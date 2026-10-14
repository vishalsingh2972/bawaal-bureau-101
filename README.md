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

Fresh clone: run `npm ci` with the committed lockfile. All included preset and relay MP3s play without a key; add your own key for Test Bulbul, transcription, AI generation and appeals.

Add `SARVAM_API_KEY=your_key_here` to `.env.local`. Never commit that file or prefix the key with `NEXT_PUBLIC_`. Existing local env files are preserved. Restart the dev server after adding or changing the key.

## Launch build — cinematic comedy, live AI and Pan-India relay

**PAN-INDIA ESCALATION 🌏** spreads the same biscuit disaster through five fictional newsrooms in **27.336 seconds of authentic Bulbul audio** (27.57 seconds in the verified production browser run). It is a special **fixed scripted showcase**, with one native-script line per newsroom, English translations, five-stage progress and cached replay. Launch it from the prominent card above Live AI Desk or from the original biscuit verdict. It uses the existing single-element playback director, not five LLM calls.

| Newsroom | Language | Verified, live-tested V4 persona | Pace |
| --- | --- | --- | --- |
| Delhi | Hindi `hi-IN` | `simran_hi_news_breaking` | 1.12 |
| Hyderabad | Telugu `te-IN` | `tarun_te_narration` | 1.1 |
| Chennai | Tamil `ta-IN` | `gokul_ta_narration` | 1.1 |
| Mumbai | Marathi `mr-IN` | `soham_mr_narration` | 1.1 |
| Kolkata | Bengali `bn-IN` | `roopa_bn_conversational` | 1.1 |

These IDs were checked against the official catalog and real API responses. Catalog-listed `vetri_ta_suspense` was rejected by the current V4 endpoint, so the shipped Tamil cast uses working `gokul_ta_narration`. All five clips passed full MP3 decoding at 24 kHz. There are **23 genuine clips** across the original cases and relay. The original 18 audio files and biscuit script remain unchanged.

The app supports these five languages in the fixed relay. **AI-generated custom cases and appeals remain Hindi/Hinglish**; no custom-language selector, 11-language app claim, streaming, full-duplex audio or unlimited conversation is implemented.

The three scripted showcases are preserved. The **Live AI Desk** adds typed or spoken tiny emergencies: **Saaras V4 → editable transcript → Sarvam 105B Conversations → four genuine Bulbul performances**. The AI writes a short personalized title, operator/investigator/news/commissioner dialogue and verdict. Fixed code chooses the existing persona IDs; the model cannot select voices. After a generated verdict, **OBJECT TO THIS VERDICT 🎙️** accepts one typed or recorded defence and generates one contextual commissioner comeback. Replaying the story or comeback reuses browser-cached audio and does not call the language model again.

### Try the live desk

1. Run `npm run dev` with your server-side key configured; open http://localhost:3000.
2. Below the case cards, select or type **Mummy ne mera poora naam le liya.** and click **Generate my bawaal**. Try **Mera ₹1 UPI payment pending hai.** as an unrelated complaint.
3. To speak, click **Speak Your Bawaal**, allow the microphone, speak one short sentence and click **Stop recording**. It also stops automatically at 10 seconds. Saaras returns real text into the editable field; inspect/correct it before generating. Typing always remains available. Microphone capture needs HTTPS or localhost and a MediaRecorder-compatible browser.
4. After the four live voices and verdict, replay the case. Then click **OBJECT TO THIS VERDICT 🎙️**, type/record one defence, and submit. One commissioner response plays; no unlimited conversation loop is provided.

Live routes use the same `SARVAM_API_KEY`: `/api/generate-crisis` calls `https://api.sarvam.ai/v1/chat/completions`, model `sarvam-105b-conversations`, strict structural JSON schema, 1,000 output tokens and a 25-second timeout. Output is independently validated for fields, lengths, plain text and native Hindi script. `/api/transcribe` accepts up to 2 MB multipart audio, strips recorder MIME codec parameters, and calls `/speech-to-text` with `saaras:v4`, `mode=codemix` and keyterms. `/api/appeal` produces one validated commissioner line from the complaint, verdict and defence. Complaints/defences are capped at 160 characters; TTS lines stay below 200. Live generation uses real paid calls; failures display an error and never substitute a template labelled as AI output.

Live endpoints each have six requests/minute/client and a shared 60/minute/process budget. These are basic in-memory budgets, not distributed protection. Same-origin checks support localhost/IP dev aliases and trusted reverse-proxy forwarding. No user recordings are stored by this application; the uploaded audio is sent to Sarvam for transcription. Voice Lab and HTTP streaming were skipped. Tamil is included in the fixed regional relay.

Actual real-API checks passed for two different personalized complaints, eight generated Bulbul lines, one contextual appeal and Saaras codemix transcription. Chrome browser QA passed microphone denial, MediaRecorder upload/transcription/editing, generated-case sequencing, appeal sequencing and zero-new-paid-call replay. Microphone QA used a virtual device fed authentic generated speech, not a human recording; physical device permission/quality and Safari still require manual verification.

