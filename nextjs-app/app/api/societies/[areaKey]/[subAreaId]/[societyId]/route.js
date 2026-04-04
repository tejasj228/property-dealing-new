import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { areaKey, subAreaId, societyId } = params;
    const area = await Area.findOne({ key: areaKey });
    if (!area) return NextResponse.json({ success: false, message: 'Area not found' }, { status: 404 });

    const subArea = area.subAreas.find(sa => sa.id === parseInt(subAreaId));
    if (!subArea) return NextResponse.json({ success: false, message: 'Sub-area not found' }, { status: 404 });

    const society = subArea.societies.find(s => s.id === parseInt(societyId));
    if (!society) return NextResponse.json({ success: false, message: 'Society not found' }, { status: 404 });

    const enhancedSociety = {
      ...society.toObject(),
      galleryImageCount: society.images ? society.images.length : 0,
      hasGallery: society.images && society.images.length > 0,
      primaryGalleryImage: society.images && society.images.length > 0 ? society.images[society.featuredImageIndex || 0] : null,
      galleryImages: society.images || [],
      hasMapImage: !!society.mapImage,
      mapImage: society.mapImage || null,
      allImages: [...(society.images || []), ...(society.mapImage ? [society.mapImage] : [])],
      parentArea: { key: area.key, name: area.name },
      parentSubArea: { id: subArea.id, name: subArea.title },
    };

    return NextResponse.json({ success: true, data: enhancedSociety });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching society details', error: error.message }, { status: 500 });
  }
}
