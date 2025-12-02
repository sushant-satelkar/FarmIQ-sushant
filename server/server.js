const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDatabase, dbHelpers } = require('./database');
const authHelpers = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Update CORS for production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://farm-frontend-jb39.onrender.com', 'https://farm-frontend-jb39.onrender.com/']
  : ['http://localhost:8080', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Log the origin for debugging
    console.log('CORS request from origin:', origin);

    // Temporarily allow all origins for debugging
    if (process.env.NODE_ENV === 'production') {
      // In production, allow all origins temporarily
      callback(null, true);
    } else {
      // In development, use strict CORS
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Middleware (CORS already configured above)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'farmiq-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (req.session.userId && req.session.role && roles.includes(req.session.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors_origin: req.headers.origin || 'no-origin'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
});

// Authentication routes

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, full_name, email, phone, password, language_pref } = req.body;

    const result = await authHelpers.register({
      role: role || 'farmer',
      full_name,
      email,
      phone,
      password,
      language_pref
    });

    res.status(201).json({ ok: true, userId: result.userId });
  } catch (error) {
    if (error.message && error.message.includes('Email already exists')) {
      res.status(409).json({ message: error.message });
    } else {
      console.error('Registration error:', error);
      res.status(400).json({ message: error.message });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, email, password } = req.body;  // email only, no username

    const user = await authHelpers.login(role, email, password);

    // Set session
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.email = user.email;

    // Determine redirect URL based on role
    let redirectUrl;
    switch (user.role) {
      case 'farmer':
        redirectUrl = '/farmer/dashboard';
        break;
      case 'vendor':
        redirectUrl = '/vendor/dashboard';
        break;
      case 'admin':
        redirectUrl = '/admin/dashboard';
        break;
      default:
        redirectUrl = '/login';
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone
      },
      redirectUrl
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message });
  }
});

// Get current session
app.get('/api/auth/session', async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await authHelpers.getUserById(req.session.userId);
      if (user) {
        res.json({
          authenticated: true,
          user: {
            id: user.id,
            role: user.role,
            email: user.email,
            phone: user.phone
          }
        });
      } else {
        // User not found, clear session
        req.session.destroy();
        res.json({ authenticated: false });
      }
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user details by ID (for profile page)
app.get('/api/auth/user/:id', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Ensure user can only access their own data
    if (req.session.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await authHelpers.getUserById(userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ message: 'Could not log out' });
    } else {
      res.json({ ok: true });
    }
  });
});

