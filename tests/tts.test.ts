import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTtsInput, TtsError, TTS_MODEL, testBulbulText } from '../src/lib/tts.ts';
import { synthesizeSpeech, requireSarvamKey, readLimitedBytes } from '../src/lib/server/sarvam.ts';
import { takeTtsRequest } from '../src/lib/server/rate-limit.ts';
import { incidents } from '../src/lib/incidents.ts';
import { voices } from '../src/lib/voices.ts';

const input = { text: testBulbulText, speaker: 'aparna_hi_customer', language_code: 'hi-IN' as const, pace: 0.95 };
const mp3Fixture = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(128)]);
// Transport-only fixture, deliberately not playable speech and never shipped in public/audio.
test('all eighteen preset lines satisfy the same public validator', () => {
  for (const scene of incidents.flatMap(incident => incident.scenes)) {
    const voice = voices[scene.role];
    assert.ok(validateTtsInput({ text: scene.text, speaker: voice.speaker, language_code: voice.language, pace: voice.pace }));
  }
});
test('rejects invalid speakers, languages, pace, markup, oversized text and unsupported parameters', () => {
  for (const bad of [{ speaker: 'shubh' }, { speaker: '__proto__' }, { language_code: 'en-US' }, { language_code: 'ta-IN' }, { pace: 0.49 }, { pace: 2.01 }, { pace: NaN }, { pace: '1' }, { text: '' }, { text: 'x'.repeat(201) }, { text: '<speak>Hello</speak>' }, { model: 'bulbul:v3' }, { pitch: 1 }, { enable_preprocessing: true }]) assert.throws(() => validateTtsInput({ ...input, ...bad }), TtsError);
  assert.throws(() => validateTtsInput(null), TtsError);
});
test('missing and placeholder keys are safe actionable errors', () => {
  for (const key of ['', 'your_key_here']) assert.throws(() => requireSarvamKey(key), error => error instanceof TtsError && error.code === 'MISSING_API_KEY' && error.status === 503);
});
test('REST uses the exact v4 contract and decodes the base64 payload', async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.sarvam.ai/text-to-speech');
    assert.equal(new Headers(options?.headers).get('api-subscription-key'), 'unit-test-only');
    assert.deepEqual(JSON.parse(String(options?.body)), { ...input, model: TTS_MODEL, speech_sample_rate: 24000, output_audio_codec: 'mp3' });
    return Response.json({ audios: [mp3Fixture.toString('base64')] });
  };
  assert.deepEqual(await synthesizeSpeech(input, { key: 'unit-test-only', fetcher }), mp3Fixture);
  assert.equal(calls, 1);
});
test('upstream failures never relay secret-bearing bodies', async () => {
  for (const [status, code] of [[401, 'SARVAM_AUTH'], [403, 'SARVAM_AUTH'], [429, 'SARVAM_RATE_LIMIT'], [500, 'SARVAM_UNAVAILABLE'], [422, 'SARVAM_VALIDATION'], [402, 'SARVAM_CREDITS']] as const) {
    await assert.rejects(synthesizeSpeech(input, { key: 'unit-test-only', fetcher: async () => new Response('secret-upstream-body', { status }) }), error => error instanceof TtsError && error.code === code && !error.message.includes('secret-upstream-body'));
  }
});
test('rejects empty, invalid base64 and non-MP3 response payloads', async () => {
  for (const data of [{}, { audios: [] }, { audios: ['invalid%'] }, { audios: [Buffer.from('not audio').toString('base64')] }]) await assert.rejects(synthesizeSpeech(input, { key: 'unit-test-only', fetcher: async () => Response.json(data) }), error => error instanceof TtsError && error.code === 'INVALID_AUDIO');
});
test('network failure, timeout and cancellation have distinct safe errors', async () => {
  await assert.rejects(synthesizeSpeech(input, { key: 'unit-test-only', fetcher: async () => { throw new Error('private network detail'); } }), error => error instanceof TtsError && error.code === 'SARVAM_NETWORK');
  const stalled: typeof fetch = async (_url, options) => new Promise((_resolve, reject) => { options?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true }); });
  // Keep the event loop alive because AbortSignal.timeout deliberately uses an unref timer.
  const keepAlive = setTimeout(() => {}, 1000);
  try { await assert.rejects(synthesizeSpeech(input, { key: 'unit-test-only', fetcher: stalled, timeoutMs: 10 }), error => error instanceof TtsError && error.code === 'SARVAM_TIMEOUT'); } finally { clearTimeout(keepAlive); }
  const abort = new AbortController(); abort.abort();
  await assert.rejects(synthesizeSpeech(input, { key: 'unit-test-only', signal: abort.signal, fetcher: async () => { throw new Error('aborted'); } }), error => error instanceof TtsError && error.code === 'REQUEST_CANCELLED');
});
test('bounds request and response stream sizes', async () => {
  await assert.rejects(readLimitedBytes(new Response('x'.repeat(4097)).body, 4096), error => error instanceof TtsError && error.status === 413);
});
test('custom requests have a per-client budget that resets', () => {
  const now = 1_000_000;
  for (let i = 0; i < 12; i++) assert.equal(takeTtsRequest('test-client', false, now), 0);
  assert.equal(takeTtsRequest('test-client', false, now), 60);
  assert.equal(takeTtsRequest('test-client', false, now + 60_001), 0);
});
