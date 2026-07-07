import { SessionLog, UserProfile, BehaviorSignals } from '@/lib/types/sessionLog';
import { getCompletionProbability, getDropoutRisk } from './mlClient';

/**
 * Analyzes the last 10 sessions to detect user behavior patterns
 * Returns signals that will be passed to Gemini for personalization
 */
export async function analyzeUserBehavior(sessions: SessionLog[]): Promise<UserProfile> {
  const recentSessions = sessions.slice(-10);

  if (recentSessions.length === 0) {
    return createDefaultProfile(sessions[0]?.userId || 'unknown');
  }

  const userId = recentSessions[0].userId;

  // === TASK DURATION ANALYSIS ===
  const allTaskDurations = recentSessions
    .flatMap((s) => s.tasks.filter((t) => t.actualDuration))
    .map((t) => t.actualDuration!);

  const avgTaskDuration = average(allTaskDurations);
  const stdDevTaskDuration = standardDeviation(allTaskDurations);
  const avgEstimateAccuracy =
    average(
      recentSessions
        .flatMap((s) => s.tasks.filter((t) => t.actualDuration))
        .map((t) => {
          const diff = t.actualDuration! - t.estimatedDuration;
          return (diff / t.estimatedDuration) * 100; // % deviation
        })
    ) || 0;

  // === COMPLETION RATE ===
  const totalTasks = recentSessions.reduce((sum, s) => sum + s.taskCount, 0);
  const completedTasks = recentSessions.reduce(
    (sum, s) => sum + s.tasksCompleted,
    0
  );
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // === BREAK BEHAVIOR ===
  const allBreaks = recentSessions.flatMap((s) => s.breaks);
  const skippedBreaks = allBreaks.filter((b) => b.skipped).length;
  const breakSkipRate = allBreaks.length > 0 ? (skippedBreaks / allBreaks.length) * 100 : 0;

  // === DROPOUT ANALYSIS ===
  const dropoutTimes = recentSessions
    .filter((s) => s.dropoutPoint)
    .map((s) => s.dropoutPoint!.minutesInto);
  const consistentDropoutAfter = dropoutTimes.length > 0
    ? mostCommonValue(dropoutTimes)
    : undefined;

  // === TIME OF DAY ANALYSIS ===
  const timeOfDayByCompletion = recentSessions
    .filter((s) => s.completedAt)
    .map((s) => {
      const hour = s.completedAt!.getHours();
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      return 'evening';
    });
  const bestTimeOfDay = mostCommonValue(timeOfDayByCompletion) as
    | 'morning'
    | 'afternoon'
    | 'evening'
    | undefined;

  // === CALCULATE SIGNALS ===
  const signals = await calculateSignals(
    avgTaskDuration,
    stdDevTaskDuration,
    completionRate,
    breakSkipRate,
    consistentDropoutAfter,
    recentSessions
  );

  // === CONSISTENCY SCORE ===
  const consistencyScore = calculateConsistencyScore(recentSessions);

  // === TOTAL HOURS INVESTED ===
  const totalHours = recentSessions.reduce((sum, s) => sum + s.totalSessionTime, 0) / 60;

  // === STREAK INFO ===
  const lastSessionDate = recentSessions[recentSessions.length - 1]?.startedAt;
  // Streaks are computed from the full session history passed in, not just
  // the last 10, so they aren't artificially capped.
  const streaks = calculateStreaks(sessions);

  return {
    userId,
    recentSessions: recentSessions.length,
    avgTaskDuration,
    avgTaskDurationStdDev: stdDevTaskDuration,
    avgEstimateAccuracy,
    overallCompletionRate: completionRate,
    averageBreakSkipRate: breakSkipRate,
    signals,
    preferredTaskDuration: getPreferredTaskDuration(avgTaskDuration),
    optimalBreakTiming: calculateOptimalBreakTiming(
      avgTaskDuration,
      breakSkipRate
    ),
    sessionConsistency: getConsistencyLabel(consistencyScore),
    totalHoursInvested: totalHours,
    longestStreak: streaks.longestStreak,
    currentStreak: streaks.currentStreak,
    lastSessionDate: lastSessionDate || new Date(),
    adaptationHistory: [],
    updatedAt: new Date(),
  };
}

