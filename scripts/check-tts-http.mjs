// Run only against a test server launched with SARVAM_API_KEY=your_key_here.
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:3001';
const valid = { text: 'बिस्किट कहाँ है?', speaker: 'aparna_hi_customer', language_code: 'hi-IN', pace: 0.95 };
const cases = [
  { name: 'missing key', body: valid, status: 503, code: 'MISSING_API_KEY' },
  { name: 'preset missing key', body: { sceneId: 'biscuit-01' }, status: 503, code: 'MISSING_API_KEY' },
  { name: 'invalid persona', body: { ...valid, speaker: 'shubh' }, status: 400, code: 'INVALID_SPEAKER' },
  { name: 'invalid language', body: { ...valid, language_code: 'en-US' }, status: 400, code: 'INVALID_LANGUAGE' },
  { name: 'invalid pace', body: { ...valid, pace: 3 }, status: 400, code: 'INVALID_PACE' },
  { name: 'oversized text', body: { ...valid, text: 'x'.repeat(201) }, status: 400, code: 'INVALID_TEXT' },
  { name: 'unknown scene', body: { sceneId: '../../etc/passwd' }, status: 400, code: 'INVALID_SCENE' },
  { name: 'unsupported model', body: { ...valid, model: 'bulbul:v3' }, status: 400, code: 'INVALID_INPUT' },
  { name: 'invalid JSON', raw: '{', status: 400, code: 'INVALID_JSON' },
  { name: 'body size limit', raw: 'x'.repeat(5000), status: 413, code: 'PAYLOAD_TOO_LARGE' },
  { name: 'cross-origin', body: valid, origin: 'https://unrelated.example', status: 403, code: 'INVALID_ORIGIN' },
];
for (const check of cases) {
  const response = await fetch(`${base}/api/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(check.origin ? { Origin: check.origin } : {}) }, body: check.raw ?? JSON.stringify(check.body) });
  const body = await response.json();
  assert.equal(response.status, check.status, check.name);
  assert.equal(body.error.code, check.code, check.name);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(!JSON.stringify(body).includes('your_key_here'));
  console.log(`PASS: ${check.name} (${response.status})`);
}
const unsupported = await fetch(`${base}/api/tts`);
assert.equal(unsupported.status, 405);
console.log('PASS: GET is not accepted (405)');
