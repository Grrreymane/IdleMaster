// ============================================================ 16:9 share cover: index.html#cover, then tools shot.py -> cover.png (1920 x 1080)
function renderCover() {
  const CW = 320, CH = 180, SC = 6, c = mk(CW, CH), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const sky = ['#2a1240', '#5a2a5a', '#a04a50', '#e88a5a'];
  sky.forEach((col, i) => { x.fillStyle = col; x.fillRect(0, i * 34, CW, 34); });
  for (let i = 0; i < 60; i++) { x.fillStyle = i & 1 ? '#fff4d0' : '#c8b0ff'; x.fillRect(Math.floor(hash(i * 3 + 7) * CW), Math.floor(hash(i * 5 + 1) * 70), 1, 1); }
  x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(250, 46, 18, 0, 7); x.fill(); x.fillStyle = '#ffe8a8'; x.beginPath(); x.arc(246, 42, 12, 0, 7); x.fill();
  const layer = (base, amp, freq, col, seed) => { for (let xx = 0; xx < CW; xx++) { const top = Math.round(base + ridge(xx, seed, amp, freq)); x.fillStyle = col; x.fillRect(xx, top, 1, CH - top); x.fillStyle = shade(col, 20); x.fillRect(xx, top, 1, 1); } };
  layer(110, 18, .03, '#5a3a6a', 3); layer(134, 10, .05, '#3a2448', 5); layer(156, 5, .08, '#24162e', 9);
  x.fillStyle = '#1a1020'; x.fillRect(0, 168, CW, 12);
  const put = (id, gear, px, py, s, flip) => { const sp = formSprite(id, gear); x.save(); x.translate(px, py); if (flip) { x.scale(-1, 1); } x.drawImage(sp.cv, 0, 0, sp.w * s, sp.h * s); x.restore(); };
  const full = { collar: 5, armor: 4, claw: 5, rune: 5 };
  put('f6c', { claw: 4, collar: 3 }, 0, 58, 1.05, false);
  put('f6a', full, 120, 80, .95, false);
  put('f6e', { collar: 4, rune: 5 }, 322, 86, .9, true);
  const big = mk(CW * SC, CH * SC), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, CW * SC, CH * SC);
  const title = (s, px, y, col) => { bx.font = px + 'px ' + FONT; bx.textAlign = 'center'; const u = px / 12; bx.fillStyle = OUT; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) bx.fillText(s, 960 + dx * u * 1.5, y + dy * u * 1.5); bx.fillStyle = col; bx.fillText(s, 960, y); };
  title('山海异兽录', 168, 230, '#ffd27a');
  title('吞噬 · 进化 · 成为上古神兽', 60, 320, '#f3ead8');
  document.body.innerHTML = ''; big.style.cssText = 'position:fixed;left:0;top:0;width:1920px;height:1080px'; document.body.appendChild(big);
  document.title = 'COVER READY';
}
