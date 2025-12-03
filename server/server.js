const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const { initDatabase, dbHelpers, db } = require('./database');
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

    // Sanitize data to remove garbage characters
    const sanitizedFarmers = farmers.map(farmer => {
      return {
        ...farmer,
        // Clean expected_price: keep only numbers, ₹, hyphen, slash, kg, quintal
        expected_price: farmer.expected_price
          ? (farmer.expected_price.replace(/[^\d₹\-–\/kgquintal\s]/gi, '').trim() || '-')
          : '-',
        // Clean crops_grown: alphabets, commas, spaces only
        crops_grown: farmer.crops_grown
          ? (farmer.crops_grown.replace(/[^a-zA-Z,\s]/g, '').trim() || '-')
          : '-',
        // Clean available_quantity: digits, kg, quintal only
        available_quantity: farmer.available_quantity
          ? (farmer.available_quantity.replace(/[^\d\skgquintal]/gi, '').trim() || '-')
          : '-',
        // Clean location: letters, commas, spaces only
        location: farmer.location
          ? (farmer.location.replace(/[^a-zA-Z,\s]/g, '').trim() || '-')
          : '-'
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
app.get('/api/forum/posts', async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT id, user_id, category, community, question, extracted_keywords, 
             status, created_at, upvotes, reply_count
      FROM forum_posts
    `;

    const params = [];
    if (category && category !== 'All') {
      query += ` WHERE category = ?`;
      params.push(category);
    }

    query += ` ORDER BY created_at DESC`;

    db.all(query, params, (err, posts) => {
      if (err) {
        console.error('Get forum posts error:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }

      if (!posts || posts.length === 0) {
        console.log('No posts found');
        return res.json([]);
      }

      console.log(`Found ${posts.length} posts`);

      // Get all replies
      db.all(`SELECT id, post_id, reply_text, replied_by, created_at, upvotes FROM forum_replies ORDER BY created_at ASC`, [], (err, replies) => {
        if (err) {
          console.error('Get replies error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }

        console.log(`Found ${replies ? replies.length : 0} replies`);

        // Attach replies to posts
        const postsWithReplies = posts.map(post => ({
          ...post,
          replies: replies ? replies.filter(r => r.post_id === post.id) : []
        }));

        console.log(`✓ Returning ${postsWithReplies.length} posts with replies`);
        res.json(postsWithReplies);
      });
    });
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get replies for a specific post
app.get('/api/forum/posts/:post_id/replies', async (req, res) => {
  try {
    const { post_id } = req.params;

    db.all(
      `SELECT id, post_id, reply_text, replied_by, upvotes, created_at 
       FROM forum_replies 
       WHERE post_id = ? 
       ORDER BY created_at ASC`,
      [post_id],
      (err, replies) => {
        if (err) {
          console.error('Get forum replies error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        console.log(`✓ Returning ${replies ? replies.length : 0} replies for post ${post_id}`);
        res.json(replies || []);
      }
    );
  } catch (error) {
    console.error('Get forum replies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ask a new question with smart matching
app.post('/api/forum/ask', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, question } = req.body;

    if (!category || !question) {
      return res.status(400).json({ message: 'Category and question are required' });
    }

    // Extract keywords
    const { extractKeywords } = require('./keywords');
    const keywords = extractKeywords(question);

    // Insert new question
    const result = await dbHelpers.createForumPost(userId, category, question, category, keywords);

    // Find best matching post for recommendation
    db.all(
      `SELECT fp.*, p.full_name as user_name
       FROM forum_posts fp
       LEFT JOIN profiles p ON fp.user_id = p.id
       WHERE fp.id != ? AND fp.community = ?
       ORDER BY fp.upvotes DESC, fp.created_at DESC
       LIMIT 3`,
      [result.id, category],
      (err, matches) => {
        if (err) {
          console.error('Find matches error:', err);
        }

        // Get replies for matches
        if (matches && matches.length > 0) {
          const matchIds = matches.map(m => m.id);
          db.all(
            `SELECT * FROM forum_replies WHERE post_id IN (${matchIds.join(',')})`,
            [],
            (err, replies) => {
              const recommended = matches.map(post => ({
                ...post,
                replies: replies ? replies.filter(r => r.post_id === post.id) : []
              }));

              res.status(201).json({
                id: result.id,
                message: 'Question posted successfully',
                keywords,
                recommended: recommended[0] || null
              });
            }
          );
        } else {
          res.status(201).json({
            id: result.id,
            message: 'Question posted successfully',
            keywords,
            recommended: null
          });
        }
      }
    );
  } catch (error) {
    console.error('Create forum question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Old endpoint for backwards compatibility
app.get('/api/forum', requireAuth, async (req, res) => {
  // Redirect to new endpoint
  res.redirect('/api/forum/posts');
});

// Create forum post (legacy endpoint) - NOW WITH AUTO-ANSWER
app.post('/api/forum', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, question } = req.body;

    if (!category || !question) {
      return res.status(400).json({ message: 'Category and question are required' });
    }

    // Extract keywords for matching
    const { extractKeywords } = require('./keywords');
    const keywords = extractKeywords(question);

    // Insert new question with status 'Answered' and reply_count = 1 (will add auto-reply)
    db.run(
      `INSERT INTO forum_posts 
       (user_id, category, community, question, extracted_keywords, status, upvotes, reply_count, created_at)
       VALUES (?, ?, ?, ?, ?, 'Answered', 0, 1, datetime('now'))`,
      [userId, category, category, question, keywords],
      function (err) {
        if (err) {
          console.error('Error inserting forum post:', err);
          return res.status(500).json({ message: 'Failed to create post' });
        }

        const newPostId = this.lastID;
        console.log(`✓ New question inserted: ID ${newPostId}`);

        // Find similar posts for smart answer generation
        db.all(
          `SELECT id, question, extracted_keywords, community
           FROM forum_posts 
           WHERE id != ? AND community = ? AND status = 'Answered'
           ORDER BY id DESC
           LIMIT 10`,
          [newPostId, category],
          (err, similarPosts) => {
            if (err) console.error('Error finding similar posts:', err);

            // Generate answer based on similarity or use generic response
            let expertAnswer = '';
            let expertName = 'FarmIQ Expert Advisor';

            // Calculate similarity scores
            const questionKeywords = keywords.toLowerCase().split(',').map(k => k.trim());
            let bestMatch = null;
            let bestScore = 0;

            if (similarPosts && similarPosts.length > 0) {
              similarPosts.forEach(post => {
                const postKeywords = (post.extracted_keywords || '').toLowerCase().split(',').map(k => k.trim());
                let score = 0;

                questionKeywords.forEach(qk => {
                  postKeywords.forEach(pk => {
                    if (qk === pk || qk.includes(pk) || pk.includes(qk)) {
                      score++;
                    }
                  });
                });

                if (score > bestScore) {
                  bestScore = score;
                  bestMatch = post;
                }
              });
            }

            // Generate context-aware answer
            if (bestScore >= 2 && bestMatch) {
              // Found good match - get its answer
              db.get(
                `SELECT reply_text, replied_by FROM forum_replies WHERE post_id = ? LIMIT 1`,
                [bestMatch.id],
                (err, matchReply) => {
                  if (matchReply) {
                    expertAnswer = `Based on similar questions: ${matchReply.reply_text}`;
                    expertName = matchReply.replied_by;
                  } else {
                    expertAnswer = generateGenericAnswer(category, question);
                  }
                  insertReplyAndRespond();
                }
              );
            } else {
              // No good match - generate category-specific answer
              expertAnswer = generateGenericAnswer(category, question);
              insertReplyAndRespond();
            }

            function insertReplyAndRespond() {
              // Insert auto-generated answer into forum_replies
              db.run(
                `INSERT INTO forum_replies
                 (post_id, reply_text, replied_by, upvotes, created_at)
                 VALUES (?, ?, ?, 0, datetime('now'))`,
                [newPostId, expertAnswer, expertName],
                function (replyErr) {
                  if (replyErr) {
                    console.error('Error inserting auto-reply:', replyErr);
                  } else {
                    console.log(`✓ Auto-reply generated for post ${newPostId}`);
                  }

                  // Fetch the complete new post with reply to return to frontend
                  db.get(
                    `SELECT fp.*, p.full_name as user_name
                     FROM forum_posts fp
                     LEFT JOIN profiles p ON fp.user_id = p.id
                     WHERE fp.id = ?`,
                    [newPostId],
                    (err, newPost) => {
                      if (err || !newPost) {
                        return res.status(201).json({
                          id: newPostId,
                          message: 'Post created successfully'
                        });
                      }

                      // Get the reply we just created
                      db.get(
                        `SELECT * FROM forum_replies WHERE post_id = ? ORDER BY created_at DESC LIMIT 1`,
                        [newPostId],
                        (err, newReply) => {
                          // Return complete post with reply
                          res.status(201).json({
                            id: newPostId,
                            message: 'Question posted and answered successfully',
                            post: {
                              id: newPost.id,
                              user_name: newPost.user_name || 'You',
                              category: newPost.community,
                              community: newPost.community,
                              question: newPost.question,
                              keywords: newPost.extracted_keywords ? newPost.extracted_keywords.split(',') : [],
                              status: newPost.status,
                              upvotes: newPost.upvotes,
                              reply_count: newPost.reply_count,
                              created_at: newPost.created_at,
                              replies: newReply ? [{
                                id: newReply.id,
                                reply_text: newReply.reply_text,
                                replied_by: newReply.replied_by,
                                upvotes: newReply.upvotes,
                                created_at: newReply.created_at
                              }] : []
                            }
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          }
        );
      }
    );
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Helper function to generate category-specific answers
function generateGenericAnswer(category, question) {
  const answers = {
    'Crop': `For crop-related queries, I recommend consulting with your local agriculture extension officer. Based on your region's climate and soil type, they can provide specific guidance. You can also use our crop disease detection feature for image-based analysis.`,

    'Soil': `Soil health is crucial for good yields. I recommend getting a soil test done at your nearest soil testing laboratory. Based on the results, you can determine the right amendments needed. Regular addition of organic matter like FYM or compost helps improve soil structure and fertility.`,

    'Weather': `For accurate weather forecasts, please check our Weather section which provides 7-day forecasts. During extreme weather events, ensure proper drainage in fields and protect standing crops with appropriate measures. Local agriculture department can provide region-specific advisories.`,

    'Disease & Pests': `Early detection is key for pest and disease management. Try using our Crop Disease feature for image-based identification. For immediate action, consult with local plant protection experts. Always use recommended pesticides at proper dosages and follow safety guidelines.`,

    'Market': `Market prices fluctuate based on demand, supply, and seasonal factors. Check daily rates on eNAM portal or local APMC markets. Avoid distress selling - store produce properly if prices are low. Consider joining Farmer Producer Organizations (FPOs) for better bargaining power.`,

    'Fertilizers': `Fertilizer application should be based on soil test results. Over-application can harm soil health and crops. Follow recommended NPK ratios for your crop. Split application is better than single dose. Consider using bio-fertilizers and organic manures to reduce chemical dependence.`,

    'General Queries': `For general agricultural queries and government schemes, visit your local agriculture department office or Krishi Vigyan Kendra (KVK). They provide free advisory services, training programs, and information about subsidies. You can also call the Kisan Call Centre at 1800-180-1551 for expert advice.`
  };

  return answers[category] || `Thank you for your question. Our agricultural experts will review this and provide detailed guidance. In the meantime, you can explore our other features like Crop Disease Detection, Market Prices, and Weather Forecast for immediate assistance.`;
}


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

// Upvote forum post
app.post('/api/forum/upvote', requireAuth, async (req, res) => {
  try {
    const { postId, action } = req.body;

    if (!postId || !action) {
      return res.status(400).json({ message: 'Post ID and action are required' });
    }

    let result;
    if (action === 'increment') {
      result = await dbHelpers.incrementPostUpvotes(postId);
    } else if (action === 'decrement') {
      result = await dbHelpers.decrementPostUpvotes(postId);
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "increment" or "decrement"' });
    }

    res.json({ upvotes: result.upvotes });
  } catch (error) {
    console.error('Upvote forum post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ========== INTELLIGENT FARMER FORUM ROUTES (New Q&A System) ==========

const { extractKeywords } = require('./keywords');

// Get all farmer forum posts
app.get('/api/farmer-forum/posts', requireAuth, async (req, res) => {
  try {
    const posts = await dbHelpers.getFarmerForumPosts();
    res.json(posts);
  } catch (error) {
    console.error('Get farmer forum posts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search farmer forum with keyword extraction and intelligent matching
app.get('/api/farmer-forum/search', requireAuth, async (req, res) => {
  try {
    const { question, community } = req.query;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Extract keywords from the question
    const keywords = extractKeywords(question);
    console.log(`Extracted keywords from "${question}": ${keywords}`);

    // Search with keywords and community filter
    const results = await dbHelpers.searchFarmerForumByKeywords(keywords, community);

    if (!results || results.length === 0) {
      return res.json({
        found: false,
        message: 'No community-specific result found. Please refine your question.',
        extractedKeywords: keywords
      });
    }

    res.json({
      found: true,
      results,
      extractedKeywords: keywords
    });
  } catch (error) {
    console.error('Search farmer forum error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new farmer forum question
app.post('/api/farmer-forum/question', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { question, community } = req.body;

    if (!question || !community) {
      return res.status(400).json({ message: 'Question and community are required' });
    }

    // Extract keywords
    const keywords = extractKeywords(question);

    // Create the question
    const result = await dbHelpers.createFarmerForumQuestion(question, keywords, community, userId);

    res.status(201).json({
      id: result.id,
      message: 'Question posted successfully',
      extractedKeywords: keywords
    });
  } catch (error) {
    console.error('Create farmer forum question error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle upvote on farmer forum post
app.post('/api/farmer-forum/upvote', requireAuth, async (req, res) => {
  try {
    const { postId, action } = req.body;

    if (!postId || !action) {
      return res.status(400).json({ message: 'Post ID and action are required' });
    }

    let result;
    if (action === 'increment') {
      result = await dbHelpers.incrementForumUpvotes(postId);
    } else if (action === 'decrement') {
      result = await dbHelpers.decrementForumUpvotes(postId);
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "increment" or "decrement"' });
    }

    res.json({ upvotes: result.upvotes });
  } catch (error) {
    console.error('Upvote farmer forum post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add reply to farmer forum post (increments reply count)
app.post('/api/farmer-forum/reply', requireAuth, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    // Increment the reply count
    await dbHelpers.incrementForumReplies(postId);

    res.json({ message: 'Reply added successfully' });
  } catch (error) {
    console.error('Add farmer forum reply error:', error);
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
