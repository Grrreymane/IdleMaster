// ============================================================ scene: the pixel stage (portrait + fight), 180 x 160 logical
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const low = mk(W, H);
let g = low.getContext('2d');
let K = 2;                                    // device pixels per logical pixel (set by layout())
const FLOOR = 150;                            // feet line on the stage
// ------------------------------------------------------------ backgrounds (cached per zone)
const BG = {};
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
function ridge(x, seed, amp, freq) { let v = 0, a = 1, f = freq; for (let o = 0; o < 4; o++) { v += Math.sin(x * f + seed * 7.3 + o * 1.7) * a; a *= .5; f *= 2.1; } return v * amp; }
function bgFor(z) {
  if (BG[z]) return BG[z];
  const Z = ZONES[z], c = mk(W, H), x = c.getContext('2d');
  if (PIX['bg' + z]) { x.drawImage(PIX['bg' + z], 0, 0, W, H); return (BG[z] = c); }   // drawn background (img/bg<zone>.png)
  // sky: three bands with a narrow dithered seam
  const bands = [[0, 46], [46, 92], [92, H]];
  bands.forEach(([a, b], i) => { x.fillStyle = Z.sky[i]; x.fillRect(0, a, W, b - a); });
  for (let i = 1; i < 3; i++) { const y0 = bands[i][0]; x.fillStyle = Z.sky[i - 1]; for (let y = y0; y < y0 + 4; y++) for (let xx = 0; xx < W; xx++) if (BAYER[y & 3][xx & 3] / 16 > (y - y0 + .5) / 4) x.fillRect(xx, y, 1, 1); }
  if (Z.deco === 'sun') { for (let i = 0; i < 10; i++) { const sx = 12 + i * 17, sy = 14 + (i % 3) * 7; x.fillStyle = '#ff9a3a'; x.beginPath(); x.arc(sx, sy, 4, 0, 7); x.fill(); x.fillStyle = '#ffe080'; x.fillRect(sx - 1, sy - 2, 2, 2); } }
  if (z === 6) { x.fillStyle = '#e8e0ff'; for (let i = 0; i < 40; i++) x.fillRect(Math.floor(hash(i * 3 + 1) * W), Math.floor(hash(i * 7 + 2) * 70), 1, 1); }
  // three mountain layers
  const layer = (base, amp, freq, col, seed, snow) => {
    for (let xx = 0; xx < W; xx++) {
      const top = Math.round(base + ridge(xx, seed, amp, freq));
      x.fillStyle = col; x.fillRect(xx, top, 1, H - top);
      x.fillStyle = shade(col, 18); x.fillRect(xx, top, 1, 1);
      if (snow && top < base - amp * .3) { x.fillStyle = '#f8f8ff'; x.fillRect(xx, top, 1, 3); }
    }
  };
  layer(78, 16, .035, Z.far, z * 3 + 1, z === 1 || z === 2);
  layer(104, 10, .05, Z.mid, z * 3 + 2);
  if (z === 3 || z === 5) { x.fillStyle = Z.mid; x.fillRect(0, 112, W, 30); x.fillStyle = shade(Z.mid, 30); for (let i = 0; i < 30; i++) x.fillRect(Math.floor(hash(i + z) * W), 114 + Math.floor(hash(i * 5 + z) * 24), 4 + Math.floor(hash(i * 9) * 6), 1); }
  layer(128, 6, .07, Z.near, z * 3 + 3);
  // ground with a lit lip and speckles
  x.fillStyle = Z.ground; x.fillRect(0, 140, W, H - 140);
  x.fillStyle = shade(Z.ground, 22); x.fillRect(0, 140, W, 1);
  x.fillStyle = Z.soil; for (let i = 0; i < 70; i++) x.fillRect(Math.floor(hash(i * 13 + z) * W), 143 + Math.floor(hash(i * 17 + z) * 16), 1 + (i & 1), 1);
  // decorations
  const deco = (dx, s) => {
    if (Z.deco === 'tree' || Z.deco === 'palm') {
      x.fillStyle = '#5a3a24'; x.fillRect(dx, 128 - 16 * s, 3, 16 * s + 12);
      const col = Z.deco === 'palm' ? '#3a9a58' : '#3a8a48';
      for (let k = 0; k < 6; k++) { x.fillStyle = shade(col, k * 6 - 10); x.beginPath(); x.arc(dx + 1 + Math.cos(k) * 7 * s, 124 - 18 * s + Math.sin(k * 1.7) * 4 * s, 7 * s, 0, 7); x.fill(); }
    } else if (Z.deco === 'rock') { x.fillStyle = shade(Z.near, 10); x.beginPath(); x.ellipse(dx, 140, 12 * s, 8 * s, 0, Math.PI, 0); x.fill(); x.fillStyle = shade(Z.near, 34); x.fillRect(dx - 6 * s, 134, 6 * s, 1); }
    else if (Z.deco === 'deadtree') { x.fillStyle = '#4a4a58'; x.fillRect(dx, 112, 2, 30); x.fillRect(dx - 6, 118, 7, 1); x.fillRect(dx + 2, 122, 6, 1); x.fillRect(dx - 4, 126, 5, 1); }
    else if (Z.deco === 'ding') { x.fillStyle = '#7a6a3a'; x.fillRect(dx - 7, 128, 14, 10); x.fillRect(dx - 6, 138, 2, 3); x.fillRect(dx + 4, 138, 2, 3); x.fillStyle = '#a8904a'; x.fillRect(dx - 8, 127, 16, 2); x.fillRect(dx - 6, 124, 2, 3); x.fillRect(dx + 4, 124, 2, 3); }
    else if (Z.deco === 'jade') { x.fillStyle = '#a8f0d0'; x.fillRect(dx - 10, 134, 20, 2); x.fillRect(dx - 7, 130, 14, 2); x.fillRect(dx - 4, 126, 8, 2); }
    else if (Z.deco === 'sun') { x.fillStyle = '#1a0a08'; x.fillRect(dx, 104, 4, 38); x.fillRect(dx - 8, 112, 10, 2); x.fillRect(dx + 3, 118, 9, 2); }
  };
  deco(18, 1); deco(150, .8); deco(98, .6);
  return (BG[z] = c);
}
// ------------------------------------------------------------ enemy sprites (monsterGrid from art_monsters.js, facing right -> mirrored)
const ESPR = {};
function cropGrid(G) {
  let x0 = G.w, y0 = G.h, x1 = -1, y1 = -1;
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) if (G.get(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return G;
  const N = new Grid(x1 - x0 + 3, y1 - y0 + 3);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) N.d[(y - y0 + 1) * N.w + x - x0 + 1] = G.get(x, y);
  return N;
}
function fallbackMonster(z, t) {
  const Z = ZONES[z], col = [Z.mid, Z.near, Z.far, Z.soil][t] || Z.mid;
  const f = { body: shade(col, 10), belly: shade(col, 50), ears: ['fox', 'cat', 'round', 'long'][(z + t) & 3], snout: ['short', 'mid', 'long'][(z * 3 + t) % 3], tail: ['thin', 'lion', 'fox', 'stub'][(t + z) & 3], size: t === 4 ? .95 : .55, thick: t === 4 ? 1 : 0, fangs: t >= 2 ? 1 : 0, horn: t === 4 ? 'twin' : null, eye: '#ff4a3a' };
  return quadGrid(f, {}).G;
}
function enemySprite(z, t) {
  const k = z + '-' + t; if (ESPR[k]) return ESPR[k];
  const im = PIX['m' + k];
  if (im) { const r = mk(im.width, im.height); r.getContext('2d').drawImage(im, 0, 0); const l = flipC(r); return (ESPR[k] = { l, w: l.width, h: l.height, white: tintC(l, '#ffffff'), red: tintC(l, '#ff4a3a', .45), sil: tintC(l, '#2a2038') }); }
  let G = typeof monsterGrid === 'function' ? monsterGrid(z, t) : fallbackMonster(z, t);
  G = cropGrid(G); G.selOutline();
  const r = G.canvas(), l = flipC(r);
  return (ESPR[k] = { l, w: l.width, h: l.height, white: tintC(l, '#ffffff'), red: tintC(l, '#ff4a3a', .45), sil: tintC(l, '#2a2038') });
}
// ------------------------------------------------------------ live state of the stage
const FX = { lunge: 0, hurt: 0, eHit: 0, eDie: 0, eDieSpr: null, eDieX: 0, evo: 0, evoFrom: null, warn: 0, flood: 0, rel: 0, slash: 0, slashCr: false, eIn: 0 };
const LUNGE = .24, SLASH = .2, EDIE = .4, EIN = .35;
const POPS = [], PARTS = [];
function pop(s, x, y, col, size, life) { if (POPS.length > 14) POPS.shift(); POPS.push({ s, x, y, col: col || '#ffffff', size: size || 8, life: life || .9, max: life || .9 }); }
function part(x, y, vx, vy, col, life, sz) { if (PARTS.length > 120) PARTS.shift(); PARTS.push({ x, y, vx, vy, col, life, max: life, sz: sz || 1 }); }
const TQ = [];
function txt(s, x, y, size, col, align, stroke, alpha) { TQ.push({ s: String(s), x, y, size: size || 6, col: col || '#ffffff', align: align || 'center', stroke: stroke === undefined ? OUT : stroke, alpha: alpha === undefined ? 1 : alpha }); }
function hpBar(x, y, w, h, f, col, back) {
  g.fillStyle = OUT; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = back || '#3a1a24'; g.fillRect(x, y, w, h);
  g.fillStyle = col; g.fillRect(x, y, Math.max(0, Math.round(w * clamp(f, 0, 1))), h);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, Math.max(0, Math.round(w * clamp(f, 0, 1))), 1);
}
function updateFX(dt) {
  for (const k of ['lunge', 'hurt', 'eHit', 'eDie', 'warn', 'flood', 'rel', 'slash', 'eIn']) if (FX[k] > 0) FX[k] = Math.max(0, FX[k] - dt);
  if (FX.evo > 0) FX.evo = Math.max(0, FX.evo - dt);
  for (let i = POPS.length - 1; i >= 0; i--) { const p = POPS[i]; p.life -= dt; p.y -= 12 * dt; if (p.life <= 0) POPS.splice(i, 1); }
  for (let i = PARTS.length - 1; i >= 0; i--) { const p = PARTS[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 20 * dt; if (p.life <= 0) PARTS.splice(i, 1); }
}
function drawStage(T) {
  TQ.length = 0;
  g.imageSmoothingEnabled = false; g.globalAlpha = 1;
  const z = S.f ? S.f.z : S.zone, boss = S.f && S.f.t === 4;
  g.drawImage(bgFor(z), 0, 0);
  // drifting clouds / snow / embers
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 61 + T * (3 + i)) % (W + 40)) - 20, cy = 10 + i * 9;
    if (z === 2) { g.fillStyle = '#ffffff'; for (let k = 0; k < 6; k++) g.fillRect(Math.floor((i * 37 + k * 29 + T * 6) % W), Math.floor((k * 23 + i * 11 + T * (10 + k)) % 140), 1, 1); }
    else if (z !== 6 && z !== 7) { g.globalAlpha = .55; g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx), cy, 14, 2); g.fillRect(Math.round(cx) + 3, cy - 1, 7, 1); g.globalAlpha = 1; }
  }
  // the beast
  const D = DER, spr = formSprite(S.form, gearOf(S));
  const breath = Math.sin(T * 2.4) > .2 ? 1 : 0, lp = FX.lunge > 0 ? 1 - FX.lunge / LUNGE : 1;
  const lunge = FX.lunge > 0 ? R(lp < .3 ? -lp / .3 * 2 : Math.sin((lp - .3) / .7 * Math.PI) * 6) : 0, knock = FX.hurt > .1 ? -1 : 0;
  const bx = (boss ? -14 - Math.max(0, spr.w - 100) : -6 - Math.max(0, spr.w - 112)) + lunge + knock, by = FLOOR - spr.gy;   // wide sprites slide left so the enemy stays clear
  // shadow
  g.globalAlpha = .28; g.fillStyle = '#000'; g.fillRect(bx + 22, FLOOR - 1, 70, 3); g.globalAlpha = 1;
  // rarity aura: motes rising for each ornate (r >= 3) item worn
  const ornate = SLOTS.filter(s => S.slots[s.id].r >= 3).length;
  if (ornate && Math.random() < ornate * .04) { const r = Math.max(...SLOTS.map(s => S.slots[s.id].r)); part(bx + 30 + Math.random() * 60, FLOOR - 10 - Math.random() * 40, 0, -8, RAR[r].c, 1.6); }
  const dead = S.dead > 0, img = FX.evo > 1.2 ? spr.white : spr.cv;
  if (dead) g.globalAlpha = .35;
  // breathing: everything above the paws rises a pixel; the only stretched row is just above the ground, so it reads as legs straightening
  const cut = spr.gy - 3;
  g.drawImage(img, bx, by);
  g.drawImage(img, 0, 0, spr.w, cut, bx, by - breath, spr.w, cut);
  if (FX.hurt > 0) { g.globalAlpha = .35 * FX.hurt / .2; g.drawImage(spr.red, bx, by - breath); }
  g.globalAlpha = 1;
  // floating orb
  const orbR = S.slots.orb.r;
  if (orbR >= 0) {
    const op = spr.A.orb || [102, 18], ox = bx + op[0], oy = by + op[1] + Math.sin(T * 1.7) * 3, col = ORB_COL[orbR];
    g.globalAlpha = .25 + .1 * Math.sin(T * 3); disc(ox, oy, 5 + orbR * .4, col); g.globalAlpha = 1;
    disc(ox, oy, 2.5 + orbR * .25, shade(col, -30)); disc(ox - .5, oy - .5, 1.8 + orbR * .2, col); g.fillStyle = '#ffffff'; g.fillRect(Math.round(ox - 1), Math.round(oy - 1), 1, 1);
  }
  // the enemy
  if (S.f && !dead) {
    const e = enemySprite(S.f.z, S.f.t), ein = FX.eIn > 0 ? FX.eIn / EIN : 0, ex = W - 4 - e.w + (FX.eHit > 0 ? R(FX.eHit / .12 * 3) : 0) + R(ein * ein * (e.w + 10)), ey = FLOOR + 1 - e.h;   // a new foe walks in from the right
    g.globalAlpha = .28; g.fillStyle = '#000'; g.fillRect(ex + 4, FLOOR - 1, e.w - 8, 3); g.globalAlpha = 1;
    g.drawImage(e.l, ex, ey);
    if (FX.eHit > 0) { g.globalAlpha = .5 * FX.eHit / .12; g.drawImage(e.red, ex, ey); g.globalAlpha = 1; }
    if (FX.slash > 0) slashFX(ex + e.w / 2, ey + e.h * .45, Math.min(e.w, e.h) * .45, 1 - FX.slash / SLASH, FX.slashCr);
    if (S.f.poison > 0) { g.globalAlpha = .4; g.drawImage(e.red, ex, ey); g.globalAlpha = 1; }
    const ew = Math.min(70, Math.max(40, e.w)), hx = W - 6 - ew, hy = Math.max(16, ey - 9);
    hpBar(hx, hy, ew, 3, S.f.hp / S.f.max, boss ? '#ff5a3a' : '#e04848');
    if (S.f.shield > 0) hpBar(hx, hy + 4, ew, 1, S.f.shield / S.f.max * 8, '#8ad0ff');
    const name = boss ? ZONES[S.f.z].boss : ZONES[S.f.z].mons[S.f.t];
    txt(name + (boss ? '' : ' ' + TIER_N[S.f.t]), hx + ew / 2, hy - 5, 6, boss ? '#ffd27a' : '#ffffff');
    if (boss) {
      const left = Math.max(0, BAL.bossTime - S.f.time);
      txt(Math.ceil(left) + '秒', W - 8, 30, 6, left < 10 ? '#ff8a6a' : '#ffffff', 'right');
      if (S.f.z === 0 && S.f.hits % 4 === 3) txt('!', ex + e.w / 2, ey - 2, 10, '#ff4a3a');
      if (S.f.z === 5) txt('九首 ' + S.f.heads, hx + ew / 2, hy + 9, 6, '#a8f0c0');
      if (S.f.z === 7) txt(S.f.moon ? '月相' : '日相', hx + ew / 2, hy + 9, 6, S.f.moon ? '#c8d8ff' : '#ffb040');
      if (S.f.z === 3 && S.f.hp < S.f.max * .5) txt('狂暴', hx + ew / 2, hy + 9, 6, '#ff6a4a');
      if (S.f.z === 2) txt('贪 ×' + (1 + S.f.hits * .05).toFixed(2), hx + ew / 2, hy + 9, 6, '#ffd27a');
    }
  }
  if (FX.eDie > 0 && FX.eDieSpr) {   // sinks into the ground and fades
    const k = 1 - FX.eDie / EDIE, d = FX.eDieSpr, sink = R(k * k * 10);
    g.save(); g.beginPath(); g.rect(0, 0, W, FLOOR + 1); g.clip();
    g.globalAlpha = 1 - k; g.drawImage(d.l, FX.eDieX, FLOOR + 1 - d.h + sink); g.globalAlpha = .4 * (1 - k); g.drawImage(d.sil, FX.eDieX, FLOOR + 1 - d.h + sink);
    g.restore(); g.globalAlpha = 1;
  }
  if (dead) txt('复活中…', 54, 96, 8, '#ffffff');
  // particles
  for (const p of PARTS) { g.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.sz, p.sz); }
  g.globalAlpha = 1;
  // evolution light: slow rays, no flashing
  if (FX.evo > 0) {
    const k = FX.evo / 3, a = Math.sin(Math.min(1, (1 - k) * 2) * Math.PI / 2) * (k < .3 ? k / .3 : 1);
    g.globalAlpha = .35 * a; g.fillStyle = '#fff4c0';
    for (let i = 0; i < 12; i++) { const ang = i / 12 * Math.PI * 2 + T * .4; for (let r = 10; r < 90; r += 2) g.fillRect(Math.round(56 + Math.cos(ang) * r), Math.round(100 + Math.sin(ang) * r * .7), 2, 2); }
    g.globalAlpha = 1;
  }
  // beast HP + header
  hpBar(6, FLOOR + 3, 70, 3, S.hp / D.hp, '#58d070', '#1a3a24');
  txt(ZONES[z].n + ' · ' + (boss ? '大妖' : TIER_N[S.tier] + '档'), 4, 8, 8, '#ffffff', 'left');
  for (const p of POPS) txt(p.s, p.x, p.y, p.size, p.col, 'center', OUT, Math.min(1, p.life / p.max * 2));
}
function slashFX(cx, cy, r, k, cr) {   // three claw marks sweeping down-left across the target
  const col = cr ? '#ffe070' : '#ffffff', a = k < .15 ? k / .15 : 1 - (k - .15) / .85, len = Math.min(1, k * 2.5);
  g.globalAlpha = clamp(a, 0, 1);
  for (let i = -1; i <= 1; i++) {
    const ox = i * r * .35, oy = -i * r * .15;
    for (let t = 0; t < len; t += .04) {
      const x = cx + ox + r * (.6 - t * 1.2), y = cy + oy + r * (-.7 + t * 1.4), w = t > .12 && t < .88 ? 2 : 1;
      g.fillStyle = '#3a1020'; g.fillRect(R(x) - 1, R(y), w + 1, w + 1);   // dark edge so the mark reads on pale foes too
      g.fillStyle = col; g.fillRect(R(x), R(y), w, w);
      if (cr) { g.fillStyle = '#ff9a3a'; g.fillRect(R(x) + 1, R(y) + 1, 1, 1); }
    }
  }
  g.globalAlpha = 1;
}
function disc(x, y, r, col) {
  x = R(x); y = R(y); g.fillStyle = col;
  if (r <= .6) { g.fillRect(x, y, 1, 1); return; }
  const Rr = Math.ceil(r);
  for (let dy = -Rr; dy <= Rr; dy++) { if (r * r - dy * dy < 0) continue; const hw = R(Math.sqrt(r * r - dy * dy)); g.fillRect(x - hw, y + dy, hw * 2 + 1, 1); }
}
// ------------------------------------------------------------ present: pixel layer + crisp text (pixel font snapped to its 12px grid)
function present() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1;
  ctx.drawImage(low, 0, 0, W, H, 0, 0, cv.width, cv.height);
  for (const t of TQ) {
    const c = textSprite(t), tw = c.w - 2 * c.pad;
    ctx.globalAlpha = t.alpha; ctx.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? tw / 2 : t.align === 'right' ? tw : 0)), R(t.y * K - c.h / 2));
  }
  ctx.globalAlpha = 1;
}
const TXC = new Map();
function txtPx(size) { const px = size * K; let n = Math.max(1, Math.round(px / 12)); if (n > 1 && n * 12 > px * 1.2) n--; return n * 12; }   // whole multiples of the 12px pixel font, never more than 20% bigger
function textSprite(t) {
  const px = txtPx(t.size), key = t.s + '|' + px + '|' + t.col + '|' + t.stroke;
  let c = TXC.get(key); if (c) return c;
  if (TXC.size > 300) TXC.clear();
  const m = document.createElement('canvas'), x = m.getContext('2d'), font = px + 'px ' + FONT, u = px / 12;
  const pad = Math.ceil(u) + 2;
  x.font = font; m.width = Math.ceil(x.measureText(t.s).width) + pad * 2; m.height = Math.ceil(px * 1.4) + pad * 2;
  x.font = font; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  const base = Math.round(m.height / 2 + px * .4);
  if (t.stroke) { x.fillStyle = t.stroke; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) x.fillText(t.s, pad + dx * u, base + dy * u); }
  x.fillStyle = t.col; x.fillText(t.s, pad, base);
  c = { cv: m, w: m.width, h: m.height, pad }; TXC.set(key, c); return c;
}
try { if (document.fonts) { document.fonts.addEventListener('loadingdone', () => TXC.clear()); document.fonts.ready.then(() => TXC.clear()); } } catch (e) {}
