// ============================================================ 16:9 covers from the game's own art: index.html#cover (1920 x 1080, share image),
// #cover1600 (store cover), #coverbase (store base picture without text); tools: shot.py --hash ... --size WxH
// The face-off: the ancient beast and Kui head to head under the ten suns, a spark between them, the name below.
function renderCover() {
  if (!PIX.bg7 || !PIX.f6 || !PIX['m7-4']) { setTimeout(renderCover, 100); return; }
  FSPR.clear();
  const mode = location.hash.slice(6), SC = mode ? 5 : 6, CW = 320, CH = 180, c = mk(CW, CH), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  // sprites and background both at 2x, so every pixel is the same size
  const put2 = (cv, px, top, ox = 0, oy = 0) => { x.save(); x.translate(px - ox * 2, top - oy * 2); x.scale(2, 2); x.drawImage(cv, 0, 0); x.restore(); };
  const glow = (cx, cy, r, col, a) => { const g0 = x.createRadialGradient(cx, cy, 0, cx, cy, r); g0.addColorStop(0, col); g0.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = g0; x.fillRect(0, 0, CW, CH); x.globalAlpha = 1; };
  x.drawImage(PIX.bg7, 0, 22, 180, 90, -20, 0, 360, 180);
  put2(enemySprite(7, 4).l, 168, 2);
  const f6 = formSprite('f6', Object.fromEntries(SLOTS.map(s => [s.id, 5]))).cv;
  put2(f6, -96, -18, f6.ox, f6.oy);
  // the spark where they meet
  const sx = 166, sy = 70;
  glow(sx, sy, 70, '#fff0b0', .7); glow(sx, sy, 26, '#ffffff', .9);
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, L = i & 1 ? 14 : 26; for (let r = 5; r < L; r++) x.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * .8), 1, 1); }
  // darker ground for the name, embers in the air
  const sh = x.createLinearGradient(0, 120, 0, 180); sh.addColorStop(0, 'rgba(14,8,20,0)'); sh.addColorStop(1, 'rgba(14,8,20,.85)'); x.fillStyle = sh; x.fillRect(0, 120, CW, 60);
  const em = ['#ffd27a', '#ffffff', '#ff8a3a'];
  for (let i = 0; i < 60; i++) { x.fillStyle = em[i % 3]; x.globalAlpha = .5 + hash(i * 7 + 353) * .5; x.fillRect(Math.floor(hash(i * 7 + 3) * CW), Math.floor(40 + hash(i * 7 + 6303) * 140), hash(i * 7 + 52) > .8 ? 2 : 1, 1); }
  x.globalAlpha = 1;
  const big = mk(CW * SC, CH * SC), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, CW * SC, CH * SC);
  const title = (s, px, y, col) => { bx.font = px + 'px ' + FONT; bx.textAlign = 'center'; const u = px / 12; bx.fillStyle = OUT; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]]) bx.fillText(s, CW * SC / 2 + dx * u, y + dy * u); bx.fillStyle = col; bx.fillText(s, CW * SC / 2, y); };
  if (mode !== 'base') {
    const px = k => Math.round(k * SC / 12) * 12;   // whole multiples of the 12 px pixel font: 144 / 48 px at 1600 wide
    title('山海异兽录', px(28.8), 160 * SC, '#ffd27a');
    title('从幼崽进化成上古穷奇', px(9.6), 174 * SC, '#fff4e0');
  }
  document.body.innerHTML = ''; big.style.cssText = `position:fixed;left:0;top:0;width:${CW * SC}px;height:${CH * SC}px`; document.body.appendChild(big);
  document.title = 'COVER READY';
}
