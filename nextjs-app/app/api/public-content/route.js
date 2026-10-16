import { NextResponse } from 'next/server';
import { publicContentPath } from '@/lib/public-content-path.mjs';

export async function GET(request) {
  const path = publicContentPath(new URL(request.url).searchParams.get('path'));
  if (!path) return NextResponse.json({ success: false, message: 'Unknown public content.' }, { status: 400 });
  const source = process.env.LANDING_CONTENT_API_URL?.replace(/\/+$/, '');
  if (!source) return NextResponse.redirect(new URL(`/api${path}`, request.url));
  try {
    const response = await fetch(`${source}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } });
    if (!response.ok) return NextResponse.json({ success: false, message: 'Content is unavailable.' }, { status: response.status === 404 ? 404 : 503 });
    const result = await response.json();
    if (!result.success) throw new Error('Content unavailable');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, message: 'Content is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
