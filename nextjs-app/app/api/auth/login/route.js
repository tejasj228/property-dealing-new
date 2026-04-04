import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Store hashed password in module scope (computed once per cold start)
let passwordHash = null;

async function getPasswordHash() {
  if (!passwordHash) {
    const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';
    passwordHash = await bcrypt.hash(plainPassword, 12);
  }
  return passwordHash;
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    if (username !== adminUsername) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const hash = await getPasswordHash();
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign(
      { username, role: 'admin', loginTime: new Date().toISOString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { token, admin: { username, role: 'admin' }, expiresIn: '24h' },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
