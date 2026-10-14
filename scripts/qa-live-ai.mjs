// Development QA only: native Chrome CDP, no production dependency or synthetic audio.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:3002';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const output = resolve('.qa'); await mkdir(output, { recursive: true });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${resolve(output, `chrome-${Date.now()}`)}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${resolve(output, 'mic-fixture.wav')}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const debuggerUrl = await new Promise((resolveUrl, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome did not expose a debugger within 15 seconds.')), 15_000);
    let text = '';
    chrome.on('error', reject);
    chrome.stderr.on('data', chunk => { text += chunk.toString(); const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timeout); resolveUrl(match[1]); } });
  });
  socket = new WebSocket(debuggerUrl);
  await new Promise((resolveOpen, reject) => { socket.addEventListener('open', resolveOpen, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let nextId = 0; let session;
  const pending = new Map(); const runtimeErrors = []; const apiCalls = [];
  socket.addEventListener('close', event => { for (const request of pending.values()) request.reject(new Error(`Chrome debugger disconnected (${event.code}).`)); pending.clear(); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id) { const request = pending.get(message.id); if (request) { pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); } }
    if (message.method === 'Network.requestWillBeSent' && message.params.request.url.includes('/api/')) apiCalls.push(new URL(message.params.request.url).pathname);
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
  });
  const cdp = (method, params = {}, target = session) => new Promise((resolveResult, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Chrome command timed out: ${method}`)); }, method === 'Page.navigate' ? 45_000 : 15_000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolveResult(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, ...(target ? { sessionId: target } : {}) }));
  });
  const target = await cdp('Target.createTarget', { url: 'about:blank' }, null);
  session = (await cdp('Target.attachToTarget', { targetId: target.targetId, flatten: true }, null)).sessionId;
  await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
  const evaluate = async (expression, userGesture = false) => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, timeout = 15_000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolveWait => setTimeout(resolveWait, 100)); }
    const recording=await evaluate(`window.__recordedUpload ? window.__recordedUpload.arrayBuffer().then(buffer=>btoa(Array.from(new Uint8Array(buffer),byte=>String.fromCharCode(byte)).join(''))) : null`);if(recording)await writeFile(resolve(output,'recorded-mic.webm'),Buffer.from(recording,'base64'));const diagnostics=await evaluate(`({text:document.querySelector('#complaint')?.value,errors:Array.from(document.querySelectorAll('.audio-error')).map(node=>node.textContent),buttons:Array.from(document.querySelectorAll('.record-controls button')).map(node=>node.textContent)})`);throw new Error(`Timed out waiting for: ${expression}; ${JSON.stringify(diagnostics)}`);
  };
  const clickText = text => evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)})?.click()`, true);
  const mobile = () => cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 694, deviceScaleFactor: 1, mobile: true });
  const capture = async name => {
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `${name}: horizontal overflow`);
    const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(resolve(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  await mobile(); await cdp('Page.navigate',{url:base});
  await wait("document.querySelector('#complaint') && Object.keys(document.querySelector('#complaint')).some(key => key.startsWith('__reactProps$'))");
  await evaluate("document.getElementById('custom-emergency').scrollIntoView()");
  await cdp('Browser.setPermission', {permission:{name:'microphone'},setting:'denied',origin:base}, null);
  await clickText('Speak Your Bawaal');
  await wait("document.querySelector('.record-controls .audio-error')?.textContent.includes('denied')");
  console.log('PASS: microphone denial handled; typing remains available');
  await cdp('Browser.setPermission', {permission:{name:'microphone'},setting:'granted',origin:base}, null);
  await evaluate(`const nativeFetch=window.fetch;window.fetch=(input,options)=>{if(String(input).includes('/api/transcribe'))window.__recordedUpload=options.body.get('file');return nativeFetch(input,options);}`);
  await clickText('Speak Your Bawaal');
  await wait("document.querySelector('.recording')");
  if (process.argv.includes('--auto-stop')) {
    const recordingStarted = Date.now();
    await wait("!document.querySelector('.recording') && document.querySelector('.record-controls button').textContent.includes('transcribing')", 15_000);
    assert.ok(Date.now() - recordingStarted >= 9500 && Date.now() - recordingStarted <= 12_000);
    console.log('PASS: recording automatically stops at 10 seconds');
  } else {
    await new Promise(resolveWait=>setTimeout(resolveWait,6000));
    await evaluate("document.querySelector('.recording').click()",true);
  }
  await wait("document.querySelector('#complaint').value.includes('बिस्किट') || document.querySelector('.record-controls .audio-error')",30000);
  if (await evaluate("Boolean(document.querySelector('.record-controls .audio-error'))")) {
    const recording = await evaluate("window.__recordedUpload.arrayBuffer().then(buffer=>btoa(Array.from(new Uint8Array(buffer),byte=>String.fromCharCode(byte)).join('')))");
    await writeFile(resolve(output, 'recorded-mic.webm'), Buffer.from(recording, 'base64'));
    throw new Error(await evaluate("document.querySelector('.record-controls .audio-error').textContent"));
  }
  assert.equal(apiCalls.filter(path=>path==='/api/generate-crisis').length,0,'transcription must not auto-submit');
  console.log('PASS: actual MediaRecorder -> Saaras V4 codemix -> editable transcript (generated speech via QA virtual microphone)');
  await evaluate("Array.from(document.querySelectorAll('.suggested-complaints button')).find(button=>button.textContent.includes('UPI')).click()",true);
  assert.ok(await evaluate("document.querySelector('#complaint').value.includes('UPI')"));
  await evaluate("window.__qaAudio=[];const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);this.defaultPlaybackRate=8;this.playbackRate=8;window.__qaAudio.push(this)}}");
  await clickText('Generate my bawaal'); await wait("document.querySelector('.cinematic')",30000);
  await wait("document.querySelector('.verdict-screen')",40000);
  assert.equal(await evaluate("document.querySelectorAll('.event-log p').length"),4);
  assert.equal(apiCalls.filter(path=>path==='/api/generate-crisis').length,1);
  assert.equal(apiCalls.filter(path=>path==='/api/tts').length,4);
  assert.ok(await evaluate("document.querySelector('.verdict-screen').textContent.includes('UPI') || document.querySelector('.verdict-screen').textContent.includes('₹1') || document.querySelector('.verdict-screen').textContent.includes('एक')"));
  await capture('generated-verdict-mobile');
  await clickText('Replay'); await wait("!document.querySelector('.verdict-screen')"); await wait("document.querySelector('.verdict-screen')",15000);
  assert.equal(apiCalls.filter(path=>path==='/api/tts').length,4,'replay must not spend credits');
  console.log('PASS: real 105B custom case, four live Bulbul voices, sequential verdict; replay makes zero paid calls');
  await evaluate("Array.from(document.querySelectorAll('.appeal-box button')).find(button=>button.textContent.includes('OBJECT')).click()",true);
  await evaluate("const node=document.querySelector('#defence');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(node,'Sir, ₹1 bheja tha, loan nahi liya!');node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));",true);
  await clickText('Submit my one objection'); await wait("document.querySelector('.appeal-final')",40000);
  assert.equal(apiCalls.filter(path=>path==='/api/appeal').length,1);
  assert.equal(apiCalls.filter(path=>path==='/api/tts').length,5);
  assert.equal(await evaluate("document.querySelectorAll('.event-log p').length"),1);
  assert.equal(await evaluate('window.__qaAudio.length'),1);
  await capture('appeal-verdict-mobile');
  await clickText('Replay'); await wait("!document.querySelector('.verdict-screen')"); await wait("document.querySelector('.appeal-final')",10000);
  assert.equal(apiCalls.filter(path=>path==='/api/appeal').length,1);assert.equal(apiCalls.filter(path=>path==='/api/tts').length,5);
  console.log('PASS: one contextual commissioner appeal, real Bulbul playback, cached appeal replay, no conversation loop');
  assert.equal(runtimeErrors.length,0);
  console.log('PASS: no browser exceptions. Live AI browser QA complete.');
  await cdp('Browser.close', {}, null).catch(() => {});
} finally { socket?.close(); chrome.kill(); }

