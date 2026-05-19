import { SessionLog, UserProfile, BehaviorSignals } from '@/lib/types/sessionLog';

/**
 * Analyzes the last 10 sessions to detect user behavior patterns
 * Returns signals that will be passed to Gemini for personalization
 */
export function analyzeUserBehavior(sessions: SessionLog[]): UserProfile {
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
  const signals = calculateSignals(
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
    longestStreak: 7, // TODO: calculate from streak DB
    currentStreak: 1, // TODO: calculate from streak DB
    lastSessionDate: lastSessionDate || new Date(),
    adaptationHistory: [],
    updatedAt: new Date(),
  };
}

/**
 * Calculate behavioral signals from metrics
 */
function calculateSignals(
  avgTaskDuration: number,
  stdDev: number,
  completionRate: number,
  breakSkipRate: number,
  dropoutAfter: number | undefined,
  sessions: SessionLog[]
): BehaviorSignals {
  return {
    prefersShortTasks: avgTaskDuration < 18, // < 18 min is "short"
    skipsBreaks: breakSkipRate > 40,
    highVariance: stdDev > 10, // unpredictable time usage
    dropoutAfterMinutes: dropoutAfter,
    completionConfidence: completionRate, // 0-100
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
