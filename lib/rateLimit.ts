import { NextRequest } from 'next/server';

// In-memory store for rate limiting (Note: in serverless environments like Vercel,
// this memory is per-lambda instance and clears frequently. For a production app,
// use Upstash Redis, but this is a decent fallback for basic protection).
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10; // Max requests per minute per IP

export function rateLimit(req: NextRequest): { success: boolean; limit: number; remaining: number; reset: number } {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
  const now = Date.now();

  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS };
  }

  const timePassed = now - record.timestamp;
  
  if (timePassed > WINDOW_MS) {
    // Reset window
    record.count = 1;
    record.timestamp = now;
    return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS };
  }

  // Inside window
  record.count++;
  if (record.count > MAX_REQUESTS) {
    return { success: false, limit: MAX_REQUESTS, remaining: 0, reset: record.timestamp + WINDOW_MS };
  }

  return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - record.count, reset: record.timestamp + WINDOW_MS };
}
