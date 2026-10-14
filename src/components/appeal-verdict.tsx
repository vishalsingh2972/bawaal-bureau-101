'use client';
import { useEffect, useRef, useState } from 'react';
import { Gavel, LoaderCircle, Mic } from 'lucide-react';
import type { Incident } from '@/lib/types';
import { RecordButton } from './record-button';
export function AppealVerdict({ incident, onGenerated }: { incident: Incident; onGenerated: (incident: Incident) => void }) {
  const [open, setOpen] = useState(false); const [defence, setDefence] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function appeal(event: React.FormEvent) {
    event.preventDefault(); if (busy || recordingActive || !defence.trim()) return;
    setBusy(true); setError(null); const controller = new AbortController(); abort.current = controller;
    try {
      const response = await fetch('/api/appeal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ complaint: incident.complaint, verdict: incident.verdict, defence: defence.trim() }), signal: controller.signal }); const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'The appeal could not be heard. Retry.');
      if (!controller.signal.aborted) onGenerated({ ...incident, id: `${incident.id}-appeal`, title: 'Appeal: ' + incident.title, verdict: data.comeback, resolution: 'Appeal heard. Further objections have been politely confiscated.', appealUsed: true, scenes: [{ id: `${incident.id}-appeal-01`, role: 'announcer', department: 'Verdict', headline: 'ONE OBJECTION. ONE FINAL COMEBACK.', text: data.comeback }] });
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Appeal failed.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  if (incident.appealUsed) return <p className="appeal-final">ONE APPEAL HEARD. THE COMMISSIONER HAS LEFT THE CHAT.</p>;
  return <div className="appeal-box">{!open ? <button className="button secondary" onClick={() => setOpen(true)}><Mic size={18} />OBJECT TO THIS VERDICT 🎙️</button> : <form onSubmit={appeal}><label htmlFor="defence">One short defence. Make it count.</label><textarea id="defence" maxLength={160} rows={2} value={defence} disabled={busy} onChange={event => setDefence(event.target.value)} placeholder="Maine toh sirf ₹1 bheja tha!" /><div className="custom-actions"><button className="button primary" type="submit" disabled={busy || recordingActive || !defence.trim()}>{busy ? <LoaderCircle className="loading-spin" size={17} /> : <Gavel size={17} />}{busy ? 'Commissioner is reconsidering…' : 'Submit my one objection'}</button><RecordButton disabled={busy} onTranscript={setDefence} onActivityChange={setRecordingActive} /></div>{error && <p className="audio-error" role="alert">{error}</p>}</form>}</div>;
}
