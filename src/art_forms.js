// ------------------------------------------------------------ the player's forms: look parameters (see quadGrid / snakeGrid)
const LOOK = {
  f0: { body: '#8a7058', belly: '#d8c8b0', ears: 'round', ear: '#f4f0e8', earIn: '#e8c8c0', snout: 'short', tail: 'thin', tailTip: '#8a7058', leg: .75, size: .78, eye: '#2a1a14', pupil: 'round', eyeR: 2.7, cheek: 1 },
  f1: { body: '#c8a050', belly: '#f0e0b8', ears: 'cat', snout: 'short', mane: '#9a6a30', tail: 'fox', tailTip: '#5a4028', leg: .82, size: .86, eye: '#4a3018', pupil: 'round', eyeR: 2.6 },
  f2: { body: '#d8b048', belly: '#f4e4b8', spots: '#3a2818', ears: 'fox', snout: 'mid', horn: 'ox', hornCol: '#e8dcc0', tail: 'thin', tailTip: '#3a2818', size: .94, eye: '#c8402a' },
  f3a: { body: '#e0602a', belly: '#fff0dc', tail: 'fox', tailTip: '#ffd040', ears: 'fox', ear: '#c84a20', snout: 'long', eye: '#ffd23a' },
  f4a: { body: '#e88a3a', belly: '#fff4e0', tail: 'fox', tailTip: '#fff4e0', ears: 'fox', snout: 'long', wings: '#f8f0e0', eye: '#ffd23a', size: 1.02 },
  f5a: { body: '#e8c040', belly: '#fff4c8', tail: 'fox', tails: 3, tailTip: '#fff8e0', ears: 'fox', snout: 'long', horn: 'curl', hornCol: '#fff0c0', eye: '#ff8a3a', size: 1.06 },
  f6a: { body: '#f4ecd8', belly: '#ffffff', tail: 'fox', tails: 9, tailCol: '#f8e8c8', tailTip: '#ff8a3a', ears: 'fox', earIn: '#ff9ab0', snout: 'long', eye: '#ff6a8a', size: 1.1 },
  f3b: { body: '#e0a038', belly: '#fff0d0', stripes: '#2a1a10', tail: 'lion', tailTip: '#3a2818', ears: 'cat', snout: 'short', thick: 1, fangs: 1, eye: '#9cff5a' },
  f4b: { body: '#c84028', belly: '#f0c0a0', spots: '#5a1a10', horn: 'single', hornCol: '#f0e8d0', tail: 'thin', tails: 5, tailTip: '#5a1a10', ears: 'cat', snout: 'short', thick: 1, fangs: 1, eye: '#ffe040', size: 1.04 },
  f5b: { body: '#3a5a9a', belly: '#a8c0e0', stripes: '#18203a', tail: 'thin', tailTip: '#18203a', ears: 'cat', snout: 'short', thick: 1, fangs: 1, eye: '#ffd040', size: 1.08 },
  f6b: { body: '#e8e4dc', belly: '#ffffff', stripes: '#4a4a5a', wings: '#2a2438', mane: '#a8a0b0', tail: 'lion', tailTip: '#2a2438', ears: 'cat', snout: 'short', thick: 1, fangs: 1, eye: '#ff4a3a', size: 1.12 },
  f3c: { snake: 1, body: '#4a9a8a', belly: '#d8f0c0', legs: 6, wings: 'small4', wingCol: '#8ad0f0', size: .82, eye: '#ffde3a' },
  f4c: { snake: 1, body: '#7a9ac8', belly: '#e0e8f8', wings: 'thin4', wingCol: '#c8e0ff', crest: '#a0c0f0', size: .92, eye: '#ff8a3a' },
  f5c: { snake: 1, body: '#2a5aa0', belly: '#e8d890', legs: 4, whisk: '#e8f0ff', crest: '#4a8ad0', fangs: 1, fin: '#4a8ad0', size: 1, eye: '#ffde3a' },
  f6c: { snake: 1, body: '#2a9a8a', belly: '#f0e090', legs: 4, wings: 'big', wingCol: '#f0d870', horn: 'antler', hornCol: '#f8f0d0', whisk: '#ffffff', mane: '#f0e0a0', fangs: 1, size: 1.1, eye: '#ffde3a' },
  f6d: { snake: 1, body: '#c03028', belly: '#f0a060', face: 'human', skin: '#f4c8a0', mane: '#3a1a18', candle: 1, size: 1.12, thick: 1.1, eye: '#ffde3a' },
  f3e: { body: '#a0683a', belly: '#e8c8a0', headCol: '#f4f0e8', stripes: '#3a2010', tail: 'lion', tailCol: '#d03a2a', tailTip: '#e04a3a', hoof: '#3a2a20', ears: 'fox', snout: 'long', mane: '#f4f0e8', eye: '#3a2010', pupil: 'round', leg: 1.08 },
  f4e: { body: '#f0ece4', belly: '#ffffff', horn: 'antler', hornCol: '#d8c8a8', hoof: '#8a7a6a', ears: 'long', snout: 'mid', tail: 'stub', tailTip: '#ffffff', eye: '#3a6ac0', pupil: 'round', leg: 1.12, size: 1.04 },
  f5e: { body: '#e8a040', belly: '#fff0d0', stripes: ['#3a6ac0', '#c03a3a', '#3a9a48', '#2a1a10', '#f0f0f0'], tail: 'thin', tailLen: 1.6, tailTip: '#c03a3a', ears: 'cat', snout: 'short', mane: '#d04a3a', thick: 1, eye: '#ffe040', size: 1.08 },
  f6e: { body: '#f4f0e8', belly: '#ffffff', horn: 'twin', hornCol: '#a8c8f0', mane: '#dfe8ff', beard: '#ffffff', tail: 'lion', tailTip: '#c8d8f0', ears: 'long', snout: 'mid', eye: '#5ac8ff', thick: 1, size: 1.12 },
};
// sprite for a form wearing gear: cached by form + rarities
const FSPR = new Map();
function gearKey(S) { return SLOTS.map(s => S.slots[s.id].r).join(','); }
function formSprite(id, gearR) {   // gearR: { horn: r, ... } (rarity or undefined)
  const key = id + '|' + JSON.stringify(gearR || {});
  let c = FSPR.get(key); if (c) return c;
  if (FSPR.size > 40) FSPR.clear();
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
