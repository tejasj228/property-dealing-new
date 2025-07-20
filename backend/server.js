// backend/server.js - MINIMAL WORKING VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🔧 SIMPLE CORS - Allow all origins for debugging
app.use(cors({
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add logging middleware to see all requests
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log(`📝 Headers:`, req.headers.origin || 'No origin');
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB Connected');
}).catch(err => {
  console.error('❌ MongoDB Connection Error:', err);
});

// 🔧 DIRECT CONTACT ROUTE - No conflicts!
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, interest, message } = req.body;
    
    console.log('📧 DIRECT: Contact form submission:', { 
      name, 
      email, 
      phone, 
      interest,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
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

    // Import Contact model only when needed
    const Contact = require('./models/Contact');

    // Create new contact
    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      interest: interest?.trim() || '',
      message: message.trim(),
      source: 'website'
    });

    await contact.save();

    console.log('✅ Contact saved successfully:', {
      id: contact._id,
      name: contact.name,
      email: contact.email
    });

    // Send success response
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
    console.error('❌ Error in contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested');
  res.json({ 
    message: 'Backend is running!', 
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route to verify server is working
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pawan Buildhome API Server',
    version: '1.0.0',
    timestamp: new Date(),
    availableRoutes: [
      'POST /api/contacts - Contact form submission',
      'GET /api/health - Health check'
    ]
  });
});

// 🔧 OTHER ROUTES (Add these back once contact form works)
// Uncomment these once contact form is working:

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

// Catch all unhandled routes
app.all('/api/*', (req, res) => {
  console.log(`❌ 404 - Unhandled API route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'POST /api/contacts',
      'GET /api/health',
      'GET /api/properties',
      'GET /api/areas'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Contact Form: POST http://localhost:${PORT}/api/contacts`);
  console.log(`🔍 Health Check: GET http://localhost:${PORT}/api/health`);
  console.log(`🔧 CORS: Enabled for all origins (debug mode)`);
});

module.exports = app;