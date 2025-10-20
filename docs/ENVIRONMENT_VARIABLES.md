# Environment Variables Guide

## Overview
Your `.env` file contains all the configuration needed to run the application. The `NODE_ENV` variable is particularly important as it affects security settings.

## NODE_ENV Variable

### Purpose
The `NODE_ENV` environment variable determines which environment your application is running in.

### Values
- **`development`** - For local development
- **`production`** - For production deployment
- **`test`** - For running tests (optional)

### Current Configuration
```env
NODE_ENV=development
```

## How NODE_ENV Affects Your Application

### 1. **Cookie Security** 
The `secure` flag on cookies depends on `NODE_ENV`:

```typescript
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',  // ← This line!
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,
});
```

#### In Development (`NODE_ENV=development`)
- ✅ `secure: false` - Cookies work over HTTP
- ✅ Can test on `http://localhost:4000`
- ✅ No SSL certificate needed

#### In Production (`NODE_ENV=production`)
- ✅ `secure: true` - Cookies only sent over HTTPS
- ✅ Protects against man-in-the-middle attacks
- ⚠️ Requires valid SSL certificate
- ⚠️ Won't work on plain HTTP

### 2. **CORS Configuration**
Your CORS settings also reference environment variables:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

### 3. **Error Handling**
NestJS provides more detailed error messages in development:
- **Development**: Stack traces and detailed errors
- **Production**: Generic error messages (security)

### 4. **Logging**
Different log levels based on environment:
- **Development**: Verbose logging
- **Production**: Only important logs

## Complete .env Structure

```env
# ============================================
# Application Configuration
# ============================================
PORT=4000
NODE_ENV=development

# ============================================
# Database Configuration
# ============================================
DATABASE_URL="postgresql://admin_hrm:admin@localhost:5433/hrm?schema=public"

# ============================================
# CORS Configuration
# ============================================
FRONTEND_URL=http://localhost:3000

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET="PObYCcBNflsv6VonJTpdDfeNnLBx1cYM"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="F91138E3DCB1A211EE9A35771EE72GR2WE23KJL1"
JWT_REFRESH_EXPIRES_IN="7d"
```

## Production Deployment Checklist

When deploying to production, update your `.env`:

### ✅ Required Changes
```env
# Change to production
NODE_ENV=production

# Use your production database
DATABASE_URL="postgresql://prod_user:secure_pass@prod-db:5432/hrm_prod?schema=public"

# Set your production frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Generate new secure secrets (use crypto)
JWT_SECRET="[64-character-random-string]"
JWT_REFRESH_SECRET="[64-character-random-string]"

# Keep or adjust token expiry times
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
```

### ✅ Generate Secure Secrets
Run this command to generate secure random secrets:

```bash
# For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# For JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### ✅ Security Requirements for Production
1. **HTTPS/SSL Certificate**: Required for `secure: true` cookies
2. **Strong Secrets**: Use cryptographically secure random strings
3. **Environment Variables**: Never commit `.env` to version control
4. **Database Credentials**: Use strong passwords
5. **CORS**: Restrict to your actual frontend domain

## Testing Different Environments

### Local Development (Current)
```bash
# Start normally
npm run start:dev
```

### Test Production Mode Locally
```bash
# Temporarily change NODE_ENV
$env:NODE_ENV="production"  # PowerShell
# or
set NODE_ENV=production     # CMD

# Run the app
npm run start:prod
```

⚠️ **Note**: In production mode locally, you'll need HTTPS for cookies to work!

## Common Issues

### ❌ Cookies Not Working
**Problem**: Cookies not being set/sent

**Solution**: Check `NODE_ENV`:
- If `development`: Should work on HTTP
- If `production`: Requires HTTPS

### ❌ CORS Errors
**Problem**: Frontend can't access API

**Solution**: Update `FRONTEND_URL` in `.env`:
```env
FRONTEND_URL=http://localhost:3000  # Development
FRONTEND_URL=https://yourdomain.com  # Production
```

## Best Practices

### ✅ DO
- Keep `.env` in `.gitignore`
- Use `.env.example` for documentation
- Generate new secrets for each environment
- Use strong database passwords
- Set `NODE_ENV=production` in production

### ❌ DON'T
- Commit `.env` to version control
- Use weak or default secrets in production
- Use `NODE_ENV=development` in production
- Hardcode secrets in code
- Share secrets in public repositories

## Environment Variables Priority

1. **System Environment Variables** (highest priority)
2. **`.env` file** 
3. **Default values in code** (fallback)

## Verify Your Configuration

Run this command to check your environment:

```bash
# Check NODE_ENV
echo $env:NODE_ENV  # PowerShell
echo %NODE_ENV%     # CMD

# Or check all env vars in Node.js
node -e "console.log(process.env.NODE_ENV)"
```

## Summary

✅ **You already have `NODE_ENV=development` in your `.env` file!**

This means:
- Cookies work over HTTP (no SSL needed for development)
- More detailed error messages
- CORS allows `http://localhost:3000`
- Perfect for local development

When you deploy to production, just change it to:
```env
NODE_ENV=production
```

And make sure you have HTTPS configured on your server!
