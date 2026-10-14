'use client';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, AudioLines, Check, CheckCheck, Fingerprint, Gavel, Headphones, LoaderCircle, Pause, Play, Radio, RotateCcw, Search, ShieldAlert, Siren, Volume2, X } from 'lucide-react';
import { voices } from '@/lib/voices';
import type { BulbulAudio } from '@/hooks/use-bulbul-audio';
import type { CaseDirector, CaseState } from '@/lib/case-director';
import { measuredCaseDuration } from '@/lib/case-timings';
import { AppealVerdict } from './appeal-verdict';
const roleIcons = { operator: Headphones, investigator: Search, command: ShieldAlert, reporter: Radio, announcer: Gavel };
const styles = { operator: 'CALM UNDER PRESSURE', investigator: 'BUREAUCRACY, WITH RECEIPTS', command: 'MAXIMUM AUTHORITY', reporter: 'LIVE. LOUD. UNNECESSARY.', announcer: 'ABSOLUTELY FINAL' };
export function CaseConsole({ state, director, audio, onClose }: { state: CaseState; director: CaseDirector; audio: BulbulAudio; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus({ preventScroll: true }); }, [state.incident?.id]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && (event.target.closest('button,input,a,textarea,select') || event.target.isContentEditable)) return;
      if (event.code === 'Space') { event.preventDefault(); if (['playing', 'loading'].includes(director.state.status)) director.pause(); else director.resume(); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); director.replay(); }
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', keyboard); return () => window.removeEventListener('keydown', keyboard);
  }, [director, onClose]);
  const incident = state.incident;
  if (!incident) return null;
  const scene = incident.scenes[state.index];
  const voice = voices[scene.role];
  const Icon = roleIcons[scene.role];
  const finished = state.status === 'verdict';
  const transmitting = state.status === 'playing' && audio.status === 'playing';
  const started = state.log.some(event => event.scene === state.index);
  const fraction = audio.duration ? Math.min(1, audio.currentTime / audio.duration) : 0;
  const progress = finished ? 100 : ((state.index + fraction) / incident.scenes.length) * 100;
  const duration = incident.generated ? null : measuredCaseDuration(incident);
  return <section ref={panel} tabIndex={-1} className={`dispatch cinematic role-${scene.role} ${transmitting ? 'transmitting' : ''} ${finished ? 'case-closed' : ''}`} aria-label={`${incident.title} dispatch console`}>
    <div className="panel-label"><span><i className="status-dot red" /> CASE {incident.number} / {finished ? 'CLOSED' : 'ACTIVE DISPATCH'}</span><button className="icon-button" aria-label="Close case and stop audio" onClick={onClose}><X size={19} /></button></div>
    <div className="case-masthead"><div><span className="eyebrow">{incident.severity}</span><h2>{incident.title}</h2></div><div className="case-runtime"><AudioLines size={15} /><span>{duration ? `${duration.toFixed(1)} SEC OF REAL AUDIO` : 'REAL BULBUL AUDIO'}<small>{incident.generated ? (incident.appealUsed ? '1 VOICE' : '4 VOICES') : '5 VOICES'} / {incident.scenes.length} BEATS</small></span></div></div>
    {!finished ? <>
      <div className="dispatch-takeover" key={`${incident.id}-${scene.id}`}><span>{scene.role === 'reporter' ? <><Radio size={18} />BREAKING BAWAAL</> : <><Siren size={16} />{scene.department.toUpperCase()}</>}</span><strong>{scene.headline}</strong><span className="broadcast-live">{transmitting ? '● ON AIR' : state.status === 'paused' ? 'Ⅱ PAUSED' : '● STANDBY'}</span></div>
      <div className="dispatch-body"><aside className="officer"><div className="officer-avatar" key={scene.role}><Icon size={46} /><span>{voice.name.slice(0, 2).toUpperCase()}</span><div className="officer-badge">BB / {String(Object.keys(voices).indexOf(scene.role) + 1).padStart(2, '0')}</div></div><div className="eyebrow">{scene.department}</div><h3>{voice.name}</h3><p>{incident.generated && scene.role === 'announcer' ? 'Commissioner / final authority' : voice.title}</p><span className="officer-style">{styles[scene.role]}</span><code>{voice.speaker}</code><div className="voice-settings">{voice.language} / PACE {voice.pace}</div><div className="signal-bars" aria-hidden="true">{Array.from({ length: 17 }, (_, n) => <i key={n} style={{ animationDelay: `${n * .09}s` }} />)}</div></aside>
        <div className="transmission"><div className="transmission-meta"><span>{transmitting ? 'LIVE TRANSMISSION' : state.status === 'paused' ? 'TRANSMISSION PAUSED' : 'DISPATCH CHANNEL'}</span><span>BEAT {String(state.index + 1).padStart(2, '0')} / {String(incident.scenes.length).padStart(2, '0')}</span></div><div className="caption-stage" key={scene.id}><p className="caption-kicker">{incident.generated ? 'SARVAM 105B WROTE THIS CASE. BULBUL IS ON AIR.' : scene.role === 'reporter' ? 'THE NATION DEMANDS A TEA STRAINER.' : incident.hindi}</p><h2 className="subtitle" lang="hi" aria-live="polite">{started ? scene.text : state.status === 'error' ? 'Transmission interrupted.' : state.status === 'paused' ? 'Dispatch paused. Your chai can wait.' : 'Connecting the department…'}</h2>{!started && state.status === 'loading' && <p className="connection-note"><LoaderCircle size={15} className="loading-spin" />Loading a real Bulbul voice clip</p>}</div>
        <div className="story-meter" role="progressbar" aria-label="Case progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div><div className="segments">{incident.scenes.map((beat, index) => <div className={index <= state.index ? 'done' : ''} key={beat.id}><span /><small>{beat.department}</small></div>)}</div>
        <div className="controls">{['playing', 'loading'].includes(state.status) && <button className="button primary compact" onClick={() => director.pause()}><Pause size={17} />Pause</button>}{['paused', 'ready'].includes(state.status) && <button className="button primary compact" onClick={() => director.resume()}><Play size={17} />{state.status === 'ready' ? 'Play audio' : 'Resume'}</button>}{state.status === 'error' && <button className="button primary compact" onClick={() => director.retry()}><RotateCcw size={17} />Retry this line</button>}<button className="button secondary compact" onClick={() => director.replay()}><RotateCcw size={16} />Restart case</button><label className="volume-control"><Volume2 size={17} /><span className="sr-only">Case audio volume</span><input aria-label="Case audio volume" type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={event => audio.setVolume(Number(event.target.value))} /><span>{Math.round(audio.volume * 100)}%</span></label></div>
        {(state.status === 'error' || state.status === 'ready') && <p className="audio-error" role="alert">{audio.error || 'Playback was interrupted. Retry this line to continue.'}</p>}
        <div className="case-playback-meta"><span>{audio.source === 'cache' ? 'CACHED BULBUL MP3' : audio.source === 'preset' ? 'PRE-GENERATED BULBUL MP3' : audio.source === 'live' ? 'LIVE SARVAM GENERATION' : 'CONNECTING'}{audio.roundTripMs !== null && ` / NETWORK ROUND-TRIP ${(audio.roundTripMs / 1000).toFixed(2)}s`}</span><span>SPACE: PAUSE / R: RESTART / ESC: EXIT</span></div>
      </div></div>
    </> : <div className="verdict-screen"><div className="verdict-seal"><CheckCheck size={44} /><span>CASE CLOSED</span></div><div className="eyebrow">FINAL ORDER / {incident.number}</div><h2>{incident.verdict}</h2><p className="verdict-hindi" lang="hi">{incident.resolution}</p><div className="verdict-receipt"><Fingerprint size={24} /><span>OFFICIALLY OVERREACTED TO.<br /><small>PUBLIC MONEY SPENT: ₹0. EMOTIONAL DAMAGE: UNLIMITED.</small></span><span className="signed">— Bawaal Bureau</span></div><div className="controls"><button className="button primary" onClick={onClose}>File another emergency <ArrowUpRight size={18} /></button><button className="button secondary" onClick={() => director.replay()}><RotateCcw size={18} />Replay</button></div>{incident.generated && <AppealVerdict key={incident.id} incident={incident} onGenerated={next => director.start(next)} />}<p className="verdict-postscript">{incident.generated ? 'Written by Sarvam 105B. Voiced by Bulbul V4 Flash.' : incident.id === 'biscuit' ? 'The evidence was delicious. Allegedly.' : incident.id === 'five-minutes' ? 'Your friend is still five minutes away.' : 'This verdict is subject to Mummy’s approval.'}</p></div>}
    <div className="event-log"><span>DISPATCH LOG / ACTUAL CLIP STARTS</span>{state.log.map(event => <p key={event.scene}><Check size={12} /> T+{event.elapsedSeconds.toFixed(1)}s · {incident.scenes[event.scene].department} · {voices[incident.scenes[event.scene].role].name}</p>)}</div><p className="parody-strip">FICTIONAL PARODY · NO REAL EMERGENCY ASSISTANCE · MADE WITH SARVAM BULBUL V4 FLASH</p>
  </section>;
}
