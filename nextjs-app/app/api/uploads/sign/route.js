import { authorizeAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { signBrowserUpload } from '@/lib/cloudinary';

const PURPOSES = new Set(['property', 'slider', 'society', 'map']);

// Browsers send photos straight to Cloudinary with these one-use credentials. That skips the
// 4.5 MB request limit on this server and accepts every format Cloudinary can read, HEIC included.
export async function POST(request) {
  const denied = authorizeAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => ({}));
    const signed = signBrowserUpload(PURPOSES.has(body?.purpose) ? body.purpose : 'property');
    if (!signed) return NextResponse.json({ success: false, message: 'Image storage is not configured on the server.' }, { status: 503 });
    return NextResponse.json({ success: true, data: signed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error signing upload:', error);
    return NextResponse.json({ success: false, message: 'Could not prepare the upload', error: error.message }, { status: 500 });
  }
}
