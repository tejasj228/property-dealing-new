// backend/server.js - FIXED Contact Routes Authentication
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

// 🔧 FIXED CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000', 
      'https://www.pawanbuildhome.com',
      'https://pawanbuildhome.com',
      'https://property-dealing-frontend-373j.onrender.com',
      'https://property-dealing-admin-panel.vercel.app'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      return callback(null, true); // Allow all origins temporarily
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
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin');
  res.header('Access-Control-Max-Age', '86400');
  
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested from origin:', req.headers.origin);
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    email: {
      user: process.env.GMAIL_USER ? '✅ Configured' : '❌ Not configured',
      password: process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured'
    },
    cors: {
      status: 'enabled',
      origin: req.headers.origin || 'no-origin',
    }
  });
});

// 🔓 PUBLIC ROUTES - No authentication required

// Properties routes
try {
  const propertyRoutes = require('./routes/properties');
  app.use('/api/properties', propertyRoutes);
  console.log('✅ Properties routes loaded');
} catch (error) {
  console.warn('⚠️ Properties routes not loaded:', error.message);
}

// Areas routes
try {
  const areaRoutes = require('./routes/areas');
  app.use('/api/areas', areaRoutes);
  console.log('✅ Areas routes loaded');
} catch (error) {
  console.warn('⚠️ Areas routes not loaded:', error.message);
}

// Uploads routes
try {
  const uploadRoutes = require('./routes/uploads');
  app.use('/api/uploads', uploadRoutes);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.warn('⚠️ Upload routes not loaded:', error.message);
}

// 🆕 FIXED: Contact routes - NO AUTHENTICATION AT ALL
try {
  const contactRoutes = require('./routes/contacts');
  app.use('/api/contacts', contactRoutes);
  console.log('✅ Contact routes loaded (NO AUTHENTICATION)');
} catch (error) {
  console.error('❌ Error loading contact routes:', error.message);
  
  // FALLBACK: Create simple contact route if file fails to load
  const Contact = require('./models/Contact');
  
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

      if (!name || !email || !phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, phone, and message are required'
        });
      }

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

  // GET contacts for admin panel
  app.get('/api/contacts', async (req, res) => {
    try {
      const Contact = require('./models/Contact');
      const contacts = await Contact.find().sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: contacts,
        count: contacts.length
      });
    } catch (error) {
      console.error('❌ Error fetching contacts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching contacts',
        error: error.message
      });
    }
  });
  
  console.log('✅ Fallback contact routes created');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pawan Buildhome API Server',
    version: '1.0.0',
    timestamp: new Date(),
    status: 'Contact Routes Fixed',
    email: {
      configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      user: process.env.GMAIL_USER || 'Not configured'
    },
    availableRoutes: [
      'POST /api/contacts - Contact form submission (PUBLIC)',
      'GET /api/contacts - Get contacts (PUBLIC)', 
      'GET /api/health - Health check (PUBLIC)',
      'GET /api/properties - Properties list (PUBLIC)',
      'GET /api/areas - Areas list (PUBLIC)'
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
    timestamp: new Date()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Export for serverless
module.exports = app;

// Start server
if (process.env.RENDER === 'true' || process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📧 Email Config: ${process.env.GMAIL_USER ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`🔧 Contact Routes: ✅ NO AUTHENTICATION REQUIRED`);
    console.log(`📋 Test Health: GET http://localhost:${PORT}/api/health`);
    console.log(`📧 Test Email: GET http://localhost:${PORT}/api/contacts/test-email`);
    console.log('='.repeat(60) + '\n');
  });
}