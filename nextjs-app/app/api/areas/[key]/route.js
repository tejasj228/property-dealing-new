import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const area = await Area.findOne({ key: params.key });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        name: area.name,
        description: area.description,
        subAreas: area.subAreas.sort((a, b) => a.order - b.order),
        order: area.order,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching area', error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    const area = await Area.findOneAndUpdate({ key: params.key }, body, { new: true, runValidators: true });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Area updated successfully', data: area });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error updating area', error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const area = await Area.findOneAndDelete({ key: params.key });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Area deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error deleting area', error: error.message }, { status: 500 });
  }
}
