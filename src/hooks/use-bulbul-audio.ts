'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { inputKey, isMp3, TTS_MODEL, type AudioManifest, type TtsInput } from '@/lib/tts';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ready' | 'ended' | 'error';
export interface AudioRequest { input: TtsInput; sceneId?: string; onStart?: () => void; onEnded?: () => void; onError?: () => void; onBlocked?: () => void; }
export function useBulbulAudio() {
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'preset' | 'cache' | null>(null);
  const [roundTripMs, setRoundTripMs] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [input, setInput] = useState<TtsInput | null>(null);
  const element = useRef<HTMLAudioElement | null>(null);
  const cache = useRef(new Map<string, string>());
  const badPresets = useRef(new Set<string>());
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const lastRequest = useRef<AudioRequest | null>(null);
  const pauseRequested = useRef(false);
  const loading = useRef(false);
  const preparation = useRef<AbortController | null>(null);
  const manifestPromise = useRef<Promise<AudioManifest | null> | null>(null);
  const stop = useCallback(() => {
    generation.current++; controller.current?.abort(); controller.current = null; preparation.current?.abort(); loading.current = false; pauseRequested.current = false;
    if (element.current) { element.current.pause(); element.current.removeAttribute('src'); element.current.load(); }
    setStatus('idle'); setError(null); setDuration(null); setCurrentTime(0); setSource(null); setRoundTripMs(null);
  }, []);
  useEffect(() => {
    const urls = cache.current;
    const lifecycle = generation;
    return () => {
      lifecycle.current++; controller.current?.abort(); preparation.current?.abort();
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
  async function getManifest() {
    if (!manifestPromise.current) manifestPromise.current = fetch('/audio/manifest.json', { cache: 'no-store' }).then(async response => response.ok ? await response.json() as AudioManifest : null).catch(() => null);
    return manifestPromise.current;
  }
  async function readPreset(request: AudioRequest, signal: AbortSignal) {
    if (!request.sceneId || badPresets.current.has(request.sceneId)) return null;
    try {
      const manifest = await getManifest();
      const entry = manifest?.clips?.[request.sceneId];
      if (manifest?.model !== TTS_MODEL || manifest.sampleRate !== 24000 || manifest.codec !== 'mp3' || !entry || inputKey(entry.input) !== inputKey(request.input) || !/^\/audio\/[a-z0-9-]+\.mp3$/.test(entry.file)) return null;
      const response = await fetch(entry.file, { signal });
      if (!response.ok) return null;
      const blob = await response.blob();
      return blob.size === entry.bytes && isMp3(new Uint8Array(await blob.arrayBuffer())) ? blob : null;
    } catch { return null; }
  }
  async function prepare(requests: AudioRequest[]) {
    preparation.current?.abort();
    const abort = new AbortController(); preparation.current = abort;
    // Warm real preset files only. Never spend live API credits for speculative prefetch.
    for (let index = 0; index < requests.length; index += 3) {
      if (abort.signal.aborted) return;
      await Promise.all(requests.slice(index, index + 3).map(async request => {
        const key = inputKey(request.input);
        if (cache.current.has(key)) return;
        const blob = await readPreset(request, abort.signal);
        if (blob && !abort.signal.aborted && !cache.current.has(key)) cache.current.set(key, URL.createObjectURL(blob));
      }));
    }
  }
  async function play(request: AudioRequest): Promise<AudioStatus | 'cancelled'> {
    const audio = getElement();
    audio.pause(); audio.removeAttribute('src'); audio.load(); controller.current?.abort();
    pauseRequested.current = false; loading.current = true;
    const requestId = ++generation.current;
    const key = inputKey(request.input);
    function discardFailedClip() {
      const cached = cache.current.get(key);
      if (cached) URL.revokeObjectURL(cached);
      cache.current.delete(key);
      if (request.sceneId) badPresets.current.add(request.sceneId);
    }
    audio.onended = () => { if (requestId === generation.current) { setStatus('ended'); request.onEnded?.(); } };
    audio.ontimeupdate = () => { if (requestId === generation.current) setCurrentTime(audio.currentTime); };
    audio.onloadedmetadata = () => { if (requestId === generation.current) setDuration(Number.isFinite(audio.duration) ? audio.duration : null); };
    audio.onerror = () => { if (requestId === generation.current) { discardFailedClip(); setStatus('error'); setError('The browser could not decode this MP3. Retry the clip.'); request.onError?.(); } };
    const abort = new AbortController(); controller.current = abort;
    lastRequest.current = request;
    setInput(request.input);
    setError(null); setDuration(null); setCurrentTime(0); setRoundTripMs(null); setSource(null); setStatus('loading');
    try {
      let url = cache.current.get(key);
      if (url) setSource('cache');
      else {
        let blob: Blob | null = null;
        let fetchedSource: 'live' | 'preset' = 'live';
        blob = await readPreset(request, abort.signal);
        if (abort.signal.aborted) return 'cancelled';
        if (blob) fetchedSource = 'preset';
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
        if (requestId !== generation.current) return 'cancelled';
        url = URL.createObjectURL(blob);
        const previous = cache.current.get(key);
        if (previous) URL.revokeObjectURL(previous);
        cache.current.set(key, url);
        if (cache.current.size > 32) {
          const oldest = cache.current.keys().next().value;
          if (oldest) { URL.revokeObjectURL(cache.current.get(oldest)!); cache.current.delete(oldest); }
        }
        setSource(fetchedSource);
      }
      if (requestId !== generation.current) return 'cancelled';
      loading.current = false;
      audio.src = url;
      if (pauseRequested.current) { setStatus('paused'); return 'paused'; }
      try { await audio.play(); if (requestId !== generation.current) return 'cancelled'; if (pauseRequested.current) { audio.pause(); setStatus('paused'); return 'paused'; } setStatus('playing'); request.onStart?.(); return 'playing'; }
      catch (cause) {
        if (requestId !== generation.current) return 'cancelled';
        if (cause instanceof DOMException && cause.name === 'NotAllowedError') { setStatus('ready'); setError('Audio is ready. Your browser requires another click: press Play audio.'); return 'ready'; }
        else { discardFailedClip(); throw new Error('Playback failed. Check your browser audio support and retry.'); }
      }
    } catch (cause) {
      if (requestId !== generation.current || abort.signal.aborted) return 'cancelled';
      loading.current = false;
      setStatus('error'); setError(cause instanceof Error ? cause.message : 'Audio could not be generated. Please retry.');
      return 'error';
    }
  }
  function pause() { pauseRequested.current = true; element.current?.pause(); setStatus('paused'); }
  async function resume() {
    const audio = element.current;
    pauseRequested.current = false;
    if (loading.current) { setStatus('loading'); return; }
    if (!audio?.src) return;
    if (audio.ended) audio.currentTime = 0;
    const requestId = generation.current;
    try { await audio.play(); if (requestId !== generation.current) return; if (pauseRequested.current) { audio.pause(); return; } setError(null); setStatus('playing'); lastRequest.current?.onStart?.(); }
    catch { if (requestId !== generation.current) return; setStatus('ready'); setError('Press Play audio to allow browser playback, and check that this tab is permitted to play sound.'); lastRequest.current?.onBlocked?.(); }
  }
  function retry() { if (lastRequest.current) void play(lastRequest.current); }
  function setVolume(value: number) { const level = Math.min(1, Math.max(0, value)); setVolumeState(level); getElement().volume = level; }
  return { status, error, source, roundTripMs, duration, currentTime, volume, input, play, prepare, pause, resume, retry, stop, setVolume };
}
export type BulbulAudio = ReturnType<typeof useBulbulAudio>;
