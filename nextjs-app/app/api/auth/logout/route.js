import { NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/auth';

export async function POST(request) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  console.log(`Admin logout: ${admin.username}`);
  return NextResponse.json({ success: true, message: 'Logout successful' });
}
