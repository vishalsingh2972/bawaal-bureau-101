// Development QA only: native Chrome CDP, no production dependency or synthetic audio.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:3002';
const accelerated = process.argv.includes('--fast');
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const output = resolve('.qa'); await mkdir(output, { recursive: true });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${resolve(output, `chrome-${Date.now()}`)}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
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
  const pending = new Map(); const runtimeErrors = [];
  socket.addEventListener('close', event => { for (const request of pending.values()) request.reject(new Error(`Chrome debugger disconnected (${event.code}).`)); pending.clear(); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.id) { const request = pending.get(message.id); if (request) { pending.delete(message.id); if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result); } }
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
  await cdp('Runtime.enable'); await cdp('Page.enable');
  const evaluate = async (expression, userGesture = false) => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, timeout = 15_000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) { if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolveWait => setTimeout(resolveWait, 100)); }
    throw new Error(`Timed out waiting for: ${expression}`);
  };
  const clickText = text => evaluate(`Array.from(document.querySelectorAll('button')).find(button => button.textContent.trim() === ${JSON.stringify(text)})?.click()`, true);
  const mobile = () => cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 694, deviceScaleFactor: 1, mobile: true });
  const landscape = () => cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
  const capture = async name => {
    assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `${name}: horizontal overflow`);
    const result = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(resolve(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  await mobile(); await cdp('Page.navigate', { url: base }); await wait("document.querySelectorAll('.case-card').length === 3");
  await wait("Object.keys(document.querySelector('.case-biscuit')).some(key => key.startsWith('__reactProps$'))");
  await capture('home-mobile');
  await evaluate(`window.__qaAudio=[];const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.__qaAudio.push(this)}}`);
  await evaluate("document.querySelector('.case-biscuit').click()", true);
  await wait("document.querySelector('.cinematic')");
  await wait("(window.__qaAudio[0] && !window.__qaAudio[0].paused) || Array.from(document.querySelectorAll('.cinematic button')).some(button => button.textContent.trim() === 'Play audio')");
  if (await evaluate("Array.from(document.querySelectorAll('.cinematic button')).some(button => button.textContent.trim() === 'Play audio')")) await clickText('Play audio');
  await wait("window.__qaAudio[0] && !window.__qaAudio[0].paused && window.__qaAudio[0].currentTime > 0.3");
  assert.ok(await evaluate("document.querySelector('.subtitle').textContent.includes('crime scene')"));
  await capture('biscuit-opening-mobile');
  await clickText('Pause'); await wait("document.querySelector('.broadcast-live').textContent.includes('PAUSED')");
  const pausedAt = await evaluate('window.__qaAudio[0].currentTime');
  await new Promise(resolveWait => setTimeout(resolveWait, 600));
  assert.ok(Math.abs(await evaluate('window.__qaAudio[0].currentTime') - pausedAt) < .03, 'pause must freeze audio position');
  await evaluate(`const slider=document.querySelector('input[aria-label="Case audio volume"]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(slider,'0.3');slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));`, true);
  await wait('window.__qaAudio[0].volume === 0.3');
  await clickText('Resume'); await wait('!window.__qaAudio[0].paused');
  console.log('PASS: genuine MP3 decode/play, synchronized first-line caption, pause/resume, volume, mobile overflow');
  if (accelerated) await evaluate('window.__qaAudio[0].defaultPlaybackRate=8;window.__qaAudio[0].playbackRate=8');
  await clickText('Restart case'); await wait("window.__qaAudio[0].currentTime > 0.05 && window.__qaAudio[0].currentTime < 1 && !window.__qaAudio[0].paused");
  const started = Date.now();
  await wait("document.querySelector('.role-reporter') && !window.__qaAudio[0].paused", 40_000);
  assert.ok(await evaluate("document.querySelector('.subtitle').textContent.includes('दूसरा बिस्किट')"));
  assert.ok(await evaluate("document.querySelector('.cinematic .controls').getBoundingClientRect().bottom <= window.innerHeight"), 'portrait recording must keep controls in frame');
  await capture('breaking-news-mobile'); await landscape(); await capture('breaking-news-landscape');
  console.log('PASS: automatic voice/department switches and breaking-news takeover, portrait and landscape');
  await wait("document.querySelector('.verdict-screen')", 25_000);
  const elapsed = (Date.now() - started) / 1000;
  if (!accelerated) assert.ok(elapsed >= 45 && elapsed <= 55, `flagship elapsed ${elapsed}s`);
  assert.equal(await evaluate("document.querySelectorAll('.event-log p').length"), 6);
  assert.equal(await evaluate('window.__qaAudio.length'), 1);
  assert.equal(await evaluate('window.__qaAudio[0].paused'), true);
  await capture('verdict-landscape');
  console.log(`PASS: six genuine clips, single audio element, verdict only after final clip${accelerated ? ' (QA accelerated)' : `, flagship ${elapsed.toFixed(2)}s wall time`}`);
  await clickText('Replay'); await wait('!window.__qaAudio[0].paused && window.__qaAudio[0].currentTime < 1');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait('window.__qaAudio[0].paused');
  await clickText('Resume'); await wait('!window.__qaAudio[0].paused');
  console.log('PASS: replay and keyboard pause');
  for (const selector of ['.case-clock', '.case-name']) {
    await evaluate("document.querySelector('button[aria-label=\"Close case and stop audio\"]').click()", true);
    await wait("!document.querySelector('.cinematic')");
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`, true);
    await wait('!window.__qaAudio[0].paused');
    // Test-only accelerated playback to finish remaining genuine clips promptly. Product uses playbackRate=1.
    await evaluate('window.__qaAudio[0].defaultPlaybackRate=8;window.__qaAudio[0].playbackRate=8');
    await wait("document.querySelector('.verdict-screen')", 15_000);
    assert.equal(await evaluate("document.querySelectorAll('.event-log p').length"), 6);
    assert.equal(await evaluate('window.__qaAudio.length'), 1);
    console.log(`PASS: ${selector} six-clip sequence, final verdict, no second audio element (QA accelerated)`);
  }
  await clickText('File another emergency'); await wait("!document.querySelector('.cinematic')");
  await mobile(); assert.ok(await evaluate("document.querySelector('.case-section').getBoundingClientRect().height > 0"));
  assert.equal(runtimeErrors.length, 0, `browser exceptions: ${runtimeErrors.join(', ')}`);
  console.log('PASS: return to case files, no runtime exceptions. Screenshots saved in .qa/.');
  await cdp('Browser.close', {}, null).catch(() => {});
} finally { socket?.close(); chrome.kill(); }
