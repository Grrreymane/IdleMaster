// Draw the stage in fixed animation states side by side (lunge, slash, crit slash, death, walk-in)
(function () {
  S = fresh(); S.form = 'f3'; S.stage = 3; S.lv = 30; recalc(); S.hp = DER.hp;
  setTimeout(() => {
    advance(.05);
    const st = [
      () => { FX.lunge = LUNGE * .4; },
      () => { FX.slash = SLASH * .55; FX.slashCr = false; FX.eHit = .08; },
      () => { FX.slash = SLASH * .55; FX.slashCr = true; FX.eHit = .08; },
      () => { const e = enemySprite(S.f.z, S.f.t); FX.eDie = EDIE * .5; FX.eDieSpr = e; FX.eDieX = W - 4 - e.w; FX.eIn = EIN * .6; },
      () => { FX.hurt = .18; },
    ];
    const sheet = mk(W * st.length, H), sx = sheet.getContext('2d');
    st.forEach((f, i) => { for (const k of ['lunge', 'slash', 'eHit', 'eDie', 'eIn', 'hurt']) FX[k] = 0; f(); drawStage(T); sx.drawImage(low, i * W, 0); });
    document.body.innerHTML = ''; sheet.style.cssText = 'width:' + sheet.width * 3 + 'px;image-rendering:pixelated'; document.body.appendChild(sheet); document.title = 'FX';
  }, 900);
})();
