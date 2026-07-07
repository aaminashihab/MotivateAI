import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SessionLog } from '@/lib/types/sessionLog';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateSchema = z.object({
  sessionId: z.string().min(1),
  tasksCompleted: z.number().int().min(0).optional(),
  tasksSkipped: z.number().int().min(0).optional(),
  taskCount: z.number().int().min(0).optional(),
  sessionRating: z.number().min(1).max(5).optional(),
  abandoned: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.format() },
        { status: 400 }
      );
    }

    const { sessionId, tasksCompleted, tasksSkipped, taskCount = 0, sessionRating, abandoned } = result.data;

    const client = await clientPromise;
    const db = client.db('motivateai');
    
    const completionRatio = taskCount > 0 ? (tasksCompleted / taskCount) * 100 : 0;
    
    const session = await db.collection<SessionLog>('sessions').findOne({ userId, sessionId });
    
    if (session) {
      const updatedTasks = session.tasks.map((task, index) => {
        if (index < tasksCompleted) {
          return {
            ...task,
            completed: true,
            actualDuration: task.estimatedDuration
          };
        }
        return task;
      });

        const updateData: any = {
          completedAt: new Date(),
          tasksCompleted: tasksCompleted !== undefined ? tasksCompleted : session.tasksCompleted,
          completionRatio: completionRatio,
          tasks: updatedTasks as any,
          updatedAt: new Date()
        };

        if (sessionRating !== undefined) {
          updateData.sessionRating = sessionRating;
        }
        
        if (tasksSkipped !== undefined) {
          updateData.tasksSkipped = tasksSkipped;
        }

        if (abandoned !== undefined) {
          updateData.abandoned = abandoned;
        }

        await db.collection<SessionLog>('sessions').updateOne(
          { userId, sessionId },
          { $set: updateData }
        );

      // --- Day 3: Make Optimizations Real ---
      // If session is fully completed, check total completed sessions
      if (tasksCompleted >= taskCount && taskCount > 0) {
        const completedSessionsCount = await db.collection('sessions').countDocuments({ 
          userId, 
          completedAt: { $exists: true } 
        });

        const userDoc = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const optimizationsCount = userDoc?.optimizations?.length || 0;

        // Trigger optimization engine if we've reached the next multiple of 5 successfully
        // This ensures if session 5 fails, session 6 will retry it, because optimizationsCount will still be 0!
        if (completedSessionsCount > 0 && completedSessionsCount >= (optimizationsCount + 1) * 5) {
          try {
            // Await the fetch so Next.js doesn't kill the background process prematurely
            const baseUrl = request.headers.get('origin') || `http://${request.headers.get('host')}`;
            const authToken = request.cookies.get('auth_token')?.value;
            
            await fetch(`${baseUrl}/api/user/${userId}/optimize`, {
              method: 'POST',
              headers: authToken ? { 'Cookie': `auth_token=${authToken}` } : undefined
            });
          } catch (e) {
            console.warn('Failed to trigger background optimization:', e);
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating session:', error.message);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
