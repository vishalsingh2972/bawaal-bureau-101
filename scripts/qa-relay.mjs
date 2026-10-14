// Development QA only: native Chrome CDP, no production dependency or synthetic audio.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:3002';
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
  await mobile();await cdp('Page.navigate',{url:base});
  await wait("document.querySelector('.relay-promo button') && Object.keys(document.querySelector('.relay-promo button')).some(key=>key.startsWith('__reactProps$'))");
  await evaluate("window.__qaAudio=[];const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.__qaAudio.push(this)}}");
  await evaluate("document.querySelector('.relay-promo button').click()",true);
  await wait("window.__qaAudio[0] && !window.__qaAudio[0].paused && window.__qaAudio[0].currentTime>0.1");
  const started=Date.now();
  const cities=['DELHI','HYDERABAD','CHENNAI','MUMBAI','KOLKATA'];const languages=['hi','te','ta','mr','bn'];
  for(let index=0;index<5;index++){
    await wait("document.querySelector('.dispatch-takeover strong')?.textContent.includes("+JSON.stringify(cities[index])+") && !window.__qaAudio[0].paused && window.__qaAudio[0].currentTime>0.1",12000);
    assert.equal(await evaluate("document.querySelector('.subtitle').lang"),languages[index]);
    assert.ok(await evaluate("document.querySelector('.english-translation').textContent.length>20"));
    assert.ok(await evaluate("document.querySelector('.officer code').textContent.length>5"));
    await capture('relay-'+languages[index]+'-mobile');
    console.log('PASS: '+cities[index]+' '+languages[index]+' genuine playback, native caption, English translation, speaker ID');
  }
  await wait("document.querySelector('.verdict-screen')",12000);
  const elapsed=(Date.now()-started)/1000;assert.ok(elapsed>=20&&elapsed<=30,'relay wall time '+elapsed);
  assert.equal(await evaluate("document.querySelectorAll('.event-log p').length"),5);assert.equal(await evaluate('window.__qaAudio.length'),1);
  console.log('PASS: five-stage sequential relay, one audio element, '+elapsed.toFixed(2)+'s wall time');
  await clickText('Replay');await wait('!window.__qaAudio[0].paused');await evaluate('window.__qaAudio[0].defaultPlaybackRate=8;window.__qaAudio[0].playbackRate=8');await wait("document.querySelector('.verdict-screen')",10000);
  await landscape();await capture('relay-verdict-landscape');
  assert.equal(runtimeErrors.length,0);console.log('PASS: relay replay and no browser exceptions');
  await cdp('Browser.close', {}, null).catch(() => {});
} finally { socket?.close(); chrome.kill(); }
