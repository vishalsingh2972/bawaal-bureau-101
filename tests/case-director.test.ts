import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CaseDirector, type CaseAudio } from '../src/lib/case-director.ts';
import { incidents } from '../src/lib/incidents.ts';
import type { AudioRequest, AudioStatus } from '../src/hooks/use-bulbul-audio.ts';
function harness() {
  const calls: AudioRequest[] = [];
  let result: AudioStatus = 'playing';
  let paused = 0; let stopped = 0;
  const audio: CaseAudio = {
    async play(request) { calls.push(request); if (result === 'playing') request.onStart?.(); return result; },
    async prepare() {}, pause() { paused++; },
    async resume() { calls.at(-1)?.onStart?.(); }, stop() { stopped++; },
  };
  const director = new CaseDirector(audio, () => {});
  return { director, calls, setResult(value: AudioStatus) { result = value; }, get paused() { return paused; }, get stopped() { return stopped; } };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
test('all three cases advance only on audio-ended, then finish with exactly six logged roles', async () => {
  for (const incident of incidents) {
    const h = harness(); h.director.start(incident); await tick();
    assert.equal(h.director.state.index, 0);
    for (let i = 0; i < incident.scenes.length; i++) {
      assert.equal(h.director.state.index, i);
      assert.equal(h.calls[i].sceneId, incident.scenes[i].id);
      h.calls[i].onEnded?.(); await tick();
    }
    assert.equal(h.director.state.status, 'verdict'); assert.equal(h.calls.length, incident.scenes.length);
    assert.equal(h.director.state.log.length, incident.scenes.length);
  }
});
test('pause and resume retain the same line instead of making another TTS request', async () => {
  const h = harness(); h.director.start(incidents[0]); await tick();
  h.director.pause(); assert.equal(h.director.state.status, 'paused'); assert.equal(h.paused, 1);
  h.director.resume(); await tick(); assert.equal(h.calls.length, 1); assert.equal(h.director.state.status, 'playing');
});
test('a late ended event while paused waits for explicit resume', async () => {
  const h = harness(); h.director.start(incidents[0]); await tick(); h.director.pause(); h.calls[0].onEnded?.();
  assert.equal(h.director.state.index, 0); h.director.resume(); await tick(); assert.equal(h.director.state.index, 1);
});
test('restart invalidates callbacks from the previous run', async () => {
  const h = harness(); h.director.start(incidents[0]); await tick(); const old = h.calls[0];
  h.director.replay(); await tick(); old.onEnded?.(); old.onStart?.(); old.onError?.();
  assert.equal(h.director.state.index, 0); assert.equal(h.director.state.status, 'playing'); assert.equal(h.director.state.log.length, 1);
});
test('case switches and close cancel old callbacks', async () => {
  const h = harness(); h.director.start(incidents[0]); await tick(); const old = h.calls[0];
  h.director.start(incidents[1]); await tick(); old.onEnded?.(); assert.equal(h.director.state.incident?.id, 'five-minutes'); assert.equal(h.director.state.index, 0);
  h.director.close(); h.calls.at(-1)?.onEnded?.(); assert.equal(h.director.state.status, 'idle'); assert.equal(h.director.state.incident, null);
});
test('generation failure does not skip a scene and retry resumes that scene', async () => {
  const h = harness(); h.setResult('error'); h.director.start(incidents[0]); await tick();
  assert.equal(h.director.state.status, 'error'); assert.equal(h.director.state.index, 0);
  h.setResult('playing'); h.director.retry(); await tick(); assert.equal(h.calls.length, 2); assert.equal(h.director.state.status, 'playing'); assert.equal(h.calls[1].sceneId, 'biscuit-01');
});
test('autoplay rejection exposes ready and resumes on an explicit gesture', async () => {
  const h = harness(); h.setResult('ready'); h.director.start(incidents[0]); await tick();
  assert.equal(h.director.state.status, 'ready'); h.director.resume(); await tick(); assert.equal(h.director.state.status, 'playing');
});
test('pause during loading survives the eventual paused transport result', async () => {
  const h = harness(); h.setResult('paused'); h.director.start(incidents[0]); h.director.pause(); await tick();
  assert.equal(h.director.state.status, 'paused'); assert.equal(h.director.state.log.length, 0);
  h.director.resume(); await tick(); assert.equal(h.director.state.status, 'playing'); assert.equal(h.director.state.log.length, 1);
});
test('decode failures and blocked resumes stop advancement until user action', async () => {
  const h = harness(); h.director.start(incidents[0]); await tick();
  h.calls[0].onError?.(); assert.equal(h.director.state.status, 'error');
  h.director.retry(); await tick(); h.calls.at(-1)?.onBlocked?.(); assert.equal(h.director.state.status, 'ready');
});
