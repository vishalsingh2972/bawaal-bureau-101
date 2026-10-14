import { TtsError } from '@/lib/tts';
import { readLimitedBytes, requireSarvamKey } from '@/lib/server/sarvam';
import { liveError, protectLiveRequest } from '@/lib/server/live-request';
export const runtime = 'nodejs';
export const maxDuration = 35;
export async function POST(request: Request) {
  try {
    protectLiveRequest(request, 'transcribe');
    const type = request.headers.get('content-type') || '';
    if (!type.startsWith('multipart/form-data')) throw new TtsError('INVALID_AUDIO', 'Upload recorded audio as multipart form data.');
    const bytes = await readLimitedBytes(request.body, 2_000_000);
    const upload = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': type }, body: new Uint8Array(bytes) }).formData();
    const file = upload.get('file');
    if (!(file instanceof File) || file.size < 100 || file.size > 1_900_000 || !/^audio\/(webm|mp4|ogg|wav|mpeg)(;|$)/i.test(file.type)) throw new TtsError('INVALID_AUDIO', 'Record 1–10 seconds of WebM, MP4, Ogg, WAV or MP3 audio.');
    const mime = file.type.split(';')[0];
    const extension = mime.split('/')[1];
    const form = new FormData(); form.set('file', new Blob([await file.arrayBuffer()], { type: mime }), `bawaal.${extension}`); form.set('model', 'saaras:v4'); form.set('mode', 'codemix'); form.set('language_code', 'unknown'); form.set('keyterms', JSON.stringify(['Bawaal', 'Swiggy', 'UPI']));
    const timeout = AbortSignal.timeout(25_000);
    const response = await fetch('https://api.sarvam.ai/speech-to-text', { method: 'POST', headers: { 'api-subscription-key': requireSarvamKey() }, body: form, signal: AbortSignal.any([timeout, request.signal]), cache: 'no-store' });
    if (!response.ok) { await response.body?.cancel(); throw new TtsError('STT_UPSTREAM', `Saaras could not transcribe this recording (${response.status}). Try again or type your complaint.`, 502); }
    const result = JSON.parse((await readLimitedBytes(response.body, 32_000)).toString('utf8'));
    if (typeof result.transcript !== 'string' || !result.transcript.trim()) throw new TtsError('EMPTY_SPEECH', 'No speech was detected. Try again or type your complaint.', 422);
    if (Array.from(result.transcript.trim()).length > 160) throw new TtsError('LONG_SPEECH', 'The recording was too detailed. Try one short sentence, or type it.', 422);
    return Response.json({ transcript: result.transcript.trim(), model: 'saaras:v4' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) return liveError(new TtsError('STT_TIMEOUT', 'Transcription timed out. Retry or type your complaint.', 504)); return liveError(error); }
}
