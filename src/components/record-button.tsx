'use client';
import { LoaderCircle, Mic, Square } from 'lucide-react';
import { useRecordBawaal } from '@/hooks/use-record-bawaal';
import { useEffect } from 'react';
export function RecordButton({ onTranscript, disabled = false, onActivityChange }: { onTranscript: (text: string) => void; disabled?: boolean; onActivityChange?: (active: boolean) => void }) {
  const record = useRecordBawaal(onTranscript);
  useEffect(() => { onActivityChange?.(record.status !== 'idle'); }, [record.status, onActivityChange]);
  return <div className="record-controls"><button type="button" className={`button secondary ${record.status === 'recording' ? 'recording' : ''}`} disabled={disabled || ['permission', 'transcribing'].includes(record.status)} onClick={() => record.status === 'recording' ? record.stop() : void record.start()}>{record.status === 'recording' ? <Square size={18} /> : record.status === 'idle' ? <Mic size={18} /> : <LoaderCircle size={18} className="loading-spin" />}{record.status === 'recording' ? `Stop recording · ${record.seconds}/10s` : record.status === 'transcribing' ? 'Saaras is transcribing…' : record.status === 'permission' ? 'Allow microphone access…' : 'Speak Your Bawaal'}</button><span className="record-note" aria-live="polite">{record.status === 'recording' ? 'MIC LIVE · AUTO-STOPS AT 10 SECONDS' : 'SAARAS V4 · REVIEW TRANSCRIPT BEFORE SENDING'}</span>{record.error && <p className="audio-error" role="alert">{record.error}</p>}</div>;
}
