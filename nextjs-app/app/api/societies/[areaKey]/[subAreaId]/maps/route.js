import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { areaKey, subAreaId } = await params;
    const area = await Area.findOne({ key: areaKey });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    if (!subArea) return NextResponse.json({ success: false, message: 'Sub-area not found' }, { status: 404 });

    const mapImages = subArea.societies
      .filter(s => s.mapImage)
      .map(s => ({ imageUrl: s.mapImage, societyName: s.name, societyId: s.id, type: 'map', description: `${s.name} - Location Map`, society: { id: s.id, name: s.name, description: s.description } }));

    return NextResponse.json({
      success: true,
      data: { images: mapImages, totalCount: mapImages.length, areaName: area.name, subAreaName: subArea.title, type: 'maps' },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching map images', error: error.message }, { status: 500 });
  }
}
