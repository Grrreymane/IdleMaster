// ------------------------------------------------------------ the player's forms: look parameters (see quadGrid / snakeGrid)
const LOOK = {
  f0: { body: '#4a4452', belly: '#a89cb0', stripes: '#e0502a', ears: 'round', snout: 'short', tail: 'thin', tailTip: '#2a2430', leg: .62, size: .74, eye: '#ffc840', pupil: 'round', eyeR: 2.9, cheek: 1 },
  f1: { body: '#4a4452', belly: '#a89cb0', stripes: '#e0502a', ears: 'cat', snout: 'short', mane: '#c8c0d0', tail: 'thin', tailTip: '#2a2430', leg: .8, size: .84, eye: '#ffc840' },
  f2: { body: '#423c4a', belly: '#9a90a4', stripes: '#e8582a', ears: 'cat', snout: 'short', mane: '#d8d0e0', tail: 'lion', tailTip: '#2a2430', thick: 1, fangs: 1, size: .92, eye: '#ffc840' },
  f3: { body: '#3c3644', belly: '#948aa0', stripes: '#f0602a', ears: 'cat', snout: 'short', mane: '#d8d0e0', wings: '#2a2430', tail: 'lion', tailTip: '#2a2430', thick: 1, fangs: 1, size: .98, eye: '#ffd040' },
  f4: { body: '#36303e', belly: '#8a8096', stripes: '#ff6a2a', ears: 'cat', snout: 'short', mane: '#e0d8e8', wings: '#2a2430', tail: 'lion', tailTip: '#2a2430', thick: 1, fangs: 1, size: 1.04, eye: '#ffd040' },
  f5: { body: '#302a38', belly: '#80768c', stripes: '#ff7a30', ears: 'cat', snout: 'short', mane: '#e8e0f0', wings: '#24202c', tail: 'lion', tailTip: '#24202c', thick: 1, fangs: 1, size: 1.1, eye: '#ffe060' },
  f6: { body: '#2a2432', belly: '#786e84', stripes: '#ff8a3a', ears: 'cat', snout: 'short', mane: '#f4eefc', wings: '#1e1a26', horn: 'twin', hornCol: '#e8e0d0', tail: 'lion', tailTip: '#ff8a3a', thick: 1, fangs: 1, size: 1.14, eye: '#ffe060' },
};
// sprite for a form wearing gear: cached by form + rarities
const FSPR = new Map();
// hand-finished sprites (AI draft -> tools/pixelize.py -> img/<key>.png) replace the procedural ones once loaded
const ART_FILES = ['f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
for (let z = 0; z < 8; z++) for (let t = 0; t < 5; t++) ART_FILES.push('m' + z + '-' + t);
for (let z = 0; z < 8; z++) ART_FILES.push('bg' + z);                                                          // zone backgrounds, 180 x 160
for (const sl of ['horn', 'collar', 'armor', 'claw', 'tail', 'orb', 'rune']) for (let r = 0; r < 6; r++) ART_FILES.push('i-' + sl + '-' + r);   // item icons   // monsters: img/m<zone>-<tier>.png (4 = boss); missing ones fall back to code art
const PIX = {};
function loadPix() {
  for (const k of ART_FILES) {
    const im = new Image();
    im.onload = () => { PIX[k] = im; FSPR.clear(); for (const e in ESPR) delete ESPR[e]; for (const i in ICONS) if (i.startsWith('form')) delete ICONS[i]; if (k.startsWith('bg')) delete BG[+k.slice(2)]; };
    im.onerror = () => {};
    im.src = 'img/' + k + '.png';
  }
}
function pixCanvas(im) {   // an image as a sprite canvas: centred on the QW box, feet on the ground line (taller pictures get a taller canvas)
  const w = Math.max(QW, im.width), h = Math.max(QH, im.height + QH - GY), c = mk(w, h), x = c.getContext('2d');
  c.gy = h - (QH - GY); c.ox = Math.round((w - im.width) / 2); c.oy = c.gy + 1 - im.height;
  x.drawImage(im, c.ox, c.oy); return c;
}
// where gear goes on each drawn sprite, in the image's own pixels (read off tools/anchors.py sheets)
// crown: middle of the forehead, collar: nape -> throat, wing: leading edge of the near wing just inside its outline [wrist x, y, middle x, y, outer x, y],
// leg: front-leg cuff [x, y, leg angle],
// tail: just before the tail tip, hip: the haunch (rune), orb: where the spirit orb floats, s: gear scale
const ANCH = {
  f0: { crown: [36, 8], collar: [22, 25, 38, 32], wing: [19, 12, 13, 10, 7, 9], leg: [38, 38, 90], tail: [5, 28], hip: [15, 32], orb: [52, -4], s: .55 },
  f1: { crown: [44, 6], collar: [31, 22, 45, 29], wing: [23, 8, 15, 6.5, 7, 7.5], leg: [46, 37, 20], tail: [4, 27], hip: [18, 36], orb: [56, -4], s: .6 },
  f2: { crown: [49, 8], collar: [36, 25, 52, 32], wing: [25, 9, 17, 6.5, 9, 8], leg: [51, 50, 90], tail: [3, 34], hip: [19, 42], orb: [62, -6], s: .65 },
  f3: { crown: [63, 12], collar: [47, 28, 66, 40], wing: [36, 5, 22, 5.5, 8, 11], leg: [65, 61, 90], tail: [5, 45], hip: [25, 48], orb: [78, -4], s: .78 },
  f4: { crown: [76, 28], collar: [61, 42, 78, 54], wing: [45, 5, 32, 13, 19, 23], leg: [69, 69, 90], tail: [8, 54], hip: [30, 62], orb: [88, 8], s: .85 },
  f5: { crown: [86, 34], collar: [65, 48, 84, 64], wing: [51, 5, 34, 10.5, 18, 20], leg: [93, 76, 60], tail: [6, 53], hip: [32, 62], orb: [106, 6], s: .95 },
  f6: { crown: [108, 46], collar: [84, 64, 104, 82], wing: [64, 8, 46, 14.5, 28, 25], leg: [116, 95, 70], tail: [16, 80], hip: [40, 85], orb: [128, 20], s: 1.05 },
};
// gear reads as metal + a gem: the metal climbs bone -> bronze -> silver -> gold, the gem carries the rarity colour
const METAL = ['#8a7c66', '#b07a3c', '#a8b2c2', '#c4ccd8', '#e8b030', '#ffc444'];
const GEM = ['#a8a090', '#5ac85a', '#4a98ff', '#b06cff', '#ff9a2a', '#f03a3a'];
function insideMask(cv) {   // the sprite's own area shrunk by a pixel (compositing only, so file:// pages work too)
  const m = mk(cv.width, cv.height), x = m.getContext('2d');
  x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'destination-in';
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) x.drawImage(cv, dx, dy);
  return m;
}
function clipped(G, mask) { const c = G.canvas(), x = c.getContext('2d'); x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0); return c; }
function wingG(G, T, r, w, S) {   // wing guard on the wing's wrist: overlapping plates down the leading edge (cut to the wing), a jewelled boss, spikes on the better ones
  const M = ramp(METAL[r]), Mh = ramp(shade(METAL[r], 24)), Md = ramp(shade(METAL[r], -70)), q0 = [w[0], w[1]], q2 = [w[4], w[5]], q1 = [2 * w[2] - (w[0] + w[4]) / 2, 2 * w[3] - (w[1] + w[5]) / 2];
  const u = .55, p0 = q0, p1 = [lerp(q0[0], q1[0], u), lerp(q0[1], q1[1], u)], p2 = bez(q0, q1, q2, u);   // only the part next to the wrist
  const len = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]), n = clamp(Math.round(len / Math.max(3, S(4.5))), 2, 5), r0 = Math.max(1.6, S(2.6)), r1 = Math.max(.9, S(1.1));
  tube(G, p0, p1, p2, 0, 0, M, { rf: t => lerp(r0, r1, t), pat: (x, y, t) => { const f = t * n - Math.floor(t * n); return f > .8 ? Md : f < .3 ? Mh : null; } });
  const ns = r >= 4 ? 3 : r >= 2 ? r - 1 : 0;
  for (let k = 0; k < ns; k++) {
    const t = (k + .6) / (ns + .4), [cx, cy] = bez(p0, p1, p2, t), [ax, ay] = bez(p0, p1, p2, t + .03), d = Math.hypot(ax - cx, ay - cy) || 1;
    const ox = -(ay - cy) / d, oy = (ax - cx) / d, tx = (ax - cx) / d, ty = (ay - cy) / d, rr = lerp(r0, r1, t) * .8, b = Math.max(1, S(1.2)), h = S(2 + r * .5) * (1.15 - t * .5);
    poly(T, [[cx + ox * rr - tx * b, cy + oy * rr - ty * b], [cx + ox * (rr + h) + tx * b * .9, cy + oy * (rr + h) + ty * b * .9], [cx + ox * rr + tx * b, cy + oy * rr + ty * b]], M);   // swept back along the wing
  }
  const gr = Math.max(1.2, S(1.4 + r * .15));
  blob(T, p0[0], p0[1], gr + Math.max(.8, S(1)), gr + Math.max(.8, S(1)), M);
  blob(T, p0[0], p0[1], gr, gr, ramp(GEM[r]));
}
function neckbandG(G, T, r, nx, ny, tx, ty, S) {   // band round the neck (G, cut to the body) and a pendant under the throat (T)
  const M = ramp(METAL[r]), w = Math.max(1, S(1.5));
  tube(G, [nx, ny], [nx + (tx - nx) * .35, ty + S(1)], [tx, ty], w, w, M);
  const py = ty + w + Math.max(1, S(1.2)), gr = Math.max(1.2, S(1.4 + r * .2));
  T.set(R(tx - .5), R(ty + w), M[4]);
  blob(T, tx - .5, py + gr, gr, gr * 1.15, ramp(GEM[r]));
  if (r >= 4) T.set(R(tx - .5 - gr * .35), R(py + gr * .6), '#ffffff');
}
function crownG(G, T, r, x, y, S) {   // circlet across the forehead (G) with a crest and gem on the front (T)
  const M = ramp(METAL[r]), w = Math.max(.8, S(1.1));
  tube(G, [x - S(9), y + S(2.5)], [x, y - S(1.5)], [x + S(8), y + S(2.5)], w, w, M);
  if (r >= 2) { const h = S(3 + r * .7); poly(T, [[x - S(3), y + S(.5)], [x - S(2.2), y - h], [x - S(.6), y - h * .45], [x, y - h * 1.2], [x + S(.6), y - h * .45], [x + S(2.2), y - h], [x + S(3), y + S(.5)]], M); }
  const gr = Math.max(1, S(1.3 + r * .12));
  blob(T, x, y, gr, gr, ramp(GEM[r]));
}
function cuffG(G, r, x, y, ang, S) {   // bracer round the front leg (cut to the leg, so it takes the leg's width) with an inlaid gem
  const M = ramp(METAL[r]), a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), half = Math.max(1.5, S(2.4)), len = S(9);
  for (let j = -len; j <= len; j++) for (let i = -len; i <= len; i++) {
    const px = Math.floor(x + i), py = Math.floor(y + j), dx = px + .5 - x, dy = py + .5 - y, al = dx * ux + dy * uy, ac = -dx * uy + dy * ux;
    if (Math.abs(al) > half || Math.abs(ac) > len) continue;
    G.set(px, py, qv(M, .85 - (al / half + 1) * .28 - Math.abs(ac / len) * .25, px, py));
  }
  if (r >= 1) blob(G, x, y, Math.max(.8, S(1.1)), Math.max(.8, S(1.1)), ramp(GEM[r]));
}
function charmG(G, T, r, x, y, S) {   // ring round the tail (G) and a charm hanging from it (T)
  const M = ramp(METAL[r]), rr = Math.max(1.5, S(2.2)), gr = Math.max(1.2, S(1.4 + r * .18));
  blob(G, x, y, rr, rr, M);
  for (let k = 1; k <= Math.max(2, S(2.6)); k++) T.set(R(x), R(y + rr * .6 + k), M[3]);
  blob(T, x + .5, y + rr * .6 + Math.max(2, S(2.6)) + gr, gr, gr * 1.2, ramp(GEM[r]));
}
function runeMark(G, r, x, y, S) {   // a glowing sigil on the haunch: claw strokes, more of them on the rare ones (cut to the body, no outline)
  const c = mixHex(GEM[r], '#ffffff', .35), d = mixHex(GEM[r], '#1a1020', .2), n = r >= 3 ? 3 : 2, L = Math.max(3, S(5)), gap = Math.max(2, S(2.4));
  for (let k = 0; k < n; k++) {
    const sx = x + (k - (n - 1) / 2) * gap;
    for (let t = 0; t <= L; t++) { const px = Math.floor(sx + L * .35 - t * .7), py = Math.floor(y - L / 2 + t); G.set(px, py, t === 0 || t === L ? d : c); if (r >= 4 && t > 0 && t < L) G.set(px + 1, py, d); }
  }
}
function pixGear(cv, id, gear) {   // paint the worn gear over a drawn sprite: wrapped pieces are cut to the body, hanging ones get their own outline
  const a = ANCH[id]; if (!a) return;
  const mask = insideMask(cv), S = v => v * a.s, ox = cv.ox, oy = cv.oy, P = p => [ox + p[0], oy + p[1]];
  const Gr = new Grid(cv.width, cv.height), G = new Grid(cv.width, cv.height), T = new Grid(cv.width, cv.height), x = cv.getContext('2d');
  if (gear.rune !== undefined) runeMark(Gr, gear.rune, ...P(a.hip), S);
  if (gear.armor !== undefined) wingG(G, T, gear.armor, a.wing.map((v, i) => v + (i & 1 ? oy : ox)), S);
  if (gear.collar !== undefined) { const c = a.collar; neckbandG(G, T, gear.collar, ox + c[0], oy + c[1], ox + c[2], oy + c[3], S); }
  if (gear.claw !== undefined) cuffG(G, gear.claw, ...P(a.leg), a.leg[2], S);
  if (gear.tail !== undefined) charmG(G, T, gear.tail, ...P(a.tail), S);
  if (gear.horn !== undefined) crownG(G, T, gear.horn, ...P(a.crown), S);
  G.selOutline(); T.selOutline();
  x.drawImage(clipped(Gr, mask), 0, 0); x.drawImage(clipped(G, mask), 0, 0); x.drawImage(T.canvas(), 0, 0);
}
function gearKey(S) { return SLOTS.map(s => S.slots[s.id].r).join(','); }
function formSprite(id, gearR) {   // gearR: { horn: r, ... } (rarity or undefined)
  const key = id + '|' + JSON.stringify(gearR || {});
  let c = FSPR.get(key); if (c) return c;
  if (FSPR.size > 40) FSPR.clear();
  if (PIX[id]) {
    const cv = pixCanvas(PIX[id]), a = ANCH[id], g = Object.assign({}, gearR || {}); delete g.orb;
    pixGear(cv, id, g);
    c = { cv, A: a ? { orb: [cv.ox + a.orb[0], cv.oy + a.orb[1]] } : {}, w: cv.width, h: cv.height, gy: cv.gy, sil: tintC(cv, '#2a2038'), white: tintC(cv, '#ffffff'), red: tintC(cv, '#ff3a2a', .55) };
    FSPR.set(key, c); return c;
  }
  const f = LOOK[id] || LOOK.f0, g = Object.assign({}, gearR || {}); delete g.orb;
  const out = f.snake ? snakeGrid(f, g) : quadGrid(f, g);
  out.G.selOutline();
  const cv = out.G.canvas(), x = cv.getContext('2d');
  if (out.whisk) {   // 1px whiskers after the outline pass (WORKFLOW 2: thin details go straight onto the canvas)
    const [[wx, wy], col] = out.whisk; x.fillStyle = col;
    for (let k = 0; k < 14; k++) { x.fillRect(R(wx + k), R(wy + Math.sin(k * .45) * 2 + k * .25), 1, 1); x.fillRect(R(wx + k * .9), R(wy + 3 + Math.sin(k * .45 + 1) * 2 + k * .35), 1, 1); }
  }
  // breathing: split at the leg line so the body can rise a pixel
  c = { cv, A: out.A, w: cv.width, h: cv.height, gy: GY, sil: tintC(cv, '#2a2038'), white: tintC(cv, '#ffffff'), red: tintC(cv, '#ff3a2a', .55) };
  FSPR.set(key, c); return c;
}
function gearOf(S) { const g = {}; for (const s of SLOTS) if (S.slots[s.id].r >= 0) g[s.id] = S.slots[s.id].r; return g; }
// ------------------------------------------------------------ small icons (DOM uses them as data URLs)
const ICONS = {};
// file:// pages: a canvas that drew an img/ picture is 'tainted' and toDataURL throws -> fall back to an empty pixel
function iconURL(k, make) { if (ICONS[k]) return ICONS[k]; let u; try { u = make().toDataURL(); } catch (e) { u = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; } return (ICONS[k] = u); }
const SLOT_ROWS = {
  horn: ['..X..X..', '.XX..XX.', '.X....X.', 'XX....XX', 'X......X', '.XXXXXX.'],
  claw: ['X..X..X.', 'X..X..X.', 'XX.XX.XX', '.XXXXXX.', '.XXXXXX.', '..XXXX..'],
  collar: ['XX....XX', '.XX..XX.', '..XXXX..', '...YY...', '..YYYY..', '...YY...'],
  armor: ['.XXXXXX.', 'XYXYXYXY', 'XXXXXXXX', 'YXYXYXYX', '.XXXXXX.', '..XXXX..'],
  tail: ['......XX', '.....XX.', '....XX..', '.YYXX...', 'YYYY....', '.YY.....'],
  orb: ['..XXXX..', '.XYYXXX.', 'XYYXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..'],
  rune: ['X.XXXX.X', '.X....X.', 'X.XYYX.X', 'X.XYYX.X', '.X....X.', 'X.XXXX.X'],
};
function slotIcon(slot, r) {
  if (r >= 0 && PIX['i-' + slot + '-' + r]) return 'img/i-' + slot + '-' + r + '.png';
  return iconURL('s' + slot + r, () => {
    const c = r < 0 ? '#5a4c68' : RAR[r].c;
    return rows(SLOT_ROWS[slot], { X: c, Y: r < 0 ? '#6a5c78' : shade(c, 50) });
  });
}
const MISC_ROWS = {
  gold: [['..XXXX..', '.XYYYYX.', 'XYXXXXYX', 'XYX..XYX', 'XYXXXXYX', '.XYYYYX.', '..XXXX..'], { X: '#3a9a6a', Y: '#9af0c0' }],
  m: [['...X...', '..XYX..', '.XYYYX.', 'XYYYYYX', '.XYYYX.', '..XYX..', '...X...'], { X: '#c08a20', Y: '#ffe38a' }],
  xp: [['..X..', '.XYX.', 'XYYYX', '.XYX.', '..X..'], { X: '#2a8ac0', Y: '#9be7ff' }],
  pow: [['X.....X', 'XX...XX', '.XXYXX.', '..XYX..', '.XXYXX.', 'XX...XX', 'X.....X'], { X: '#c03a3a', Y: '#ffd040' }],
  beast: [['X.....X', 'XX...XX', 'XXXXXXX', 'XYXXXYX', 'XXXXXXX', '.XXZXX.', '..XXX..'], { X: '#c8a050', Y: '#2a1a14', Z: '#ff8a9a' }],
  map: [['XXXXXXXX', 'XYYXXYYX', 'XYXXYYXX', 'XXYYXXYX', 'XYYXXYYX', 'XXXXXXXX'], { X: '#c8a878', Y: '#5a8a4a' }],
  book: [['XXXX.XXXX', 'XYYX.XYYX', 'XYYX.XYYX', 'XYYXXXYYX', 'XXXXXXXXX'], { X: '#8a3a2a', Y: '#f0e0c0' }],
  fire: [['...X...', '..XX...', '..XYX..', '.XYYX..', '.XYZYX.', 'XYZZYX.', '.XYYX..'], { X: '#c0302a', Y: '#ff8a3a', Z: '#ffe060' }],
  gift: [['X..X..X', '.XXXXX.', 'XXXYXXX', 'XYYYYYX', 'XXXYXXX', 'XXXYXXX', 'XXXXXXX'], { X: '#c03a3a', Y: '#ffd040' }],
};
function miscIcon(k) { return iconURL('m' + k, () => rows(MISC_ROWS[k][0], MISC_ROWS[k][1])); }
const MAT_COL = ['#7ac860', '#d0603a', '#a8c8e8', '#f0a8b8', '#c89a48', '#ff8a6a', '#8ad0b0', '#ffd040'];
function matIcon(z) { return iconURL('mat' + z, () => rows(['..XX..', '.XYYX.', 'XYYYYX', 'XYYYXX', '.XXXX.'], { X: shade(MAT_COL[z], -60), Y: MAT_COL[z] })); }
function monIcon(z, t) {   // codex picture of a monster: the drawn one, or the code-drawn fallback (facing left, as in a fight)
  if (PIX['m' + z + '-' + t]) return 'img/m' + z + '-' + t + '.png';
  return iconURL('mon' + z + '-' + t, () => enemySprite(z, t).l);
}
function formIcon(id, sil) {   // portrait thumbnail for the codex / evolution choice (drawn forms: the picture itself, CSS .sil darkens it)
  if (PIX[id]) return 'img/' + id + '.png';
  return iconURL('form' + id + (sil ? 's' : ''), () => { const s = formSprite(id, {}); return sil ? s.sil : s.cv; });
}
