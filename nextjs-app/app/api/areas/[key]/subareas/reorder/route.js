import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { key } = await params;
    const { subAreas } = await request.json();

    const area = await Area.findOne({ key });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    area.subAreas = subAreas.map((sa, index) => ({ ...sa, order: index }));
    await area.save();

    return NextResponse.json({ success: true, message: 'Sub-areas reordered successfully', data: area });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error reordering sub-areas', error: error.message }, { status: 500 });
  }
}
