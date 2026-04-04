import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { areaKey, subAreaId, societyId } = params;
    const { imageIndex } = await request.json();

    const area = await Area.findOne({ key: areaKey });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    if (!subArea) return NextResponse.json({ success: false, message: 'Sub-area not found' }, { status: 404 });

    const society = subArea.societies.find(s => s.id === parseInt(societyId));
    if (!society) return NextResponse.json({ success: false, message: 'Society not found' }, { status: 404 });

    if (imageIndex < 0 || imageIndex >= (society.images?.length || 0)) {
      return NextResponse.json({ success: false, message: 'Invalid gallery image index' }, { status: 400 });
    }

    society.featuredImageIndex = imageIndex;
    await area.save();

    return NextResponse.json({
      success: true,
      message: 'Featured gallery image updated successfully',
      data: { featuredImageIndex: imageIndex, featuredImage: society.images[imageIndex] },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error setting featured image', error: error.message }, { status: 500 });
  }
}
