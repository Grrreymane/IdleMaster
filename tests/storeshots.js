// Store-page screenshots from the real game UI: _test.html#window.SHOT='boss';fetch('tests/storeshots.js').then(r=>r.text()).then(t=>eval(t))
//   SHOT: cub (first minutes), gear (mid game, gear pane), evolve (evolution card), book (codex), boss (last form vs the last great demon)
// Shot with shot.py --size 500x1082 --dpr 1.5 (a phone-shaped window); nothing is saved (saveGame is switched off).
(function () {
  saveGame = () => {}; TUT.i = 99;
  const shot = window.SHOT || 'gear', all = ['horn', 'claw', 'collar', 'armor', 'tail', 'orb', 'rune'];
  const wear = rs => all.forEach((k, i) => { const r = rs[i]; if (r >= 0) { S.slots[k] = { r, l: 10 + r * 9 + i }; for (let q = 0; q <= r; q++) S.items[k + ':' + q] = 1; } });
  const killsUpTo = (zMax, n) => { for (let z = 0; z <= zMax; z++) for (let t = 0; t < 4; t++) S.kills[z + '-' + t] = n; };
  S = fresh();
  if (shot === 'cub') {
    S.lv = 4; S.stats.kills = 6; S.gold = 180; S.mats[0] = 14; wear([-1, 0, 0, -1, -1, -1, -1]); killsUpTo(0, 2); S.unlocked[0] = [1, 1, 0, 0, 0]; S.tier = 1;
  } else {
    const n = shot === 'boss' ? 6 : shot === 'book' ? 4 : 3;
    S.form = 'f' + n; S.stage = n; for (let i = 0; i <= n; i++) S.forms['f' + i] = 1;
    S.lv = [0, 0, 0, 30, 48, 0, 88][n]; S.maxZone = n === 6 ? 7 : n === 4 ? 4 : 2; S.zone = S.maxZone; S.tier = 2;
    for (let z = 0; z <= S.maxZone; z++) S.unlocked[z] = z < S.maxZone ? [1, 1, 1, 1, 1] : [1, 1, 1, 0, 0];
    for (let z = 0; z < S.maxZone; z++) S.bossWins[z] = 1;
    wear(n === 6 ? [5, 5, 4, 5, 4, 5, 5] : n === 4 ? [3, 4, 3, 3, 2, 3, 3] : [2, 3, 2, 1, 2, 1, 2]);
    killsUpTo(S.maxZone, 260); for (let z = 0; z < S.maxZone; z++) S.kills[z + '-4'] = 3;
    S.gold = [0, 0, 0, 5e5, 8e7, 0, 3e12][n]; S.mats = S.mats.map((m, z) => z <= S.maxZone ? 40 + z * 7 : 0); S.stats.kills = 2400;
  }
  recalc(); S.hp = DER.hp;
  if (shot === 'boss') { S.unlocked[7][4] = 1; spawn(S, 7, 4); S.f.time = 8; S.f.hp = S.f.max * .46; }
  setTab({ cub: 'beast', gear: 'gear', evolve: 'beast', book: 'book', boss: 'map' }[shot]); renderUI();
  setTimeout(() => {
    advance(.5); FX.hurt = 0; FX.eHit = 0; FX.eIn = 0; S.hp = DER.hp;
    document.getElementById('toast').innerHTML = '';
    if (shot === 'evolve') { S.lv = 48; S.mats = S.mats.map(m => m + 999); S.bossWins[2] = 1; S.bossWins[3] = 1; recalc(); if (canEvolve(S)) chooseEvolve(); FX.evo = 0; }
    renderUI(); drawStage(T); present(); document.title = 'SHOT ' + shot;
  }, 700);
})();
