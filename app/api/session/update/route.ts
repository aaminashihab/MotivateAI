import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { SessionLog } from '@/lib/types/sessionLog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, tasksCompleted, taskCount } = body;

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

      await db.collection<SessionLog>('sessions').updateOne(
        { userId, sessionId },
        {
          $set: {
            completedAt: new Date(),
            tasksCompleted: tasksCompleted,
            completionRatio: completionRatio,
            tasks: updatedTasks as any,
            updatedAt: new Date()
          }
        }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating session:', error.message);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
