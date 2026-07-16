import { redis } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `${key}:${Math.floor(now / windowSeconds)}`;

    const current = await redis().incr(windowKey);
    if (current === 1) {
      await redis().expire(windowKey, windowSeconds);
    }

    const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch {
    // If Redis is down, allow the request
    return { allowed: true, remaining: limit, resetAt: 0 };
  }
}
