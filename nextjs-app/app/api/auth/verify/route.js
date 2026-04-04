import { NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/auth';

export async function POST(request) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  return NextResponse.json({
    success: true,
    message: 'Token is valid',
    data: { admin: { username: admin.username, role: admin.role, loginTime: admin.loginTime } },
  });
}
