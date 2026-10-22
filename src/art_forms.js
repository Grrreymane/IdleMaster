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
const ART_FILES = [];
const PIX = {};
function loadPix() {
  for (const k of ART_FILES) {
    const im = new Image();
    im.onload = () => { PIX[k] = im; FSPR.clear(); for (const e in ESPR) delete ESPR[e]; for (const i in ICONS) if (i.startsWith('form')) delete ICONS[i]; };
    im.src = 'img/' + k + '.png';
  }
}
function pixCanvas(im) {   // an image as a sprite canvas: centred on the QW box, feet on GY
  const w = Math.max(QW, im.width), c = mk(w, QH), x = c.getContext('2d');
  x.drawImage(im, Math.round((w - im.width) / 2), GY + 1 - im.height); return c;
}
function gearKey(S) { return SLOTS.map(s => S.slots[s.id].r).join(','); }
function formSprite(id, gearR) {   // gearR: { horn: r, ... } (rarity or undefined)
  const key = id + '|' + JSON.stringify(gearR || {});
  let c = FSPR.get(key); if (c) return c;
  if (FSPR.size > 40) FSPR.clear();
  if (PIX[id]) { const cv = pixCanvas(PIX[id]); c = { cv, A: {}, w: cv.width, h: cv.height, sil: tintC(cv, '#2a2038'), white: tintC(cv, '#ffffff') }; FSPR.set(key, c); return c; }
  const f = LOOK[id] || LOOK.f0, g = Object.assign({}, gearR || {}); delete g.orb;
  const out = f.snake ? snakeGrid(f, g) : quadGrid(f, g);
  out.G.selOutline();
  const cv = out.G.canvas(), x = cv.getContext('2d');
  if (out.whisk) {   // 1px whiskers after the outline pass (WORKFLOW 2: thin details go straight onto the canvas)
    const [[wx, wy], col] = out.whisk; x.fillStyle = col;
    for (let k = 0; k < 14; k++) { x.fillRect(R(wx + k), R(wy + Math.sin(k * .45) * 2 + k * .25), 1, 1); x.fillRect(R(wx + k * .9), R(wy + 3 + Math.sin(k * .45 + 1) * 2 + k * .35), 1, 1); }
  }
  // breathing: split at the leg line so the body can rise a pixel
  c = { cv, A: out.A, w: cv.width, h: cv.height, sil: tintC(cv, '#2a2038'), white: tintC(cv, '#ffffff') };
  FSPR.set(key, c); return c;
}
function gearOf(S) { const g = {}; for (const s of SLOTS) if (S.slots[s.id].r >= 0) g[s.id] = S.slots[s.id].r; return g; }
// ------------------------------------------------------------ small icons (DOM uses them as data URLs)
const ICONS = {};
function iconURL(k, make) { return ICONS[k] || (ICONS[k] = make().toDataURL()); }
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
function formIcon(id, sil) {   // portrait thumbnail for the codex / evolution choice
  return iconURL('form' + id + (sil ? 's' : ''), () => { const s = formSprite(id, {}); return sil ? s.sil : s.cv; });
}
