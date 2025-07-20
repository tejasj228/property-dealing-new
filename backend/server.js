// backend/server.js - FIXED VERSION
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

// 🔧 SIMPLIFIED CORS Configuration
const corsOptions = {
  origin: [
    // Production domains
    'https://pawanbuildhome.com',
    'https://www.pawanbuildhome.com',
    
    // Vercel domains (allow all vercel apps)
    /.*\.vercel\.app$/,
    
    // Development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
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

// 🔓 PUBLIC ROUTES (No authentication required)
app.use('/api/auth', require('./routes/auth'));

// 🔓 PUBLIC: Contact form submission - STANDALONE ROUTE
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, interest, message } = req.body;
    
    console.log('📧 PUBLIC: Contact form submission received:', { 
      name, 
      email, 
      phone,
      interest: interest || 'Not specified',
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      method: req.method
    });
    
    // Validate required fields
    if (!name || !email || !phone || !message) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and message are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
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
const propertyRoutes = require('./routes/properties');
app.use('/api/properties', propertyRoutes);

// Areas routes - GET public, POST/PUT/DELETE protected  
const areaRoutes = require('./routes/areas');
app.use('/api/areas', areaRoutes);

// Uploads routes - GET public, POST/DELETE protected
const uploadRoutes = require('./routes/uploads');
app.use('/api/uploads', uploadRoutes);

// 🔒 PROTECTED: Admin contact management routes
const { authenticateToken, requireAdmin } = require('./middleware/auth');
const contactRoutes = require('./routes/contacts');

// Apply auth middleware only to non-POST contact routes
app.use('/api/contacts', (req, res, next) => {
  // Skip authentication for POST requests (already handled above)
  if (req.method === 'POST') {
    return next('route'); // Skip to next route
  }
  
  // Apply authentication for all other methods
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireAdmin(req, res, next);
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
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  
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
    console.log(`📧 Contact Form: POST /api/contacts (PUBLIC)`);
  });
}