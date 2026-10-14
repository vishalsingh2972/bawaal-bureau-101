import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const manifestPath = resolve('public/audio/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const totals = {};
for (const [id, clip] of Object.entries(manifest.clips)) {
  const file = resolve('public', clip.file.slice(1));
  const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate', '-of', 'json', file], { encoding: 'utf8' }));
  if (metadata.streams[0]?.codec_name !== 'mp3' || metadata.streams[0]?.sample_rate !== '24000') throw new Error(`${id}: invalid codec/sample rate`);
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: ['ignore', 'pipe', 'pipe'] });
  clip.durationSeconds = Number(metadata.format.duration);
  if (!Number.isFinite(clip.durationSeconds) || clip.durationSeconds <= 0) throw new Error(`${id}: invalid duration`);
  const group = id.split('-')[0]; totals[group] = (totals[group] || 0) + clip.durationSeconds;
  console.log(`${id}: ${clip.durationSeconds.toFixed(3)} s, MP3 24 kHz, full decode passed`);
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
for (const [id, duration] of Object.entries(totals)) console.log(`${id}: total ${duration.toFixed(3)} s`);
