import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Area from '@/lib/models/Area';

export async function PUT(request) {
  try {
    await connectDB();
    const { areaKeys } = await request.json();

    if (!areaKeys || !Array.isArray(areaKeys)) {
      return NextResponse.json({ success: false, message: 'areaKeys array is required' }, { status: 400 });
    }

    await Promise.all(
      areaKeys.map((key, index) => Area.findOneAndUpdate({ key }, { order: index }, { new: true }))
    );

    return NextResponse.json({ success: true, message: 'Areas reordered successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error reordering areas', error: error.message }, { status: 500 });
  }
}
