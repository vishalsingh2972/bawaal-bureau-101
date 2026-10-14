import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plainText, storyIncident, validateStory } from '../src/lib/crisis.ts';
import { sceneRequest } from '../src/lib/case-director.ts';
import { assertSameOrigin } from '../src/lib/server/origin.ts';
const story = { title: 'UPI Ka Ek Rupaya', operator: 'Sir, आपका एक रुपया अभी waiting room में है।', investigator: 'जाँच में एक रुपया और चार pending screenshots मिले हैं।', reporter: 'ब्रेकिंग न्यूज़! एक रुपये के लिए अलग queue बनाई गई है।', commissioner: 'एक रुपये को VIP waiting room में बैठाया जाए।', verdict: '₹1 को VIP कुर्सी।' };
test('complaints are bounded plain text; HTML and empty input are rejected', () => {
  assert.equal(plainText('  Mera UPI pending hai.  ', 160), 'Mera UPI pending hai.');
  for (const value of ['', '<script>x</script>', 'x'.repeat(161), null]) assert.throws(() => plainText(value, 160));
});
test('generated speech is strictly validated, not silently templated', () => {
  assert.deepEqual(validateStory(story), story);
  for (const data of [{}, { ...story, operator: 'Roman Hindi only' }, { ...story, reporter: '<speak>Hello</speak>' }, { ...story, commissioner: '😀 नमस्ते' }, { ...story, speaker: 'made_up' }, { ...story, investigator: 'ज'.repeat(201) }]) assert.throws(() => validateStory(data));
});
test('generated incidents retain the fixed four persona roles and use live TTS bodies', () => {
  const incident = storyIncident(story, 'Mera ₹1 UPI pending hai.', 'live-test');
  assert.deepEqual(incident.scenes.map(scene => scene.role), ['operator', 'investigator', 'reporter', 'announcer']);
  for (let index = 0; index < 4; index++) assert.equal(sceneRequest(incident, index).sceneId, undefined);
  assert.equal(sceneRequest(incident, 3).input.speaker, 'ashok_hi_news');
});
test('origin validation handles Next localhost normalization and rejects foreign browsers', () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://localhost:3002/api/tts', { headers: { Host: '127.0.0.1:3002', Origin: 'http://127.0.0.1:3002' } })));
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://internal/api/tts', { headers: { Host: 'bureau.example', Origin: 'https://bureau.example', 'x-forwarded-proto': 'https' } })));
  assert.throws(() => assertSameOrigin(new Request('http://localhost:3002/api/tts', { headers: { Origin: 'https://evil.example' } })));
});
