import { TtsError } from '../tts.ts';
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const url = new URL(request.url);
  const host = request.headers.get('host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.slice(0, -1);
  let supplied: URL;
  try { supplied = new URL(origin); } catch { throw new TtsError('INVALID_ORIGIN', 'Send requests from this website.', 403); }
  if (supplied.host !== host || supplied.protocol !== `${protocol}:`) throw new TtsError('INVALID_ORIGIN', 'Send requests from this website.', 403);
}
