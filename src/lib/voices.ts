import type { Role, Voice } from './types.ts';
export const voices: Record<Role, Voice> = {
  operator: { name: 'Aparna', title: 'Emergency operator', speaker: 'aparna_hi_customer', language: 'hi-IN', pace: 0.95 },
  investigator: { name: 'Shubh', title: 'Senior investigator', speaker: 'shubh_enhi_banking', language: 'hi-IN', pace: 1 },
  command: { name: 'Ratan', title: 'Command officer', speaker: 'ratan_hi_customer_expressive', language: 'hi-IN', pace: 1.08 },
  reporter: { name: 'Simran', title: 'Breaking-news desk', speaker: 'simran_hi_news_breaking', language: 'hi-IN', pace: 1.12 },
  announcer: { name: 'Ashok', title: 'Official closing announcer', speaker: 'ashok_hi_news', language: 'hi-IN', pace: 0.95 },
};
// Verified against the official V4 catalog; fixed application casting, never LLM-selected.
// https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices
export const regionalVoices: Voice[] = [
  { ...voices.reporter, title: 'Delhi newsroom' },
  { name: 'Tarun', title: 'Hyderabad newsroom', speaker: 'tarun_te_narration', language: 'te-IN', pace: 1.1 },
  { name: 'Gokul', title: 'Chennai newsroom', speaker: 'gokul_ta_narration', language: 'ta-IN', pace: 1.1 },
  { name: 'Soham', title: 'Mumbai newsroom', speaker: 'soham_mr_narration', language: 'mr-IN', pace: 1.1 },
  { name: 'Roopa', title: 'Kolkata newsroom', speaker: 'roopa_bn_conversational', language: 'bn-IN', pace: 1.1 },
];
