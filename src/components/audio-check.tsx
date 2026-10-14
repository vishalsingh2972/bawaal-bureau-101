'use client';
import { AudioLines, LoaderCircle, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { testBulbulText } from '@/lib/tts';
import { voices } from '@/lib/voices';
import type { BulbulAudio } from '@/hooks/use-bulbul-audio';

export function AudioCheck({ audio, onTest }: { audio: BulbulAudio; onTest: () => void }) {
  const voice = voices.operator;
  return <section className="audio-check" id="audio-check" aria-label="Real Bulbul audio test">
    <div className="audio-check-heading"><div><div className="eyebrow"><AudioLines size={15} /> REAL VOICE / LIVE API TEST</div><h2>Give the bureau a voice<span>.</span></h2></div><span className="audio-model">bulbul:v4-flash</span></div>
    <p className="audio-test-line" lang="hi">“{audio.input?.text ?? testBulbulText}”</p>
    <div className="audio-config"><code>{audio.input?.speaker ?? voice.speaker}</code><span>{audio.input?.language_code ?? voice.language}</span><span>PACE {audio.input?.pace ?? voice.pace}</span><span>24 kHz · MP3</span></div>
    <div className="audio-actions"><button className="button primary" onClick={onTest} disabled={audio.status === 'loading'}>{audio.status === 'loading' ? <LoaderCircle className="loading-spin" size={18} /> : <AudioLines size={18} />}Test Bulbul</button>
      {audio.status === 'playing' && <button className="button secondary" onClick={audio.pause}><Pause size={17} />Pause audio</button>}
      {['paused', 'ready', 'ended'].includes(audio.status) && <button className="button secondary" onClick={() => void audio.resume()}><Play size={17} />{audio.status === 'ended' ? 'Replay audio' : 'Play audio'}</button>}
      {audio.status === 'error' && <button className="button secondary" onClick={audio.retry}><RotateCcw size={17} />Retry request</button>}
      {audio.status !== 'idle' && <button className="button secondary" onClick={audio.stop}><Square size={16} />Stop</button>}
      <label className="volume-control"><Volume2 size={18} /><span className="sr-only">Audio volume</span><input type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={event => audio.setVolume(Number(event.target.value))} /><span>{Math.round(audio.volume * 100)}%</span></label>
    </div>
    <div className="audio-feedback" aria-live="polite"><span className={`audio-state audio-state-${audio.status}`}>{audio.status === 'idle' ? 'READY TO TEST' : audio.status.toUpperCase()}</span>{audio.source && <span>{audio.source === 'live' ? 'Live Sarvam REST response' : audio.source === 'preset' ? 'Pre-generated Sarvam clip' : 'Browser session cache'}</span>}{audio.roundTripMs !== null && <span>Network round-trip: {(audio.roundTripMs / 1000).toFixed(2)} s</span>}{audio.duration !== null && <span>Clip duration: {audio.duration.toFixed(1)} s</span>}</div>
    {audio.error && <p className="audio-error" role="alert">{audio.error}</p>}
    <p className="audio-help">Needs your server-side SARVAM_API_KEY. REST downloads the full clip before playback. Round-trip includes your server and network; it is not model time-to-first-audio.</p>
  </section>;
}
