import { voices } from './voices.ts';

export const TTS_MODEL = 'bulbul:v4-flash' as const;
export const MAX_TTS_TEXT = 200;
export const testBulbulText = 'Bawaal Bureau, emergency desk. Sir, शांत रहिए। बिस्किट आख़िरी बार कब देखा गया था?';
export const speakerLanguages = {
  ...Object.fromEntries(Object.values(voices).map(voice => [voice.speaker, voice.language])),
  simran_hi_conversation: 'hi-IN',
  vetri_ta_suspense: 'ta-IN',
  shubh_en_recovery: 'en-IN',
} as const;
export interface TtsInput { text: string; speaker: string; language_code: 'hi-IN' | 'ta-IN' | 'en-IN'; pace: number; }
export interface AudioManifestEntry { file: string; input: TtsInput; bytes: number; generatedAt: string; durationSeconds?: number; }
export interface AudioManifest { model: typeof TTS_MODEL; sampleRate: 24000; codec: 'mp3'; clips: Record<string, AudioManifestEntry>; }
export class TtsError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.name = 'TtsError'; this.code = code; this.status = status; }
}
export function validateTtsInput(value: unknown): TtsInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TtsError('INVALID_INPUT', 'Send a JSON object.');
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some(key => !['text', 'speaker', 'language_code', 'pace'].includes(key))) throw new TtsError('INVALID_INPUT', 'Only text, speaker, language_code and pace are accepted.');
  if (typeof data.text !== 'string') throw new TtsError('INVALID_TEXT', 'Text is required.');
  const text = data.text.trim().normalize('NFC');
  if (!text || Array.from(text).length > MAX_TTS_TEXT || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) throw new TtsError('INVALID_TEXT', 'Use 1–200 characters of plain text, without HTML or SSML.');
  if (typeof data.speaker !== 'string' || !Object.hasOwn(speakerLanguages, data.speaker)) throw new TtsError('INVALID_SPEAKER', 'Choose a supported Bulbul V4 persona.');
  if (data.language_code !== speakerLanguages[data.speaker as keyof typeof speakerLanguages]) throw new TtsError('INVALID_LANGUAGE', 'Language must match the selected persona.');
  if (typeof data.pace !== 'number' || !Number.isFinite(data.pace) || data.pace < 0.5 || data.pace > 2) throw new TtsError('INVALID_PACE', 'Pace must be a number between 0.5 and 2.0.');
  return { text, speaker: data.speaker, language_code: data.language_code as TtsInput['language_code'], pace: data.pace };
}
export function inputKey(input: TtsInput) { return JSON.stringify([TTS_MODEL, input.text, input.speaker, input.language_code, input.pace, 24000, 'mp3']); }
export function isMp3(bytes: Uint8Array) {
  return bytes.length > 100 && ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0));
}
