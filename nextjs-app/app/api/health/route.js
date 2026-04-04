import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      message: 'Backend is running!',
      timestamp: new Date(),
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return NextResponse.json({ message: 'Backend running but DB connection failed', error: error.message }, { status: 500 });
  }
}
