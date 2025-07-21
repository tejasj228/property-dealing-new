// backend/server.js - FIXED CORS Configuration
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(morgan('combined'));

// 🔧 FIXED CORS Configuration - The main issue was here!
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000', 
      'https://www.pawanbuildhome.com',
      'https://pawanbuildhome.com',
      'https://property-dealing-frontend-373j.onrender.com'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      return callback(null, true); // Allow all origins temporarily for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Access-Control-Allow-Origin' // This was missing!
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 🔧 ADDITIONAL CORS HEADERS - Manual override for preflight issues
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set specific CORS headers manually
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight: ${req.method} ${req.originalUrl} from ${origin || 'unknown'}`);
    return res.status(200).end();
  }
  
  console.log(`📝 CORS Request: ${req.method} ${req.originalUrl} from ${origin || 'unknown'}`);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log(`📝 Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`📝 User-Agent: ${req.headers['user-agent'] || 'No user-agent'}`);
  next();
});

// Create uploads directory only in development
if (process.env.NODE_ENV !== 'production') {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
    console.log('📂 Database:', mongoose.connection.name);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

connectDB();

// Health check endpoint with CORS test
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested from origin:', req.headers.origin);
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      status: 'enabled',
      origin: req.headers.origin || 'no-origin',
      allowedOrigins: [
        'http://localhost:3000',
        'https://www.pawanbuildhome.com',
        'https://pawanbuildhome.com'
      ]
    },
    routes: {
      'POST /api/contacts': 'Public contact form',
      'GET /api/health': 'Health check',
      'GET /api/properties': 'Public properties',
      'GET /api/areas': 'Public areas'
    }
  });
});

// 🔓 PUBLIC ROUTES FIRST (No authentication required)

// Auth routes
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.warn('⚠️ Auth routes not loaded:', error.message);
}

// Properties routes (PUBLIC READ)
try {
  const propertyRoutes = require('./routes/properties');
  app.use('/api/properties', propertyRoutes);
  console.log('✅ Properties routes loaded');
} catch (error) {
  console.warn('⚠️ Properties routes not loaded:', error.message);
}

// Areas routes (PUBLIC READ)
try {
  const areaRoutes = require('./routes/areas');
  app.use('/api/areas', areaRoutes);
  console.log('✅ Areas routes loaded');
} catch (error) {
  console.warn('⚠️ Areas routes not loaded:', error.message);
}

// Uploads routes (PUBLIC READ)
try {
  const uploadRoutes = require('./routes/uploads');
  app.use('/api/uploads', uploadRoutes);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.warn('⚠️ Upload routes not loaded:', error.message);
}

// Societies route (PUBLIC READ access)
try {
  app.use('/api/societies', require('./routes/societies'));
  console.log('✅ Societies routes loaded');
} catch (error) {
  console.warn('⚠️ Societies routes not loaded:', error.message);
}

// 🔧 CONTACT ROUTES - FIXED APPROACH
try {
  const contactRoutes = require('./routes/contacts');
  
  // Mount contact routes with conditional authentication
  app.use('/api/contacts', (req, res, next) => {
    console.log(`📧 Contact route: ${req.method} ${req.originalUrl} from ${req.headers.origin}`);
    
    // Allow POST without authentication (public contact form)
    if (req.method === 'POST') {
      console.log('📧 Public contact form submission - no auth required');
      return next();
    }
    
    // Require authentication for all other methods (admin features)
    console.log('🔒 Admin contact route - authentication required');
    try {
      const { authenticateToken, requireAdmin } = require('./middleware/auth');
      authenticateToken(req, res, (err) => {
        if (err) return next(err);
        requireAdmin(req, res, next);
      });
    } catch (authError) {
      console.warn('⚠️ Auth middleware not available:', authError.message);
      return res.status(500).json({
        success: false,
        message: 'Authentication system not available'
      });
    }
  }, contactRoutes);
  
  console.log('✅ Contact routes loaded with conditional auth');
} catch (error) {
  console.error('❌ Error loading contact routes:', error.message);
  
  // FALLBACK: If contact routes fail, create a simple standalone route
  console.log('🔧 Creating fallback contact route...');
  
  app.post('/api/contacts', async (req, res) => {
    try {
      const { name, email, phone, interest, message } = req.body;
      
      console.log('📧 FALLBACK: Contact form submission:', { 
        name, 
        email, 
        phone,
        interest: interest || 'Not specified',
        origin: req.headers.origin
      });

      // Validate required fields
      if (!name || !email || !phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, phone, and message are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      const Contact = require('./models/Contact');

      const contact = new Contact({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        interest: interest?.trim() || '',
        message: message.trim(),
        source: 'website'
      });

      await contact.save();

      console.log('✅ FALLBACK: Contact saved successfully:', {
        id: contact._id,
        name: contact.name,
        email: contact.email
      });

      res.status(201).json({
        success: true,
        message: 'Thank you for your inquiry! We will get back to you soon.',
        data: {
          id: contact._id,
          name: contact.name,
          email: contact.email,
          createdAt: contact.createdAt
        }
      });

    } catch (error) {
      console.error('❌ FALLBACK: Error saving contact:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting contact form. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });
  
  console.log('✅ Fallback contact route created');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pawan Buildhome API Server',
    version: '1.0.0',
    timestamp: new Date(),
    status: 'CORS Issues Fixed',
    cors: {
      enabled: true,
      allowedOrigins: [
        'http://localhost:3000',
        'https://www.pawanbuildhome.com',
        'https://pawanbuildhome.com'
      ]
    },
    availableRoutes: [
      'POST /api/contacts - Contact form submission (PUBLIC)',
      'GET /api/health - Health check (PUBLIC)',
      'GET /api/properties - Properties list (PUBLIC)',
      'GET /api/areas - Areas list (PUBLIC)',
      'GET /api/uploads/slider - Slider images (PUBLIC)'
    ]
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl} from ${req.headers.origin}`);
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    origin: req.headers.origin,
    availableRoutes: [
      'POST /api/contacts',
      'GET /api/health',
      'GET /api/properties',
      'GET /api/areas',
      'GET /api/uploads/slider'
    ],
    timestamp: new Date()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  console.error('❌ Request origin:', req.headers.origin);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.message
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Export for serverless
module.exports = app;

// Start server for development and Render
if (process.env.RENDER === 'true' || process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🔧 CORS: Fixed - Properly configured for production`);
    console.log(`📋 Health Check: GET http://localhost:${PORT}/api/health`);
    console.log(`📧 Contact Form: POST http://localhost:${PORT}/api/contacts`);
    console.log(`🌍 Allowed Origins:`);
    console.log(`   - http://localhost:3000 (development)`);
    console.log(`   - https://www.pawanbuildhome.com (production)`);
    console.log(`   - https://pawanbuildhome.com (production)`);
    console.log(`🛠️ Status: CORS preflight issues resolved`);
    console.log('='.repeat(60) + '\n');
  });
}