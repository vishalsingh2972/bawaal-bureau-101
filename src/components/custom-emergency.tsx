'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, BrainCircuit, LoaderCircle } from 'lucide-react';
import { RecordButton } from './record-button';
import type { Incident } from '@/lib/types';
export function CustomEmergency({ onGenerated }: { onGenerated: (incident: Incident) => void }) {
  const [complaint, setComplaint] = useState('');
  const [busy, setBusy] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function generate(event: React.FormEvent) {
    event.preventDefault(); if (busy || recordingActive || !complaint.trim()) return;
    setBusy(true); setError(null); const controller = new AbortController(); abort.current = controller;
    try {
      const response = await fetch('/api/generate-crisis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ complaint: complaint.trim() }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'The AI could not file this case. Retry.');
      if (!controller.signal.aborted) onGenerated(data.incident);
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Generation failed.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <section className="custom-emergency" id="custom-emergency"><div className="eyebrow"><BrainCircuit size={16} /> LIVE AI DESK / NOT A SCRIPTED CASE</div><h2>Your disaster. Our overreaction<span>.</span></h2><p className="custom-intro">Sarvam 105B writes your investigation. Four Bulbul officials make it everyone’s problem.</p><form onSubmit={generate}><label htmlFor="complaint">What tiny disaster happened?</label><textarea id="complaint" maxLength={160} rows={3} value={complaint} onChange={event => setComplaint(event.target.value)} placeholder="Mera ₹1 UPI payment pending hai…" disabled={busy} /><div className="input-meta"><span>Typing is always available. Recorded text stays editable.</span><span>{complaint.length}/160</span></div><div className="suggested-complaints">{['Mummy ne mera poora naam le liya.', 'Mera ₹1 UPI payment pending hai.', 'Swiggy wale ne chutney nahi bheji.'].map(text => <button key={text} type="button" onClick={() => setComplaint(text)} disabled={busy}>{text}</button>)}</div><div className="custom-actions"><button className="button primary" type="submit" disabled={busy || recordingActive || !complaint.trim()}>{busy ? <LoaderCircle className="loading-spin" size={18} /> : <ArrowUpRight size={18} />}{busy ? '105B is investigating…' : 'Generate my bawaal'}</button><RecordButton onTranscript={setComplaint} disabled={busy} onActivityChange={setRecordingActive} /></div>{error && <p className="audio-error" role="alert">{error}</p>}</form><p className="audio-help">Live model calls use your server’s key. No template is substituted on failure. Fictional entertainment; never real emergency assistance.</p></section>;
}
