// Mid-game state for UI screenshots: _test.html#window.UITAB='gear';fetch('tests/uishots.js').then(r=>r.text()).then(t=>eval(t))
(function () {
  S = fresh(); TUT.i = 99;
  S.form = 'f3'; S.stage = 3; S.lv = 30; S.maxZone = 2; S.zone = 2; S.tier = 2;
  S.unlocked = [[1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 0, 0]]; S.bossWins = { 0: 1, 1: 1 };
  ['horn', 'claw', 'collar', 'armor', 'tail', 'orb', 'rune'].forEach((k, i) => { S.slots[k] = { r: [2, 3, 2, 1, 2, 1, 2][i], l: 18 + i }; S.items[k + ':' + S.slots[k].r] = 1; });
  S.gold = 5e5; S.mats = [40, 60, 30, 0, 0, 0, 0, 0]; S.stats.kills = 900; S.forms = { f0: 1, f1: 1, f2: 1, f3: 1 };
  for (const k of ['0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '2-1']) S.kills[k] = 260;
  recalc(); S.hp = DER.hp; setTab(window.UITAB || 'beast'); renderUI();
  setTimeout(() => { advance(.6); FX.hurt = 0; FX.eHit = 0; FX.slash = 0; renderUI(); drawStage(T); present(); document.title = 'UI'; }, 600);
})();
