// ============================================================ audio (synthesised, no files)
let AC = null, NB = null, muted = load('mute', false), SFXB = null, MUSB = null;
function initAudio() {
  try {
    if (AC && AC.state === 'closed') { AC = null; NB = null; }
    if (!AC) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      AC = new A();
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6; comp.connect(AC.destination);
      SFXB = AC.createGain(); SFXB.gain.value = .55; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; SFXB.connect(lp); lp.connect(comp);
      MUSB = AC.createGain(); MUSB.gain.value = .32; const pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1000; pk.Q.value = .75; pk.gain.value = 6; MUSB.connect(pk); pk.connect(comp);
    }
    if (AC && AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function tone(f, d, type, v, f2, delay, bus) {
  if (!AC || muted) return;
  try {
    const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    gn.gain.value = 0; gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v || .06, t + .006); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(gn); gn.connect(bus || SFXB); o.start(t); o.stop(t + d + .03);
  } catch (e) {}
}
function noise(d, v, freq, delay, ft) {
  if (!AC || muted) return;
  try {
    if (!NB) { NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = NB; fl.type = ft || 'lowpass'; fl.frequency.value = freq || 1000;
    gn.gain.value = 0; gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v || .1, t + .005); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(gn); gn.connect(SFXB); s.start(t); s.stop(t + d + .03);
  } catch (e) {}
}
const _sfxT = {};
function lim(k, gap) { const n = performance.now(); if (_sfxT[k] && n - _sfxT[k] < gap * 1000) return false; _sfxT[k] = n; return true; }
const SFX = {
  click() { tone(880, .04, 'triangle', .05); },
  hit(cr) { if (!lim('hit', .14)) return; if (cr) { noise(.08, .09, 2400, 0, 'bandpass'); tone(620, .08, 'triangle', .05, 420); } else noise(.05, .05, 1500, 0, 'bandpass'); },
  hurt() { if (!lim('hurt', .25)) return; tone(300, .1, 'sine', .06, 180); tone(900, .05, 'triangle', .02); },
  kill() { if (!lim('kill', .2)) return; tone(700, .06, 'triangle', .05, 1000); },
  level() { [660, 880, 1100].forEach((f, i) => tone(f, .12, 'triangle', .05, 0, i * .06)); },
  up() { if (!lim('up', .06)) return; tone(760, .05, 'square', .03); tone(1140, .07, 'triangle', .03, 0, .04); },
  item(r) { const b = [660, 740, 880, 990, 1170, 1320][r || 0]; for (let i = 0; i <= Math.min(3, r || 0); i++) tone(b * (1 + i * .25), .14, 'triangle', .05, 0, i * .07); },
  evolve() { [392, 523, 659, 784, 1046].forEach((f, i) => { tone(f, .5, 'triangle', .05, 0, i * .12); tone(f * 2, .25, 'sine', .02, 0, i * .12); }); },
  bossWin() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, .22, 'square', .04, 0, i * .1)); },
  bossFail() { tone(440, .3, 'triangle', .05, 220); },
  boss() { tone(196, .5, 'sawtooth', .04, 160); tone(784, .2, 'triangle', .03); },
  heavy() { noise(.2, .12, 600); tone(520, .12, 'triangle', .04, 300); },
};
function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
// ------------------------------------------------------------ music: pentatonic plucks, a calm loop per mood
const PENTA = [0, 2, 4, 7, 9];
let musT = 0, musI = 0, musMood = 0;
function pluck(f, t, v) {
  if (!AC || muted) return;
  try {
    const o = AC.createOscillator(), gn = AC.createGain(), o2 = AC.createOscillator(), g2 = AC.createGain();
    o.type = 'triangle'; o.frequency.value = f; gn.gain.value = 0; gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + .005); gn.gain.exponentialRampToValueAtTime(.0001, t + 1.2);
    o2.type = 'sine'; o2.frequency.value = f < 350 ? f * 4 : f * 2; g2.gain.value = 0; g2.gain.setValueAtTime(.0001, t); g2.gain.exponentialRampToValueAtTime(v * .35, t + .004); g2.gain.exponentialRampToValueAtTime(.0001, t + .18);
    o.connect(gn); gn.connect(MUSB); o2.connect(g2); g2.connect(MUSB); o.start(t); o.stop(t + 1.3); o2.start(t); o2.stop(t + .25);
  } catch (e) {}
}
const MEL = [[0, 2, 4, 2, 3, 4, 2, 1], [4, 3, 2, 0, 1, 2, 4, 3], [2, 4, 5, 4, 3, 2, 1, 0], [0, 1, 2, 4, 3, 2, 1, -1]];
function musicTick(boss) {
  if (!AC || muted || AC.state !== 'running') return;
  const beat = boss ? .24 : .42, root = boss ? 196 : 262;
  if (musT < AC.currentTime) musT = AC.currentTime + .05;
  while (musT < AC.currentTime + .3) {
    const bar = Math.floor(musI / 8) % MEL.length, n = MEL[bar][musI % 8];
    if (n >= 0 && (boss || musI % 8 !== 7)) {
      const deg = ((n % 5) + 5) % 5, oct = Math.floor(n / 5);
      pluck(root * Math.pow(2, (PENTA[deg] + 12 * oct) / 12), musT, boss ? .07 : .06);
    }
    if (musI % 4 === 0) pluck((boss ? 98 : 131) * (bar & 1 ? 1.5 : 1), musT, .05);
    musT += beat; musI++;
  }
}
document.addEventListener('visibilitychange', () => { try { if (!AC) return; if (document.hidden) AC.suspend(); else AC.resume(); } catch (e) {} });
window.addEventListener('pagehide', () => { try { if (AC) AC.close(); } catch (e) {} });
