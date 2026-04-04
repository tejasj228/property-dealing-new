import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    count: 0,
    data: [],
    message: 'Files are stored in Cloudinary. Check individual properties and slider images.',
  });
}
