import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Property from '@/lib/models/Property';

export async function PUT(request) {
  try {
    await connectDB();
    const { propertyIds } = await request.json();

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json({ success: false, message: 'propertyIds array is required' }, { status: 400 });
    }

    await Promise.all(
      propertyIds.map((id, index) => Property.findByIdAndUpdate(id, { order: index }, { new: true }))
    );

    return NextResponse.json({ success: true, message: 'Properties reordered successfully' });
  } catch (error) {
    console.error('Error reordering properties:', error);
    return NextResponse.json({ success: false, message: 'Error reordering properties', error: error.message }, { status: 500 });
  }
}
