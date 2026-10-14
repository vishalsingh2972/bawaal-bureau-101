import { isMp3, TTS_MODEL, TtsError, validateTtsInput, type TtsInput } from '../tts.ts';

export const SARVAM_ENDPOINT = 'https://api.sarvam.ai/text-to-speech';
export const TTS_TIMEOUT_MS = 30_000;
export function requireSarvamKey(key = process.env.SARVAM_API_KEY) {
  const clean = key?.trim();
  if (!clean || /^(your[_ -]?key|your_sarvam|replace|placeholder)/i.test(clean)) throw new TtsError('MISSING_API_KEY', 'Add SARVAM_API_KEY to .env.local, then restart the dev server.', 503);
  return clean;
}
export async function readLimitedBytes(stream: ReadableStream<Uint8Array> | null, max: number) {
  if (!stream) throw new TtsError('EMPTY_RESPONSE', 'The server returned an empty response.', 502);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > max) { await reader.cancel(); throw new TtsError('PAYLOAD_TOO_LARGE', 'The response or request is too large.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, length);
}
export async function synthesizeSpeech(input: TtsInput, options: { key?: string; fetcher?: typeof fetch; signal?: AbortSignal; timeoutMs?: number } = {}) {
  const validated = validateTtsInput(input);
  const key = requireSarvamKey(options.key);
  const timeout = AbortSignal.timeout(options.timeoutMs ?? TTS_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  try {
    const response = await (options.fetcher ?? fetch)(SARVAM_ENDPOINT, {
      method: 'POST', headers: { 'api-subscription-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validated, model: TTS_MODEL, speech_sample_rate: 24000, output_audio_codec: 'mp3' }),
      signal, cache: 'no-store',
    });
    if (!response.ok) {
      // Never relay upstream bodies: these can contain credentials or submitted text.
      await response.body?.cancel();
      if ([401, 403].includes(response.status)) throw new TtsError('SARVAM_AUTH', 'Sarvam rejected the API key. Check your key and account access, then restart the server.', 502);
      if (response.status === 429) throw new TtsError('SARVAM_RATE_LIMIT', 'Sarvam is rate-limiting requests. Wait a moment and retry; check your account quota.', 429);
      if (response.status === 402) throw new TtsError('SARVAM_CREDITS', 'Check your Sarvam account credits before retrying.', 502);
      if (response.status === 400 || response.status === 422) throw new TtsError('SARVAM_VALIDATION', 'Sarvam rejected this voice request. Check model access and the configured persona.', 502);
      throw new TtsError('SARVAM_UNAVAILABLE', 'Sarvam is temporarily unavailable. Please retry.', 502);
    }
    const bytes = await readLimitedBytes(response.body, 8_000_000);
    let data: unknown;
    try { data = JSON.parse(bytes.toString('utf8')); } catch { throw new TtsError('INVALID_AUDIO', 'Sarvam returned an invalid audio response. Please retry.', 502); }
    const audios = (data as { audios?: unknown } | null)?.audios;
    if (!Array.isArray(audios) || audios.length !== 1 || typeof audios[0] !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(audios[0])) throw new TtsError('INVALID_AUDIO', 'Sarvam returned no usable audio. Please retry.', 502);
    const audio = Buffer.from(audios[0], 'base64');
    if (!isMp3(audio)) throw new TtsError('INVALID_AUDIO', 'Sarvam did not return a valid MP3 clip. Please retry.', 502);
    return audio;
  } catch (error) {
    if (timeout.aborted) throw new TtsError('SARVAM_TIMEOUT', 'Speech generation took longer than 30 seconds. Please retry.', 504);
    if (options.signal?.aborted) throw new TtsError('REQUEST_CANCELLED', 'Speech request cancelled.', 499);
    if (error instanceof TtsError) throw error;
    throw new TtsError('SARVAM_NETWORK', 'Could not reach Sarvam. Check the server internet connection and retry.', 502);
  }
}
