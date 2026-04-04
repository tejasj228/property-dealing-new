import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, { public_id: `property-${Date.now()}`, resource_type: 'image' });

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: result.public_id,
        originalName: file.name,
        imageUrl: result.secure_url,
        size: file.size,
        cloudinaryData: { public_id: result.public_id, version: result.version, format: result.format },
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ success: false, message: 'Error uploading image', error: error.message }, { status: 500 });
  }
}
