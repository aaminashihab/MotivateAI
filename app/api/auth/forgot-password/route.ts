import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { z } from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    
    const { email } = result.data;
    
    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const user = await db.collection('users').findOne({ email });
    
    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: 'If that email is in our system, we have sent a reset link.' }, { status: 200 });
    }
    
    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpiry } }
    );
    
    // In a real app, send an email here using SendGrid/Resend
    // For now, we simulate it by logging to the console
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    console.log(`\n\n=========================================\n`);
    console.log(`[SIMULATED EMAIL] Password Reset Requested`);
    console.log(`To reset password for ${email}, go to:\n${resetUrl}`);
    console.log(`\n=========================================\n\n`);
    
    return NextResponse.json({ success: true, message: 'If that email is in our system, we have sent a reset link.' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
