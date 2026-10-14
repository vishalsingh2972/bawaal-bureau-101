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

## Current build: Phase 3 — three cinematic, playable cases

Three tiny disasters escalate through real Bulbul voice performances, automatically advancing only when each clip ends. The active case takes over the screen: incoming dispatch, officer cards, Hindi/Hinglish subtitles, investigation, command escalation, a red breaking-news takeover and a ridiculous official verdict. Pause/resume, restart, replay, close and volume controls are included. Space pauses/resumes, R restarts and Escape closes the case when focus is outside an input/button. Captions align to whole dialogue clips; there is no claimed word alignment. Browser autoplay restrictions expose an explicit **Play audio** button.

The repository includes **18 authentic generated Sarvam MP3s** and a matching manifest. The flagship biscuit story contains **47.160 seconds** of measured audio; Bas 5 Minute contains 39.720 seconds and Mummy Used My Full Name contains 40.056 seconds. Browser startup/loading can add a small amount to these clip totals. Actor/persona changes are real TTS casting, not browser pitch/speed effects. Missing/stale clips fall back to live server synthesis. No speechSynthesis or placeholder audio is used. The user confirmed the Phase 2 real TTS test passed.

### Play a case

Click **DISPATCH THIS CASE** on any case file. The first clip loads immediately while remaining pre-generated clips warm into browser memory. One reusable audio element prevents overlapping clips. Pausing while loading also prevents the downloaded clip from starting until you resume. Errors keep the current beat available for retry; case switching/restart/close invalidate stale callbacks and cancel pending requests. Verdicts appear only after the final line finishes.

For clean recordings, run `npm run build` then `npm start` to avoid Next.js development indicators. Use a 390px portrait viewport or a landscape browser window. Voice Lab and live custom incidents remain Phase 4.

### Test real audio

1. Add your actual `SARVAM_API_KEY` to `.env.local` at the repo root.
2. Stop the existing dev server with Ctrl+C, then run `npm run dev` (`npm.cmd run dev` on PowerShell if needed).
3. Open http://localhost:3000 and click the **Test Bulbul audio** link beneath the main CTA, then **Test Bulbul**.
4. Wait for the MP3 download. You should hear Aparna deliver the biscuit emergency line. If the browser requires a second click, press **Play audio**. Try pause, resume, volume and replay.
5. In browser DevTools → Network, the first **Test Bulbul** request to `POST /api/tts` should return **200**, **audio/mpeg**. Case playback normally fetches committed `/audio/*.mp3` files instead. No API key should appear in browser requests. Network round-trip is not model time-to-first-audio.

Without a key, live generation shows a clear setup message (HTTP 503); committed preset cases still play. Invalid input returns HTTP 400. An invalid key, account quota problem, timeout or upstream outage produces a helpful error and a retry button. Do not paste your key into chat.

### Generate preset audio

After your real-audio test succeeds:

```sh
npm run generate:audio -- --case biscuit
# Or generate all 18 preset lines:
npm run generate:audio
```

The script reads `.env.local`, synthesizes sequentially, skips valid existing clips matching the current text/voice/pace, and saves real MP3s plus `public/audio/manifest.json`. It stops on the first failure without an automatic retry loop; rerun it to resume. Audio files use configuration fingerprints so changed scripts regenerate. Playback prefers matching generated files; missing, damaged or stale clips use `/api/tts`. Replays cache MP3s in browser memory (up to 32 clips, cleared when the page closes). Generating uses your Sarvam credits. All included audio was generated with the configured V4 personas.

Optional local measurement: with FFmpeg/ffprobe installed, run `node scripts/measure-audio.mjs` to verify full MP3 decoding and update measured durations in the manifest. FFmpeg is not required to run the app or generate speech.

### API architecture

`browser → POST /api/tts → api.sarvam.ai/text-to-speech → base64 decode on server → audio/mpeg → HTMLAudioElement`.

The model is fixed to `bulbul:v4-flash`, at 24,000 Hz, MP3. The route accepts either `{ "sceneId": "biscuit-01" }` or `{ "text": "...", "speaker": "aparna_hi_customer", "language_code": "hi-IN", "pace": 0.95 }`. It allows only configured persona/language pairs, 1–200 plain-text characters and pace 0.5–2.0. No SSML, pitch, loudness, preprocessing switch or client-specified model is accepted. Request size is bounded at 4 KB and Sarvam has a 30-second timeout. Upstream bodies and the credential are never returned to clients.

Basic in-memory rate limits: 12 live/custom requests per minute per client, 36 preset requests per minute per client, and 120 total requests per minute per process. These reset on server restart and are not shared across instances; deployment should use trusted proxy IP headers and platform rate limits for larger public traffic. Cross-origin browser requests are rejected. REST waits for the entire MP3; streaming is intentionally omitted.

Persona casting: Aparna `aparna_hi_customer`; Shubh `shubh_enhi_banking`; Ratan `ratan_hi_customer_expressive`; Simran `simran_hi_news_breaking`; Ashok `ashok_hi_news`. All preset lines use `hi-IN`; cast quality awaits a live audition.

Official contract: [Sarvam REST reference](https://docs.sarvam.ai/api-reference/text-to-speech/convert), [persona catalog](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices).

## Structure

- `src/app`: Next.js App Router and global visual theme.
- `src/components/bureau.tsx`: landing, case files, preview console.
- `src/components/case-console.tsx`: cinematic officer/broadcast/verdict presentation.
- `src/lib/incidents.ts`: scripted dialogue and verdicts.
- `src/lib/voices.ts`: Sarvam V4 persona IDs, language and pace.
- `src/lib/types.ts`: shared strict data contracts.
- `src/lib/tts.ts`: shared TTS validator and manifest contracts.
- `src/lib/server`: Sarvam fetch/decode and request budgets.
- `src/app/api/tts/route.ts`: server-only REST endpoint.
- `src/hooks/use-bulbul-audio.ts`: cancellable single-player audio lifecycle and cache.
- `src/lib/case-director.ts`: event-driven story sequencing with stale-event cancellation.
- `src/hooks/use-case-playback.ts`: React adapter for the story director.
- `scripts/generate-audio.ts`: real preset clip generation.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:tts
npm run test:playback
npm run build
```

## Planned phases

2. Complete: real Bulbul V4 Flash TTS integration; user confirmed live audio works.
3. Implemented: sequential cinematic playback, all preset MP3s and measured flagship duration.
4. Deterministic custom incidents and voice-style/pace comparison.
5. Full QA, deployment instructions and submission assets.

This is entertainment, not an official government service or emergency helpline. Made with Sarvam AI · Bulbul V4 Flash.
