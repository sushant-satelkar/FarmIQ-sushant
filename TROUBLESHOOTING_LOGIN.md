# Troubleshooting Login Connection Issues

## Quick Diagnosis

### Step 1: Check if Backend Server is Running

Run the diagnostic script:
```bash
node check_backend.js
```

This will tell you if the server is accessible on port 3001.

### Step 2: Verify Server is Actually Running

**Check 1: Look for server process**
```bash
# Windows PowerShell
Get-Process node

# Or check if port 3001 is in use
netstat -ano | findstr :3001
```

**Check 2: Try accessing health endpoint directly**
Open your browser and go to:
```
http://localhost:3001/api/health
```

You should see:
```json
{"status":"OK","timestamp":"...","environment":"development"}
```

### Step 3: Start the Server Properly

If the server is not running, start it:

```bash
# Navigate to server directory
cd server

# Install dependencies (if not done)
npm install

# Start the server
node server.js
```

You should see:
```
✅ Server running on http://localhost:3001
✅ Database initialized successfully
✅ CORS enabled for: http://localhost:8080, http://localhost:5173
```

### Step 4: Verify Frontend Configuration

Check that your `.env` file (or environment variables) has:
```
VITE_API_URL=http://localhost:3001/api
```

If you don't have a `.env` file, create one from `env.example`:
```bash
cp env.example .env
```

**Important**: After changing `.env`, restart your Vite dev server!

### Step 5: Check CORS Configuration

The server allows these origins by default:
- `http://localhost:5173` (Vite default)
- `http://localhost:8080`

If your frontend runs on a different port, update `server/server.js`:
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://farm-frontend-jb39.onrender.com']
  : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000']; // Add your port
```

## Common Issues & Solutions

### Issue 1: "ERR_CONNECTION_REFUSED"

**Cause**: Backend server is not running or not accessible.

**Solutions**:
1. Start the backend server: `cd server && node server.js`
2. Check if port 3001 is already in use by another process
3. Verify firewall isn't blocking localhost connections
4. Try accessing `http://localhost:3001/api/health` in browser

### Issue 2: "CORS Error"

**Cause**: Frontend origin not allowed by backend.

**Solutions**:
1. Check what port your Vite dev server is running on (check terminal output)
2. Add that port to `allowedOrigins` in `server/server.js`
3. Restart the backend server after making changes

### Issue 3: "Cannot connect to server" (but server seems running)

**Cause**: Server might be running on wrong port or interface.

**Solutions**:
1. Check server console output - it should say "Server running on http://localhost:3001"
2. Verify `PORT` environment variable isn't overriding default
3. Check if server is listening on `0.0.0.0` or `127.0.0.1` (should be `0.0.0.0`)

### Issue 4: Server starts but immediately crashes

**Cause**: Database or dependency issues.

**Solutions**:
1. Check server console for error messages
2. Verify `farmiQ.db` file exists in `server/` directory
3. Reinstall dependencies: `cd server && npm install`
4. Check Node.js version (should be 14+)

### Issue 5: Frontend shows old error even after fixing

**Cause**: Browser cache or Vite not picking up changes.

**Solutions**:
1. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Restart Vite dev server
4. Check browser console for actual error (not cached)

## Step-by-Step Verification

### 1. Terminal 1: Start Backend
```bash
cd FarmIQ-login/server
node server.js
```

Expected output:
```
✅ Server running on http://localhost:3001
✅ Database initialized successfully
```

### 2. Terminal 2: Test Backend
```bash
cd FarmIQ-login
node check_backend.js
```

Expected output:
```
✅ Server is RUNNING!
   Status Code: 200
```

### 3. Terminal 3: Start Frontend
```bash
cd FarmIQ-login
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 4. Browser: Test Login
1. Open `http://localhost:5173/login`
2. Open browser DevTools (F12) → Network tab
3. Try to login
4. Check if request to `http://localhost:3001/api/auth/login` appears
5. Check response status (should be 200, not ERR_CONNECTION_REFUSED)

## Debug Checklist

- [ ] Backend server is running (`node server.js` in `server/` directory)
- [ ] Server shows "Server running on http://localhost:3001" message
- [ ] `http://localhost:3001/api/health` returns JSON in browser
- [ ] Frontend `.env` file has `VITE_API_URL=http://localhost:3001/api`
- [ ] Vite dev server restarted after `.env` changes
- [ ] Frontend port matches CORS allowed origins
- [ ] No firewall blocking localhost connections
- [ ] Browser console shows actual error (not cached)
- [ ] Network tab shows request attempt (even if failed)

## Still Not Working?

1. **Check server logs**: Look at the terminal where `server.js` is running for any errors
2. **Check browser console**: Look for detailed error messages
3. **Check Network tab**: See the exact request/response
4. **Try different browser**: Rule out browser-specific issues
5. **Check Windows Firewall**: Ensure it's not blocking Node.js
6. **Verify Node.js version**: `node --version` (should be 14+)

## Quick Test Commands

```bash
# Test if server responds
curl http://localhost:3001/api/health

# Test login endpoint (replace credentials)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"role":"farmer","username":"test","password":"test"}'

# Check what's using port 3001 (Windows)
netstat -ano | findstr :3001

# Check what's using port 3001 (Linux/Mac)
lsof -i :3001
```

