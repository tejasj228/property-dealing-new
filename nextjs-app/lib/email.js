import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendContactFormEmail({ name, email, phone, interest, message }) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
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

    const info = await transporter.sendMail({
      from: email,
      to: 'tejasjaiswal5@gmail.com',
      replyTo: email,
      subject,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function testEmailConfiguration() {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return false;
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
