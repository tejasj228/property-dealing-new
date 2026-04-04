import { NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/email';

export async function GET() {
  try {
    const configTest = await testEmailConfiguration();
    return NextResponse.json({
      success: configTest,
      message: configTest ? 'Email configuration is working' : 'Email configuration test failed',
      config: {
        user: process.env.GMAIL_USER || 'Not configured',
        password: process.env.GMAIL_APP_PASSWORD ? '✅ Configured' : '❌ Not configured',
      },
      timestamp: new Date(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error testing email configuration', error: error.message }, { status: 500 });
  }
}
