import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { authenticateToken } from '@/lib/auth';

export async function GET(request, { params }) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const contact = await Contact.findById(params.id);
    if (!contact) return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching contact', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const body = await request.json();
    const { status: contactStatus, priority, notes, isRead } = body;

    const updateData = {};
    if (contactStatus) updateData.status = contactStatus;
    if (priority) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;
    if (isRead !== undefined) updateData.isRead = isRead;

    const contact = await Contact.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true });
    if (!contact) return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Contact updated successfully', data: contact });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating contact', error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const contact = await Contact.findByIdAndDelete(params.id);
    if (!contact) return NextResponse.json({ success: false, message: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting contact', error: error.message }, { status: 500 });
  }
}
