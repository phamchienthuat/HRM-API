import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully registered.',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            username: 'john_doe',
            createdAt: '2025-10-16T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Please provide a valid email address',
          'Username must be at least 3 characters long',
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        ],
        error: 'Bad Request',
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user with JWT and cookies' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description:
      'User has been successfully logged in. Tokens are set in cookies.',
    schema: {
      example: {
        success: true,
        message: 'User logged in successfully',
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            username: 'john_doe',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'Unauthorized',
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    const result = await this.authService.login(loginDto, userAgent, ipAddress);

    // Set access token in httpOnly cookie
    res.cookie('access_token', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refresh_token', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: result.success,
      message: result.message,
      data: {
        user: result.data.user,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully logged out.',
    schema: {
      example: {
        success: true,
        message: 'Logout successful',
      },
    },
  })
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (refreshToken) {
      await this.authService.logout(user.id, refreshToken);
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    schema: {
      example: {
        success: true,
        message: 'Tokens refreshed successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or expired refresh token.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Update cookies with new tokens
    res.cookie('access_token', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 1,
            username: 'john_doe',
            email: 'user@example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required.',
  })
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      success: true,
      data: {
        user,
      },
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully.',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully. Please login again.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - current password is incorrect.',
    schema: {
      example: {
        statusCode: 401,
        message: 'Current password is incorrect',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - passwords do not match or are the same.',
    schema: {
      example: {
        statusCode: 409,
        message: 'New passwords do not match',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed.',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        ],
        error: 'Bad Request',
      },
    },
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );

    // Clear cookies to force re-login with new password
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return result;
  }
}
