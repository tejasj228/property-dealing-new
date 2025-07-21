// backend/services/emailService.js - Email service using nodemailer
const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.GMAIL_USER || 'your-email@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send contact form email notification
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Contact person name
 * @param {string} contactData.email - Contact person email
 * @param {string} contactData.phone - Contact person phone
 * @param {string} contactData.interest - Area of interest
 * @param {string} contactData.message - Contact message
 * @returns {Promise<Object>} - Email send result
 */
const sendContactFormEmail = async (contactData) => {
  try {
    const { name, email, phone, interest, message } = contactData;
    
    console.log('📧 Preparing to send contact form email...');
    console.log('📧 Contact data:', { name, email, phone, interest: interest || 'Not specified' });
    
    const transporter = createTransporter();
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    // Build subject line
    const subject = `${name} : ${phone} : ${interest || 'General Inquiry'}`;
    
    // Build email content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #B8860B, #DAA520);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
          }
          .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #B8860B;
          }
          .info-label {
            font-weight: 600;
            color: #B8860B;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 16px;
            color: #333;
          }
          .message-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #B8860B;
          }
          .message-label {
            font-weight: 600;
            color: #B8860B;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          .message-content {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            white-space: pre-line;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .priority-high {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
          }
          .contact-actions {
            margin: 20px 0;
            text-align: center;
          }
          .contact-btn {
            display: inline-block;
            background: #B8860B;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 New Property Inquiry</h1>
            <p>Pawan Buildhome - Contact Form Submission</p>
          </div>
          
          <div class="content">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">👤 Contact Person</div>
                <div class="info-value">${name}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">📧 Email Address</div>
                <div class="info-value">
                  <a href="mailto:${email}" style="color: #B8860B; text-decoration: none;">
                    ${email}
                  </a>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">📱 Phone Number</div>
                <div class="info-value">
                  <a href="tel:${phone}" style="color: #B8860B; text-decoration: none;">
                    ${phone}
                  </a>
                </div>
              </div>
              
              <div class="info-item">
                <div class="info-label">🏢 Area of Interest</div>
                <div class="info-value">${interest || 'Not specified'}</div>
              </div>
            </div>
            
            <div class="message-section">
              <div class="message-label">💬 Message</div>
              <div class="message-content">${message}</div>
            </div>
            
            <div class="contact-actions">
              <a href="mailto:${email}" class="contact-btn">
                📧 Reply via Email
              </a>
              <a href="tel:${phone}" class="contact-btn">
                📞 Call Now
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Pawan Buildhome</strong></p>
            <p>S-1 Skytech Matrott Market, Sector-76, Noida (U.P) 201307</p>
            <p>📞 +91-9811186086 | 📞 +91-9811186083</p>
            <p>📧 pawan127jitendra@gmail.com</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p style="font-size: 12px; color: #999;">
              This email was sent from the contact form on your website.<br>
              Received on ${new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Plain text version for email clients that don't support HTML
    const textContent = `
New Property Inquiry - Pawan Buildhome

Contact Details:
==================
Name: ${name}
Email: ${email}
Phone: ${phone}
Area of Interest: ${interest || 'Not specified'}

Message:
========
${message}

---
This inquiry was submitted through the contact form on your website.
Received on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

Contact Information:
Pawan Buildhome
S-1 Skytech Matrott Market, Sector-76, Noida (U.P) 201307
Phone: +91-9811186086, +91-9811186083
Email: pawan127jitendra@gmail.com
    `;
    
    // Email options
    const mailOptions = {
      from: {
        name: name,
        address: email
      },
      to: 'tejasjaiswal5@gmail.com', // 🔧 RECIPIENT EMAIL
      replyTo: email, // Reply will go to the contact person
      subject: subject,
      text: textContent,
      html: htmlContent,
      // Additional headers for better deliverability
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Pawan Buildhome Contact Form'
      }
    };
    
    console.log('📤 Sending email to:', mailOptions.to);
    console.log('📝 Email subject:', subject);
    
    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Contact form email sent successfully');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
    
  } catch (error) {
    console.error('❌ Error sending contact form email:', error);
    
    // Log detailed error information
    if (error.code) {
      console.error('❌ Error Code:', error.code);
    }
    if (error.response) {
      console.error('❌ SMTP Response:', error.response);
    }
    if (error.responseCode) {
      console.error('❌ Response Code:', error.responseCode);
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} - True if email config is working
 */
const testEmailConfiguration = async () => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Email configuration test passed');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
};

/**
 * Send a test email
 * @param {string} testRecipient - Test email recipient
 * @returns {Promise<Object>} - Test email result
 */
const sendTestEmail = async (testRecipient = 'tejasjaiswal5@gmail.com') => {
  try {
    console.log('🧪 Sending test email to:', testRecipient);
    
    const testContactData = {
      name: 'Test Contact',
      email: 'test@example.com',
      phone: '+91-9999999999',
      interest: 'Test Area',
      message: 'This is a test message from the Pawan Buildhome contact form system.'
    };
    
    const result = await sendContactFormEmail(testContactData);
    
    if (result.success) {
      console.log('✅ Test email sent successfully');
    } else {
      console.error('❌ Test email failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendContactFormEmail,
  testEmailConfiguration,
  sendTestEmail
};