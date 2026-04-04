import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SliderImage from '@/lib/models/SliderImage';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET() {
  try {
    await connectDB();
    const sliderImages = await SliderImage.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json({ success: true, count: sliderImages.length, data: sliderImages });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching slider images', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const formData = await request.formData();
    const file = formData.get('image');
    const title = formData.get('title') || '';
    const altText = formData.get('altText') || '';
    const order = formData.get('order') || 0;

    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, { public_id: `slider-${Date.now()}`, resource_type: 'image' });

    const sliderImage = new SliderImage({
      title: title || file.name,
      imageUrl: result.secure_url,
      altText: altText || title || file.name,
      order: parseInt(order) || 0,
    });

    await sliderImage.save();

    return NextResponse.json({ success: true, message: 'Slider image added successfully', data: sliderImage }, { status: 201 });
  } catch (error) {
    console.error('Error adding slider image:', error);
    return NextResponse.json({ success: false, message: 'Error adding slider image', error: error.message }, { status: 500 });
  }
}
