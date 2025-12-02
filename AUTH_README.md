# FarmIQ Authentication System

This document describes the authentication system implemented for FarmIQ, including setup instructions and usage.

## Overview

The authentication system provides:
- **Role-based access control** (Farmer, Vendor, Admin)
- **SQLite database** for user storage
- **Session-based authentication** with secure password hashing
- **Protected routes** with automatic redirects
- **Multi-language support** (English, Hindi, Punjabi)

## Architecture

### Backend (Node.js/Express)
- **Server**: `server/server.js` - Main Express server
- **Database**: `server/database.js` - SQLite database setup and helpers
- **Auth Logic**: `server/auth.js` - Authentication and password hashing
- **Database File**: `server/farmiQ.db` - SQLite database (created automatically)

### Frontend (React/TypeScript)
- **Auth Service**: `src/services/authService.ts` - API client for authentication
- **Auth Context**: `src/contexts/AuthContext.tsx` - React context for auth state
- **Protected Routes**: `src/components/ProtectedRoute.tsx` - Route protection component
- **Pages**: `src/pages/Login.tsx`, `src/pages/Register.tsx` - Auth pages
- **Dashboard Pages**: `src/pages/VendorDashboard.tsx`, `src/pages/AdminDashboard.tsx`

## Database Schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('farmer','vendor','admin')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  aadhar TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (role, username)
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout user

### Protected Routes
- `GET /api/farmer/dashboard` - Farmer dashboard data
- `GET /api/vendor/dashboard` - Vendor dashboard data
- `GET /api/admin/dashboard` - Admin dashboard data

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Start the Servers

```bash
# Start backend server (Terminal 1)
cd server
npm start

# Start frontend development server (Terminal 2)
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Default Route**: Login page (`/login`)

## User Roles and Access

### Farmer
- **Dashboard**: `/farmer/dashboard` (existing FarmIQ dashboard)
- **Features**: Weather, soil analysis, crop disease detection, etc.

### Vendor
- **Dashboard**: `/vendor/dashboard` (placeholder page)
- **Status**: Coming soon

### Admin
- **Dashboard**: `/admin/dashboard` (placeholder page)
- **Status**: Coming soon

## Authentication Flow

### Registration
1. User selects role (Farmer/Vendor/Admin)
2. Fills registration form with validation
3. Password is hashed using bcrypt
4. User data stored in SQLite database
5. Redirect to login page

### Login
1. User selects role and enters credentials
2. Server validates role + username + password
3. Session created with user data
4. Redirect to appropriate dashboard based on role

### Route Protection
- All dashboard routes are protected
- Unauthenticated users redirected to `/login`
- Role mismatch redirects to correct dashboard
- Session persists across browser refreshes

## Validation Rules

### Registration
- **Name**: Required
- **Phone**: Exactly 10 digits
- **Aadhar**: Exactly 12 digits
- **Username**: Required, unique per role
- **Password**: Minimum 6 characters

### Login
- **Username**: Required
- **Password**: Required
- **Role**: Must match registered role

## Security Features

- **Password Hashing**: bcrypt with salt rounds = 10
- **Session Management**: Express sessions with secure cookies
- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Restricted to frontend origin

## Future Enhancements

### Planned Features
- **Google OAuth**: "Continue with Google" button (placeholder)
- **Phone Authentication**: "Continue with Phone" button (placeholder)
- **Email Verification**: Account activation via email
- **Password Reset**: Forgot password functionality
- **Two-Factor Authentication**: SMS/Email OTP

### Database Improvements
- **User Profiles**: Extended user information
- **Activity Logs**: Login/logout tracking
- **Password History**: Prevent password reuse
- **Account Lockout**: Brute force protection

## Testing

### Manual Testing Scenarios

1. **Registration Flow**
   - Register as Farmer with valid data
   - Register as Vendor with valid data
   - Register as Admin with valid data
   - Test duplicate username validation
   - Test form validation errors

2. **Login Flow**
   - Login with correct credentials
   - Test wrong password
   - Test wrong role selection
   - Test non-existent username

3. **Route Protection**
   - Access protected routes without login
   - Access wrong role dashboard
   - Test session persistence
   - Test logout functionality

4. **Social Login Placeholders**
   - Click "Continue with Google" (should show coming soon)
   - Click "Continue with Phone" (should show coming soon)

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 3001 is available
   - Verify Node.js version compatibility
   - Check server dependencies installation

2. **Database errors**
   - Ensure SQLite3 is properly installed
   - Check file permissions for database directory
   - Verify database schema creation

3. **Frontend connection issues**
   - Verify backend server is running
   - Check CORS configuration
   - Ensure API_BASE_URL is correct

4. **Authentication not working**
   - Check session configuration
   - Verify cookie settings
   - Test API endpoints directly

## Development Notes

- **Database**: SQLite file created automatically on first run
- **Sessions**: Stored in memory (not persistent across server restarts)
- **Passwords**: Hashed with bcrypt, never stored in plain text
- **Validation**: Both client-side (React Hook Form + Zod) and server-side
- **Error Handling**: Comprehensive error messages with user-friendly text

## File Structure

```
├── server/
│   ├── server.js          # Main Express server
│   ├── database.js        # Database setup and helpers
│   ├── auth.js           # Authentication logic
│   ├── package.json      # Server dependencies
│   └── farmiQ.db         # SQLite database (auto-created)
├── src/
│   ├── services/
│   │   └── authService.ts # API client
│   ├── contexts/
│   │   └── AuthContext.tsx # React auth context
│   ├── components/
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── pages/
│   │   ├── Login.tsx     # Login page
│   │   ├── Register.tsx  # Registration page
│   │   ├── VendorDashboard.tsx # Vendor placeholder
│   │   └── AdminDashboard.tsx  # Admin placeholder
│   └── lib/
│       └── translations.ts # i18n translations
└── AUTH_README.md        # This documentation
```

## Support

For issues or questions about the authentication system, please refer to the code comments or create an issue in the project repository.
