import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const user = await db.collection('users').findOne({ _id: params.userId });
    
    if (!user || !user.preferences) {
      return NextResponse.json({}, { status: 404 });
    }
    
    return NextResponse.json(user.preferences);
  } catch (error) {
    console.error('Failed to fetch preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const preferences = await request.json();
    const client = await clientPromise;
    const db = client.db('motivateai');

    await db.collection('users').updateOne(
      { _id: params.userId },
      { 
        $set: { 
          _id: params.userId,
          preferences, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
