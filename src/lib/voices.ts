import type { Role, Voice } from './types.ts';
export const voices: Record<Role, Voice> = {
  operator: { name: 'Aparna', title: 'Emergency operator', speaker: 'aparna_hi_customer', language: 'hi-IN', pace: 0.95 },
  investigator: { name: 'Shubh', title: 'Senior investigator', speaker: 'shubh_enhi_banking', language: 'hi-IN', pace: 1 },
  command: { name: 'Ratan', title: 'Command officer', speaker: 'ratan_hi_customer_expressive', language: 'hi-IN', pace: 1.08 },
  reporter: { name: 'Simran', title: 'Breaking-news desk', speaker: 'simran_hi_news_breaking', language: 'hi-IN', pace: 1.12 },
  announcer: { name: 'Ashok', title: 'Official closing announcer', speaker: 'ashok_hi_news', language: 'hi-IN', pace: 0.95 },
};
