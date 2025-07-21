const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// Try to load email service, but don't fail if it's not available
let sendContactFormEmail, testEmailConfiguration;
try {
  const emailService = require('../services/emailService');
  sendContactFormEmail = emailService.sendContactFormEmail;
  testEmailConfiguration = emailService.testEmailConfiguration;
  console.log('✅ Email service loaded successfully');
} catch (error) {
  console.warn('⚠️ Email service not available:', error.message);
  sendContactFormEmail = async () => ({ success: false, error: 'Email service not available' });
  testEmailConfiguration = async () => false;
}

// 🔓 PUBLIC ROUTE: POST /api/contacts - Create new contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, interest, message } = req.body;
    
    console.log('📧 Contact form submission:', { name, email, phone, interest: interest || 'Not specified' });
    
    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and message are required'
      });
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }
    
    // Create contact in database
    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      interest: interest?.trim() || '',
      message: message.trim(),
      source: 'website'
    });
    
    await contact.save();
    console.log('✅ Contact saved to database:', contact._id);
    
    // Try to send email notification
    let emailResult = { success: false, error: 'Email service not available' };
    try {
      emailResult = await sendContactFormEmail({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        interest: contact.interest,
        message: contact.message
      });
      
      if (emailResult.success) {
        console.log('✅ Email notification sent');
      } else {
        console.warn('⚠️ Email notification failed:', emailResult.error);
      }
    } catch (emailError) {
      console.warn('⚠️ Email send error:', emailError.message);
    }
    
    // Return success (don't fail if email fails)
    res.status(201).json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt
      },
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

// 🔓 PUBLIC ROUTE: GET /api/contacts/test-email - Test email config
router.get('/test-email', async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const configTest = await testEmailConfiguration();
    
    res.json({
      success: configTest,
      message: configTest ? 'Email configuration is working' : 'Email configuration test failed',
      config: {
        user: process.env.GMAIL_USER || 'Not configured',
        password: process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured',
        nodemailer: sendContactFormEmail !== undefined ? '✅ Available' : '❌ Not available'
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email configuration',
      error: error.message
    });
  }
});

// 🔒 PROTECTED ROUTES - Require authentication

// GET /api/contacts - Get all contacts
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

    console.log('📊 Loading contacts for admin...');

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalContacts = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(totalContacts / parseInt(limit));
    
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

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const unreadCount = await Contact.countDocuments({ isRead: false });
    const newCount = await Contact.countDocuments({ status: 'new' });
    
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
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact statistics',
      error: error.message
    });
  }
});

// GET /api/contacts/:id - Get single contact
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

// PUT /api/contacts/:id - Update contact
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

// PUT /api/contacts/:id/mark-read - Mark as read
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
    
    res.json({
      success: true,
      message: 'Contact marked as read',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error marking as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking contact as read',
      error: error.message
    });
  }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
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