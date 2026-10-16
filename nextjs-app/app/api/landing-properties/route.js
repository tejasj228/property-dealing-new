import { NextResponse } from 'next/server';
import { getLandingProperties } from '@/lib/landing-data';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getLandingProperties() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, message: 'Properties are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
