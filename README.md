# Bawaal Bureau

**Chhoti si problem. National level bawaal.** A fictional, parody Indian crisis room for tiny everyday disasters. Built for the Sarvam Bulbul Build Challenge.

## Quickstart

Requires Node.js 22.17+ and npm (the generation script uses Node's native TypeScript stripping).

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`; copy the env file with `Copy-Item .env.example .env.local` only if you do not already have one.

Add `SARVAM_API_KEY=your_key_here` to `.env.local`. Never commit that file or prefix the key with `NEXT_PUBLIC_`. Existing local env files are preserved. Restart the dev server after adding or changing the key.

## Current build: Phase 2 — audio integration ready for your test

Responsive control-room home, three complete six-beat scripts, configured V4 persona IDs, and an interactive **manual text preview**. **Test Bulbul** makes a real server-side Sarvam request and plays the returned MP3. Open any case and press **Play this Bulbul line** to audition its current voice; pause/resume, replay, retry, stop and volume controls are available. Only one audio element plays at a time. No browser speech synthesis or placeholder audio is used. Full automatic cinematic audio sequencing follows in Phase 3; preview timers are illustrative, not measured speech durations.

### Test real audio

1. Add your actual `SARVAM_API_KEY` to `.env.local` at the repo root.
2. Stop the existing dev server with Ctrl+C, then run `npm run dev` (`npm.cmd run dev` on PowerShell if needed).
3. Open http://localhost:3000 and click the **Test Bulbul audio** link beneath the main CTA, then **Test Bulbul**.
4. Wait for the MP3 download. You should hear Aparna deliver the biscuit emergency line. If the browser requires a second click, press **Play audio**. Try pause, resume, volume and replay.
5. In browser DevTools → Network, `POST /api/tts` should return **200**, **audio/mpeg**. No API key should appear in the browser request. The UI displays network round-trip, not model time-to-first-audio.

Without a key, the button shows a clear setup message (HTTP 503). Invalid input returns HTTP 400. An invalid key, account quota problem, timeout or upstream outage produces a helpful error and a retry button. Actual Sarvam voice quality and browser playback remain unverified until your live test. Do not paste your key into chat.

### Generate preset audio

After your real-audio test succeeds:

```sh
npm run generate:audio -- --case biscuit
# Or generate all 18 preset lines:
npm run generate:audio
```

The script reads `.env.local`, synthesizes sequentially, skips valid existing clips matching the current text/voice/pace, and saves real MP3s plus `public/audio/manifest.json`. It stops on the first failure without an automatic retry loop; rerun it to resume. Audio files use configuration fingerprints so changed scripts regenerate. Playback prefers matching generated files; missing, damaged or stale clips use `/api/tts`. Replays cache MP3s in browser memory (up to 32 clips, cleared when the page closes). Generating uses your Sarvam credits; no clips have been generated without a key.

### API architecture

`browser → POST /api/tts → api.sarvam.ai/text-to-speech → base64 decode on server → audio/mpeg → HTMLAudioElement`.

The model is fixed to `bulbul:v4-flash`, at 24,000 Hz, MP3. The route accepts either `{ "sceneId": "biscuit-01" }` or `{ "text": "...", "speaker": "aparna_hi_customer", "language_code": "hi-IN", "pace": 0.95 }`. It allows only configured persona/language pairs, 1–200 plain-text characters and pace 0.5–2.0. No SSML, pitch, loudness, preprocessing switch or client-specified model is accepted. Request size is bounded at 4 KB and Sarvam has a 30-second timeout. Upstream bodies and the credential are never returned to clients.

Basic in-memory rate limits: 12 live/custom requests per minute per client, 36 preset requests per minute per client, and 120 total requests per minute per process. These reset on server restart and are not shared across instances; deployment should use trusted proxy IP headers and platform rate limits for larger public traffic. Cross-origin browser requests are rejected. REST waits for the entire MP3; streaming is intentionally omitted.

Persona casting: Aparna `aparna_hi_customer`; Shubh `shubh_enhi_banking`; Ratan `ratan_hi_customer_expressive`; Simran `simran_hi_news_breaking`; Ashok `ashok_hi_news`. All preset lines use `hi-IN`; cast quality awaits a live audition.

Official contract: [Sarvam REST reference](https://docs.sarvam.ai/api-reference/text-to-speech/convert), [persona catalog](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices).

## Structure

- `src/app`: Next.js App Router and global visual theme.
- `src/components/bureau.tsx`: landing, case files, preview console.
- `src/lib/incidents.ts`: scripted dialogue and verdicts.
- `src/lib/voices.ts`: Sarvam V4 persona IDs, language and pace.
- `src/lib/types.ts`: shared strict data contracts.
- `src/lib/tts.ts`: shared TTS validator and manifest contracts.
- `src/lib/server`: Sarvam fetch/decode and request budgets.
- `src/app/api/tts/route.ts`: server-only REST endpoint.
- `src/hooks/use-bulbul-audio.ts`: cancellable single-player audio lifecycle and cache.
- `scripts/generate-audio.ts`: real preset clip generation.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:tts
npm run build
```

## Planned phases

2. Implemented: real Bulbul V4 Flash TTS integration, clip generation and audio caching; awaiting the user's live audio verification.
3. Sequential cinematic playback and measured flagship duration.
4. Deterministic custom incidents and voice-style/pace comparison.
5. Full QA, deployment instructions and submission assets.

This is entertainment, not an official government service or emergency helpline. Made with Sarvam AI · Bulbul V4 Flash.
