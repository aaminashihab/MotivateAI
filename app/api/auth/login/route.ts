import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { SignJWT } from 'jose';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const JWT_SECRET_ENV = process.env.JWT_SECRET;
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_ENV || 'fallback_secret_for_development_only');

export async function POST(req: NextRequest) {
  if (!JWT_SECRET_ENV && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
  }
  
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }
    
    const { email, password } = result.data;
    
    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const user = await db.collection('users').findOne({ email });
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    // Create JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ userId: user._id.toString(), email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Short-lived token
      .sign(secret);
      
    const response = NextResponse.json({ success: true }, { status: 200 });
    
    // Set HttpOnly Cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
