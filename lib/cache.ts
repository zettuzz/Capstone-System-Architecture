import { redis } from './redis';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis().get(key);
    return data as T | null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis().set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // silently fail — cache is optional
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis().keys(pattern);
    if (keys.length > 0) {
      await redis().del(...keys);
    }
  } catch {
    // silently fail
  }
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  await setCache(key, data, ttlSeconds);
  return data;
}
