import {
  ConflictException,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../shared/services/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists with the same email
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException('Email already exists');
      }

      // Hash password with argon2
      const hashedPassword = await argon2.hash(registerDto.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          password: hashedPassword,
          isLocked: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            createdAt: user.createdAt,
          },
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto, userAgent: string, ipAddress: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException('Account is locked');
    }

    // Verify password with argon2
    const isPasswordValid = await argon2.verify(
      user.password,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.email,
    );

    // Save refresh token to database
    await this.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      userAgent,
      ipAddress,
    );

    return {
      success: true,
      message: 'User logged in successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async logout(userId: number, refreshToken: string) {
    // Delete the refresh token from database
    await this.prisma.userTokens.deleteMany({
      where: {
        userId,
        refreshToken,
      },
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  async refreshTokens(refreshToken: string) {
    // Find token in database
    const tokenRecord = await this.prisma.userTokens.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      await this.prisma.userTokens.delete({
        where: { refreshToken },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Verify JWT
    try {
      const jwtRefreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'your-refresh-secret';
      await this.jwtService.verifyAsync(refreshToken, {
        secret: jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.username,
      tokenRecord.user.email,
    );

    // Update refresh token in database
    await this.prisma.userTokens.update({
      where: { id: tokenRecord.id },
      data: {
        refreshToken: tokens.refreshToken,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Validate that new passwords match
    if (newPassword !== confirmPassword) {
      throw new ConflictException('New passwords do not match');
    }

    // Validate that new password is different from current
    if (currentPassword === newPassword) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await argon2.verify(
      user.password,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await argon2.hash(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Optionally: Invalidate all refresh tokens for security
    await this.prisma.userTokens.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: 'Password changed successfully. Please login again.',
    };
  }

  private async generateTokens(
    userId: number,
    username: string,
    email: string,
  ) {
    const payload = { sub: userId, username, email };

    const jwtSecret =
      this.configService.get<string>('JWT_SECRET') || 'your-secret-jwt-key';
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'your-refresh-secret';
    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        payload as any,
        {
          secret: jwtSecret,
          expiresIn: jwtExpiresIn,
        } as any,
      ),
      this.jwtService.signAsync(
        payload as any,
        {
          secret: jwtRefreshSecret,
          expiresIn: jwtRefreshExpiresIn,
        } as any,
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    userId: number,
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.userTokens.create({
      data: {
        userId,
        refreshToken,
        userAgent,
        ipAddress,
        deviceInfo: userAgent,
        expiresAt,
      },
    });
  }
}
