import { TtsError } from './tts.ts';
import type { Incident, Role, Department } from './types.ts';
export interface CrisisStory { title: string; operator: string; investigator: string; reporter: string; commissioner: string; verdict: string; }
export function plainText(value: unknown, max: number, field = 'Complaint') {
  if (typeof value !== 'string') throw new TtsError('INVALID_INPUT', `${field} is required.`);
  const text = value.trim().normalize('NFC').replace(/\s+/g, ' ');
  if (!text || Array.from(text).length > max || /[<>\u0000-\u001f\u007f]/u.test(text)) throw new TtsError('INVALID_INPUT', `${field} must be 1–${max} plain-text characters.`);
  return text;
}
export function validateStory(data: unknown): CrisisStory {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TtsError('INVALID_STORY', 'The AI returned an incomplete case. Please retry.', 502);
  const value = data as Record<string, unknown>;
  const fields = ['title', 'operator', 'investigator', 'reporter', 'commissioner', 'verdict'];
  if (Object.keys(value).length !== fields.length || fields.some(field => !Object.hasOwn(value, field))) throw new TtsError('INVALID_STORY', 'The AI returned an incomplete case. Please retry.', 502);
  try {
    const result = Object.fromEntries(fields.map(field => [field, plainText(value[field], field === 'title' ? 65 : field === 'verdict' ? 160 : 200, field)])) as unknown as CrisisStory;
    for (const field of ['operator', 'investigator', 'reporter', 'commissioner'] as const) {
      if (!/[\u0900-\u097f]/u.test(result[field]) || /[*#`]|\p{Extended_Pictographic}/u.test(result[field])) throw new Error('Invalid spoken format');
    }
    return result;
  } catch { throw new TtsError('INVALID_STORY', 'The AI output was unsuitable for short spoken dialogue. Retry your complaint.', 502); }
}
export function storyIncident(story: CrisisStory, complaint: string, id: string): Incident {
  const cast: [keyof CrisisStory, Role, Department, string][] = [
    ['operator', 'operator', 'Emergency desk', 'YOUR COMPLAINT. THEIR OVERREACTION.'],
    ['investigator', 'investigator', 'Investigation', 'EVIDENCE HAS ENTERED THE CHAT.'],
    ['reporter', 'reporter', 'Breaking news', 'LIVE FROM YOUR TINY DISASTER.'],
    ['commissioner', 'announcer', 'Verdict', 'THE COMMISSIONER HAS SPOKEN.'],
  ];
  return { id, number: id.replace('live-', 'AI-').slice(0, 18), title: story.title, hindi: 'आपकी शिकायत। AI की जाँच।', description: complaint, severity: 'LIVE AI / SARVAM 105B', exhibit: 'name', verdict: story.verdict, resolution: story.commissioner, generated: true, complaint, scenes: cast.map(([field, role, department, headline], index) => ({ id: `${id}-${index}`, role, department, headline, text: story[field] })) };
}