/**
 * Calculate behavioral signals from metrics
 */
async function calculateSignals(
  avgTaskDuration: number,
  stdDev: number,
  completionRate: number,
  breakSkipRate: number,
  dropoutAfter: number | undefined,
  sessions: SessionLog[]
): Promise<BehaviorSignals> {
  const lastSession = sessions[sessions.length - 1];
  const defaultTaskCount = lastSession?.taskCount || 3;
  const defaultHour = new Date().getHours();

  const [mlProb, mlDropoutRisk] = await Promise.all([
    getCompletionProbability({
      estimatedDuration: avgTaskDuration,
      taskPosition: 1,
      sessionTaskCount: defaultTaskCount,
      hourOfDay: defaultHour,
      breakSkipRateSoFar: breakSkipRate,
    }),
    getDropoutRisk({
      taskCount: defaultTaskCount,
      avgEstimatedDuration: avgTaskDuration,
      breakSkipRate: breakSkipRate,
      completedRatio: completionRate / 100,
      estimatedSessionTime: defaultTaskCount * avgTaskDuration,
    })
  ]);

  const prefersShortTasks = mlProb !== null 
    ? mlProb < 0.5 && avgTaskDuration < 25 
    : avgTaskDuration < 18;

  const finalCompletionConfidence = mlProb !== null
    ? mlProb * 100
    : completionRate;

  return {
    prefersShortTasks,
    skipsBreaks: breakSkipRate > 40,
    highVariance: stdDev > 10,
    dropoutAfterMinutes: (mlDropoutRisk !== null && mlDropoutRisk > 0.6) 
      ? Math.floor(avgTaskDuration * 1.5) 
      : dropoutAfter,
    completionConfidence: finalCompletionConfidence,
    bestTimeOfDay: determineBestTimeOfDay(sessions),
    consistencyScore: calculateConsistencyScore(sessions),
    engagementLevel: determineEngagementLevel(completionRate, breakSkipRate),
  };
}

/**
 * Determines what task duration works best for this user
 */
function getPreferredTaskDuration(
  avgDuration: number
): 'short' | 'medium' | 'long' {
  if (avgDuration < 18) return 'short';
  if (avgDuration < 28) return 'medium';
  return 'long';
}

/**
 * Calculate optimal break timing based on user behavior
 * If they skip breaks frequently, insert breaks EARLIER (20 min instead of 25)
 */
function calculateOptimalBreakTiming(
  avgTaskDuration: number,
  breakSkipRate: number
): number {
  let baseBreakTiming = 25; // default

  if (breakSkipRate > 60) {
    baseBreakTiming = 18; // very high skip rate = break early
  } else if (breakSkipRate > 40) {
    baseBreakTiming = 22; // moderate skip rate = slightly earlier
  }

  return baseBreakTiming;
}

/**
 * Convert consistency score to label
 */
function getConsistencyLabel(
  score: number
): 'unpredictable' | 'somewhat_consistent' | 'very_consistent' {
  if (score > 75) return 'very_consistent';
  if (score > 50) return 'somewhat_consistent';
  return 'unpredictable';
}

/**
 * Calculate how predictable a user's behavior is (0-100)
 */
function calculateConsistencyScore(sessions: SessionLog[]): number {
  if (sessions.length < 2) return 50; // insufficient data

  // Measure variance in completion rates across sessions
  const completionRates = sessions.map(
    (s) => s.completionRatio || (s.taskCount > 0 ? (s.tasksCompleted / s.taskCount) * 100 : 0)
  );
  const avgRate = average(completionRates);
  const variance = average(
    completionRates.map((rate) => Math.pow(rate - avgRate, 2))
  );

  // Normalize: lower variance = higher consistency
  // If variance is 0, consistency is 100
  // If variance is >400, consistency is 0
  const consistencyScore = Math.max(0, 100 - variance / 4);
  return consistencyScore;
}

