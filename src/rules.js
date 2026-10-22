// ==== RULES BEGIN ====
// Pure game rules: data, formulas, combat step, actions. No DOM, no canvas, no clock (time is passed in).
// tools/sim.js slices this block out of index.html and runs it in Node.
const BAL = {
  G: 1.45,                                // enemy growth per enemy level
  eHp0: 40, eAtk0: 3,                     // enemy HP / ATK at level 1
  tierLv: [1, 3, 5, 8], bossLv: 10,
  bossHp: 30, bossAtk: .8, bossTime: 45,
  A0: 5, H0: 50, eq0: 7, eqG: 1.15, rarMul: 1.6, hpK: 5,
  lvG: 1.07,
  pInt: 1.0, eInt: 2.0, regen: .04, bossRegen: .01,
  crit0: .05, critD0: 1.0, respawn: 4,
  xp0: 20, D: [10, 16, 22, 30, 40, 55, 75, 100], gold0: 2,
  evoMul: 2.5,
  // stage s -> s+1 needs: level, boss essence (boss index, -1 = none), zone materials
  evo: [{ lv: 8, boss: -1, mat: 15 }, { lv: 10, boss: 0, mat: 25 }, { lv: 24, boss: 1, mat: 90 }, { lv: 40, boss: 3, mat: 200 }, { lv: 58, boss: 5, mat: 400 }, { lv: 70, boss: 6, mat: 700 }],
  unlockKills: 10, bossUnlockKills: 15,
  matK: 8, matG: 1.06, goldK: 3,
  dropRate: 1 / 40,
  rarW: [[60, 32, 8, 0, 0, 0], [35, 40, 20, 5, 0, 0], [15, 40, 33, 11, 1, 0], [6, 30, 40, 20, 4, 0], [2, 18, 40, 30, 9, 1], [0, 10, 35, 38, 15, 2], [0, 5, 25, 42, 23, 5], [0, 2, 18, 40, 30, 10]],
  bossMinR: [1, 2, 2, 3, 3, 4, 4, 5],
  pity: 200,
  // 山海图鉴 (mastery)
  mBase: 1.015,
  mCap: [15, 60, 110, 170, 240, 320, 410, 510, 1e9],
  mileKills: [10, 50, 200, 800, 3000], mileM: [1, 2, 3, 4, 5], mSlot: 2,
  mBoss: 15, mItem: 3, mForm: 12,
  offCap: 12 * 3600, offEff: 1, offMaxRate: 8,
  nirPct: .08, nirMax: 60,
};
const SLOTS = [
  { id: 'horn', n: '角饰', k: 'atk' },
  { id: 'claw', n: '爪套', k: 'atk' },
  { id: 'collar', n: '项铃', k: 'hp' },
  { id: 'armor', n: '鳞甲', k: 'hp' },
  { id: 'tail', n: '尾饰', k: 'spd' },
  { id: 'orb', n: '灵珠', k: 'gain' },
  { id: 'rune', n: '符纹', k: 'crit' },
];
const SLOT_I = Object.fromEntries(SLOTS.map((s, i) => [s.id, i]));
// evolution forms: st = stage, next = what it can become, tr = trait (small passive)
const FORMS = {
  f0: { n: '狌狌', st: 0, next: ['f1'], tr: { spd: .05 }, td: '善走：攻速 +5%' },
  f1: { n: '类', st: 1, next: ['f2'], tr: { lvHeal: 1 }, td: '自为牝牡：升级时回满生命' },
  f2: { n: '狡', st: 2, next: ['f3a', 'f3b', 'f3c', 'f3e'], tr: { gold: .1 }, td: '见则大穰：灵玉 +10%' },
  f3a: { n: '青丘狐', line: 0, st: 3, next: ['f4a'], tr: { crit: .03 }, td: '狐火：暴击 +3%' },
  f4a: { n: '獙獙', line: 0, st: 4, next: ['f5a'], tr: { atkP: .1 }, td: '旱风：攻击 +10%' },
  f5a: { n: '乘黄', line: 0, st: 5, next: ['f6a'], tr: { regenP: .5 }, td: '长寿：回复 +50%' },
  f6a: { n: '九尾狐', line: 0, st: 6, next: [], tr: { critD: 1 }, td: '九尾：暴伤 +100%' },
  f3b: { n: '彘', line: 1, st: 3, next: ['f4b'], tr: { killHeal: .05 }, td: '食人：每杀回 5% 生命' },
  f4b: { n: '狰', line: 1, st: 4, next: ['f5b'], tr: { crit: .08 }, td: '击石之音：暴击 +8%' },
  f5b: { n: '罗罗', line: 1, st: 5, next: ['f6b'], tr: { boss: .15 }, td: '虎踞：对大妖 +15%' },
  f6b: { n: '穷奇', line: 1, st: 6, next: [], tr: { fresh: .3 }, td: '从首始食：打高血量敌人 +30%' },
  f3c: { n: '肥遗', line: 2, st: 3, next: ['f4c'], tr: { dr: .08 }, td: '鳞厚：受伤 -8%' },
  f4c: { n: '鸣蛇', line: 2, st: 4, next: ['f5c'], tr: { bossRegen: .005 }, td: '其音如磬：大妖战回复 +0.5%/秒' },
  f5c: { n: '蛟', line: 2, st: 5, next: ['f6c', 'f6d'], tr: { respawn: .5 }, td: '潜渊：复活快一倍' },
  f6c: { n: '应龙', line: 2, st: 6, next: [], tr: { flood: 1 }, td: '畜水：每 10 秒洪流一击 ×3' },
  f6d: { n: '烛龙', line: 2, st: 6, next: [], tr: { atkP: .15, hpP: .15 }, td: '昼夜：攻击、生命 +15%' },
  f3e: { n: '鹿蜀', line: 3, st: 3, next: ['f4e'], tr: { xp: .1 }, td: '宜子孙：精元 +10%' },
  f4e: { n: '夫诸', line: 3, st: 4, next: ['f5e'], tr: { regen: .01 }, td: '白鹿：每秒多回 1% 生命' },
  f5e: { n: '驺吾', line: 3, st: 5, next: ['f6e'], tr: { offline: .2 }, td: '日行千里：离线 +20%' },
  f6e: { n: '白泽', line: 3, st: 6, next: [], tr: { drop: .25 }, td: '知万物：掉装备 +25%' },
};
// ------------------------------------------------------------ formulas
const eLv = (z, t) => 10 * z + (t === 4 ? BAL.bossLv : BAL.tierLv[t]);
function enemyStats(z, t) {
  const L = eLv(z, t), g = Math.pow(BAL.G, L - 1);
  let hp = BAL.eHp0 * g, atk = BAL.eAtk0 * g;
  if (t === 4) { hp *= BAL.bossHp; atk *= BAL.bossAtk; }
  return { L, hp, atk, xp: BAL.xp0 * g / BAL.D[z] * (t === 4 ? 20 : 1), gold: BAL.gold0 * g * (t === 4 ? 20 : 1) };
}
function needXp(lv) { return BAL.xp0 * Math.pow(BAL.G, lv - 1); }
const EQ = (l, r) => BAL.eq0 * Math.pow(BAL.eqG, l) * Math.pow(BAL.rarMul, r);
function slotVal(slot, r, l) {   // what an equipped item gives, by rarity r (0..5) and slot level l
  if (r < 0) return {};
  const k = SLOTS[SLOT_I[slot]].k, e = EQ(l, r);
  if (k === 'atk') return { atkF: e };
  if (k === 'hp') return { hpF: e * BAL.hpK };
  if (k === 'spd') return { atkF: e * .5, spd: .05 + .04 * r + .005 * l, crit: .01 * r + .001 * l };
  if (k === 'gain') return { atkF: e * .5, xp: .1 + .1 * r + .01 * l, gold: .1 + .1 * r + .01 * l };
  return { hpF: e * BAL.hpK * .5, critD: .2 + .15 * r + .01 * l, boss: .1 + .1 * r + .01 * l };
}
const slotCap = S => 10 * (Object.keys(S.bossWins).length + 1);
function slotCost(slot, l) {   // upgrading slot level l -> l + 1; materials of zone floor(l / 10)
  return { gold: BAL.goldK * BAL.gold0 * Math.pow(BAL.G, l), mat: Math.ceil(BAL.matK * Math.pow(BAL.matG, l) * (l < 4 ? (l + 2) / 6 : 1)), z: Math.min(7, Math.floor(l / 10)) };
}
// ------------------------------------------------------------ state
function newState() {
  const S = {
    v: 1, t: 0,
    lv: 1, xp: 0, gold: 0, mats: [0, 0, 0, 0, 0, 0, 0, 0],
    stage: 0, form: 'f0', forms: { f0: 1 },
    slots: Object.fromEntries(SLOTS.map(s => [s.id, { r: -1, l: 0 }])),
    items: {},                  // owned items "slot:r" -> 1
    kills: {},                  // species "z-t" -> count (t = 4: boss)
    zone: 0, tier: 0, maxZone: 0, unlocked: [[1, 0, 0, 0, 0]], auto: true,
    bossWins: {}, pity: 0, souls: 0, nirCount: 0, bestLv: 1,
    f: null, hp: -1, dead: 0, calm: 0,
    stats: { kills: 0, deaths: 0, bossTries: 0, play: 0 },
  };
  S.items['claw:0'] = 1; S.slots.claw.r = 0;   // a plain claw to start with
  return S;
}
const SP = (z, t) => z + '-' + t;
function mastery(S) {
  let m = 0;
  for (const k in S.kills) { const n = S.kills[k]; for (let i = 0; i < BAL.mileKills.length; i++) if (n >= BAL.mileKills[i]) m += BAL.mileM[i]; }
  m += Object.keys(S.bossWins).length * BAL.mBoss;
  m += Object.keys(S.items).length * BAL.mItem;
  m += Object.keys(S.forms).length * BAL.mForm;
  for (const k in S.slots) m += Math.floor(S.slots[k].l / 10) * BAL.mSlot;
  return m;
}
function mCap(S) { return BAL.mCap[Math.min(Object.keys(S.bossWins).length, BAL.mCap.length - 1)]; }
function derive(S) {
  const tr = (FORMS[S.form] || FORMS.f0).tr;
  const a = { atkF: 0, hpF: 0, spd: tr.spd || 0, crit: tr.crit || 0, critD: tr.critD || 0, xp: tr.xp || 0, gold: tr.gold || 0, boss: tr.boss || 0 };
  for (const sl of SLOTS) { const v = slotVal(sl.id, S.slots[sl.id].r, S.slots[sl.id].l); for (const k in v) a[k] += v[k]; }
  const M = mastery(S), Me = Math.min(M, mCap(S)), MM = Math.pow(BAL.mBase, Me);
  const nir = 1 + Math.min(BAL.nirMax, S.souls) * BAL.nirPct;
  const lvM = Math.pow(BAL.lvG, S.lv - 1), evo = Math.pow(BAL.evoMul, S.stage);
  const atk = (BAL.A0 + a.atkF) * lvM * evo * MM * nir * (1 + (tr.atkP || 0));
  const hp = (BAL.H0 + a.hpF) * lvM * evo * MM * nir * (1 + (tr.hpP || 0));
  const spd = Math.min(1.5, a.spd), crit = Math.min(.6, BAL.crit0 + a.crit), critD = BAL.critD0 + a.critD;
  const dps = atk / (BAL.pInt / (1 + spd)) * (1 + crit * critD);
  return {
    tr, regen: BAL.regen * (1 + (tr.regenP || 0)) + (tr.regen || 0), bossRegen: BAL.bossRegen * (1 + (tr.regenP || 0)) + (tr.bossRegen || 0),
    atk, hp, spd, crit, critD, boss: a.boss, xp: 1 + a.xp + (nir - 1), gold: 1 + a.gold + (nir - 1), mat: 1 + (nir - 1) * .2, M, Me, MM, cap: mCap(S),
    dps, power: Math.pow(dps, .6) * Math.pow(hp, .4) * 2, parts: { lv: lvM, evo, gearA: (BAL.A0 + a.atkF) / BAL.A0, gearH: (BAL.H0 + a.hpF) / BAL.H0, MM, nir },
  };
}
// ------------------------------------------------------------ combat
function spawn(S, z, t) {
  const e = enemyStats(z, t);
  S.f = { z, t, hp: e.hp, max: e.hp, atk: e.atk, pT: 0, eT: BAL.eInt * .5, time: 0, hits: 0, shield: 0, heads: t === 4 && z === 5 ? 9 : 1, rev: t === 4 && z === 6 ? 1 : 0, daze: 0, moon: false, poison: 0 };
}
function canFight(S, z, t) { return z <= S.maxZone && !!S.unlocked[z] && !!S.unlocked[z][t]; }
let rnd = Math.random;
function setRnd(fn) { rnd = fn; }
// Advance the fight by dt seconds. E(type, data) receives events for the UI / sim.
function step(S, dt, E, D) {
  E = E || (() => {}); D = D || derive(S);
  S.t += dt;
  if (S.hp < 0 || S.hp > D.hp) S.hp = D.hp;
  if (S.dead > 0) { S.dead -= dt; if (S.dead <= 0) { S.hp = D.hp; S.f = null; } return; }
  if (!S.f) { spawn(S, S.zone, S.tier); E('spawn', S.f); }
  const f = S.f, boss = f.t === 4;
  if (!(f.poison > 0)) S.hp = Math.min(D.hp, S.hp + D.hp * (boss ? D.bossRegen : D.regen) * dt);
  f.time += dt;
  if (boss) {
    if (f.time > BAL.bossTime) { bossFail(S, E, 'time'); return; }
    const tick = p => Math.floor(f.time / p) > Math.floor((f.time - dt) / p);
    if (f.z === 1 && tick(10)) { f.hp = Math.min(f.max, f.hp + f.max * .03); E('bheal', null); }      // 帝江: dances, heals
    if (f.z === 4 && tick(12)) { f.daze = 1; E('daze', null); }                                       // 马腹: next hit misses
    if (f.z === 7 && tick(15)) { f.moon = !f.moon; E('phase', f.moon); }                               // 夔: sun / moon
    if (f.z === 7 && f.moon) f.hp = Math.min(f.max, f.hp + f.max * .02 * dt);
    if (f.poison > 0) f.poison -= dt;
  }
  f.pT += dt;
  const pInt = BAL.pInt / (1 + D.spd);
  while (f.pT >= pInt && S.f === f) {
    f.pT -= pInt;
    if (f.daze) { f.daze = 0; E('miss', null); continue; }
    const flood = D.tr.flood && Math.floor(f.time / 10) > (f.flood || 0);
    if (flood) f.flood = Math.floor(f.time / 10);
    const cr = rnd() < D.crit && !(boss && f.z === 1);                                                  // 帝江 has no face: no crits
    let dmg = D.atk * (cr ? 1 + D.critD : 1) * (.9 + rnd() * .2) * (boss ? 1 + D.boss : 1) * (flood ? 3 : 1) * (D.tr.fresh && f.hp > f.max * .8 ? 1 + D.tr.fresh : 1);
    if (f.shield > 0) { const a = Math.min(f.shield, dmg); f.shield -= a; dmg -= a; }
    f.hp -= dmg; E('hit', { dmg, cr, flood });
    if (f.hp <= 0) {
      if (f.rev > 0) { f.rev--; f.hp = f.max * .3; E('revive', null); continue; }    // 窫窳: elixir of undeath
      kill(S, E, D); return;
    }
  }
  f.eT += dt;
  const eInt = BAL.eInt * (boss && f.z === 3 && f.hp < f.max * .5 ? .5 : 1);
  while (f.eT >= eInt && S.f === f) {
    f.eT -= eInt; f.hits++;
    let dmg = f.atk * (.95 + rnd() * .1);
    let heavy = false;
    if (boss) {
      if (f.z === 0 && f.hits % 4 === 0) { dmg *= 3; heavy = true; }      // 蛊雕: every 4th strike, x3
      if (f.z === 2) dmg *= 1 + f.hits * .05;                              // 狍鸮: greed grows with every bite
      if (f.z === 7 && !f.moon) dmg *= 1.5;                                // 夔: sun phase
    }
    dmg *= 1 - (D.tr.dr || 0);
    S.hp -= dmg; E('hurt', { dmg, heavy });
    if (S.hp <= 0) { die(S, E); return; }
  }
  if (boss && f.z === 5) { const h = Math.max(1, Math.ceil(f.hp / f.max * 9)); if (h < f.heads) { f.heads = h; f.poison = 3; E('head', h); } }   // 相柳: each head lost spits poison, no regen 3 s
}
function die(S, E) {
  S.stats.deaths++;
  const f = S.f; S.f = null; S.dead = BAL.respawn * (1 - (derive(S).tr.respawn || 0)); S.hp = 0;
  if (f.t === 4) { S.tier = 3; E('bossFail', { z: f.z, why: 'dead' }); return; }
  E('death', { z: f.z, t: f.t });
  if (S.auto && S.tier > 0) S.tier--;
  S.calm = 60;
}
function bossFail(S, E, why) { const z = S.f.z; S.f = null; S.tier = 3; E('bossFail', { z, why }); }
function kill(S, E, D) {
  const f = S.f, e = enemyStats(f.z, f.t), sp = SP(f.z, f.t);
  S.kills[sp] = (S.kills[sp] || 0) + 1; S.stats.kills++;
  const xp = e.xp * D.xp, gd = e.gold * D.gold, m0 = (f.t === 4 ? 30 : 1) * D.mat, mat = Math.floor(m0) + (rnd() < m0 % 1 ? 1 : 0);
  S.xp += xp; S.gold += gd; S.mats[f.z] += mat;
  if (D.tr.killHeal) S.hp = Math.min(D.hp, S.hp + D.hp * D.tr.killHeal);
  S.f = null;
  E('kill', { z: f.z, t: f.t, xp, gold: gd, mat });
  levelUp(S, E, D);
  const u = S.unlocked[f.z];
  if (f.t < 3 && !u[f.t + 1] && S.kills[sp] >= BAL.unlockKills) { u[f.t + 1] = 1; E('unlock', { z: f.z, t: f.t + 1 }); }
  if (f.t === 3 && !u[4] && S.kills[sp] >= BAL.bossUnlockKills) { u[4] = 1; E('unlock', { z: f.z, t: 4 }); }
  S.pity++;
  if (f.t === 4) {
    const first = !S.bossWins[f.z];
    S.bossWins[f.z] = (S.bossWins[f.z] || 0) + 1;
    dropItem(S, E, f.z, first ? BAL.bossMinR[f.z] : 0);
    if (first && f.z < 7) { S.maxZone = Math.max(S.maxZone, f.z + 1); if (!S.unlocked[f.z + 1]) S.unlocked[f.z + 1] = [1, 0, 0, 0, 0]; }
    E('bossWin', { z: f.z, first });
    S.tier = 3;
    if (first && f.z < 7) { S.zone = f.z + 1; S.tier = 0; }
    return;
  }
  if (rnd() < BAL.dropRate * (1 + (D.tr.drop || 0))) dropItem(S, E, f.z, -1);
  if (S.calm > 0) S.calm -= 1;
  if (S.auto && S.zone === f.z && S.tier < 3 && u[S.tier + 1] && S.calm <= 0) S.tier++;
}
function levelUp(S, E, D) {
  while (S.xp >= needXp(S.lv)) { S.xp -= needXp(S.lv); S.lv++; S.bestLv = Math.max(S.bestLv, S.lv); if (D && D.tr.lvHeal) S.hp = -1; E('level', S.lv); }
}
function rollRarity(z) { const w = BAL.rarW[z]; const s = w.reduce((a, b) => a + b, 0); let x = rnd() * s; for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return 0; }
function dropItem(S, E, z, minR) {
  const r = Math.max(rollRarity(z), minR);
  let slot = SLOTS[Math.floor(rnd() * SLOTS.length)].id, id = slot + ':' + r;
  if (S.items[id] || S.pity >= BAL.pity) {   // duplicate or pity: swap for an unowned item of the same rarity
    const free = SLOTS.map(s => s.id + ':' + r).filter(k => !S.items[k]);
    if (free.length) { id = free[Math.floor(rnd() * free.length)]; slot = id.split(':')[0]; }
  }
  if (S.items[id]) { const g = enemyStats(z, 3).gold * 5; S.gold += g; E('dup', { id, r, gold: g }); return; }
  S.items[id] = 1; S.pity = 0;
  const cur = S.slots[slot], better = r > cur.r;
  if (better) cur.r = r;
  E('item', { id, slot, r, better });
}
// ------------------------------------------------------------ actions
// a level band asks for its zone's material; materials of any later zone are accepted too (lowest first)
function matZone(S, c, reserve) {
  for (let z = c.z; z <= 7; z++) if (S.mats[z] - (reserve && reserve.z === z ? reserve.mat : 0) >= c.mat) return z;
  return -1;
}
function upgradeSlot(S, slot, reserve) {
  const s = S.slots[slot]; if (s.r < 0 || s.l >= slotCap(S)) return false;
  const c = slotCost(slot, s.l), z = matZone(S, c, reserve);
  if (S.gold < c.gold || z < 0) return false;
  S.gold -= c.gold; S.mats[z] -= c.mat; s.l++; return true;
}
function evoNeed(S) { const e = BAL.evo[S.stage]; return e ? { lv: e.lv, boss: e.boss, mat: e.mat, z: Math.max(0, e.boss + 1) } : null; }
function canEvolve(S) { const e = evoNeed(S); return !!e && S.lv >= e.lv && (e.boss < 0 || !!S.bossWins[e.boss]) && matZone(S, e) >= 0; }
function evolve(S, formId) {
  if (!canEvolve(S) || !(FORMS[S.form].next || []).includes(formId)) return false;
  const e = evoNeed(S); S.mats[matZone(S, e)] -= e.mat;
  S.stage++; S.form = formId; S.forms[formId] = 1; S.hp = -1;
  return true;
}
function setFight(S, z, t) { if (!canFight(S, z, t)) return false; S.zone = z; S.tier = t; S.f = null; S.calm = t === 4 ? 0 : S.calm; if (t === 4) S.stats.bossTries++; return true; }
function nirvanaSouls(S) { return Math.floor(Math.sqrt(S.bestLv * mastery(S) / 40)); }
function canNirvana(S) { return !!S.bossWins[7]; }
function nirvana(S) {
  if (!canNirvana(S)) return null;
  const N = newState();
  Object.assign(N, { items: S.items, kills: S.kills, forms: S.forms, souls: Math.min(BAL.nirMax, S.souls + nirvanaSouls(S)), nirCount: S.nirCount + 1, stats: S.stats });
  for (const id in S.items) { const [sl, r] = id.split(':'); N.slots[sl].r = Math.max(N.slots[sl].r, +r); }   // keeps gear qualities, not levels
  return N;
}
// offline: fixed kill rate on the current (non-boss) fight, only if you can win it
function offlineGain(S, secs) {
  secs = Math.min(secs, BAL.offCap);
  if (secs < 60) return null;
  const D = derive(S), t = Math.min(S.tier, 3), z = S.zone, e = enemyStats(z, t);
  const ttk = e.hp / D.dps + .4, hurt = e.atk / BAL.eInt, ok = D.hp > hurt * ttk * 1.2 || hurt < D.hp * BAL.regen;
  const rate = ok ? Math.min(BAL.offMaxRate, 60 / ttk) * BAL.offEff * (1 + (D.tr.offline || 0)) : 0;
  const n = Math.floor(rate * secs / 60);
  if (t >= 3 || S.tier === 4) S.tier = 3;
  if (!n) return { secs, n: 0 };
  const sp = SP(z, t); S.kills[sp] = (S.kills[sp] || 0) + n;
  const xp = e.xp * D.xp * n, gd = e.gold * D.gold * n;
  const lv0 = S.lv, mats = Math.floor(n * D.mat); S.xp += xp; S.gold += gd; S.mats[z] += mats; levelUp(S, () => {}, D);
  let items = 0; const drops = Math.floor(n * BAL.dropRate * .5);
  for (let i = 0; i < drops; i++) { S.pity++; if (rnd() < .5) { dropItem(S, (ty) => { if (ty === 'item') items++; }, z, -1); } }
  return { secs, n, xp, gold: gd, mat: mats, z, lv: S.lv - lv0, items };
}
// ==== RULES END ====
