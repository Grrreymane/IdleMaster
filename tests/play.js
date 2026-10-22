// In-browser playthrough: _test.html#fetch('tests/play.js?'+Date.now()).then(r=>r.text()).then(eval)
// Plays with the real UI functions (allUp, doEvolve, bossOdds) and sweeps every pane for render errors.
(function () {
  const H = +(window.PLAY_H || 30), out = [], t0 = performance.now();
  S = fresh(); recalc();
  let t = 0, errs = 0; const clear = {}, evo = {};
  const sweep = () => { for (const tb of TABS) { if (!tb.open()) continue; try { TAB = tb.id; renderPane(); } catch (e) { errs++; out.push('RENDER ' + tb.id + ' ' + e.message); } } try { renderHud(); renderGoal(); renderTabs(); renderOver(); } catch (e) { errs++; out.push('UI ' + e.message); } };
  while (t < H * 3600) {
    advance(5); t += 5;
    if (t % 20 === 0) {
      allUp();
      if (canEvolve(S)) { const nx = FORMS[S.form].next; doEvolve(nx[nx.length - 1]); evo[S.stage] = t; }
      const z = S.maxZone, u = S.unlocked[z];
      if (u && u[4] && !S.bossWins[z] && !(S.f && S.f.t === 4) && bossOdds(z) >= .5) { bossPre = DER; setFight(S, z, 4); }
      if (S.zone < S.maxZone && !(S.f && S.f.t === 4)) { setFight(S, S.maxZone, 0); }
      for (const k in S.bossWins) if (!clear[k]) clear[k] = t;
      closeModal();
    }
    if (t % 600 === 0) sweep();
    if (S.bossWins[7]) { for (const k in S.bossWins) if (!clear[k]) clear[k] = t; break; }
  }
  const f = s => (s / 3600).toFixed(2) + 'h';
  out.unshift(`play ${H}h: bosses ${Object.keys(clear).map(k => k + '@' + f(clear[k])).join(' ')} | evo ${Object.keys(evo).map(k => k + '@' + f(evo[k])).join(' ')} | Lv${S.lv} form ${S.form} M ${DER.M} deaths ${S.stats.deaths} errs ${errs} | ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  if (window.KEEP) { document.title = 'DONE'; window.RES = out.join(' / '); TAB = 'beast'; renderUI(); return; }
  document.body.innerHTML = '<pre id="res" style="color:#fff;font:14px monospace;white-space:pre-wrap">' + out.join('\n') + '</pre>';
  document.title = 'DONE';
})();