/**
 * Determine engagement level
 */
function determineEngagementLevel(
  completionRate: number,
  breakSkipRate: number
): 'low' | 'medium' | 'high' {
  if (completionRate > 80 && breakSkipRate < 50) return 'high';
  if (completionRate > 60 && breakSkipRate < 70) return 'medium';
  return 'low';
}

/**
 * Helper: calculate average
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Helper: calculate standard deviation
 */
function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = average(arr);
  const variance = average(arr.map((x) => Math.pow(x - mean, 2)));
  return Math.sqrt(variance);
}

/**
 * Helper: find most common value in array
 */
function mostCommonValue<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<T, number>();
  arr.forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Determine best time of day based on session completions
 */
function determineBestTimeOfDay(
  sessions: SessionLog[]
): 'morning' | 'afternoon' | 'evening' | undefined {
  const completedSessions = sessions.filter((s) => s.completedAt);
  if (completedSessions.length === 0) return undefined;

  const timeOfDays = completedSessions.map((s) => {
    const hour = new Date(s.completedAt!).getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  });

  return mostCommonValue(timeOfDays) as
    | 'morning'
    | 'afternoon'
    | 'evening'
    | undefined;
}

/**
 * Calculate current and longest streaks (in days) from session history.
 * A "streak day" is any calendar day with at least one session in which
 * the user completed at least one task. The current streak only counts
 * if the most recent active day was today or yesterday (so a streak
 * doesn't stay "alive" forever once the user stops showing up).
 */
function calculateStreaks(sessions: SessionLog[]): {
  currentStreak: number;
  longestStreak: number;
} {
  const activeDays = new Set<string>();
  sessions.forEach((s) => {
    if ((s.tasksCompleted || 0) > 0 && s.startedAt) {
      const d = new Date(s.startedAt);
      activeDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  });

  if (activeDays.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const dayTimestamps = Array.from(activeDays)
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);

  // Longest streak: scan forward through sorted unique active days.
  let longestStreak = 1;
  let runningStreak = 1;
  for (let i = 1; i < dayTimestamps.length; i++) {
    const gapDays = Math.round((dayTimestamps[i] - dayTimestamps[i - 1]) / ONE_DAY);
    runningStreak = gapDays === 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
  }

  // Current streak: only counts if still "alive" (active today or yesterday),
  // then walk backwards counting consecutive days.
  const today = new Date();
  const todayTs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const mostRecentActiveTs = dayTimestamps[dayTimestamps.length - 1];
  const daysSinceLastActive = Math.round((todayTs - mostRecentActiveTs) / ONE_DAY);

  let currentStreak = 0;
  if (daysSinceLastActive <= 1) {
    currentStreak = 1;
    for (let i = dayTimestamps.length - 1; i > 0; i--) {
      const gapDays = Math.round((dayTimestamps[i] - dayTimestamps[i - 1]) / ONE_DAY);
      if (gapDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Create default profile for new users
 */
function createDefaultProfile(userId: string): UserProfile {
  return {
    userId,
    recentSessions: 0,
    avgTaskDuration: 20,
    avgTaskDurationStdDev: 5,
    avgEstimateAccuracy: 0,
    overallCompletionRate: 0,
    averageBreakSkipRate: 0,
    signals: {
      prefersShortTasks: false,
      skipsBreaks: false,
      highVariance: false,
      completionConfidence: 0,
      consistencyScore: 0,
      engagementLevel: 'medium',
    },
    preferredTaskDuration: 'medium',
    optimalBreakTiming: 25,
    sessionConsistency: 'unpredictable',
    totalHoursInvested: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastSessionDate: new Date(),
    adaptationHistory: [],
    updatedAt: new Date(),
  };
}
