import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { authenticateToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const { id } = await params;
    const contact = await Contact.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!contact) return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Contact marked as read', data: contact });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error marking contact as read', error: error.message }, { status: 500 });
  }
}
