import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Property from '@/lib/models/Property';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { areaKey } = await params;
    const { searchParams } = new URL(request.url);
    const propertyType = searchParams.get('propertyType');

    let filter = { areaKey, isActive: true };
    if (propertyType && propertyType !== 'all') filter.propertyType = propertyType;

    const properties = await Property.find(filter).sort({ order: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      area: areaKey,
      propertyType: propertyType || 'all',
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching properties by area', error: error.message }, { status: 500 });
  }
}
