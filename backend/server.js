// backend/server.js - FIXED: 404 Errors and Route Issues
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// ✅ FIXED: Enhanced logging
console.log('\n' + '='.repeat(60));
console.log('🚀 PAWAN BUILDHOME API SERVER STARTING...');
console.log('='.repeat(60));
console.log(`📅 Timestamp: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`);
console.log(`🔗 Port: ${process.env.PORT || 5000}`);
console.log('='.repeat(60) + '\n');

// ✅ FIXED: Request logging middleware first
app.use(morgan('combined'));

// Custom request logger for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 ${timestamp} - ${req.method} ${req.originalUrl}`);
  console.log(`📍 Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`🔍 User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
  next();
});

// ✅ FIXED: Comprehensive CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Production whitelist
    const allowedOrigins = [
      'https://pawanbuildhome.com',
      'https://www.pawanbuildhome.com',
      'https://property-dealing-qle8.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Access-Control-Allow-Origin'
  ]
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log(`✈️ Preflight request: ${req.method} ${req.originalUrl}`);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.sendStatus(200);
});

// ✅ FIXED: Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ FIXED: Static file serving for uploads (development only)
if (process.env.NODE_ENV !== 'production') {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadDir);
  }
  
  app.use('/uploads', express.static(uploadDir, {
    setHeaders: (res, path) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  }));
  console.log('📁 Static uploads directory configured');
}

// ✅ FIXED: Database connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📂 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error('🔧 Full error:', err);
      process.exit(1);
    }
  }
};

// Connect to database
connectDB();

// ✅ FIXED: Health check endpoint with comprehensive info
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  
  const healthData = {
    status: 'OK',
    message: 'Pawan Buildhome API is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      name: mongoose.connection.name || 'Unknown',
      host: mongoose.connection.host || 'Unknown'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    cors: 'Enabled',
    availableEndpoints: {
      'GET /api/health': 'Server health check',
      'POST /api/contacts': 'Contact form submission (PUBLIC)',
      'GET /api/properties': 'Properties listing (PUBLIC)',
      'GET /api/areas': 'Areas listing (PUBLIC)',
      'GET /api/uploads/slider': 'Slider images (PUBLIC)',
      'GET /api/societies/:areaKey/:subAreaId': 'Societies data (PUBLIC)'
    }
  };
  
  res.json(healthData);
});

// ✅ FIXED: Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Pawan Buildhome API Server',
    version: '2.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    documentation: {
      health: 'GET /api/health',
      contact: 'POST /api/contacts',
      properties: 'GET /api/properties',
      areas: 'GET /api/areas'
    }
  });
});

