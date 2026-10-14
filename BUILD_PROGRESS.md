# Bawaal Bureau — build progress

## Phase 1 — Foundation

Implemented: Next.js App Router, TypeScript, Tailwind CSS, Lucide; control-room theme and SVG wordmark icon; responsive incident files; CSS radar, siren pulse and status board; strict shared scene/voice types; three complete six-scene comedy scripts (18 planned audio clips); interactive text-only dispatch preview with per-line subtitles, pause/resume, next beat, restart, event log and final verdict. Reduced-motion styles, native keyboard-accessible buttons and visible focus states included.

Setup: `.env.example`, `.gitignore`, locked npm dependencies and README quickstart. Existing `.env.local` preserved and confirmed ignored by Git. No git commit or push performed.

Checks: TypeScript passes; production build passes; local dev server ready at http://127.0.0.1:3000; HTTP 200 and expected hero/case/preview content confirmed. ESLint source/config check passes with no errors; initial anonymous-default-export warning corrected. No browser automation tool is available: visual appearance, 390px behavior and interactive click paths still need browser QA. Text preview timing is illustrative, not measured audio duration.

Dependency audit: five high findings in the development-only ESLint chain (`braces` → `micromatch` → `fast-glob` → Next ESLint tooling). Audit suggests an incompatible Next ESLint downgrade; no forced downgrade applied. Revisit in final QA. No audio or Sarvam API requests exist in Phase 1.

## Phase 2 — Real Sarvam audio integration complete; user verified live audio

User confirmed actual Bulbul V4 Flash Hindi/Hinglish speech played successfully and explicitly authorized Phase 3. The following Phase 2 verification notes record the checks performed before that user confirmation.

Implemented: server-only `POST /api/tts`, fixed `bulbul:v4-flash` model, 24 kHz MP3, explicit persona/language/pace/plain-text validation, 4 KB request cap, 200-character text limit, same-origin browser checks, basic in-memory per-client/global rate limits, 30-second upstream timeout, safe auth/quota/network/timeout errors and server-side base64 decoding. No unsupported V4 controls, SSML, browser speech synthesis or streaming claims.

UI: **Test Bulbul audio** shortcut below the hero CTA, **Test Bulbul** button, real MP3 playback, pause/resume/replay/stop/retry and volume; precise network-round-trip label and measured browser clip duration. Case previews can audition each configured persona using **Play this Bulbul line**. One audio element prevents overlaps; superseded fetches are cancelled; browser session cache retains up to 32 clips. Generated preset files are preferred only when manifest configuration matches; failed preset decoding can fall back to live synthesis on retry. Automatic cinematic sequencing remains Phase 3.

Generation: `npm run generate:audio -- --case biscuit` (six flagship clips) or `npm run generate:audio` (all eighteen). Reads `.env.local`, emits fingerprinted MP3 files and incremental manifest, skips valid matching clips, stops on first failure. Requires Node 22.17+ for native TypeScript stripping. Empty manifest committed; no real or placeholder audio generated.

Verification: nine unit tests pass (all scripts validate, exact REST contract/base64 transport with clearly marked non-speech fixtures, upstream error privacy, timeout/cancellation, validation and request budgets). Twelve HTTP checks pass against a production server explicitly forced to a placeholder key: missing-key live/preset 503, invalid persona/language/pace/text/scene/model/JSON 400, oversized body 413, cross-origin 403 and GET 405. Generator missing-key failure verified. Lint, TypeScript and production build pass. `.env.local` remains Git-ignored. Browser interaction and actual Sarvam audio are unverified, as requested; no real API request made. Background dev/test servers stopped so the user can restart personally.

Next action belongs to the user: add `SARVAM_API_KEY=your_actual_key` to root `.env.local`, run `npm.cmd run dev`, open http://localhost:3000, click the hero **Test Bulbul audio** link then **Test Bulbul**. If browser autoplay blocks the downloaded MP3, click **Play audio**. Check pause/resume/replay/volume and Network → `/api/tts` → 200 `audio/mpeg`. Never share the key in chat.

