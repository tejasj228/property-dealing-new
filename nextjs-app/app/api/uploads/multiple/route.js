import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { describeUpload, uploadToCloudinary } from '@/lib/cloudinary';
import { uniquePublicId } from '@/lib/upload-ids.mjs';
import { isSupportedImage } from '@/lib/image-formats.mjs';

export async function POST(request) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const files = formData.getAll('images').filter(file => file && typeof file !== 'string');

    if (files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }
    const unsupported = files.find(file => !isSupportedImage(file));
    if (unsupported) return NextResponse.json({ success: false, message: `${unsupported.name || 'A file'} is not a supported image type` }, { status: 415 });

    const results = await Promise.allSettled(files.map(async file =>
      describeUpload(await uploadToCloudinary(Buffer.from(await file.arrayBuffer()), { public_id: uniquePublicId('property'), resource_type: 'image' }), file)));
    const uploaded = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    const failed = results.length - uploaded.length;
    if (!uploaded.length) throw results[0].reason;

    return NextResponse.json({
      success: true,
      message: failed ? `${uploaded.length} of ${files.length} images uploaded` : `${uploaded.length} images uploaded successfully`,
      data: uploaded,
      failed,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ success: false, message: 'Error uploading images', error: error.message }, { status: 500 });
  }
}
