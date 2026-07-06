import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors.map(e => e.message).join(', ') }, { status: 400 });
    }
    
    const { token, password } = result.data;
    
    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const user = await db.collection('users').findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() } // Token must not be expired
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword, updatedAt: new Date() },
        $unset: { resetToken: "", resetTokenExpiry: "" }
      }
    );
    
    return NextResponse.json({ success: true, message: 'Password has been reset' }, { status: 200 });
    
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
