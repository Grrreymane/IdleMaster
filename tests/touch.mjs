// Real touch input through Chrome DevTools (phone emulation): node tests/touch.mjs [script.js]
// Serves the game folder, opens _test.html in headless Chrome with touch on, then runs a scenario that taps by screen
// position (Input.dispatchTouchEvent), so preventDefault, hit tests and layout are all exercised the way a phone does.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const srv = createServer(async (q, r) => {
  try { const p = normalize(join(root, decodeURIComponent(q.url.split('?')[0]))); if (!p.startsWith(normalize(root))) throw 0; const b = await readFile(p); r.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }); r.end(b); }
  catch { r.writeHead(404); r.end(); }
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const port = srv.address().port, dbg = 9300 + (port % 500), prof = await mkdtemp(join(tmpdir(), 'touch-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${prof}`, '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
let ws;
for (let i = 0; i < 50 && !ws; i++) {
  await new Promise(r => setTimeout(r, 200));
  try { const t = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(x => x.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl); } catch {}
}
await new Promise(ok => { ws.onopen = ok; });
let id = 0; const wait = new Map();
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } };
const send = (method, params = {}) => new Promise(ok => { const n = ++id; wait.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Evaluated inside the page; the game's closure names are reached through window.__t, which the scenario installs via the test hook.
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed'); return r.result.result.value; };
const touch = async (x, y) => {
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await sleep(30);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(60);
};
const rectOf = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}})()`);
const touchEl = async sel => { const r = await rectOf(sel); if (!r) throw new Error('no element ' + sel); await touch(r.x, r.y); return r; };
const results = []; const check = (name, ok, more = '') => { results.push(ok); console.log((ok ? 'ok   ' : 'FAIL ') + name + (more ? '  ' + more : '')); };
try {
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  // the test hook evals the hash inside the game's closure: expose what the scenario needs
  const hook = "window.__t={get S(){return S},set S(v){S=v},get TAB(){return TAB},recalc,fresh,spawn,renderUI,setTab,get GIFT(){return GIFT},set GIFT(v){GIFT=v},W,H,BAL,get DER(){return DER},TUT,closeModal,gildFoe,questDone,questNow};";
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/_test.html#${encodeURIComponent(hook)}` });
  for (let i = 0; i < 60; i++) { await sleep(200); if (await ev('!!window.__t')) break; }
  await sleep(600);
  const scenario = (await import(new URL(process.argv[2] || './touch-scenario.mjs', import.meta.url))).default;
  await scenario({ ev, touch, touchEl, rectOf, sleep, check, send });
} catch (e) { check('scenario ran', false, e.message); }
finally {
  ws.close(); chrome.kill(); srv.close(); await sleep(300); await rm(prof, { recursive: true, force: true }).catch(() => {});
}
console.log(results.every(Boolean) ? `ALL ${results.length} OK` : `${results.filter(x => !x).length} FAILED`);
process.exit(results.every(Boolean) ? 0 : 1);
