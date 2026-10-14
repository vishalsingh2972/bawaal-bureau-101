import { createHash } from 'node:crypto';
import { incidents } from '@/lib/incidents';
import { voices } from '@/lib/voices';
import { TtsError, validateTtsInput } from '@/lib/tts';
import { readLimitedBytes, requireSarvamKey, synthesizeSpeech } from '@/lib/server/sarvam';
import { takeTtsRequest } from '@/lib/server/rate-limit';
import { assertSameOrigin } from '@/lib/server/origin';

export const runtime = 'nodejs';
export const maxDuration = 40;
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new TtsError('INVALID_CONTENT_TYPE', 'Use Content-Type: application/json.', 415);
    if (Number(request.headers.get('content-length')) > 4096) throw new TtsError('PAYLOAD_TOO_LARGE', 'Speech requests must be smaller than 4 KB.', 413);
    const raw = await readLimitedBytes(request.body, 4096);
    let body: unknown;
    try { body = JSON.parse(raw.toString('utf8')); } catch { throw new TtsError('INVALID_JSON', 'Send valid JSON.'); }
    const preset = !!body && typeof body === 'object' && Object.hasOwn(body, 'sceneId');
    let input;
    if (preset) {
      const data = body as Record<string, unknown>;
      if (Object.keys(data).length !== 1 || typeof data.sceneId !== 'string') throw new TtsError('INVALID_SCENE', 'Send a single valid sceneId.');
      const scene = incidents.flatMap(incident => incident.scenes).find(scene => scene.id === data.sceneId);
      if (!scene) throw new TtsError('INVALID_SCENE', 'Unknown case dialogue.');
      const voice = voices[scene.role];
      input = validateTtsInput({ text: scene.text, speaker: voice.speaker, language_code: voice.language, pace: voice.pace });
    } else input = validateTtsInput(body);
    requireSarvamKey();
    // Forwarded IP is useful only behind a proxy that overwrites it. A global budget also caps spoofed identities.
    const client = createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local').digest('hex');
    const retryAfter = takeTtsRequest(client, preset);
    if (retryAfter) return Response.json({ error: { code: 'RATE_LIMIT', message: `Too many speech requests. Retry in ${retryAfter} seconds.` } }, { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } });
    const audio = await synthesizeSpeech(input, { signal: request.signal });
    return new Response(new Uint8Array(audio), { headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(audio.length), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    const safe = error instanceof TtsError ? error : new TtsError('INTERNAL_ERROR', 'Speech could not be generated. Please retry.', 500);
    return Response.json({ error: { code: safe.code, message: safe.message } }, { status: safe.status, headers: { 'Cache-Control': 'no-store' } });
  }
}
