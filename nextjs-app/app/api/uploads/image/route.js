import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { describeUpload, uploadToCloudinary } from '@/lib/cloudinary';
import { uniquePublicId } from '@/lib/upload-ids.mjs';
import { isSupportedImage } from '@/lib/image-formats.mjs';

// Small-file route, kept for older admin builds. New uploads go straight to Cloudinary (see /api/uploads/sign).
export async function POST(request) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    if (!isSupportedImage(file)) return NextResponse.json({ success: false, message: `${file.name || 'This file'} is not a supported image type` }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, { public_id: uniquePublicId('property'), resource_type: 'image' });

    return NextResponse.json({ success: true, message: 'Image uploaded successfully', data: describeUpload(result, file) });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ success: false, message: 'Error uploading image', error: error.message }, { status: 500 });
  }
}
