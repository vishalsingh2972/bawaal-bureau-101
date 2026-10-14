'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { inputKey, isMp3, TTS_MODEL, type AudioManifest, type TtsInput } from '@/lib/tts';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ready' | 'ended' | 'error';
export interface AudioRequest { input: TtsInput; sceneId?: string; }
export function useBulbulAudio() {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'preset' | 'cache' | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [volume, setVolumeState] = useState(1);
  const [input, setInput] = useState<TtsInput | null>(null);
  const element = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>());
  const badPresets = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const lastRequest = useRef<AudioRequest | null>(null);
  const stop = useCallback(() => {
    generation.current++; controller.current?.abort(); controller.current = null;
    if (element.current) { element.current.pause(); element.current.removeAttribute('src'); element.current.load(); }
    setStatus('idle'); setError(null); setDuration(null); setSource(null); setRoundTripMs(null);
  }, []);
  useEffect(() => {
    const urls = cache.current;
    const lifecycle = generation;
    return () => {
      lifecycle.current++; controller.current?.abort();
      if (element.current) { element.current.pause(); element.current.removeAttribute('src'); element.current.load(); }
      urls.forEach(url => URL.revokeObjectURL(url)); urls.clear();
    };
  }, []);
  function getElement() {
    if (!element.current) {
      const audio = new Audio(); audio.preload = 'auto';
      audio.onended = () => setStatus('ended');
      audio.onloadedmetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : null);
      audio.onerror = () => { setStatus('error'); setError('The browser could not decode this MP3. Retry the clip.'); };
      element.current = audio;
    }
    return element.current;
  }
  async function play(request: AudioRequest) {
    const audio = getElement();
    audio.pause(); controller.current?.abort();
    const requestId = ++generation.current;
    const key = inputKey(request.input);
    function discardFailedClip() {
      const cached = cache.current.get(key);
      if (cached) URL.revokeObjectURL(cached);
      cache.current.delete(key);
      if (request.sceneId) badPresets.current.add(request.sceneId);
    }
    audio.onended = () => { if (requestId === generation.current) setStatus('ended'); };
    audio.onloadedmetadata = () => { if (requestId === generation.current) setDuration(Number.isFinite(audio.duration) ? audio.duration : null); };
    audio.onerror = () => { if (requestId === generation.current) { discardFailedClip(); setStatus('error'); setError('The browser could not decode this MP3. Retry the clip.'); } };
    const abort = new AbortController(); controller.current = abort;
    lastRequest.current = request;
    setInput(request.input);
    setError(null); setDuration(null); setRoundTripMs(null); setSource(null); setStatus('loading');
    try {
      let url = cache.current.get(key);
      if (url) setSource('cache');
      else {
        let blob: Blob | null = null;
        let fetchedSource: 'live' | 'preset' = 'live';
        if (request.sceneId && !badPresets.current.has(request.sceneId)) {
          // A missing, stale or damaged pre-generated clip falls back to the real server API.
          try {
            const response = await fetch('/audio/manifest.json', { signal: abort.signal, cache: 'no-store' });
            if (response.ok) {
              const manifest = await response.json() as AudioManifest;
              const entry = manifest.clips?.[request.sceneId];
              if (manifest.model === TTS_MODEL && manifest.sampleRate === 24000 && manifest.codec === 'mp3' && entry && inputKey(entry.input) === key && /^\/audio\/[a-z0-9-]+\.mp3$/.test(entry.file)) {
                const clip = await fetch(entry.file, { signal: abort.signal });
                if (clip.ok) {
                  const candidate = await clip.blob();
                  if (candidate.size === entry.bytes && isMp3(new Uint8Array(await candidate.arrayBuffer()))) { blob = candidate; fetchedSource = 'preset'; }
                }
              }
            }
          } catch { if (abort.signal.aborted) return; }
        }
        if (!blob) {
          const started = performance.now();
          const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.sceneId ? { sceneId: request.sceneId } : request.input), signal: abort.signal });
          if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error?.message || `Speech request failed (${response.status}). Please retry.`);
          }
          if (!response.headers.get('content-type')?.startsWith('audio/mpeg')) throw new Error('The server returned an unexpected audio format.');
          blob = await response.blob();
          if (!isMp3(new Uint8Array(await blob.arrayBuffer()))) throw new Error('The server returned an unusable MP3 clip.');
          if (requestId === generation.current) setRoundTripMs(Math.round(performance.now() - started));
        }
        if (requestId !== generation.current) return;
        url = URL.createObjectURL(blob);
        cache.current.set(key, url);
        if (cache.current.size > 32) {
          const oldest = cache.current.keys().next().value;
          if (oldest) { URL.revokeObjectURL(cache.current.get(oldest)!); cache.current.delete(oldest); }
        }
        setSource(fetchedSource);
      }
      if (requestId !== generation.current) return;
      audio.src = url;
      try { await audio.play(); if (requestId === generation.current) setStatus('playing'); }
      catch (cause) {
        if (requestId !== generation.current) return;
        if (cause instanceof DOMException && cause.name === 'NotAllowedError') { setStatus('ready'); setError('Audio is ready. Your browser requires another click: press Play audio.'); }
        else { discardFailedClip(); throw new Error('Playback failed. Check your browser audio support and retry.'); }
      }
    } catch (cause) {
      if (requestId !== generation.current || abort.signal.aborted) return;
      setStatus('error'); setError(cause instanceof Error ? cause.message : 'Audio could not be generated. Please retry.');
    }
  }
  function pause() { if (element.current && status === 'playing') { element.current.pause(); setStatus('paused'); } }
  async function resume() {
    const audio = element.current;
    if (!audio?.src || !['paused', 'ready', 'ended'].includes(status)) return;
    if (status === 'ended') audio.currentTime = 0;
    try { await audio.play(); setError(null); setStatus('playing'); }
    catch { setStatus('ready'); setError('Press Play audio to allow browser playback, and check that this tab is permitted to play sound.'); }
  }
  function retry() { if (lastRequest.current) void play(lastRequest.current); }
  function setVolume(value: number) { const level = Math.min(1, Math.max(0, value)); setVolumeState(level); getElement().volume = level; }
  return { status, error, source, roundTripMs, duration, volume, input, play, pause, resume, retry, stop, setVolume };
}
export type BulbulAudio = ReturnType<typeof useBulbulAudio>;