Official contracts: [105B chat completions](https://docs.sarvam.ai/api-reference/chat/chat-completions-v1), [Saaras transcription](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe).

Three tiny disasters escalate through real Bulbul voice performances, automatically advancing only when each clip ends. The active case takes over the screen: incoming dispatch, officer cards, Hindi/Hinglish subtitles, investigation, command escalation, a red breaking-news takeover and a ridiculous official verdict. Pause/resume, restart, replay, close and volume controls are included. Space pauses/resumes, R restarts and Escape closes the case when focus is outside an input/button. Captions align to whole dialogue clips; there is no claimed word alignment. Browser autoplay restrictions expose an explicit **Play audio** button.

The repository includes **23 authentic generated Sarvam MP3s** and a matching manifest. The flagship biscuit story contains **47.160 seconds** of measured audio; Bas 5 Minute contains 39.720 seconds and Mummy Used My Full Name contains 40.056 seconds. Browser startup/loading can add a small amount to these clip totals. Actor/persona changes are real TTS casting, not browser pitch/speed effects. Missing/stale clips fall back to live server synthesis. No speechSynthesis or placeholder audio is used. The user confirmed the Phase 2 real TTS test passed.

### Play a case

Click **DISPATCH THIS CASE** on any case file. The first clip loads immediately while remaining pre-generated clips warm into browser memory. One reusable audio element prevents overlapping clips. Pausing while loading also prevents the downloaded clip from starting until you resume. Errors keep the current beat available for retry; case switching/restart/close invalidate stale callbacks and cancel pending requests. Verdicts appear only after the final line finishes.

For clean recordings, run `npm run build` then `npm start` to avoid Next.js development indicators. Use a 390px portrait viewport or a landscape browser window. The flagship remains the 47.93-second measured showcase; live generated stories vary in length.

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
# Generate only the five regional clips:
npm run generate:audio -- --case pan-india
# Or generate all 23 preset/relay lines:
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
npm run test:crisis
npm run test:relay
npm run build
```

These unit tests use transport fixtures only where needed; they do not generate paid speech. Optional real-API regression scripts under `scripts/check-live-ai.ts` and `scripts/qa-live-ai.mjs` make paid calls with your key. Browser scripts need installed Chrome, can accept `CHROME_PATH`, and keep QA artifacts under ignored `.qa/`.

## Screenshots and launch assets

![Bawaal Bureau breaking-news screen](public/screenshots/biscuit-news.png)

![Tamil newsroom with English translation](public/screenshots/relay-tamil.png)

- [Demo shot list](DEMO_SCRIPT.md): 85–90-second launch video, exact actions and honest editing guidance.
- [Submission copy](SOCIAL.md): X quote-post, LinkedIn, GitHub description and Discord template with your name/URL placeholders.
- [Build evidence](BUILD_PROGRESS.md): actual phase-by-phase checks, limits and remaining manual checks.

## Deploy and record

1. Manually commit/push all source files, `package-lock.json`, `public/audio/*.mp3`, the audio manifest and submission assets. Never add `.env.local`.
2. Use a Node-capable Next.js host with Node 22.17+; this app requires API routes and cannot use a static-only export. Build command: `npm run build`; start command for a Node service: `npm start`.
3. Configure `SARVAM_API_KEY` in the host's server environment, without a `NEXT_PUBLIC_` prefix. Allow outbound HTTPS to `api.sarvam.ai` and enough request execution time for the 25–30-second upstream timeouts. The exported route duration hints do not override every host's limits.
4. Deploy/restart manually, then test a preset, Pan-India relay, typed custom crisis, microphone and one appeal at the actual HTTPS URL. Microphone access requires HTTPS or localhost. Check error/retry behavior and ensure the browser never receives the API key.
5. Record from a production build, not `next dev`, to avoid dev overlays. Insert only your actual deployed/repo/demo URLs into SOCIAL.md and the video description. No deployment or submission has been performed by the agent.

No database or auth is required. Live features incur Sarvam API usage. The basic in-memory budgets reset on restart and are not shared across deployed instances; use the host's trusted proxy headers and edge rate limits for larger public traffic. App code does not persist recordings, complaints or generated stories.

Known limits: a catalog-listed Tamil persona was rejected and replaced by the working persona above; human microphone hardware and Safari/iOS still need device checks; comedy quality varies in generated stories; streaming, custom regional language selection and Voice Lab are intentionally omitted. Recorded network round-trip is not model time-to-first-audio. Development dependency audit findings in the ESLint glob chain remain documented in BUILD_PROGRESS.md; no forced incompatible downgrade was applied.

## Build phases

2. Complete: real Bulbul V4 Flash TTS integration; user confirmed live audio works.
3. Implemented: sequential cinematic playback, all preset MP3s and measured flagship duration.
4. Implemented: real 105B custom incidents, Saaras microphone transcription and a one-shot commissioner appeal. Optional Voice Lab/streaming skipped. Five-language scripted relay added for launch.
5. Complete: launch QA, five-language scripted relay, deployment instructions, screenshots, demo shot list and submission copy. Manual deployment/posting remains the user's responsibility.

This is entertainment, not an official government service or emergency helpline. Made with Sarvam AI · Bulbul V4 Flash.