// ✅ FIXED: Load routes with error handling
const loadRoutes = () => {
  console.log('\n📋 Loading API routes...');
  
  // Auth routes (optional)
  try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded: /api/auth/*');
  } catch (error) {
    console.warn('⚠️ Auth routes not available:', error.message);
  }

  // Properties routes (PUBLIC READ)
  try {
    const propertyRoutes = require('./routes/properties');
    app.use('/api/properties', propertyRoutes);
    console.log('✅ Properties routes loaded: /api/properties/*');
  } catch (error) {
    console.error('❌ Failed to load properties routes:', error.message);
    
    // Create fallback properties route
    app.get('/api/properties', (req, res) => {
      console.log('📦 Fallback properties route called');
      res.json({
        success: true,
        data: [],
        message: 'Properties service temporarily unavailable'
      });
    });
    console.log('🔧 Fallback properties route created');
  }

  // Areas routes (PUBLIC READ)
  try {
    const areaRoutes = require('./routes/areas');
    app.use('/api/areas', areaRoutes);
    console.log('✅ Areas routes loaded: /api/areas/*');
  } catch (error) {
    console.error('❌ Failed to load areas routes:', error.message);
    
    // Create fallback areas route
    app.get('/api/areas', (req, res) => {
      console.log('📍 Fallback areas route called');
      res.json({
        success: true,
        data: {
          'noida': {
            name: 'Noida',
            description: 'Properties in Noida region',
            subAreas: []
          },
          'yamuna-expressway': {
            name: 'Yamuna Expressway',
            description: 'Properties along Yamuna Expressway',
            subAreas: []
          }
        },
        message: 'Using default areas data'
      });
    });
    console.log('🔧 Fallback areas route created');
  }

  // Uploads routes (PUBLIC READ)
  try {
    const uploadRoutes = require('./routes/uploads');
    app.use('/api/uploads', uploadRoutes);
    console.log('✅ Upload routes loaded: /api/uploads/*');
  } catch (error) {
    console.error('❌ Failed to load upload routes:', error.message);
    
    // Create fallback slider route
    app.get('/api/uploads/slider', (req, res) => {
      console.log('🖼️ Fallback slider route called');
      res.json({
        success: true,
        data: [
          {
            title: 'Modern House',
            imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1296&auto=format&fit=crop',
            altText: 'Modern House'
          },
          {
            title: 'Luxury Villa',
            imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1170&auto=format&fit=crop',
            altText: 'Luxury Villa'
          }
        ],
        message: 'Using default slider images'
      });
    });
    console.log('🔧 Fallback slider route created');
  }

  // Societies routes (PUBLIC READ)
  try {
    const societyRoutes = require('./routes/societies');
    app.use('/api/societies', societyRoutes);
    console.log('✅ Societies routes loaded: /api/societies/*');
  } catch (error) {
    console.error('❌ Failed to load societies routes:', error.message);
    
    // Create fallback societies route
    app.get('/api/societies/:areaKey/:subAreaId', (req, res) => {
      console.log('🏘️ Fallback societies route called');
      res.json({
        success: true,
        data: { societies: [] },
        message: 'Societies service temporarily unavailable'
      });
    });
    console.log('🔧 Fallback societies route created');
  }

  // ✅ FIXED: Contact routes with enhanced error handling
  try {
    const contactRoutes = require('./routes/contacts');
    
    // Public contact form submission
    app.post('/api/contacts', async (req, res) => {
      try {
        console.log('📧 Contact form submission received:', {
          name: req.body.name,
          email: req.body.email,
          timestamp: new Date().toISOString()
        });
        
        const { name, email, phone, interest, message } = req.body;

        // Validation
        if (!name || !email || !phone || !message) {
          return res.status(400).json({
            success: false,
            message: 'Name, email, phone, and message are required'
          });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address'
          });
        }

        // Try to save to database
        try {
          const Contact = require('./models/Contact');
          
          const contact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            interest: interest?.trim() || '',
            message: message.trim(),
            source: 'website',
            createdAt: new Date()
          });

          await contact.save();
          
          console.log('✅ Contact saved to database:', contact._id);
          
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
          
        } catch (dbError) {
          console.error('❌ Database save error:', dbError.message);
          
          // Even if DB save fails, acknowledge the submission
          res.status(202).json({
            success: true,
            message: 'Thank you for your inquiry! We have received your message and will get back to you soon.',
            note: 'Message received but database temporarily unavailable'
          });
        }

      } catch (error) {
        console.error('❌ Contact form error:', error);
        res.status(500).json({
          success: false,
          message: 'Error submitting contact form. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    });
    
    // Admin routes for contacts (require authentication)
    app.use('/api/contacts', (req, res, next) => {
      // Skip auth for POST requests (already handled above)
      if (req.method === 'POST') {
        return next('route');
      }
      
      // Require auth for other methods
      try {
        const { authenticateToken, requireAdmin } = require('./middleware/auth');
        authenticateToken(req, res, (err) => {
          if (err) return next(err);
          requireAdmin(req, res, next);
        });
      } catch (authError) {
        return res.status(501).json({
          success: false,
          message: 'Admin functionality not available'
        });
      }
    }, contactRoutes);
    
    console.log('✅ Contact routes loaded with enhanced error handling');
    
  } catch (error) {
    console.error('❌ Failed to load contact routes:', error.message);
    console.log('🔧 Contact route error - this should not happen');
  }

  console.log('📋 Route loading completed\n');
};

// Load all routes
loadRoutes();

// ✅ FIXED: 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health - Health check',
      'POST /api/contacts - Contact form submission',
      'GET /api/properties - Properties listing',
      'GET /api/areas - Areas listing',
      'GET /api/uploads/slider - Slider images'
    ],
    timestamp: new Date().toISOString()
  });
});

// ✅ FIXED: Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler triggered:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token expired'
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for serverless deployments
module.exports = app;

// ✅ FIXED: Start server with enhanced logging
if (require.main === module || process.env.RENDER === 'true') {
  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log('\n' + '🎉'.repeat(20));
    console.log('🚀 PAWAN BUILDHOME API SERVER STARTED SUCCESSFULLY!');
    console.log('🎉'.repeat(20));
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📧 Contact Form: POST http://localhost:${PORT}/api/contacts`);
    console.log(`🏠 Properties: GET http://localhost:${PORT}/api/properties`);
    console.log(`📍 Areas: GET http://localhost:${PORT}/api/areas`);
    console.log(`🖼️ Slider: GET http://localhost:${PORT}/api/uploads/slider`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('🎉'.repeat(20) + '\n');
  });
}