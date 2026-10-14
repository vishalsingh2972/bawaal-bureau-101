import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regionalRelay } from '../src/lib/regional-relay.ts';
import { sceneRequest, CaseDirector, type CaseAudio } from '../src/lib/case-director.ts';
import { validateTtsInput, inputKey } from '../src/lib/tts.ts';
import { readFileSync } from 'node:fs';
import type { AudioManifest } from '../src/lib/tts.ts';
test('five newsrooms have native script, translations and exact approved persona/language pairs', () => {
  assert.deepEqual(regionalRelay.scenes.map(scene => scene.voice?.speaker), ['simran_hi_news_breaking', 'tarun_te_narration', 'gokul_ta_narration', 'soham_mr_narration', 'roopa_bn_conversational']);
  assert.deepEqual(regionalRelay.scenes.map(scene => scene.voice?.language), ['hi-IN', 'te-IN', 'ta-IN', 'mr-IN', 'bn-IN']);
  const scripts = [/[\u0900-\u097f]/u, /[\u0c00-\u0c7f]/u, /[\u0b80-\u0bff]/u, /[\u0900-\u097f]/u, /[\u0980-\u09ff]/u];
  for (const [index, scene] of regionalRelay.scenes.entries()) {
    const request = sceneRequest(regionalRelay, index);
    assert.ok(scripts[index].test(scene.text)); assert.ok(scene.english && scene.city);
    assert.equal(inputKey(validateTtsInput(request.input)), inputKey(request.input));
  }
});
test('all five genuine MP3 files match the scene configs and last 20–30 seconds in total', () => {
  const manifest = JSON.parse(readFileSync('public/audio/manifest.json', 'utf8')) as AudioManifest;
  let total = 0;
  for (const [index, scene] of regionalRelay.scenes.entries()) {
    const entry = manifest.clips[scene.id]; assert.ok(entry);
    assert.equal(inputKey(entry.input), inputKey(sceneRequest(regionalRelay, index).input));
    assert.equal(readFileSync(`public${entry.file}`).length, entry.bytes);
    assert.ok(entry.durationSeconds); total += entry.durationSeconds;
  }
  assert.ok(total >= 20 && total <= 30, `relay duration ${total}`);
});
test('the unchanged director advances through five regional audio-ended events, then verdict', async () => {
  const requests: Parameters<CaseAudio['play']>[0][] = [];
  const audio: CaseAudio = { async play(request) { requests.push(request); request.onStart?.(); return 'playing'; }, async prepare() {}, pause() {}, async resume() {}, stop() {} };
  const director = new CaseDirector(audio, () => {}); director.start(regionalRelay);
  for (let index = 0; index < 5; index++) { assert.equal(director.state.index, index); requests[index].onEnded?.(); await new Promise(resolve => setTimeout(resolve, 0)); }
  assert.equal(director.state.status, 'verdict'); assert.equal(requests.length, 5);
});
