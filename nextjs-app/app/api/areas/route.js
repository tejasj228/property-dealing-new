import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    let filter = {};
    if (active !== null) {
      filter.isActive = active === 'true';
    } else {
      filter.isActive = true;
    }

    const areas = await Area.find(filter).sort({ order: 1, createdAt: 1 });

    const areasObject = {};
    areas.forEach(area => {
      areasObject[area.key] = {
        name: area.name,
        description: area.description,
        subAreas: area.subAreas.sort((a, b) => a.order - b.order),
        order: area.order,
      };
    });

    return NextResponse.json({ success: true, count: areas.length, data: areasObject });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching areas', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const area = new Area(body);
    await area.save();
    return NextResponse.json({ success: true, message: 'Area created successfully', data: area }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error creating area', error: error.message }, { status: 400 });
  }
}
