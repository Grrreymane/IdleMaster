// Store-page trailer: 15 s portrait video (720 x 1280). Runs inside the game closure (see record_video.py).
// Record:  python D:/Minigame/_workflow/tools/record_video.py D:/Minigame/IdleMaster tools/trailer.js --size 720x1280 --out 1gp-kit/preview.mp4
//          (draft: --size 360x640;  --arg nocaption for clean frames)
// Needs .cache/fp-full.ttf (the full Fusion Pixel font: the game's subset lacks the caption characters).
// Layout, in stage pixels x 4: a caption band on top, the real stage (with its sky continued above), and a band
// at the bottom with the game's own progress: the seven gear slots and the seven forms.
{
  let seed = 11;
  Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  setRnd(Math.random);
  const FPS = 30, DT = 1 / FPS, Z4 = 4, TOP = 84, SKY = 32, STAGE_Y = TOP + SKY, BOT = STAGE_Y + H;   // logical rows
  const rc = mk(W * Z4, 320 * Z4), rx = rc.getContext('2d');
  saveGame = () => {}; TUT.i = 99; BAL.dropRate = 0; muted = false;
  removeEventListener('resize', layout); if (window.visualViewport) visualViewport.removeEventListener('resize', layout);

  // music without the "is the context running" check (an offline context sits suspended between frames)
  musicTick = function (boss) {
    const beat = boss ? .24 : .42, root = boss ? 196 : 262;
    if (musT < AC.currentTime) musT = AC.currentTime + .05;
    while (musT < AC.currentTime + .3) {
      const bar = Math.floor(musI / 8) % MEL.length, n = MEL[bar][musI % 8];
      if (n >= 0 && (boss || musI % 8 !== 7)) { const deg = ((n % 5) + 5) % 5, oct = Math.floor(n / 5); pluck(root * Math.pow(2, (PENTA[deg] + 12 * oct) / 12), musT, boss ? .07 : .06); }
      if (musI % 4 === 0) pluck((boss ? 98 : 131) * (bar & 1 ? 1.5 : 1), musT, .05);
      musT += beat; musI++;
    }
  };

  // fights paced for the camera: a foe takes `HITS` blows, never hurts much, the beast swings every ~0.42 s
  let HITS = 3, SPD = 1.4, stepping = true;
  const gameEvent = onEvent;
  onEvent = (type, d) => {
    if (type === 'spawn' && S.f) { S.f.hp = S.f.max = DER.atk * (S.f.t === 4 ? 1 + DER.boss : 1) * HITS * .97; S.f.atk = DER.hp * .03; }
    if (type === 'unlock' || type === 'death') return;
    gameEvent(type, d);
  };
  const setGear = (r, only) => { for (const s of SLOTS) if (!only || only.includes(s.id)) S.slots[s.id] = { r, l: 10 + r * 8 }; };
  const setForm = n => { S.form = 'f' + n; S.stage = n; for (let i = 0; i <= n; i++) S.forms['f' + i] = 1; };
  const stage = (z, t) => { S.zone = z; S.tier = t; S.maxZone = Math.max(S.maxZone, z); S.unlocked[z] = [1, 1, 1, 1, 1]; recalc(); S.hp = DER.hp; S.dead = 0; S.f = null; POPS.length = 0; PARTS.length = 0; spawn(S, z, t); onEvent('spawn', S.f); FX.eIn = 0; S.f.pT = .3; };
  const sparkle = r => { SFX.item(r); for (let i = 0; i < 10; i++) part(48 + rand(-18, 18), 92 + rand(-24, 8), rand(-15, 15), rand(-40, -10), RAR[r].c, 1.1); };

  const shots = [];
  // 1. the core loop: a cub swats a foe down, the next one walks in, and loot lands on it
  shots.push({ len: 3, start() { S = fresh(); S.lv = 3; S.xp = 0; setForm(0); for (const s of SLOTS) S.slots[s.id] = { r: -1, l: 0 }; HITS = 3; stage(0, 0); },
    during(t) { if (t > 2.35 && !this.got) { this.got = 1; S.slots.collar = { r: 1, l: 4 }; recalc(); sparkle(1); } } });
  // 2. gear pops onto the body piece by piece
  const ORDER = ['horn', 'armor', 'claw', 'tail', 'rune', 'orb'];
  shots.push({ len: 2, start() { HITS = 4; this.n = 0; },
    during(t) { const n = Math.min(ORDER.length, Math.floor((t + .15) / .3)); while (this.n < n) { const id = ORDER[this.n++]; S.slots[id] = { r: 2, l: 8 }; recalc(); sparkle(2); } } });
  // 3. evolution montage: one cut per form, a new land behind each
  [[1, 1, 1, 2], [2, 2, 2, 3], [3, 3, 1, 3], [4, 4, 2, 4], [5, 5, 3, 4]].forEach(([n, z, t, r]) => shots.push({ len: .8, big: FORMS['f' + n].n,
    start() { setForm(n); setGear(r); S.lv = 20 + n * 18; HITS = 2; stage(z, t); FX.evo = 1.34; SFX.evolve(); } }));
  // 4. the last form against the last great demon
  shots.push({ len: 3.4, start() { setForm(6); setGear(5); S.lv = 120; S.bossWins = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }; HITS = 40; SPD = 1.8; stage(7, 4); S.f.time = 2; },
    during(t) {
      const f = S.f;
      if (f && f.t === 4) { if (t < 2.2) f.hp = f.max * Math.max(.12, 1 - t / 2.2 * .88); else if (!this.low) { this.low = 1; f.hp = f.max * .02; } }   // the bar drains steadily (no single blow can end it early), the last blow lands at ~2.4 s
      if (!f && !this.won) { this.won = 1; stepping = false; pop('打倒夔！', 120, 44, '#ffd27a', 12, 1.6); }
    } });
  // 5. end card: the beast in the Kunlun sunset, the name, three verbs and a blinking "tap to start"
  shots.push({ len: 2.6, end: true, start() { stepping = false; S.f = null; S.zone = 1; POPS.length = 0; PARTS.length = 0; FX.evo = 0; } });
  const total = shots.reduce((s, x) => s + x.len, 0);

  // captions: a small line first, the big yellow one pops 0.17 s later (overshoots to 1.15, settles)
  const CAPS = [[0, 3, '你是一只', '翼虎幼崽'], [3, 5, '打怪掉宝', '越穿越帅'], [5, 9, '一路进化', null], [9, 10.7, '最终形态', '上古穷奇'], [10.7, 12.4, '山海八大妖', '一一斩尽']];
  function text(s, x, y, size, col, sc = 1, alpha = 1) {   // logical position, centred
    const c = textSprite({ s, size, col, stroke: OUT, align: 'center' }), w = c.w * sc, h = c.h * sc;
    rx.globalAlpha = alpha; rx.drawImage(c.cv, R(x * Z4 - w / 2), R(y * Z4 - h / 2), R(w), R(h)); rx.globalAlpha = 1;
  }
  const popScale = a => a < 0 ? 0 : a < .08 ? lerp(.6, 1.15, a / .08) : a < .16 ? lerp(1.15, 1, (a - .08) / .08) : 1;
  function captions(t, big) {
    if (REC.arg === 'nocaption') return;
    const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return;
    const a = t - c[0], left = c[1] - t, fade = Math.min(1, left / .12);
    text(c[2], 90, 27 + (1 - Math.min(1, a / .12)) * 4, 11, '#f3ead8', 1, Math.min(1, a / .12) * fade);
    const b = c[3] || big, ba = c[3] ? a - .17 : t - (5 + Math.floor((t - 5) / .8) * .8) - .05;
    if (b && ba > 0) text(b, 90, 60, 19, '#ffd84a', popScale(ba), fade);
  }
  // bottom band: the gear slots (empty frames until worn) and the seven forms (dark until reached)
  function band(endCard, t) {
    rx.fillStyle = '#17121f'; rx.fillRect(0, BOT * Z4, rc.width, rc.height - BOT * Z4);
    rx.fillStyle = OUT; rx.fillRect(0, BOT * Z4, rc.width, Z4 * 2);
    if (endCard) {
      text('打怪 · 进化 · 斩大妖', 90, BOT + 22, 9, '#f3ead8');
      if (Math.floor(t * 2.2) % 2 === 0) text('点击开始', 90, BOT + 48, 12, '#ffffff');
      return;
    }
    const box = 21, gap = (W - 8 - box * 7) / 6;
    SLOTS.forEach((s, i) => {
      const x = (4 + i * (box + gap)) * Z4, y = (BOT + 7) * Z4, r = S.slots[s.id].r, im = PIX['i-' + s.id + '-' + Math.max(0, r)];
      rx.fillStyle = OUT; rx.fillRect(x, y, box * Z4, box * Z4);
      rx.fillStyle = r >= 0 ? RAR[r].c : '#3a2e4c'; rx.fillRect(x + 4, y + 4, box * Z4 - 8, box * Z4 - 8);
      rx.fillStyle = '#120c1a'; rx.fillRect(x + 12, y + 12, box * Z4 - 24, box * Z4 - 24);
      if (im) { rx.imageSmoothingEnabled = true; rx.globalAlpha = r >= 0 ? 1 : .18; const k = (box * Z4 - 20) / Math.max(im.width, im.height); rx.drawImage(im, x + (box * Z4 - im.width * k) / 2, y + (box * Z4 - im.height * k) / 2, im.width * k, im.height * k); rx.globalAlpha = 1; }
    });
    const fw = 24, fg = (W - 6 - fw * 7) / 6;
    for (let i = 0; i < 7; i++) {
      const id = 'f' + i, im = PIX[id], x = (3 + i * (fw + fg)) * Z4, y = (BOT + 33) * Z4, h = 26 * Z4, cur = S.stage === i, got = i <= S.stage;
      if (cur) { rx.fillStyle = '#ffd84a'; rx.fillRect(x - 4, y - 4, fw * Z4 + 8, h + 8); rx.fillStyle = '#2e2440'; rx.fillRect(x, y, fw * Z4, h); }
      if (!im) continue;
      const k = Math.min(fw * Z4 / im.width, h / im.height) * (.55 + i * .075);
      rx.imageSmoothingEnabled = true; rx.filter = got ? 'none' : 'brightness(0) opacity(.45)';
      rx.drawImage(im, x + (fw * Z4 - im.width * k) / 2, y + h - im.height * k - 4, im.width * k, im.height * k); rx.filter = 'none';
    }
    text('第 ' + S.stage + ' 阶 · 战力 ' + fmt(DER.power), 90, BOT + 69, 7, '#f3c96b');
  }
  // the end card's stage: just the background and the beast, breathing
  function endStage() {
    TQ.length = 0; g.imageSmoothingEnabled = false; g.globalAlpha = 1;
    g.drawImage(bgFor(1), 0, -BG_OFF);
    const spr = formSprite(S.form, gearOf(S)), bx = R((W - spr.w) / 2), by = FLOOR - spr.gy, breath = Math.sin(T * 2.4) > .2 ? 1 : 0, cut = spr.gy - 3;
    g.globalAlpha = .28; g.fillStyle = '#000'; g.fillRect(bx + 30, FLOOR - 1, spr.w - 50, 3); g.globalAlpha = 1;
    g.drawImage(spr.cv, bx, by); g.drawImage(spr.cv, 0, 0, spr.w, cut, bx, by - breath, spr.w, cut);
    const op = spr.A.orb, col = ORB_COL[5], ox = bx + op[0], oy = by + op[1] + Math.sin(T * 1.7) * 3;
    g.globalAlpha = .3; disc(ox, oy, 7, col); g.globalAlpha = 1; disc(ox, oy, 3.7, shade(col, -30)); disc(ox - .5, oy - .5, 2.8, col);
  }

  let cur = -1, t0 = 0;
  REC.run({ fps: FPS, seconds: total, canvas: rc, audio: true,
    async setup(ac) {
      AC = ac;
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 6; comp.connect(AC.destination);
      SFXB = AC.createGain(); SFXB.gain.value = .55; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; SFXB.connect(lp); lp.connect(comp);
      MUSB = AC.createGain(); MUSB.gain.value = .32; const pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1000; pk.Q.value = .75; pk.gain.value = 6; MUSB.connect(pk); pk.connect(comp);
      musT = 0; musI = 0;
      try { const ff = new FontFace('Fusion Pixel', 'url(.cache/fp-full.ttf)'); await ff.load(); document.fonts.add(ff); await document.fonts.ready; } catch (e) { REC.log('font ' + e); }
      for (let i = 0; i < 100 && ART_FILES.some(k => !PIX[k]); i++) await new Promise(r => setTimeout(r, 50));
      REC.log('pix ' + Object.keys(PIX).length + '/' + ART_FILES.length);
      cv.width = W * Z4; cv.height = H * Z4; K = Z4; TXC.clear(); FSPR.clear();
      REC.log('total ' + total.toFixed(2) + 's');
    },
    step(i, t) {
      let acc = 0, k = 0; while (k < shots.length - 1 && t >= acc + shots[k].len - 1e-6) acc += shots[k++].len;
      if (k !== cur) { cur = k; t0 = acc; stepping = true; SPD = 1.4; shots[k].start(); REC.log('shot ' + k + ' @' + t.toFixed(2)); }
      const sh = shots[k], lt = t - t0;
      if (sh.during) sh.during(lt);
      if (i > 0) { T += DT; if (stepping) { DER.spd = SPD; S.hp = DER.hp; advance(DT); DER.spd = SPD; } updateFX(DT); }
      if (sh.end) endStage(); else drawStage(T);
      present(); musicTick(!!(S.f && S.f.t === 4));
      rx.imageSmoothingEnabled = false; rx.fillStyle = '#17121f'; rx.fillRect(0, 0, rc.width, rc.height);
      rx.drawImage(bgFor(sh.end ? 1 : (S.f ? S.f.z : S.zone)), 0, 0, W, SKY, 0, TOP * Z4, W * Z4, SKY * Z4);   // the sky continues above the stage
      rx.drawImage(cv, 0, STAGE_Y * Z4);
      const grd = rx.createLinearGradient(0, (TOP - 2) * Z4, 0, (TOP + 14) * Z4); grd.addColorStop(0, '#17121f'); grd.addColorStop(1, 'rgba(23,18,31,0)');
      rx.fillStyle = grd; rx.fillRect(0, (TOP - 2) * Z4, rc.width, 16 * Z4);
      band(sh.end, lt);
      if (sh.end) {
        const a = Math.min(1, lt / .25);
        text('山海异兽录', 90, 44, 23, '#ffd27a', popScale(lt - .05), a);
      } else captions(t, sh.big);
    } });
}
