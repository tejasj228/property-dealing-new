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

    const galleryImages = [];
    subArea.societies.forEach(society => {
      if (society.images && society.images.length > 0) {
        society.images.forEach((image, index) => {
          galleryImages.push({ imageUrl: image, societyName: society.name, societyId: society.id, imageIndex: index, type: 'gallery', description: `${society.name} - Gallery Image ${index + 1}`, society: { id: society.id, name: society.name, description: society.description } });
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: { images: galleryImages, totalCount: galleryImages.length, areaName: area.name, subAreaName: subArea.title, type: 'gallery' },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching gallery images', error: error.message }, { status: 500 });
  }
}
