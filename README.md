# Bawaal Bureau

**Chhoti si problem. National level bawaal.** A fictional, parody Indian crisis room for tiny everyday disasters. Built for the Sarvam Bulbul Build Challenge.

## Quickstart

Requires Node.js 20.9+ and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`; copy the env file with `Copy-Item .env.example .env.local` only if you do not already have one.

Add `SARVAM_API_KEY=your_key_here` to `.env.local`. Never commit that file. The key is reserved for server-side use in Phase 2. Existing local env files are preserved.

## Current build: Phase 1

Responsive control-room home, three complete six-beat scripts, verified persona configuration, and an interactive **text-only preview** with pause, resume, restart, next beat, case verdict and case switching. This phase has no audio API and makes no claim to play generated speech. Preview timings are illustrative; final duration will be measured using real audio.

## Structure

- `src/app`: Next.js App Router and global visual theme.
- `src/components/bureau.tsx`: landing, case files, preview console.
- `src/lib/incidents.ts`: scripted dialogue and verdicts.
- `src/lib/voices.ts`: Sarvam V4 persona IDs, language and pace.
- `src/lib/types.ts`: shared strict data contracts.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
```

## Planned phases

2. Secure real Bulbul V4 Flash TTS, clip generation and audio caching.
3. Sequential cinematic playback and measured flagship duration.
4. Deterministic custom incidents and voice-style/pace comparison.
5. Full QA, deployment instructions and submission assets.

This is entertainment, not an official government service or emergency helpline. Made with Sarvam AI · Bulbul V4 Flash (audio integration pending).
