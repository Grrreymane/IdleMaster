// ============================================================ 16:9 covers from the game's own art: index.html#cover (1920 x 1080, share image),
// #cover1600 (store cover), #coverbase (store base picture without text); tools: shot.py --hash ... --size WxH
function renderCover() {
  const mode = location.hash.slice(6), SC = mode ? 5 : 6, CW = 320, CH = 180, c = mk(CW, CH), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  // the Kunlun sunset, twice as coarse as the beasts so it sits back; the stage's own rocky ground in front at full detail
  const bg = PIX.bg1 || bgFor(1);
  x.drawImage(bg, 0, 0, 180, 92, -20, 0, 360, 184);
  const gr = mk(180, 34), gx = gr.getContext('2d'); gx.drawImage(bg, 0, 126, 180, 34, 0, 0, 180, 34);
  x.drawImage(gr, 0, 148); x.save(); x.translate(360, 148); x.scale(-1, 1); x.drawImage(gr, 0, 0); x.restore();
  x.fillStyle = 'rgba(20,10,30,.18)'; x.fillRect(0, 0, CW, 60);   // a touch darker behind the title
  const put = (id, gear, px, foot, flip, orb) => {
    const sp = formSprite(id, gear), y = foot - sp.gy;
    x.globalAlpha = .3; x.fillStyle = '#000'; x.fillRect(px + 20, foot - 1, sp.w - 40, 3); x.globalAlpha = 1;
    x.save(); x.translate(flip ? px + sp.w : px, y); if (flip) x.scale(-1, 1); x.drawImage(sp.cv, 0, 0); x.restore();
    if (orb !== undefined && sp.A.orb) { const ox = flip ? px + sp.w - sp.A.orb[0] : px + sp.A.orb[0], oy = y + sp.A.orb[1], col = ORB_COL[orb], g0 = g; g = x; g.globalAlpha = .3; disc(ox, oy, 6, col); g.globalAlpha = 1; disc(ox, oy, 3.2, shade(col, -30)); disc(ox - .5, oy - .5, 2.4, col); g = g0; }
  };
  const full = r => Object.fromEntries(SLOTS.map(s => [s.id, r]));
  put('f6', full(5), -14, 176, false, 5);
  put('f3', Object.assign(full(3), { orb: undefined }), 140, 176, false, 3);
  put('f0', { collar: 1, horn: 1 }, 226, 176, true);
  const big = mk(CW * SC, CH * SC), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, CW * SC, CH * SC);
  const title = (s, px, cx, y, col) => { bx.font = px + 'px ' + FONT; bx.textAlign = 'center'; const u = px / 12; bx.fillStyle = OUT; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]]) bx.fillText(s, cx + dx * u, y + dy * u); bx.fillStyle = col; bx.fillText(s, cx, y); };
  if (mode !== 'base') {
    title('山海异兽录', 28 * SC, 160 * SC, 34 * SC, '#ffd27a');
    title('从幼崽进化成上古穷奇', 10 * SC, 160 * SC, 50 * SC, '#fff4e0');
  }
  document.body.innerHTML = ''; big.style.cssText = `position:fixed;left:0;top:0;width:${CW * SC}px;height:${CH * SC}px`; document.body.appendChild(big);
  document.title = 'COVER READY';
}
