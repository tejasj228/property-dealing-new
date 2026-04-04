import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { areaKey, subAreaId } = params;
    const { societies } = await request.json();

    const area = await Area.findOne({ key: areaKey });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    const subAreaIndex = area.subAreas.findIndex(sa => sa.id === parseInt(subAreaId));
    if (subAreaIndex === -1) return NextResponse.json({ success: false, message: 'Sub-area not found' }, { status: 404 });

    area.subAreas[subAreaIndex].societies = societies.map((society, index) => ({ ...society, order: index }));
    await area.save();

    return NextResponse.json({ success: true, message: 'Societies reordered successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error reordering societies', error: error.message }, { status: 500 });
  }
}
