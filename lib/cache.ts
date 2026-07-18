import { redis } from './redis';

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis().get(key);
    return data as T | null;
  } catch {
    return null;
  }
}

async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis().set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // silently fail — cache is optional
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
