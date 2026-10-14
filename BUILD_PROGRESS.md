# Bawaal Bureau — build progress

## Phase 1 — Foundation

Implemented: Next.js App Router, TypeScript, Tailwind CSS, Lucide; control-room theme and SVG wordmark icon; responsive incident files; CSS radar, siren pulse and status board; strict shared scene/voice types; three complete six-scene comedy scripts (18 planned audio clips); interactive text-only dispatch preview with per-line subtitles, pause/resume, next beat, restart, event log and final verdict. Reduced-motion styles, native keyboard-accessible buttons and visible focus states included.

Setup: `.env.example`, `.gitignore`, locked npm dependencies and README quickstart. Existing `.env.local` preserved and confirmed ignored by Git. No git commit or push performed.

Checks: TypeScript passes; production build passes; local dev server ready at http://127.0.0.1:3000; HTTP 200 and expected hero/case/preview content confirmed. ESLint source/config check passes with no errors; initial anonymous-default-export warning corrected. No browser automation tool is available: visual appearance, 390px behavior and interactive click paths still need browser QA. Text preview timing is illustrative, not measured audio duration.

Dependency audit: five high findings in the development-only ESLint chain (`braces` → `micromatch` → `fast-glob` → Next ESLint tooling). Audit suggests an incompatible Next ESLint downgrade; no forced downgrade applied. Revisit in final QA. No audio or Sarvam API requests exist in Phase 1.

## Next: Phase 2 — Real Sarvam audio

Verify the official REST docs once; implement validated server-only TTS, timeout/upstream errors, browser audio/caching and predefined clip-generation script. Preserve the configured V4 persona IDs. Read the Next.js API route guide bundled in `node_modules/next/dist/docs` before implementing routes, per the generated root `AGENTS.md`.

User setup: put `SARVAM_API_KEY=your_key_here` in `.env.local` (no `NEXT_PUBLIC_` prefix). Never paste the key into chat. Once available, audition and generate the biscuit case. Pause here for the user's manual commit/push and `NEXT`.
