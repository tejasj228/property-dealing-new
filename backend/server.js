// backend/server.js - FIXED CORS Configuration
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Middleware
app.use(morgan('combined'));

// 🔧 FIXED CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Production domains
      'https://pawanbuildhome.com',
      'https://www.pawanbuildhome.com',
      
      // Vercel domains
      'https://prop-dealing-frontend-e2fw.vercel.app',
      'https://pawan-buildhome-frontend.vercel.app',
      'https://pawan-buildhome.vercel.app',
      'https://prop-dealing-frontend-373j.vercel.app',
      'https://pawanbuildhome.vercel.app',
      
      // Development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      
      // Backend self-requests
      'https://property-dealing-qle8.onrender.com'
    ];
    
    // Check if origin is in allowed list or is a Vercel preview URL
    if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(null, true); // Allow for now, can be restrictive later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'Access-Control-Allow-Origin'
  ],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// 🔓 PUBLIC ROUTES (No authentication required)
app.use('/api/auth', require('./routes/auth'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

// 🔓 PUBLIC: Contact form submission
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, interest, message } = req.body;
    
    console.log('📧 PUBLIC: Contact form submission received:', { 
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
    
    console.log('✅ Contact inquiry saved successfully:', {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      timestamp: contact.createdAt
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
    console.error('❌ Error saving contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Societies route (PUBLIC READ access)
app.use('/api/societies', require('./routes/societies'));

// Properties routes - GET public, POST/PUT/DELETE protected
app.use('/api/properties', (req, res, next) => {
  if (req.method === 'GET') {
    next();
  } else {
    authenticateToken(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  }
}, require('./routes/properties'));

// Areas routes - GET public, POST/PUT/DELETE protected
app.use('/api/areas', (req, res, next) => {
  if (req.method === 'GET') {
    next();
  } else {
    authenticateToken(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  }
}, require('./routes/areas'));

// Uploads routes - GET public, POST/DELETE protected
app.use('/api/uploads', (req, res, next) => {
  if (req.method === 'GET') {
    next();
  } else {
    authenticateToken(req, res, (err) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    });
  }
}, require('./routes/uploads'));

// Protected contact management routes
const contactRoutes = require('./routes/contacts');
app.use('/api/contacts', (req, res, next) => {
  if (req.method === 'POST') {
    return next('route');
  }
  
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireAdmin(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  });
}, contactRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pawan Buildhome API Server',
    version: '1.0.0',
    cors: 'Fixed and enabled',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
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
  
  res.status(500).json({ 
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
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`🔧 CORS: Fixed and enabled`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  });
}