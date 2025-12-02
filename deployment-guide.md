# FarmIQ Deployment Guide

## Backend Tech Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework  
- **SQLite3** - Database
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **CORS** - Cross-origin resource sharing

## Deployment Options

### Option 1: Railway (Recommended for Backend)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # In your project root
   cd server
   # Create a Procfile
   echo "web: node server.js" > Procfile
   ```

3. **Environment Variables**
   - Set `PORT` environment variable in Railway dashboard
   - Railway will provide a URL like: `https://your-app.railway.app`

4. **Update Frontend API URL**
   ```typescript
   // In src/services/authService.ts
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'https://your-app.railway.app/api'
     : 'http://localhost:3001/api';
   ```

### Option 2: Render (Alternative)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Backend**
   - Connect your GitHub repository
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && node server.js`
   - Set root directory: `server`

### Option 3: Heroku (Paid)

1. **Create Heroku Account**
   - Go to [heroku.com](https://heroku.com)
   - Install Heroku CLI

2. **Deploy Backend**
   ```bash
   cd server
   heroku create your-app-name
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

## Frontend Deployment (Vercel)

1. **Update API URL for Production**
   ```typescript
   // In src/services/authService.ts
   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'https://your-backend-url.com/api'
     : 'http://localhost:3001/api';
   ```

2. **Environment Variables in Vercel**
   - Add `REACT_APP_API_URL=https://your-backend-url.com/api`
   - Update authService to use: `process.env.REACT_APP_API_URL || 'http://localhost:3001/api'`

3. **Redeploy to Vercel**
   - Push changes to GitHub
   - Vercel will auto-deploy

## Quick Fix for Current Vercel Deployment

### Temporary Solution:
1. **Update authService.ts**
   ```typescript
   const API_BASE_URL = 'https://your-backend-url.com/api';
   ```

2. **Deploy backend to Railway/Render first**
3. **Update frontend with backend URL**
4. **Redeploy frontend to Vercel**

## Database Considerations

- **SQLite** works for development but consider PostgreSQL for production
- **Railway/Render** provide PostgreSQL databases
- **Update database connection** in production

## Security Notes

- Change session secret in production
- Use HTTPS in production
- Set secure cookie flags
- Use environment variables for sensitive data

