import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { analyzeUserBehavior } from '@/lib/services/behaviorAnalyzer';
import { SessionLog } from '@/lib/types/sessionLog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let sessions: SessionLog[] = [];
    try {
      const client = await clientPromise;
      const db = client.db('motivateai');
      
      sessions = await db.collection<SessionLog>('sessions')
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray() as any;
    } catch (dbError) {
      console.warn('MongoDB connection failed for profile route. Using mock data for demo purposes.');
      // Provide mock data so the UI can be showcased even if DB is down
      sessions = [
        {
          userId,
          sessionId: 'mock_1',
          goal: 'Study Next.js',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45 * 60000),
          totalSessionTime: 45,
          estimatedSessionTime: 50,
          tasks: [
            { taskId: '1', taskName: 'Read Docs', taskDescription: '', estimatedDuration: 20, actualDuration: 18, completed: true },
            { taskId: '2', taskName: 'Try tutorial', taskDescription: '', estimatedDuration: 30, actualDuration: 27, completed: true }
          ],
          breaks: [{ breakNumber: 1, breakDuration: 5, skipped: false, paused: false, pauseCount: 0 }],
          completionRatio: 100,
          tasksCompleted: 2,
          taskCount: 2,
          streakContinued: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId,
          sessionId: 'mock_2',
          goal: 'Build API Route',
          startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000 + 30 * 60000),
          totalSessionTime: 30,
          estimatedSessionTime: 30,
          tasks: [
            { taskId: '1', taskName: 'Setup Route', taskDescription: '', estimatedDuration: 15, actualDuration: 10, completed: true },
            { taskId: '2', taskName: 'Connect DB', taskDescription: '', estimatedDuration: 15, actualDuration: 20, completed: true }
          ],
          breaks: [],
          completionRatio: 100,
          tasksCompleted: 2,
          taskCount: 2,
          streakContinued: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId,
          sessionId: 'mock_3',
          goal: 'Learn MongoDB',
          startedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 72 * 60 * 60 * 1000 + 60 * 60000),
          totalSessionTime: 60,
          estimatedSessionTime: 45,
          tasks: [
            { taskId: '1', taskName: 'Data Models', taskDescription: '', estimatedDuration: 20, actualDuration: 25, completed: true },
            { taskId: '2', taskName: 'Queries', taskDescription: '', estimatedDuration: 25, actualDuration: 35, completed: true }
          ],
          breaks: [{ breakNumber: 1, breakDuration: 5, skipped: true, paused: false, pauseCount: 0 }],
          completionRatio: 100,
          tasksCompleted: 2,
          taskCount: 2,
          streakContinued: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    }
    
    const profile = analyzeUserBehavior(sessions);
    
    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}
