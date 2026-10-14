'use client';
import { useEffect, useRef, useState } from 'react';
export function useRecordBawaal(onTranscript: (text: string) => void) {
  const [status, setStatus] = useState<'idle' | 'permission' | 'recording' | 'transcribing'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const generation = useRef(0);
  function stop() { if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); if (timer.current) clearInterval(timer.current); timer.current = null; }
  useEffect(() => {
    const counter = generation;
    return () => { counter.current++; if (timer.current) clearInterval(timer.current); abort.current?.abort(); if (recorder.current?.state === 'recording') recorder.current.stop(); stream.current?.getTracks().forEach(track => track.stop()); };
  }, []);
  async function start() {
    if (status !== 'idle') return;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('Microphone recording needs a supported browser on HTTPS or localhost. You can still type.'); return; }
    const id = ++generation.current;
    setStatus('permission');
    try {
      const capture = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (id !== generation.current) { capture.getTracks().forEach(track => track.stop()); return; }
      stream.current = capture;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error('This browser has no supported recording format. Please type your complaint.');
      const media = new MediaRecorder(capture, { mimeType: mime }); recorder.current = media;
      const chunks: Blob[] = [];
      media.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      media.onerror = () => { generation.current++; stop(); setStatus('idle'); setError('Recording failed. Try again or type instead.'); };
      media.onstop = async () => {
        if (id !== generation.current) return;
        stop();
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 100) { setError('No audio was recorded. Try again or type instead.'); setStatus('idle'); return; }
        setStatus('transcribing');
        const controller = new AbortController(); abort.current = controller;
        try {
          const form = new FormData(); form.set('file', blob, mime.includes('mp4') ? 'bawaal.m4a' : mime.includes('ogg') ? 'bawaal.ogg' : 'bawaal.webm');
          const response = await fetch('/api/transcribe', { method: 'POST', body: form, signal: controller.signal });
          const data = await response.json();
          if (!response.ok) throw new Error(data?.error?.message || 'Transcription failed. Type instead.');
          if (id === generation.current) onTranscript(data.transcript);
        } catch (cause) { if (id === generation.current) setError(cause instanceof Error ? cause.message : 'Transcription failed.'); }
        finally { if (id === generation.current) setStatus('idle'); }
      };
      setSeconds(0); setStatus('recording'); media.start(); const started = Date.now();
      timer.current = setInterval(() => { const elapsed = Math.floor((Date.now() - started) / 1000); setSeconds(Math.min(10, elapsed)); if (elapsed >= 10) stop(); }, 200);
    } catch (cause) { stop(); if (id === generation.current) { setStatus('idle'); setError(cause instanceof DOMException && cause.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow access in your browser or type your complaint.' : cause instanceof Error ? cause.message : 'Microphone unavailable. Type instead.'); } }
  }
  return { status, seconds, error, start, stop };
}
