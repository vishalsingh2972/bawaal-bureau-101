const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; until: number }>();
let globalBucket = { count: 0, until: 0 };
export function takeTtsRequest(client: string, preset: boolean, now = Date.now()) {
  for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
  if (globalBucket.until <= now) globalBucket = { count: 0, until: now + WINDOW_MS };
  const key = `${preset ? 'preset' : 'custom'}:${client}`;
  const bucket = buckets.get(key) ?? { count: 0, until: now + WINDOW_MS };
  const blocked = bucket.count >= (preset ? 36 : 12) || globalBucket.count >= 120 || (!buckets.has(key) && buckets.size >= 2000);
  if (blocked) return Math.max(1, Math.ceil((Math.min(bucket.until, globalBucket.until) - now) / 1000));
  bucket.count++; globalBucket.count++; buckets.set(key, bucket);
  return 0;
}
