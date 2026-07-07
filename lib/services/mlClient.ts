/**
 * ML Client — calls the Python ML microservice for completion probability
 * and dropout risk predictions. Falls back silently to the existing
 * rule-based logic in behaviorAnalyzer.ts if the service is unreachable,
 * slow, or disabled via the ML_ANALYTICS_ENABLED env var.
 *
 * Drop this file at: lib/services/mlClient.ts
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_ANALYTICS_ENABLED = process.env.ML_ANALYTICS_ENABLED === 'true';
const ML_TIMEOUT_MS = 1500; // fail fast — never block session generation on ML

interface CompletionRequest {
  estimatedDuration: number;
  taskPosition: number;
  sessionTaskCount: number;
  hourOfDay: number;
  breakSkipRateSoFar: number;
  difficulty?: 'easy' | 'just_right' | 'hard';
}

interface DropoutRequest {
  taskCount: number;
  avgEstimatedDuration: number;
  breakSkipRate: number;
  completedRatio: number;
  estimatedSessionTime: number;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns completion probability (0-1), or null if ML is disabled/unreachable.
 * Callers MUST handle null by falling back to rule-based logic.
 */
export async function getCompletionProbability(
  req: CompletionRequest
): Promise<number | null> {
  if (!ML_ANALYTICS_ENABLED) return null;

  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/predict/completion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estimated_duration: req.estimatedDuration,
        task_position: req.taskPosition,
        session_task_count: req.sessionTaskCount,
        hour_of_day: req.hourOfDay,
        break_skip_rate_so_far: req.breakSkipRateSoFar,
        difficulty: req.difficulty ?? 'just_right',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.completion_probability === 'number'
      ? data.completion_probability
      : null;
  } catch {
    // Network error, timeout, service down, or model not trained yet.
    return null;
  }
}

/**
 * Returns dropout risk (0-1), or null if ML is disabled/unreachable.
 */
export async function getDropoutRisk(req: DropoutRequest): Promise<number | null> {
  if (!ML_ANALYTICS_ENABLED) return null;

  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/predict/dropout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_count: req.taskCount,
        avg_estimated_duration: req.avgEstimatedDuration,
        break_skip_rate: req.breakSkipRate,
        completed_ratio: req.completedRatio,
        estimated_session_time: req.estimatedSessionTime,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.dropout_risk === 'number' ? data.dropout_risk : null;
  } catch {
    return null;
  }
}

/**
 * Combined helper for behaviorAnalyzer.ts: given the same inputs it already
 * computes, try ML first, fall back to the rule-based signal if unavailable.
 *
 * Example usage inside calculateSignals():
 *
 *   const mlProb = await getCompletionProbability({...});
 *   const prefersShortTasks = mlProb !== null
 *     ? mlProb < 0.5 && avgTaskDuration < 25   // ML-informed
 *     : avgTaskDuration < 18;                  // original rule-based fallback
 */
export async function isMlServiceHealthy(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${ML_SERVICE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
