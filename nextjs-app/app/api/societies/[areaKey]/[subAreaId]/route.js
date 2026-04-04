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

    const societies = (subArea.societies || [])
      .sort((a, b) => a.order - b.order)
      .map(society => {
        const societyObj = society.toObject();
        return {
          ...societyObj,
          galleryImageCount: society.images ? society.images.length : 0,
          hasGallery: society.images && society.images.length > 0,
          primaryGalleryImage: society.images && society.images.length > 0 ? society.images[society.featuredImageIndex || 0] : null,
          hasMapImage: !!society.mapImage,
          mapImage: society.mapImage || null,
          totalImages: (society.images?.length || 0) + (society.mapImage ? 1 : 0),
          primaryDisplayImage: society.images && society.images.length > 0 ? society.images[society.featuredImageIndex || 0] : society.mapImage,
        };
      });

    const mapSliderImages = societies
      .filter(s => s.mapImage)
      .map(s => ({ imageUrl: s.mapImage, societyName: s.name, societyId: s.id, type: 'map', description: `${s.name} - Location Map` }));

    const galleryImages = [];
    societies.forEach(society => {
      if (society.images && society.images.length > 0) {
        society.images.forEach((image, index) => {
          galleryImages.push({ imageUrl: image, societyName: society.name, societyId: society.id, imageIndex: index, type: 'gallery', description: `${society.name} - Gallery Image ${index + 1}` });
        });
      }
    });

    const stats = {
      totalSocieties: societies.length,
      societiesWithMaps: societies.filter(s => s.hasMapImage).length,
      societiesWithGallery: societies.filter(s => s.hasGallery).length,
      totalMapImages: mapSliderImages.length,
      totalGalleryImages: galleryImages.length,
    };

    return NextResponse.json({
      success: true,
      data: { areaName: area.name, subAreaName: subArea.title, subAreaDescription: subArea.description, societies, mapSliderImages, galleryImages, statistics: stats },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching societies', error: error.message }, { status: 500 });
  }
}
