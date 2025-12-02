# Login Functionality Files - Categorized

## 🔧 **BACKEND** (Server-Side Files)

### Core Backend Files
1. **`server/server.js`**
   - Express server setup
   - Authentication API endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/session`, `/api/auth/logout`)
   - Session configuration
   - CORS setup
   - Authentication middleware (`requireAuth`, `requireRole`)

2. **`server/auth.js`**
   - Password hashing functions (`hashPassword`, `comparePassword`)
   - User registration logic
   - User login validation
   - User lookup functions (`getUserById`)

3. **`server/database.js`**
   - SQLite database initialization
   - Database schema creation (users table)
   - Database helper functions:
     - `insertUser` - Create new user
     - `findUserByRoleAndUsername` - Find user for login
     - `findUserById` - Get user by ID for session validation

4. **`server/farmiQ.db`**
   - SQLite database file (auto-created)
   - Stores user data (id, role, name, phone, aadhar, username, password_hash, created_at)

5. **`server/package.json`**
   - Backend dependencies:
     - `express` - Web server
     - `express-session` - Session management
     - `cors` - Cross-origin resource sharing
     - `sqlite3` - Database
     - `bcryptjs` - Password hashing

---

## 🛣️ **ROUTING** (Route Configuration & Protection)

### Route Definition Files
1. **`src/App.tsx`**
   - Main application routing configuration
   - Route definitions for:
     - Public routes: `/login`, `/register`
     - Protected routes: `/farmer/dashboard`, `/vendor/dashboard`, `/admin/dashboard`
     - Role-based protected routes: `/soil-analysis`, `/farmer/crop-disease`, etc.
   - AuthProvider wrapper setup
   - BrowserRouter configuration

2. **`src/components/ProtectedRoute.tsx`**
   - Route protection component
   - Authentication check
   - Role-based access control
   - Redirects unauthenticated users to `/login`
   - Redirects users to correct dashboard based on role

3. **`src/main.tsx`**
   - Application entry point
   - Renders App component (which includes routing)

---

## 🎨 **FRONTEND** (Client-Side Files)

### Authentication Pages
1. **`src/pages/Login.tsx`**
   - Login UI component
   - Role selection (Farmer/Vendor/Admin)
   - Form validation with Zod
   - Password visibility toggle
   - Social login placeholders (Google, Phone)

2. **`src/pages/Register.tsx`**
   - Registration UI component
   - Role selection with radio buttons
   - Form validation (name, phone, aadhar, username, password)
   - Password visibility toggle

### Authentication Services & State Management
3. **`src/services/authService.ts`**
   - API client for authentication
   - Methods: `login()`, `register()`, `getSession()`, `logout()`
   - API base URL configuration
   - Request/response handling
   - Error handling

4. **`src/contexts/AuthContext.tsx`**
   - React Context for authentication state
   - Provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `checkSession()`
   - LocalStorage persistence
   - Session checking on mount and periodic intervals

### Pages Using Authentication
5. **`src/pages/Profile.tsx`**
   - User profile page
   - Uses `useAuth()` hook to get current user
   - Displays user information
   - Profile editing functionality

6. **`src/pages/FarmIQ.tsx`**
   - Farmer dashboard page
   - Protected route (requires farmer role)

7. **`src/pages/VendorDashboard.tsx`**
   - Vendor dashboard page
   - Protected route (requires vendor role)

8. **`src/pages/AdminDashboard.tsx`**
   - Admin dashboard page
   - Protected route (requires admin role)

9. **`src/components/farmiq/FarmIQNavbar.tsx`**
   - Navigation bar component
   - Uses `useAuth()` hook for user info and logout
   - Logout functionality
   - User role display

### UI Components (Used in Login/Register)
10. **`src/components/ui/button.tsx`** - Button component
11. **`src/components/ui/input.tsx`** - Input field component
12. **`src/components/ui/label.tsx`** - Label component
13. **`src/components/ui/card.tsx`** - Card container component
14. **`src/components/ui/tabs.tsx`** - Tabs component (role selection in login)
15. **`src/components/ui/alert.tsx`** - Alert component (error messages)
16. **`src/components/ui/radio-group.tsx`** - Radio group component (role selection in register)
17. **`src/components/ui/toast.tsx`** - Toast notification component
18. **`src/components/ui/toaster.tsx`** - Toaster container component
19. **`src/hooks/use-toast.ts`** - Toast hook for notifications

### Configuration Files
20. **`package.json`** - Frontend dependencies:
    - `react-hook-form` - Form handling
    - `zod` - Schema validation
    - `react-router-dom` - Routing
    - `@hookform/resolvers` - Form validation integration
    - Other UI library dependencies

21. **`vite.config.ts`** - Vite build configuration
22. **`tsconfig.json`** - TypeScript configuration
23. **`index.html`** - HTML entry point

### Additional Frontend Files
24. **`src/lib/translations.ts`** - Translation file (may contain login-related text)
25. **`env.example`** - Environment variables template (API URL configuration)

### Documentation
26. **`AUTH_README.md`** - Authentication system documentation

---

## 📊 **Summary Statistics**

- **Backend Files**: 5 files
- **Routing Files**: 3 files
- **Frontend Files**: 26+ files

**Total: 34+ files involved in login functionality**

---

## 🔄 **Data Flow**

```
Frontend (Login.tsx)
    ↓
authService.ts (API call)
    ↓
Backend (server.js - /api/auth/login)
    ↓
auth.js (validate credentials)
    ↓
database.js (query user)
    ↓
Backend Response
    ↓
AuthContext.tsx (update state)
    ↓
ProtectedRoute.tsx (check auth)
    ↓
Dashboard Pages (render)
```

---

## 📁 **File Structure by Category**

```
BACKEND/
├── server/
│   ├── server.js          # API endpoints & middleware
│   ├── auth.js            # Auth logic & password hashing
│   ├── database.js        # Database setup & queries
│   ├── farmiQ.db          # SQLite database
│   └── package.json       # Backend dependencies

ROUTING/
├── src/
│   ├── App.tsx            # Route definitions
│   ├── main.tsx           # App entry point
│   └── components/
│       └── ProtectedRoute.tsx  # Route protection

FRONTEND/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Profile.tsx
│   │   ├── FarmIQ.tsx
│   │   ├── VendorDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── services/
│   │   └── authService.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── farmiq/
│   │   │   └── FarmIQNavbar.tsx
│   │   └── ui/            # UI components
│   └── hooks/
│       └── use-toast.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── AUTH_README.md
```

