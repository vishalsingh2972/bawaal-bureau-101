# Bawaal Bureau — build progress

## Phase 1 — Foundation

Implemented: Next.js App Router, TypeScript, Tailwind CSS, Lucide; control-room theme and SVG wordmark icon; responsive incident files; CSS radar, siren pulse and status board; strict shared scene/voice types; three complete six-scene comedy scripts (18 planned audio clips); interactive text-only dispatch preview with per-line subtitles, pause/resume, next beat, restart, event log and final verdict. Reduced-motion styles, native keyboard-accessible buttons and visible focus states included.

Setup: `.env.example`, `.gitignore`, locked npm dependencies and README quickstart. Existing `.env.local` preserved and confirmed ignored by Git. No git commit or push performed.

Checks: TypeScript passes; production build passes; local dev server ready at http://127.0.0.1:3000; HTTP 200 and expected hero/case/preview content confirmed. ESLint source/config check passes with no errors; initial anonymous-default-export warning corrected. No browser automation tool is available: visual appearance, 390px behavior and interactive click paths still need browser QA. Text preview timing is illustrative, not measured audio duration.

Dependency audit: five high findings in the development-only ESLint chain (`braces` → `micromatch` → `fast-glob` → Next ESLint tooling). Audit suggests an incompatible Next ESLint downgrade; no forced downgrade applied. Revisit in final QA. No audio or Sarvam API requests exist in Phase 1.

## Phase 2 — Real Sarvam audio integration implemented; awaiting live verification

Implemented: server-only `POST /api/tts`, fixed `bulbul:v4-flash` model, 24 kHz MP3, explicit persona/language/pace/plain-text validation, 4 KB request cap, 200-character text limit, same-origin browser checks, basic in-memory per-client/global rate limits, 30-second upstream timeout, safe auth/quota/network/timeout errors and server-side base64 decoding. No unsupported V4 controls, SSML, browser speech synthesis or streaming claims.

UI: **Test Bulbul audio** shortcut below the hero CTA, **Test Bulbul** button, real MP3 playback, pause/resume/replay/stop/retry and volume; precise network-round-trip label and measured browser clip duration. Case previews can audition each configured persona using **Play this Bulbul line**. One audio element prevents overlaps; superseded fetches are cancelled; browser session cache retains up to 32 clips. Generated preset files are preferred only when manifest configuration matches; failed preset decoding can fall back to live synthesis on retry. Automatic cinematic sequencing remains Phase 3.

Generation: `npm run generate:audio -- --case biscuit` (six flagship clips) or `npm run generate:audio` (all eighteen). Reads `.env.local`, emits fingerprinted MP3 files and incremental manifest, skips valid matching clips, stops on first failure. Requires Node 22.17+ for native TypeScript stripping. Empty manifest committed; no real or placeholder audio generated.

Verification: nine unit tests pass (all scripts validate, exact REST contract/base64 transport with clearly marked non-speech fixtures, upstream error privacy, timeout/cancellation, validation and request budgets). Twelve HTTP checks pass against a production server explicitly forced to a placeholder key: missing-key live/preset 503, invalid persona/language/pace/text/scene/model/JSON 400, oversized body 413, cross-origin 403 and GET 405. Generator missing-key failure verified. Lint, TypeScript and production build pass. `.env.local` remains Git-ignored. Browser interaction and actual Sarvam audio are unverified, as requested; no real API request made. Background dev/test servers stopped so the user can restart personally.

Next action belongs to the user: add `SARVAM_API_KEY=your_actual_key` to root `.env.local`, run `npm.cmd run dev`, open http://localhost:3000, click the hero **Test Bulbul audio** link then **Test Bulbul**. If browser autoplay blocks the downloaded MP3, click **Play audio**. Check pause/resume/replay/volume and Network → `/api/tts` → 200 `audio/mpeg`. Never share the key in chat.

**Phase 3 is blocked on the user's explicit confirmation that real Bulbul audio works.** Commit suggestion: `feat: integrate secure Bulbul TTS and audio testing`. No commit/push performed.

## Next: Phase 3 — The cinematic experience (after live audio confirmation)

Implement actual sequential case playback with end-of-clip advancement, synchronized per-line subtitles and role switches; tune the biscuit case to a measured 45–55 seconds and pre-generate presets only after the user confirms the key works. Official Sarvam REST/persona docs and local Next.js route/env guides have already been read; no redundant lookup needed.

Pause here for the user's live-audio test and manual commit/push. A `NEXT` alone must not bypass the real-audio confirmation requirement.
