// backend/services/emailService.js - Simple email service
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// Send contact form email
const sendContactFormEmail = async (contactData) => {
  try {
    const { name, email, phone, interest, message } = contactData;
    
    console.log('📧 Sending contact email...');
    
    // Skip if no email config
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('⚠️ Email not configured - skipping email send');
      return { success: false, error: 'Email not configured' };
    }
    
    const transporter = createTransporter();
    
    const subject = `${name} : ${phone} : ${interest || 'General Inquiry'}`;
    
    const htmlContent = `
      <h2>🏠 New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Interest:</strong> ${interest || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <hr>
      <p><em>Submitted on: ${new Date().toLocaleString()}</em></p>
    `;
    
    const mailOptions = {
      from: email,
      to: 'tejasjaiswal5@gmail.com',
      replyTo: email,
      subject: subject,
      html: htmlContent
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully');
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Email send failed:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return false;
    }
    
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('❌ Email config test failed:', error);
    return false;
  }
};

module.exports = {
  sendContactFormEmail,
  testEmailConfiguration
};