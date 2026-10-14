'use client';
import { useRef } from 'react';
import { ArrowDown, ArrowUpRight, AudioLines, Clock3, Coffee, FileWarning, Fingerprint, Radio, ShieldAlert, Siren } from 'lucide-react';
import { incidents } from '@/lib/incidents';
import { voices } from '@/lib/voices';
import type { Incident } from '@/lib/types';
import { AudioCheck } from './audio-check';
import { useBulbulAudio } from '@/hooks/use-bulbul-audio';
import { testBulbulText } from '@/lib/tts';
import { useCasePlayback } from '@/hooks/use-case-playback';
import { CaseConsole } from './case-console';
import { measuredCaseDuration } from '@/lib/case-timings';
import { CustomEmergency } from './custom-emergency';

export function Bureau() {
  const audio = useBulbulAudio();
  const { state, director } = useCasePlayback(audio);
  const active = state.incident;
  const casesRef = useRef<HTMLElement>(null);
  function start(incident: Incident) { director.start(incident); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function closeCase() { director.close(); requestAnimationFrame(() => casesRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })); }
  return <main className={active ? 'case-mode' : undefined}>
    <header className="topbar"><a href="#" className="brand"><ShieldAlert size={24} /><span>BAWAAL<span className="brand-thin"> / BUREAU</span></span></a><span className="top-status"><i className="status-dot" /> CONTROL ROOM ONLINE<span className="desktop-only"> · NEW DELHI-ish</span></span><span className="edition">EST. 2026</span></header>
    <div hidden={!!active}><section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="small-bar" /> DEPARTMENT OF DISPROPORTIONATE RESPONSE</div><h1>SMALL PROBLEM.<br /><span>BIG BAWAAL.</span></h1><p className="tagline">Chhoti si problem.<br />National level bawaal.</p><p className="intro">Your biscuit drowned. Your friend is late.<br />Our entire department is taking it personally.</p><button className="button primary" onClick={() => casesRef.current?.scrollIntoView({ behavior: 'smooth' })}><Siren size={20} /> REPORT A TINY EMERGENCY <ArrowUpRight size={20} /></button><a className="test-shortcut" href="#audio-check"><AudioLines size={15} />Test Bulbul audio <ArrowDown size={14} /></a><p className="disclaimer">Fictional bureau. Real drama. No actual emergency assistance.</p></div>
      <div className="status-board"><div className="panel-label"><span><i className="status-dot red" /> LIVE SITUATION ROOM</span><span>BB / HQ-01</span></div><div className="radar"><div className="radar-orbit" /><div className="radar-orbit inner" /><div className="radar-sweep" /><div className="radar-cross horizontal" /><div className="radar-cross vertical" /><span className="radar-ping ping-one" /><span className="radar-ping ping-two" /><div className="radar-center"><Coffee size={40} /><span>ONE BISCUIT.<br />ZERO CONTACT.</span></div><span className="radar-coord">28.6139° N / CHAI SECTOR</span></div><div className="alert-level"><span>NATIONAL BAWAAL LEVEL</span><strong>CRITICAL <ShieldAlert size={25} /></strong><div className="level-bars">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div></div><div className="board-bottom"><span>THREAT: EMOTIONAL</span><span>RESPONSE: EXCESSIVE</span></div></div>
    </section>
    <div className="ticker"><span><Radio size={16} /> BUREAU WIRE</span><p>ONE BISCUIT MISSING <b>✳</b> FIVE MINUTES UNDER INVESTIGATION <b>✳</b> FULL NAME DETECTED <b>✳</b> COMMON SENSE ON LEAVE</p></div>
    <section className="case-section" ref={casesRef} id="cases"><div className="section-heading"><div><div className="eyebrow">OPEN CASE FILES / 003</div><h2>Pick your catastrophe<span>.</span></h2></div><span className="section-note"><ArrowDown size={15} /> SMALL STAKES. MAXIMUM DRAMA.</span></div><div className="cases">{incidents.map((incident, i) => <button className={`case-card case-${incident.exhibit}`} key={incident.id} onClick={() => start(incident)}><div className="case-top"><span>CASE / {incident.number}</span><span className="case-stamp">{i === 0 ? 'FLAGSHIP' : 'CLASSIFIED'}</span></div><div className="exhibit">{incident.exhibit === 'biscuit' ? <><div className="biscuit">B<span>· · ·<br />· · ·</span>B</div><div className="chai" /><span className="evidence-tag">EXHIBIT A: THE LAST DIP</span></> : incident.exhibit === 'clock' ? <><Clock3 className="exhibit-icon" size={96} strokeWidth={1} /><span className="clock-note">5 min ≈ 45 min</span><span className="evidence-tag">EXHIBIT B: FALSE PROMISES</span></> : <><Fingerprint className="exhibit-icon" size={100} strokeWidth={1} /><span className="name-note">FULL NAME<br />DETECTED</span><span className="evidence-tag">EXHIBIT C: माताजी</span></>}</div><div className="case-copy"><span className="severity">{incident.severity}{measuredCaseDuration(incident) !== null && ` / ${Math.round(measuredCaseDuration(incident)!)} SEC`}</span><h3>{incident.title}</h3><p className="hindi">{incident.hindi}</p><p>{incident.description}</p></div><div className="case-action"><span>DISPATCH THIS CASE</span><ArrowUpRight size={20} /></div></button>)}</div><p className="preview-note"><AudioLines size={16} /> Real Bulbul voices. Automatic escalation. Best experienced with sound on.</p></section>
    </div>{active && <CaseConsole state={state} director={director} audio={audio} onClose={closeCase} />}
    <div hidden={!!active}>
    <CustomEmergency onGenerated={start} />
    <AudioCheck audio={audio} onTest={() => { const voice = voices.operator; void audio.play({ input: { text: testBulbulText, speaker: voice.speaker, language_code: voice.language, pace: voice.pace } }); document.getElementById('audio-check')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} /></div><section className="bureau-note"><FileWarning size={30} /><div><h3>We take nothing very seriously.</h3><p>Five officials. Three tiny disasters. One wildly unnecessary response.</p></div><span>SARVAM 105B / SAARAS V4<br /><strong>LIVE AI CONTROL ROOM</strong></span></section><footer><a href="#" className="brand"><ShieldAlert size={18} /> BAWAAL BUREAU</a><span>Made with Sarvam AI · Bulbul V4 Flash<span className="footer-preview"> / real REST audio</span></span><span>PARODY, NOT PUBLIC SERVICE.</span></footer>
  </main>;
}
