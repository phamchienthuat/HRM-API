# 🔐 Authentication API with JWT, Passport & Cookies

Complete authentication system built with NestJS, JWT, Passport, Argon2, and Prisma.

## 🚀 Features

- ✅ User Registration with validation
- ✅ Login with JWT tokens
- ✅ Refresh token mechanism
- ✅ Logout functionality
- ✅ Password hashing with Argon2
- ✅ HTTP-only cookies for security
- ✅ Protected routes with Passport JWT strategy
- ✅ Token refresh with user agent and IP tracking
- ✅ Swagger API documentation

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Start development server
npm run start:dev
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://admin_hrm:admin@localhost:5433/hrm?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN="7d"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"
```

## 📚 API Endpoints

### Authentication

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "Test123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "john_doe",
      "createdAt": "2025-10-16T00:00:00.000Z"
    }
  }
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Test123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "john_doe"
    }
  }
}
```

**Note:** Access and refresh tokens are automatically set in HTTP-only cookies.

#### 3. Get Current User Profile (Protected)
```http
GET /auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "user@example.com"
    }
  }
}
```

#### 4. Refresh Tokens
```http
POST /auth/refresh
```

**Response:**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully"
}
```

**Note:** New tokens are automatically set in cookies.

#### 5. Logout (Protected)
```http
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## 🔐 Authentication Flow

### Cookie-Based Authentication (Recommended)

1. **Register/Login**: Client sends credentials
2. **Server Response**: Server sets `access_token` and `refresh_token` in HTTP-only cookies
3. **Subsequent Requests**: Browser automatically includes cookies
4. **Token Refresh**: When access token expires, use `/auth/refresh` endpoint
5. **Logout**: Server clears cookies

### Bearer Token Authentication (Alternative)

You can also use Bearer tokens in the Authorization header:

```http
GET /auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

## 🛡️ Security Features

- **Argon2 Password Hashing**: Industry-standard password hashing
- **HTTP-Only Cookies**: Prevents XSS attacks
- **SameSite Cookies**: Prevents CSRF attacks
- **JWT Expiration**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Long-lived refresh tokens (7 days) with database tracking
- **Account Locking**: Prevents access to locked accounts
- **User Agent & IP Tracking**: Tracks device and location for each session

## 📖 Swagger Documentation

Access the Swagger UI at: `http://localhost:4000/api`

## 🗄️ Database Schema

### User Table
- `id` - User ID (auto-increment)
- `email` - Unique email address
- `username` - Unique username
- `password` - Hashed password (Argon2)
- `isLocked` - Account lock status
- `createdAt` - Registration timestamp
- `updatedAt` - Last update timestamp

### UserTokens Table
- `id` - Token ID (auto-increment)
- `userId` - Foreign key to User
- `refreshToken` - Unique refresh token
- `userAgent` - Browser/app information
- `ipAddress` - User's IP address
- `deviceInfo` - Additional device details
- `lastUsedAt` - Last token usage
- `expiresAt` - Token expiration date
- `createdAt` - Token creation timestamp

## 🧪 Testing

Use the provided `test-api.http` file with REST Client extension in VS Code:

1. Register a new user
2. Login with credentials
3. Access protected routes
4. Refresh tokens
5. Logout

## 📦 Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Relational database
- **Passport JWT** - Authentication middleware
- **Argon2** - Password hashing
- **class-validator** - DTO validation
- **cookie-parser** - Cookie parsing middleware

## 🔄 Token Flow

```
┌─────────┐                  ┌─────────┐                 ┌──────────┐
│ Client  │                  │  Server │                 │ Database │
└────┬────┘                  └────┬────┘                 └────┬─────┘
     │                            │                           │
     │  POST /auth/login          │                           │
     │ ────────────────────────>  │                           │
     │                            │  Verify Credentials       │
     │                            │ ────────────────────────> │
     │                            │ <──────────────────────── │
     │                            │  Generate JWT Tokens      │
     │                            │  Save Refresh Token       │
     │                            │ ────────────────────────> │
     │  Set-Cookie: access_token  │                           │
     │  Set-Cookie: refresh_token │                           │
     │ <──────────────────────────│                           │
     │                            │                           │
     │  GET /auth/me              │                           │
     │  Cookie: access_token      │                           │
     │ ────────────────────────>  │                           │
     │                            │  Verify JWT               │
     │                            │  Get User Info            │
     │                            │ ────────────────────────> │
     │  User Profile              │ <──────────────────────── │
     │ <──────────────────────────│                           │
```

## 📝 Password Requirements

- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License
