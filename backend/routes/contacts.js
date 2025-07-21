const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { sendContactFormEmail, testEmailConfiguration } = require('../services/emailService');

// 🔓 PUBLIC ROUTE: POST /api/contacts - Create new contact (from frontend form)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, interest, message } = req.body;
    
    console.log('📧 Received contact form submission:', { name, email, phone, interest: interest || 'Not specified' });
    
    // Validate required fields
    if (!name || !email || !phone || !message) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and message are required'
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Create new contact in database
    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      interest: interest?.trim() || '',
      message: message.trim(),
      source: 'website'
    });
    
    await contact.save();
    
    console.log('✅ New contact inquiry saved to database:', {
      id: contact._id,
      name: contact.name,
      email: contact.email
    });
    
    // 🆕 NEW: Send email notification
    let emailResult = { success: false, error: 'Email service not available' };
    
    try {
      console.log('📧 Attempting to send email notification...');
      
      emailResult = await sendContactFormEmail({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        interest: contact.interest,
        message: contact.message
      });
      
      if (emailResult.success) {
        console.log('✅ Email notification sent successfully');
      } else {
        console.error('❌ Email notification failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending email notification:', emailError);
      emailResult = {
        success: false,
        error: emailError.message
      };
    }
    
    // Return success response (don't fail if email fails)
    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt
      },
      // Include email status for debugging
      emailNotification: {
        sent: emailResult.success,
        ...(emailResult.success ? { messageId: emailResult.messageId } : { error: emailResult.error })
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 🆕 NEW: Test email configuration endpoint - NO AUTH REQUIRED
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const configTest = await testEmailConfiguration();
    
    if (configTest) {
      res.json({
        success: true,
        message: 'Email configuration is working correctly',
        timestamp: new Date(),
        config: {
          user: process.env.GMAIL_USER || 'Not configured',
          password: process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed',
        timestamp: new Date(),
        config: {
          user: process.env.GMAIL_USER || 'Not configured',
          password: process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured'
        }
      });
    }
  } catch (error) {
    console.error('❌ Email configuration test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// 🔓 REMOVED AUTHENTICATION: GET /api/contacts - Get all contacts (for admin panel)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority,
      isRead,
      search 
    } = req.query;

    console.log('📊 Loading contacts with filters:', { page, limit, status, priority, isRead, search });

    // Build filter object
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    // Search in name, email, or message
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get contacts with pagination
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalContacts = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(totalContacts / parseInt(limit));
    
    // Get counts by status for dashboard
    const statusCounts = await Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const unreadCount = await Contact.countDocuments({ isRead: false });
    
    console.log('✅ Contacts loaded:', { total: totalContacts, returned: contacts.length });
    
    res.json({
      success: true,
      data: contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalContacts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      stats: {
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        unreadCount
      }
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

// 🔓 REMOVED AUTHENTICATION: GET /api/contacts/stats - Get contact statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Loading contact statistics...');
    
    const totalContacts = await Contact.countDocuments();
    const unreadCount = await Contact.countDocuments({ isRead: false });
    const newCount = await Contact.countDocuments({ status: 'new' });
    
    // Get contacts from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = await Contact.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    const statusCounts = await Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const priorityCounts = await Contact.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    console.log('✅ Contact statistics loaded');
    
    res.json({
      success: true,
      data: {
        totalContacts,
        unreadCount,
        newCount,
        recentCount,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        priorityCounts: priorityCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Error fetching contact stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact statistics',
      error: error.message
    });
  }
});

// 🔓 REMOVED AUTHENTICATION: GET /api/contacts/:id - Get single contact
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact',
      error: error.message
    });
  }
});

// 🔓 REMOVED AUTHENTICATION: PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res) => {
  try {
    const { status, priority, notes, isRead } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (isRead !== undefined) updateData.isRead = isRead;
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    console.log('✅ Contact updated:', contact._id);
    
    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating contact',
      error: error.message
    });
  }
});

// 🔓 REMOVED AUTHENTICATION: PUT /api/contacts/:id/mark-read - Mark contact as read
router.put('/:id/mark-read', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    console.log('✅ Contact marked as read:', contact._id);
    
    res.json({
      success: true,
      message: 'Contact marked as read',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error marking contact as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking contact as read',
      error: error.message
    });
  }
});

// 🔓 REMOVED AUTHENTICATION: DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    console.log('✅ Contact deleted:', contact._id);
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact',
      error: error.message
    });
  }
});

module.exports = router;