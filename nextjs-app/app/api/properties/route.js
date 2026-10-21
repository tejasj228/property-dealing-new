import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Property from '@/lib/models/Property';
import { normalizePropertyInput } from '@/lib/property-input.mjs';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const active = searchParams.get('active');
    const propertyType = searchParams.get('propertyType');
    const plot = searchParams.get('plot');

    let filter = {};
    if (area && area !== 'all') filter.areaKey = area;
    if (active !== null) {
      filter.isActive = active === 'true';
    } else {
      filter.isActive = true;
    }
    if (propertyType && propertyType !== 'all') filter.propertyType = propertyType;
    if (plot === 'true') filter.isPlot = true;
    else if (plot === 'false') filter.isPlot = { $ne: true };

    const properties = await Property.find(filter).sort({ order: 1, createdAt: 1 });

    return NextResponse.json({
      success: true,
      count: properties.length,
      data: properties,
      filters: { area: area || 'all', propertyType: propertyType || 'all', active: active ?? 'true' },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ success: false, message: 'Error fetching properties', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    await connectDB();
    const { body, error } = normalizePropertyInput(await request.json());
    if (error) return NextResponse.json({ success: false, message: error }, { status: 400 });

    const property = new Property(body);
    await property.save();

    return NextResponse.json({ success: true, message: 'Property created successfully', data: property }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ success: false, message: 'Error creating property', error: error.message }, { status: 400 });
  }
}
