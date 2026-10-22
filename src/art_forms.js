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
// where gear goes on each drawn sprite, in the image's own pixels (measured on tools/anchors.py sheets)
// head: top of the skull (gear horns), brow: forehead, neck: under the jaw, back: saddle centre [x, y, width],
// paw: front paw on the ground, tail: tail tip, orb: where the spirit orb floats, horns: the form has its own horns, s: gear scale
const ANCH = {
  f0: { head: [38, 3], brow: [40, 10], neck: [38, 29], back: [20, 28, 10], paw: [36, 43], tail: [2, 30], orb: [52, -4], s: .55 },
  f1: { head: [44, 2], brow: [46, 8], neck: [44, 27], back: [24, 30, 10], paw: [51, 38], tail: [2, 24], orb: [56, -4], s: .6 },
  f2: { head: [48, 2], brow: [50, 9], neck: [47, 30], back: [26, 32, 12], paw: [49, 56], tail: [2, 35], orb: [62, -6], s: .65, horns: 1 },
  f3: { head: [62, 6], brow: [62, 12], neck: [58, 38], back: [34, 40, 14], paw: [60, 71], tail: [2, 48], orb: [78, -4], s: .78, horns: 1 },
  f4: { head: [76, 22], brow: [78, 30], neck: [70, 52], back: [48, 50, 14], paw: [73, 80], tail: [8, 55], orb: [88, 8], s: .85, horns: 1 },
  f5: { head: [88, 26], brow: [90, 38], neck: [82, 66], back: [55, 58, 18], paw: [100, 87], tail: [4, 55], orb: [106, 6], s: .95, horns: 1 },
  f6: { head: [108, 40], brow: [110, 47], neck: [98, 80], back: [62, 72, 22], paw: [124, 104], tail: [14, 78], orb: [128, 20], s: 1.05, horns: 1 },
};
function plateG(G, r, x, y, w, S) {   // armour on a sprite: a domed scale pauldron on the shoulder (rows of overlapping scales)
  const P = ramp(RAR[r].c), rx = w / 2, ry = w * .42;
  for (let j = -ry; j <= ry * .35; j++) for (let i = -rx; i <= rx; i++) {
    const nx = i / rx, ny = j / ry; if (nx * nx + ny * ny > 1) continue;
    const row = Math.floor((j + ry) / S(2.6)), u = (i + (row & 1) * S(1.6)) / S(3.2), fu = u - Math.floor(u), fv = ((j + ry) / S(2.6)) % 1;
    const rim = fv > .72 || fu < .12;   // dark gap under each scale
    const v = lam(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))) + (1 - fv) * .12 - (rim ? .3 : 0);
    G.set(R(x + i), R(y + j), qv(P, v, R(x + i), R(y + j)));
  }
  if (r >= 3) blob(G, x, y - ry * .35, S(1.6), S(1.6), ramp(r >= 5 ? '#fff0a0' : '#ffffff'));
}
function pixGear(cv, id, gear) {   // paint the worn gear over a drawn sprite (own outline pass, so the art keeps its edges)
  const a = ANCH[id]; if (!a) return;
  const G = new Grid(cv.width, cv.height), S = v => v * a.s, P = p => [cv.ox + p[0], cv.oy + p[1]];
  if (gear.tail !== undefined) tailG(G, gear.tail, ...P(a.tail), S);
  if (gear.armor !== undefined) plateG(G, gear.armor, ...P(a.back), S(a.back[2]), S);
  if (gear.collar !== undefined) collarG(G, gear.collar, ...P(a.neck), S);
  if (gear.claw !== undefined) clawG(G, gear.claw, ...P(a.paw), S);
  if (gear.horn !== undefined) { if (a.horns) circletG(G, gear.horn, ...P(a.brow), S); else hornG(G, 'gear', RAR[gear.horn].c, ...P(a.head), S, gear.horn); }
  if (gear.rune !== undefined) runeG(G, gear.rune, ...P(a.brow), S);
  G.selOutline();
  cv.getContext('2d').drawImage(G.canvas(), 0, 0);
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
function formIcon(id, sil) {   // portrait thumbnail for the codex / evolution choice (drawn forms: the picture itself, CSS .sil darkens it)
  if (PIX[id]) return 'img/' + id + '.png';
  return iconURL('form' + id + (sil ? 's' : ''), () => { const s = formSprite(id, {}); return sil ? s.sil : s.cv; });
}
