import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { incidents } from '../src/lib/incidents.ts';
import { regionalRelay } from '../src/lib/regional-relay.ts';
import { voices } from '../src/lib/voices.ts';
import { inputKey, isMp3, TTS_MODEL, validateTtsInput, type AudioManifest } from '../src/lib/tts.ts';
import { requireSarvamKey, synthesizeSpeech } from '../src/lib/server/sarvam.ts';

async function main() {
  try { loadEnvFile(resolve('.env.local')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const key = requireSarvamKey();
  const args = process.argv.slice(2);
  const caseIndex = args.indexOf('--case');
  const selection = caseIndex >= 0 ? args[caseIndex + 1] : undefined;
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--case' || !selection)) throw new Error('Usage: npm run generate:audio -- [--case biscuit|five-minutes|full-name|pan-india]');
  const catalog = [...incidents, regionalRelay];
  const cases = selection ? catalog.filter(incident => incident.id === selection) : catalog;
  if (!cases.length) throw new Error('Unknown case. Choose biscuit, five-minutes, full-name, or pan-india.');
  const directory = resolve('public/audio'); await mkdir(directory, { recursive: true });
  const manifestPath = resolve(directory, 'manifest.json');
  let manifest: AudioManifest = { model: TTS_MODEL, sampleRate: 24000, codec: 'mp3', clips: {} };
  try {
    const existing = JSON.parse(await readFile(manifestPath, 'utf8')) as AudioManifest;
    if (existing.model === TTS_MODEL && existing.sampleRate === 24000 && existing.codec === 'mp3' && existing.clips) manifest = existing;
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.log('Rebuilding missing or invalid audio manifest.'); }
  const scenes = cases.flatMap(incident => incident.scenes);
  console.log(`Bulbul V4 Flash: ${scenes.length} clips; sequential requests; no automatic retry loop.`);
  for (const [index, scene] of scenes.entries()) {
    const voice = scene.voice ?? voices[scene.role];
    const input = validateTtsInput({ text: scene.text, speaker: voice.speaker, language_code: voice.language, pace: voice.pace });
    const fingerprint = createHash('sha256').update(inputKey(input)).digest('hex').slice(0, 12);
    const filename = `${scene.id}-${fingerprint}.mp3`;
    const filepath = resolve(directory, filename);
    const entry = manifest.clips[scene.id];
    try {
      const bytes = await readFile(filepath);
      if (entry?.file === `/audio/${filename}` && inputKey(entry.input) === inputKey(input) && entry.bytes === bytes.length && isMp3(bytes)) { console.log(`[${index + 1}/${scenes.length}] ${scene.id}: valid existing clip; skipped.`); continue; }
    } catch { /* Generate missing or invalid clip. */ }
    console.log(`[${index + 1}/${scenes.length}] ${scene.id}: ${voice.speaker}, pace ${voice.pace}...`);
    const started = performance.now();
    const audio = await synthesizeSpeech(input, { key });
    await writeFile(`${filepath}.tmp`, audio); await rename(`${filepath}.tmp`, filepath);
    manifest.clips[scene.id] = { file: `/audio/${filename}`, input, bytes: audio.length, generatedAt: new Date().toISOString() };
    await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`); await rename(`${manifestPath}.tmp`, manifestPath);
    console.log(`  Saved ${audio.length} bytes; network round-trip ${( (performance.now() - started) / 1000).toFixed(2)} s.`);
  }
  console.log('Done. Clips and manifest are in public/audio. These are real Sarvam files; review them before recording.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Audio generation failed.'); process.exitCode = 1; });
