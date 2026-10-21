import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Property from '@/lib/models/Property';
import { normalizePropertyInput } from '@/lib/property-input.mjs';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const property = await Property.findById(id);
    if (!property) return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching property', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    await connectDB();
    const { id } = await params;
    const { body, error } = normalizePropertyInput(await request.json(), { partial: true });
    if (error) return NextResponse.json({ success: false, message: error }, { status: 400 });

    const property = await Property.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!property) return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Property updated successfully', data: property });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating property', error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    await connectDB();
    const { id } = await params;
    const property = await Property.findByIdAndDelete(id);
    if (!property) return NextResponse.json({ success: false, message: 'Property not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting property', error: error.message }, { status: 500 });
  }
}