User confirmation received; Phase 3 unlocked. Phase 2 commit suggestion: `feat: integrate secure Bulbul TTS and audio testing`. No agent commit/push performed.

## Phase 3 — The cinematic experience complete

Implemented: all three cases play automatically through six genuine voice clips. Case files dispatch directly into a focused cinematic console. The revised biscuit opening declares the chai a crime scene immediately; Aparna takes the call, Shubh files the investigation, Ratan commands the spoon rescue, Simran takes over a red breaking-news broadcast about a second biscuit entering danger, and Ashok closes the case with an evidence-destruction verdict. Role-specific colors/icons/settings, per-line Hindi/Hinglish captions, media-time progress, actual clip-start event logs, waveform styling and a stamped final verdict are included.

Architecture: a small event-driven `CaseDirector` advances only on real `HTMLAudioElement` ended events. One retained audio element prevents overlaps; cancellation tokens protect restart/close/case switches. Pause/resume work during both playback and loading. Errors retain the current line for retry; browser autoplay rejection exposes Play audio. Later preset clips warm in the background without speculative live API calls. Final-screen Replay and File another emergency work. Keyboard Space/R/Escape controls and reduced-motion CSS are included. The existing Test Bulbul live REST integration is preserved.

Real assets: generated all 18 authentic `bulbul:v4-flash` MP3 files with the configured key; saved under `public/audio` with current configuration fingerprints and manifest. All 18 pass FFmpeg full decoding and ffprobe MP3/24,000 Hz checks. Measured audio totals: biscuit **47.160s**, five-minutes **39.720s**, full-name **40.056s**. Production browser biscuit playback at normal speed measured **47.93s including transitions**. Total MP3 size is about 2 MB. No placeholder speech, browser synthesis or production playback-rate manipulation exists.

QA passed: lint without warnings, TypeScript, production build, nine TTS unit tests and nine director tests. Native installed Chrome/CDP (no added dependencies) verifies genuine playback, caption changes, pause/resume with a frozen media position, volume, restart, replay, keyboard pause, six-scene progression, final verdict after the final ended event, only one audio element, all three cases, and return to the case list with no runtime exceptions. The biscuit duration test used normal playback; the remaining sequence regression runs use explicitly test-only accelerated playback. Public presets passed against a production server with a placeholder key, confirming preset playback needs no live credential. Server key scanning found zero matches in 31 client/public files. `.env.local` remains ignored.

Responsive/recording QA: inspected actual browser screenshots at 390px mobile width, 390×694 (approximately 9:16) and 1440×810 (16:9). No horizontal overflow; the portrait news captions, pause/restart and volume controls stay in frame. Short viewports receive compact console framing. Screenshots and browser profiles are development-only ignored `.qa/` artifacts. Optional QA scripts: `node scripts/measure-audio.mjs` (FFmpeg installed) and `node scripts/qa-cinematic.mjs <running-local-url>` (installed Chrome; optional CHROME_PATH). Chrome confirms decoding/playback, not a human subjective assessment of every voice performance; the user can review comedy/casting while recording. Safari/iOS autoplay behavior has not been independently tested.

README updated for playable cases, measured duration, clip generation, architecture and clean production recording (`npm run build` then `npm start`). Agent-owned QA servers are stopped after verification; the user's own server is untouched. No commit or push performed.

## Next: Phase 4 — Model showcase

Implement deterministic custom incident broadcasts, same-text Simran conversation/breaking style comparison, pace presets through real TTS, and numerical/Hinglish pronunciation samples. Keep all three completed case flows intact. Optional Tamil/streaming only if safe within time; REST is the reliable baseline. Official Sarvam REST/persona docs and local Next.js route/env guides have already been read; no redundant lookup needed.

Pause for the user's manual commit/push and `NEXT`. Suggested Phase 3 commit: `feat: ship cinematic cases with real Bulbul audio`.
