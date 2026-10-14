export type Role = 'operator' | 'investigator' | 'command' | 'reporter' | 'announcer';
export type Department = 'Incoming call' | 'Emergency desk' | 'Investigation' | 'Escalation' | 'Breaking news' | 'Verdict';
export type VoiceLanguage = 'hi-IN' | 'te-IN' | 'ta-IN' | 'mr-IN' | 'bn-IN' | 'en-IN';
export interface Voice { name: string; title: string; speaker: string; language: VoiceLanguage; pace: number; }
export interface Scene { id: string; role: Role; department: Department; text: string; headline: string; voice?: Voice; city?: string; languageName?: string; english?: string; }
export interface Incident { id: string; number: string; title: string; hindi: string; description: string; severity: string; exhibit: 'biscuit' | 'clock' | 'name'; verdict: string; resolution: string; scenes: Scene[]; generated?: boolean; complaint?: string; appealUsed?: boolean; relay?: boolean; }