// Get current user's profile
app.get('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const profile = await authHelpers.getUserProfile(userId);

    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ message: 'Profile not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update current user's profile (no aadhar, village, district, state)
app.put('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { full_name, phone_number, language_pref } = req.body;  // only allowed fields

    const { dbHelpers } = require('./database');
    await dbHelpers.updateProfile(userId, {
      full_name,
      phone_number,
      language_pref
    });

    res.json({ ok: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Protected routes for testing
app.get('/api/farmer/dashboard', requireAuth, requireRole(['farmer']), (req, res) => {
  res.json({ message: 'Farmer dashboard data' });
});

app.get('/api/vendor/dashboard', requireAuth, requireRole(['vendor']), (req, res) => {
  res.json({ message: 'Vendor dashboard data' });
});

app.get('/api/admin/dashboard', requireAuth, requireRole(['admin']), (req, res) => {
  res.json({ message: 'Admin dashboard data' });
});

// Get all farmers (vendor only)
app.get('/api/farmers', requireAuth, requireRole(['vendor']), async (req, res) => {
  try {
    const farmers = await dbHelpers.getFarmers();

    // Helper function to clean values safely
    const cleanValue = (value, regex) => {
      if (!value || value.trim() === '') return '-';
      const cleaned = value.replace(regex, '').trim();
      return cleaned || '-';
    };

    // Sanitize data to remove garbage characters
    const sanitizedFarmers = farmers.map(farmer => {
      return {
        ...farmer,
        // Keep: digits, ₹, hyphens (both types), slash, spaces, letters for kg/quintal
        expected_price: cleanValue(
          farmer.expected_price,
          /[^\d₹\-–—\s\/a-zA-Z]/g
        ),
        // Keep: letters, commas, spaces
        crops_grown: cleanValue(
          farmer.crops_grown,
          /[^a-zA-Z,\s]/g
        ),
        // Keep: digits, spaces, letters for kg/quintal
        available_quantity: cleanValue(
          farmer.available_quantity,
          /[^\d\sa-zA-Z]/g
        ),
        // Keep: letters, commas, spaces
        location: cleanValue(
          farmer.location,
          /[^a-zA-Z,\s]/g
        )
      };
    });

    res.json(sanitizedFarmers);
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========== NGO SCHEMES ROUTES ==========

// Get all NGO schemes (all authenticated users can read)
app.get('/api/ngo-schemes', requireAuth, async (req, res) => {
  try {
    const schemes = await dbHelpers.getNgoSchemes();
    res.json(schemes);
  } catch (error) {
    console.error('Get NGO schemes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get NGO scheme by ID (all authenticated users can read)
app.get('/api/ngo-schemes/:id', requireAuth, async (req, res) => {
  try {
    const schemeId = parseInt(req.params.id);
    const scheme = await dbHelpers.getNgoSchemeById(schemeId);

    if (scheme) {
      res.json(scheme);
    } else {
      res.status(404).json({ message: 'NGO scheme not found' });
    }
  } catch (error) {
    console.error('Get NGO scheme error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create NGO scheme (admin only)
app.post('/api/ngo-schemes', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const result = await dbHelpers.createNgoScheme(req.body);
    res.status(201).json({ id: result.id, message: 'NGO scheme created successfully' });
  } catch (error) {
    console.error('Create NGO scheme error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update NGO scheme (admin only)
app.put('/api/ngo-schemes/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const schemeId = parseInt(req.params.id);
    await dbHelpers.updateNgoScheme(schemeId, req.body);
    res.json({ message: 'NGO scheme updated successfully' });
  } catch (error) {
    console.error('Update NGO scheme error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete NGO scheme (admin only)
app.delete('/api/ngo-schemes/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const schemeId = parseInt(req.params.id);
    await dbHelpers.deleteNgoScheme(schemeId);
    res.json({ message: 'NGO scheme deleted successfully' });
  } catch (error) {
    console.error('Delete NGO scheme error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========== SOIL LAB ROUTES ==========

// Get all soil labs (all authenticated users can read)
app.get('/api/soil-labs', requireAuth, async (req, res) => {
  try {
    const labs = await dbHelpers.getSoilLabs();
    res.json(labs);
  } catch (error) {
    console.error('Get soil labs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get soil lab by ID (all authenticated users can read)
app.get('/api/soil-labs/:id', requireAuth, async (req, res) => {
  try {
    const labId = parseInt(req.params.id);
    const lab = await dbHelpers.getSoilLabById(labId);

    if (lab) {
      res.json(lab);
    } else {
      res.status(404).json({ message: 'Soil lab not found' });
    }
  } catch (error) {
    console.error('Get soil lab error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create soil lab (admin only)
app.post('/api/soil-labs', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const result = await dbHelpers.createSoilLab(req.body);
    res.status(201).json({ id: result.id, message: 'Soil lab created successfully' });
  } catch (error) {
    console.error('Create soil lab error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update soil lab (admin only)
app.put('/api/soil-labs/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const labId = parseInt(req.params.id);
    await dbHelpers.updateSoilLab(labId, req.body);
    res.json({ message: 'Soil lab updated successfully' });
  } catch (error) {
    console.error('Update soil lab error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete soil lab (admin only)
app.delete('/api/soil-labs/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const labId = parseInt(req.params.id);
    await dbHelpers.deleteSoilLab(labId);
    res.json({ message: 'Soil lab deleted successfully' });
  } catch (error) {
    console.error('Delete soil lab error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========== CROP HISTORY ROUTES ==========

// Get crops (farmers get own, admins get all, vendors denied)
app.get('/api/crops', requireAuth, async (req, res) => {
  try {
    const userRole = req.session.role;
    const userId = req.session.userId;

    // Vendors not allowed to access crop history
    if (userRole === 'vendor') {
      return res.status(403).json({ message: 'Vendors cannot access crop history' });
    }

    let crops;
    if (userRole === 'admin') {
      // Admins see all crops
      crops = await dbHelpers.getAllCrops();
    } else {
      // Farmers see only their crops
      crops = await dbHelpers.getCropsByUserId(userId);
    }

    res.json(crops);
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create crop (farmers and admins only, user_id from session)
app.post('/api/crops', requireAuth, async (req, res) => {
  try {
    const userRole = req.session.role;
    const userId = req.session.userId;

    // Only farmers and admins can create crops
    if (userRole === 'vendor') {
      return res.status(403).json({ message: 'Vendors cannot create crop records' });
    }

    // Validate required fields
    const { crop_name } = req.body;
    if (!crop_name) {
      return res.status(400).json({ message: 'Crop name is required' });
    }

    // SECURITY: user_id from session, NEVER from client
    // Even if client sends user_id, it's ignored
    const result = await dbHelpers.createCrop(userId, req.body);
    res.status(201).json({ id: result.id, message: 'Crop record created successfully' });
  } catch (error) {
    console.error('Create crop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update crop (owner or admin only)
app.put('/api/crops/:id', requireAuth, async (req, res) => {
  try {
    const cropId = parseInt(req.params.id);
    const userRole = req.session.role;
    const userId = req.session.userId;

    // Vendors not allowed
    if (userRole === 'vendor') {
      return res.status(403).json({ message: 'Vendors cannot modify crop records' });
    }

    // Check ownership (unless admin)
    const crop = await dbHelpers.getCropById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop record not found' });
    }

    // Only admin or owner can update
    if (userRole !== 'admin' && crop.user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own crop records' });
    }

    await dbHelpers.updateCrop(cropId, req.body);
    res.json({ message: 'Crop record updated successfully' });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete crop (owner or admin only)
app.delete('/api/crops/:id', requireAuth, async (req, res) => {
  try {
    const cropId = parseInt(req.params.id);
    const userRole = req.session.role;
    const userId = req.session.userId;

    // Vendors not allowed
    if (userRole === 'vendor') {
      return res.status(403).json({ message: 'Vendors cannot delete crop records' });
    }

    // Check ownership (unless admin)
    const crop = await dbHelpers.getCropById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop record not found' });
    }

    // Only admin or owner can delete
    if (userRole !== 'admin' && crop.user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own crop records' });
    }

    await dbHelpers.deleteCrop(cropId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// IoT Sensor API endpoints
// Mock technician data
const technicians = [
  { id: 'T1', name: 'Ravi Kumar', phone: '9876543210', activeJobsCount: 2 },
  { id: 'T2', name: 'Simran Kaur', phone: '9876501234', activeJobsCount: 1 },
  { id: 'T3', name: 'Arjun Mehta', phone: '9876512345', activeJobsCount: 0 },
];

// Mock data storage (in production, this would be in database)
let mockRequests = [];
let mockReadings = [];
let mockAlerts = [];

// Generate mock readings for the last 24 hours
const generateMockReadings = () => {
  const readings = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    readings.push({
      timestamp: timestamp.toISOString(),
      temperatureC: Math.round((28 + Math.sin(i / 4) * 5 + Math.random() * 2) * 10) / 10,
      humidityPct: Math.round((65 + Math.cos(i / 3) * 10 + Math.random() * 5)),
      soilMoisturePct: Math.round((45 + Math.sin(i / 2) * 15 + Math.random() * 10)),
      lightLevel: i >= 6 && i <= 18 ?
        (Math.random() > 0.5 ? 'High' : 'Medium') : 'Low'
    });
  }

  return readings;
};

// Generate mock alerts
const generateMockAlerts = () => {
  return [
    {
      id: 'A1',
      type: 'moisture',
      message: 'Low moisture detected — consider light irrigation',
      severity: 'medium'
    },
    {
      id: 'A2',
      type: 'temperature',
      message: 'High temperature in afternoon — monitor crop stress',
      severity: 'low'
    }
  ];
};

// Initialize mock data
mockReadings = generateMockReadings();
mockAlerts = generateMockAlerts();

// Allocate technician (mock logic)
const allocateTechnician = () => {
  const technician = technicians.reduce((min, tech) =>
    tech.activeJobsCount < min.activeJobsCount ? tech : min
  );

  technician.activeJobsCount++;

  return {
    id: technician.id,
    name: technician.name,
    phone: technician.phone,
    rating: 4.5
  };
};

// GET /api/iot/status - Get current installation request status
app.get('/api/iot/status', (req, res) => {
  try {
    const activeRequest = mockRequests.length > 0 ? mockRequests[0] : null;
    res.json(activeRequest);
  } catch (error) {
    console.error('Error getting IoT status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/iot/request - Create new installation request
app.post('/api/iot/request', (req, res) => {
  try {
    const requestData = req.body;

    // Validate required fields
    if (!requestData.farmerName || !requestData.phone || !requestData.preferredDate || !requestData.preferredWindow) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new request
    const newRequest = {
      id: `IOT-2025-${String(mockRequests.length + 1).padStart(6, '0')}`,
      ...requestData,
      status: 'allocated',
      technician: allocateTechnician(),
      appointment: {
        date: requestData.preferredDate,
        window: requestData.preferredWindow
      },
      createdAt: new Date().toISOString()
    };

    // Store request (replace existing if any)
    mockRequests = [newRequest];

    res.json(newRequest);
  } catch (error) {
    console.error('Error creating IoT request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/iot/reschedule - Reschedule appointment
app.post('/api/iot/reschedule', (req, res) => {
  try {
    const { id, newDate, newWindow } = req.body;

    if (!id || !newDate || !newWindow) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const request = mockRequests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.appointment = { date: newDate, window: newWindow };
    request.status = 'scheduled';

    res.json(request);
  } catch (error) {
    console.error('Error rescheduling IoT request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/iot/cancel - Cancel request
app.post('/api/iot/cancel', (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing request ID' });
    }

    mockRequests = mockRequests.filter(r => r.id !== id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error cancelling IoT request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/iot/readings - Get sensor readings
app.get('/api/iot/readings', (req, res) => {
  try {
    const since = req.query.since;
    let readings = mockReadings;

    if (since) {
      const sinceDate = new Date(since);
      readings = mockReadings.filter(r => new Date(r.timestamp) >= sinceDate);
    }

    res.json(readings);
  } catch (error) {
    console.error('Error getting IoT readings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/iot/alerts - Get farm alerts
app.get('/api/iot/alerts', (req, res) => {
  try {
    res.json(mockAlerts);
  } catch (error) {
    console.error('Error getting IoT alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/iot/mark-installed - Mark sensor as installed (for testing)
app.post('/api/iot/mark-installed', (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing request ID' });
    }

    const request = mockRequests.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'installed';
    res.json(request);
  } catch (error) {
    console.error('Error marking IoT as installed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ========== FORUM ROUTES ==========

// Get all forum posts
app.get('/api/forum', requireAuth, async (req, res) => {
  try {
    const posts = await dbHelpers.getForumPosts();
    res.json(posts);
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create forum post
app.post('/api/forum', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, question } = req.body;

    if (!category || !question) {
      return res.status(400).json({ message: 'Category and question are required' });
    }

    const result = await dbHelpers.createForumPost(userId, category, question);
    res.status(201).json({ id: result.id, message: 'Post created successfully' });
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create forum reply
app.post('/api/forum/reply', requireAuth, async (req, res) => {
  try {
    const { postId, replyText, repliedBy } = req.body;

    if (!postId || !replyText || !repliedBy) {
      return res.status(400).json({ message: 'Post ID, reply text, and replied by are required' });
    }

    const result = await dbHelpers.createForumReply(postId, replyText, repliedBy);
    res.status(201).json({ id: result.id, message: 'Reply added successfully' });
  } catch (error) {
    console.error('Create forum reply error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`✅ Server accessible at http://127.0.0.1:${PORT}`);
      console.log('✅ Database initialized successfully');
      console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
