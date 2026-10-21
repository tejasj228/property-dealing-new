import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SliderImage from '@/lib/models/SliderImage';
import { describeUpload, uploadToCloudinary } from '@/lib/cloudinary';
import { uniquePublicId } from '@/lib/upload-ids.mjs';
import { isSupportedImage } from '@/lib/image-formats.mjs';

// Slider images already uploaded from the browser arrive as a Cloudinary address.
function cloudinaryAddress(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' ? url.toString() : null; } catch { return null; }
}

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
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    await connectDB();
    let title, altText, order, imageUrl, fallbackName = 'Slider image';
    if ((request.headers.get('content-type') || '').includes('application/json')) {
      const body = await request.json();
      ({ title = '', altText = '', order = 0 } = body);
      imageUrl = cloudinaryAddress(body.imageUrl);
      if (!imageUrl) return NextResponse.json({ success: false, message: 'A Cloudinary image address is required' }, { status: 400 });
    } else {
      const formData = await request.formData();
      const file = formData.get('image');
      title = formData.get('title') || '';
      altText = formData.get('altText') || '';
      order = formData.get('order') || 0;

      if (!file || typeof file === 'string') return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
      if (!isSupportedImage(file)) return NextResponse.json({ success: false, message: `${file.name || 'This file'} is not a supported image type` }, { status: 415 });

      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = describeUpload(await uploadToCloudinary(buffer, { public_id: uniquePublicId('slider'), resource_type: 'image' }), file).imageUrl;
      fallbackName = file.name;
    }

    const sliderImage = new SliderImage({
      title: title || fallbackName,
      imageUrl,
      altText: altText || title || fallbackName,
      order: parseInt(order) || 0,
    });

    await sliderImage.save();

    return NextResponse.json({ success: true, message: 'Slider image added successfully', data: sliderImage }, { status: 201 });
  } catch (error) {
    console.error('Error adding slider image:', error);
    return NextResponse.json({ success: false, message: 'Error adding slider image', error: error.message }, { status: 500 });
  }
}
