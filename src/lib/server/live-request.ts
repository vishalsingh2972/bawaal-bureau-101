import { createHash } from 'node:crypto';
import { TtsError } from '../tts.ts';
import { readLimitedBytes, requireSarvamKey } from './sarvam.ts';
import { assertSameOrigin } from './origin.ts';
const budgets = new Map<string, { count: number; until: number }>();
let globalBudget = { count: 0, until: 0 };
export function protectLiveRequest(request: Request, kind: string) {
  assertSameOrigin(request);
  requireSarvamKey();
  const now = Date.now();
  for (const [key, entry] of budgets) if (entry.until <= now) budgets.delete(key);
  if (globalBudget.until <= now) globalBudget = { count: 0, until: now + 60_000 };
  const client = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local').digest('hex');
  const key = `${kind}:${client}`;
  const budget = budgets.get(key) ?? { count: 0, until: now + 60_000 };
  if (budget.count >= 6 || globalBudget.count >= 60 || budgets.size >= 2000) throw new TtsError('RATE_LIMIT', 'Too many live requests. Wait one minute and retry.', 429);
  budget.count++; globalBudget.count++; budgets.set(key, budget);
}
export async function liveJson(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new TtsError('INVALID_CONTENT_TYPE', 'Send JSON.', 415);
  const bytes = await readLimitedBytes(request.body, 4096);
  try { return JSON.parse(bytes.toString('utf8')) as Record<string, unknown>; } catch { throw new TtsError('INVALID_JSON', 'Send valid JSON.'); }
}
export function liveError(error: unknown) {
  const safe = error instanceof TtsError ? error : new TtsError('LIVE_ERROR', 'This request could not be completed. Please retry.', 500);
  return Response.json({ error: { code: safe.code, message: safe.message } }, { status: safe.status, headers: { 'Cache-Control': 'no-store' } });
}
