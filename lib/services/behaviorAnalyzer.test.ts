import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeUserBehavior } from './behaviorAnalyzer';
import { SessionLog } from '@/lib/types/sessionLog';
import * as mlClient from './mlClient';

// Mock mlClient module
vi.mock('./mlClient', () => ({
  getCompletionProbability: vi.fn(),
  getDropoutRisk: vi.fn(),
  isMlServiceHealthy: vi.fn(),
}));

describe('behaviorAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSessions: SessionLog[] = [
    {
      id: '1',
      userId: 'test_user',
      goal: 'test',
      topic: 'test',
      difficulty: 'beginner',
      taskCount: 3,
      tasksCompleted: 3,
      totalSessionTime: 45,
      completionRatio: 1,
      startedAt: new Date(),
      completedAt: new Date(),
      tasks: [
        { id: '1', title: 'test', description: 'test', estimatedDuration: 15, actualDuration: 15, type: 'video' },
        { id: '2', title: 'test', description: 'test', estimatedDuration: 15, actualDuration: 15, type: 'reading' },
        { id: '3', title: 'test', description: 'test', estimatedDuration: 15, actualDuration: 15, type: 'exercise' },
      ],
      breaks: [
        { id: 'b1', duration: 5, skipped: false },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  it('should fallback to rule-based logic when ML service returns null', async () => {
    (mlClient.getCompletionProbability as any).mockResolvedValue(null);
    (mlClient.getDropoutRisk as any).mockResolvedValue(null);

    const profile = await analyzeUserBehavior(mockSessions);
    expect(profile.userId).toBe('test_user');
    expect(mlClient.getCompletionProbability).toHaveBeenCalled();
    expect(mlClient.getDropoutRisk).toHaveBeenCalled();
    expect(profile.signals.prefersShortTasks).toBe(true); // 15 < 18 min
  });

  it('should use ML predictions when service is available', async () => {
    (mlClient.getCompletionProbability as any).mockResolvedValue(0.9);
    (mlClient.getDropoutRisk as any).mockResolvedValue(0.8); // High dropout risk

    const profile = await analyzeUserBehavior(mockSessions);
    expect(profile.userId).toBe('test_user');
    
    // ML says high probability, but duration is 15. The rule uses: mlProb < 0.5 && avgTaskDuration < 25
    // Here mlProb = 0.9, so prefersShortTasks should be false according to the logic.
    expect(profile.signals.prefersShortTasks).toBe(false); 

    // With ML Dropout Risk = 0.8, it sets dropoutAfterMinutes to Math.floor(15 * 1.5) = 22
    expect(profile.signals.dropoutAfterMinutes).toBe(22);
  });
});
