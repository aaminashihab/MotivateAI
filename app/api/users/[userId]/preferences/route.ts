import { NextResponse, NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    let { userId } = await params;
    const authenticatedUserId = request.headers.get('x-user-id');

    if (userId === 'me' && authenticatedUserId) {
      userId = authenticatedUserId;
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    if (authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot view another user preferences' }, { status: 403 });
    }
    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const user = await db.collection<any>('users').findOne({ _id: new ObjectId(userId) });
    
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
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    let { userId } = await params;
    const authenticatedUserId = request.headers.get('x-user-id');
    const preferences = await request.json();

    if (userId === 'me' && authenticatedUserId) {
      userId = authenticatedUserId;
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 400 });
    }

    if (authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot modify another user preferences' }, { status: 403 });
    }

    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
    }

    // Strict sanitization of properties to prevent Database Pollution
    const sanitizedPreferences: any = {};
    
    if (typeof preferences.maxSessionDuration === 'number') {
      sanitizedPreferences.maxSessionDuration = Math.min(180, Math.max(10, preferences.maxSessionDuration));
    }
    if (typeof preferences.minBreakDuration === 'number') {
      sanitizedPreferences.minBreakDuration = Math.min(60, Math.max(1, preferences.minBreakDuration));
    }
    if (typeof preferences.difficultyLevel === 'string') {
      sanitizedPreferences.difficultyLevel = preferences.difficultyLevel.slice(0, 20);
    }
    if (typeof preferences.preferredSessionTime === 'string') {
      sanitizedPreferences.preferredSessionTime = preferences.preferredSessionTime.slice(0, 20);
    }

    const client = await clientPromise;
    const db = client.db('motivateai');

    await db.collection<any>('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          _id: new ObjectId(userId),
          preferences: sanitizedPreferences, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, preferences: sanitizedPreferences });
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
  }
}
