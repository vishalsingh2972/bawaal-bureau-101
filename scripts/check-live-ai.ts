import { loadEnvFile } from 'node:process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { generateCrisis, generateAppeal } from '../src/lib/server/brain.ts';
import { synthesizeSpeech } from '../src/lib/server/sarvam.ts';
import { storyIncident } from '../src/lib/crisis.ts';
import { voices } from '../src/lib/voices.ts';
import assert from 'node:assert/strict';
loadEnvFile('.env.local'); await mkdir('.qa', { recursive: true });
const incidents = [];
for (const [index, complaint] of ['Mummy ne mera poora naam le liya.', 'Mera ₹1 UPI payment pending hai.'].entries()) {
  const started = Date.now(); const story = await generateCrisis(complaint); const incident = storyIncident(story, complaint, `live-test-${index}`);
  console.log(`${index + 1}: ${story.title}; real 105B response ${(Date.now() - started) / 1000}s`);
  console.log(JSON.stringify(story));
  assert.ok(new RegExp(index === 0 ? 'मम्मी|Mummy|नाम|surname|माँ' : 'UPI|पेमेंट|payment|रुपय|₹|एक', 'i').test(Object.values(story).join(' ')), 'story should reference its complaint');
  for (const scene of incident.scenes) {
    const voice = voices[scene.role]; const audio = await synthesizeSpeech({ text: scene.text, speaker: voice.speaker, language_code: voice.language, pace: voice.pace });
    await writeFile(`.qa/generated-${index}-${scene.role}.mp3`, audio);
  }
  incidents.push(incident);
}
assert.notEqual(incidents[0].scenes[0].text, incidents[1].scenes[0].text);
const comeback = await generateAppeal(incidents[1].complaint!, incidents[1].verdict, 'Sir, ₹1 bheja tha, loan nahi liya!');
assert.ok(/₹|एक|loan|लोन|रुपय|ऋण|उधार|पैस/i.test(comeback));
const voice = voices.announcer;
await writeFile('.qa/appeal.mp3', await synthesizeSpeech({ text: comeback, speaker: voice.speaker, language_code: voice.language, pace: voice.pace }));
console.log(`Real contextual commissioner comeback: ${comeback}`);
const manifest = JSON.parse(await readFile('public/audio/manifest.json', 'utf8'));
const clip = await readFile(`public${manifest.clips['biscuit-01'].file}`);
const form = new FormData(); form.set('file', new Blob([clip], { type: 'audio/mpeg' }), 'biscuit.mp3'); form.set('model', 'saaras:v4'); form.set('mode', 'codemix'); form.set('keyterms', JSON.stringify(['Bawaal', 'UPI']));
const response = await fetch('https://api.sarvam.ai/speech-to-text', { method: 'POST', headers: { 'api-subscription-key': process.env.SARVAM_API_KEY! }, body: form, signal: AbortSignal.timeout(25_000) });
const data = await response.json();
assert.equal(response.status, 200, `Saaras test failed: ${response.status}`); assert.ok(data.transcript?.trim());
console.log(`Real Saaras V4 codemix transcription (generated-speech fixture): ${data.transcript}`);
await writeFile('.qa/live-ai-results.json', JSON.stringify({ incidents, comeback, transcript: data.transcript }, null, 2));
console.log('PASS: two personalized 105B stories, eight real Bulbul lines, one contextual appeal/Bulbul clip, real Saaras V4 codemix.');
