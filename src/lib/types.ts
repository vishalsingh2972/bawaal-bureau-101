export type Role = 'operator' | 'investigator' | 'command' | 'reporter' | 'announcer';
export type Department = 'Incoming call' | 'Emergency desk' | 'Investigation' | 'Escalation' | 'Breaking news' | 'Verdict';
export interface Voice { name: string; title: string; speaker: string; language: 'hi-IN'; pace: number; }
export interface Scene { id: string; role: Role; department: Department; text: string; headline: string; }
export interface Incident { id: string; number: string; title: string; hindi: string; description: string; severity: string; exhibit: 'biscuit' | 'clock' | 'name'; verdict: string; resolution: string; scenes: Scene[]; generated?: boolean; complaint?: string; appealUsed?: boolean; }
