import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { generateAdaptiveSession } from '@/lib/services/adaptiveSessionGenerator';
import { SessionLog } from '@/lib/types/sessionLog';
import { z } from 'zod';
import { rateLimit } from '@/lib/rateLimit';
import { ObjectId } from 'mongodb';

const generateSchema = z.object({
  goal: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
    }

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = generateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid goal parameter' },
        { status: 400 }
      );
    }
    
    const { goal } = result.data;

    let userSessions: SessionLog[] = [];
    let sessionCollection: any = null;
    let userPreferences: any = null;
    
    try {
      const client = await clientPromise;
      const db = client.db('motivateai');
      sessionCollection = db.collection<SessionLog>('sessions');

      userSessions = await sessionCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();
        
      const userDoc = await db.collection<any>('users').findOne({ _id: new ObjectId(userId) });
      if (userDoc && userDoc.preferences) {
        userPreferences = userDoc.preferences;
      }
    } catch (dbError) {
      console.warn('[AdaptiveGen] MongoDB connection failed, falling back to clean profile:', dbError);
      // Proceed with empty sessions if DB is unreachable
    }

    const sessionPlan = await generateAdaptiveSession(
      goal,
      userId,
      userSessions as any,
      userPreferences
    );

    const generatedSessionId = `session_${Date.now()}`;
    sessionPlan.sessionId = generatedSessionId;

    if (sessionCollection) {
      try {
        await sessionCollection.insertOne({
          userId,
          sessionId: generatedSessionId,
          goal,
          startedAt: new Date(),
          tasks: sessionPlan.tasks.map((t) => ({
            taskId: t.id,
            taskName: t.name,
            taskDescription: t.description,
            estimatedDuration: t.durationMinutes,
            completed: false,
            resourceUrl: t.resources,
          })),
          breaks: [],
          completionRatio: 0,
          tasksCompleted: 0,
          taskCount: sessionPlan.tasks.length,
          streakContinued: true,
          totalSessionTime: sessionPlan.estimatedTotalTime,
          estimatedSessionTime: sessionPlan.estimatedTotalTime,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      } catch (insertError) {
        console.warn('[AdaptiveGen] Failed to save session to MongoDB:', insertError);
      }
    }

    return NextResponse.json(sessionPlan, { status: 200 });
  } catch (error: any) {
    console.error('[AdaptiveGen] Error:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to generate adaptive session',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
