import type { Incident } from './types.ts';
import { voices } from './voices.ts';
import type { AudioRequest, AudioStatus } from '../hooks/use-bulbul-audio.ts';

export type CaseStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ready' | 'error' | 'verdict';
export interface DispatchEvent { scene: number; elapsedSeconds: number; }
export interface CaseState { incident: Incident | null; index: number; status: CaseStatus; log: DispatchEvent[]; }
export const emptyCase: CaseState = { incident: null, index: 0, status: 'idle', log: [] };
export interface CaseAudio {
  play(request: AudioRequest): Promise<AudioStatus | 'cancelled'>;
  prepare(requests: AudioRequest[]): Promise<void>;
  pause(): void;
  resume(): Promise<void>;
  stop(): void;
}
export function sceneRequest(incident: Incident, index: number): AudioRequest {
  const scene = incident.scenes[index]; const voice = scene.voice ?? voices[scene.role];
  return { ...(!incident.generated ? { sceneId: scene.id } : {}), input: { text: scene.text.trim().normalize('NFC'), speaker: voice.speaker, language_code: voice.language, pace: voice.pace } };
}
// Only a genuine audio-ended event advances the story. Tokens reject stale callbacks after restart/switch/close.
export class CaseDirector {
  state: CaseState = emptyCase;
  private token = 0;
  private startedAt = 0;
  private pendingAdvance = false;
  private audio: CaseAudio;
  private publish: (state: CaseState) => void;
  constructor(audio: CaseAudio, publish: (state: CaseState) => void) { this.audio = audio; this.publish = publish; }
  private update(patch: Partial<CaseState>) { this.state = { ...this.state, ...patch }; this.publish(this.state); }
  start(incident: Incident) {
    this.token++; this.audio.stop(); this.pendingAdvance = false; this.startedAt = Date.now();
    this.update({ incident, index: 0, status: 'loading', log: [] });
    void this.playCurrent();
    void this.audio.prepare(incident.scenes.slice(1).map((_, index) => sceneRequest(incident, index + 1)));
  }
  private async playCurrent() {
    const incident = this.state.incident;
    if (!incident) return;
    const token = ++this.token;
    const index = this.state.index;
    this.pendingAdvance = false;
    this.update({ status: 'loading' });
    const result = await this.audio.play({ ...sceneRequest(incident, index), onStart: () => {
      if (token !== this.token) return;
      const log = this.state.log.some(event => event.scene === index) ? this.state.log : [...this.state.log, { scene: index, elapsedSeconds: (Date.now() - this.startedAt) / 1000 }];
      this.update({ status: 'playing', log });
    }, onError: () => { if (token === this.token) this.update({ status: 'error' }); }, onBlocked: () => { if (token === this.token) this.update({ status: 'ready' }); }, onEnded: () => {
      if (token !== this.token) return;
      if (this.state.status === 'paused') { this.pendingAdvance = true; return; }
      this.advance();
    } });
    if (token !== this.token || result === 'cancelled') return;
    if (result === 'error' || result === 'ready') this.update({ status: result });
  }
  private advance() {
    const incident = this.state.incident;
    if (!incident) return;
    if (this.state.index === incident.scenes.length - 1) { this.token++; this.update({ status: 'verdict' }); }
    else { this.update({ index: this.state.index + 1 }); void this.playCurrent(); }
  }
  pause() {
    if (!['playing', 'loading'].includes(this.state.status)) return;
    this.update({ status: 'paused' }); this.audio.pause();
  }
  resume() {
    if (!['paused', 'ready'].includes(this.state.status)) return;
    if (this.pendingAdvance) { this.pendingAdvance = false; this.advance(); return; }
    this.update({ status: 'loading' }); void this.audio.resume();
  }
  retry() { if (this.state.incident && this.state.status === 'error') void this.playCurrent(); }
  replay() { if (this.state.incident) this.start(this.state.incident); }
  close() { this.token++; this.audio.stop(); this.pendingAdvance = false; this.state = emptyCase; this.publish(this.state); }
  dispose() { this.token++; this.audio.stop(); }
}
