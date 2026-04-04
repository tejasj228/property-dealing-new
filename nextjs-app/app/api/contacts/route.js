import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { authenticateToken } from '@/lib/auth';
import { sendContactFormEmail } from '@/lib/email';

// POST /api/contacts - Public: submit contact form
export async function POST(request) {
  try {
    await connectDB();
    const { name, email, phone, interest, message } = await request.json();

    if (!name || !email || !phone || !message) {
      return NextResponse.json({ success: false, message: 'Name, email, phone, and message are required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address' }, { status: 400 });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      interest: interest?.trim() || '',
      message: message.trim(),
      source: 'website',
    });

    await contact.save();

    let emailResult = { success: false, error: 'Email service not available' };
    try {
      emailResult = await sendContactFormEmail({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        interest: contact.interest,
        message: contact.message,
      });
    } catch (emailError) {
      console.warn('Email send error:', emailError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your inquiry! We will get back to you soon.',
      data: { id: contact._id, name: contact.name, email: contact.email, createdAt: contact.createdAt },
      emailNotification: { sent: emailResult.success, ...(emailResult.success ? { messageId: emailResult.messageId } : { error: emailResult.error }) },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ success: false, message: 'Error submitting contact form.', error: error.message }, { status: 500 });
  }
}

// GET /api/contacts - Admin only: get all contacts
export async function GET(request) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const contactStatus = searchParams.get('status');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const search = searchParams.get('search');

    let filter = {};
    if (contactStatus) filter.status = contactStatus;
    if (priority) filter.priority = priority;
    if (isRead !== null) filter.isRead = isRead === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const contacts = await Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalContacts = await Contact.countDocuments(filter);
    const totalPages = Math.ceil(totalContacts / limit);
    const statusCounts = await Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const unreadCount = await Contact.countDocuments({ isRead: false });

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: { currentPage: page, totalPages, totalContacts, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      stats: { statusCounts: statusCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}), unreadCount },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ success: false, message: 'Error fetching contacts', error: error.message }, { status: 500 });
  }
}
