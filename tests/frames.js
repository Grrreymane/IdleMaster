// Frame strip for checking animation: _test.html#window.FR={form:'f0',n:24,dt:.05};fetch('tests/frames.js').then(r=>r.text()).then(t=>eval(t))
(function () {
  const o = window.FR || {}, n = o.n || 24, dt = o.dt || .05, cols = 6;
  S = fresh(); S.form = o.form || 'f0'; S.stage = +S.form.slice(1); S.lv = o.lv || 6; recalc(); S.hp = DER.hp;
  const sheet = mk(W * cols, Math.ceil(n / cols) * H), sx = sheet.getContext('2d');
  setTimeout(() => {
    for (let i = 0; i < n; i++) {
      advance(dt); T += dt; updateFX(dt); drawStage(T);
      sx.drawImage(low, (i % cols) * W, Math.floor(i / cols) * H);
    }
    document.body.innerHTML = ''; sheet.style.cssText = 'width:' + sheet.width * 2 + 'px;image-rendering:pixelated'; document.body.appendChild(sheet); document.title = 'FRAMES';
  }, 900);
})();
