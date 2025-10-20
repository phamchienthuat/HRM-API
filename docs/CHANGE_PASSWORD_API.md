# Change Password API Documentation

## Endpoint
`POST /auth/change-password`

## Description
Allows authenticated users to change their password. After a successful password change, all refresh tokens are invalidated and the user must log in again.

## Authentication
**Required**: Yes (JWT Bearer Token or Cookie)

## Request Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
Or use httpOnly cookies (automatically sent by browser).

## Request Body
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

### Validation Rules
- **currentPassword**: Required, must be the user's current password
- **newPassword**: 
  - Required
  - Minimum 6 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter
  - Must contain at least one number
  - Must be different from current password
- **confirmPassword**: 
  - Required
  - Must match `newPassword`

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**Side Effects:**
- User's password is updated in the database (hashed with Argon2)
- All refresh tokens for the user are deleted from the database
- Access and refresh token cookies are cleared
- User must log in again with the new password

### Error Responses

#### 400 Bad Request - Validation Failed
```json
{
  "statusCode": 400,
  "message": [
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ],
  "error": "Bad Request"
}
```

#### 401 Unauthorized - Wrong Current Password
```json
{
  "statusCode": 401,
  "message": "Current password is incorrect",
  "error": "Unauthorized"
}
```

#### 401 Unauthorized - Not Authenticated
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 409 Conflict - Passwords Don't Match
```json
{
  "statusCode": 409,
  "message": "New passwords do not match",
  "error": "Conflict"
}
```

#### 409 Conflict - Same Password
```json
{
  "statusCode": 409,
  "message": "New password must be different from current password",
  "error": "Conflict"
}
```

## Example Usage

### Using REST Client (VSCode Extension)
```http
### Change Password
POST http://localhost:4000/auth/change-password
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### Using cURL
```bash
curl -X POST http://localhost:4000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword123",
    "confirmPassword": "NewPassword123"
  }'
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:4000/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    currentPassword: 'OldPassword123',
    newPassword: 'NewPassword123',
    confirmPassword: 'NewPassword123'
  })
});

const data = await response.json();
console.log(data);
```

### Using Axios
```javascript
import axios from 'axios';

const response = await axios.post(
  'http://localhost:4000/auth/change-password',
  {
    currentPassword: 'OldPassword123',
    newPassword: 'NewPassword123',
    confirmPassword: 'NewPassword123'
  },
  {
    withCredentials: true, // Important for cookies
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.data);
```

## Security Features

1. **Password Hashing**: Uses Argon2 (winner of Password Hashing Competition)
2. **Token Invalidation**: All existing refresh tokens are deleted after password change
3. **Cookie Clearing**: Access and refresh tokens are cleared from cookies
4. **Password Validation**: Enforces strong password requirements
5. **Current Password Verification**: Requires current password to change
6. **Same Password Prevention**: Prevents using the same password

## Testing Scenarios

### ✅ Valid Change Password
```json
{
  "currentPassword": "Test123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```
**Expected**: 200 OK, password changed

### ❌ Wrong Current Password
```json
{
  "currentPassword": "WrongPassword",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```
**Expected**: 401 Unauthorized

### ❌ Passwords Don't Match
```json
{
  "currentPassword": "Test123456",
  "newPassword": "NewPassword123",
  "confirmPassword": "DifferentPassword123"
}
```
**Expected**: 409 Conflict

### ❌ Same as Current Password
```json
{
  "currentPassword": "Test123456",
  "newPassword": "Test123456",
  "confirmPassword": "Test123456"
}
```
**Expected**: 409 Conflict

### ❌ Weak Password
```json
{
  "currentPassword": "Test123456",
  "newPassword": "weak",
  "confirmPassword": "weak"
}
```
**Expected**: 400 Bad Request

## Best Practices

1. **Always use HTTPS in production** to protect passwords in transit
2. **Implement rate limiting** to prevent brute force attacks
3. **Log password changes** for security audit trails
4. **Send email notifications** when password is changed
5. **Consider adding 2FA** for additional security
6. **Force logout on all devices** after password change (already implemented via token invalidation)

## Related Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/logout` - Logout and clear tokens
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
