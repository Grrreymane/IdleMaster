#!/usr/bin/env node
// Headless balance simulator for 山海异兽录.
// Runs the real rules block (between "==== RULES BEGIN/END" in index.html) with simulated players.
//   node tools/sim.js [--hours 48] [--seeds 6] [--who active,normal,idle] [--trace] [--nir 2]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const HOURS = +arg('hours', 60), SEEDS = +arg('seeds', 6), WHO = arg('who', 'active,normal,idle').split(','), TRACE = process.argv.includes('--trace');
const NIR = +arg('nir', 0);
const SRC = arg('src', path.join(__dirname, '..', 'index.html'));

function loadRules(seed) {
  const html = fs.readFileSync(SRC, 'utf8');
  const a = html.indexOf('// ==== RULES BEGIN'), b = html.indexOf('// ==== RULES END');
  const code = html.slice(a, b);
  const ctx = { Math, console };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;this.R = { BAL, SLOTS, newState, derive, step, setRnd, upgradeSlot, matZone, slotCost, slotCap, evoNeed, canEvolve, evolve, setFight, canFight, offlineGain, nirvana, canNirvana, nirvanaSouls, enemyStats, mastery, FORMS: typeof FORMS !== "undefined" ? FORMS : null };', ctx);
  let s = seed >>> 0;
  ctx.R.setRnd(() => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; });
  return ctx.R;
}

// online schedule: returns true if the player is "online" at time t (seconds)
const SCHED = {
  active: t => { const d = t % 86400; return d < 16 * 3600 && (d % 7200) < 2700; },      // 45 of every 120 min while awake: 6 h/day
  normal: t => { const d = t % 86400; return d < 16 * 3600 && (d % 7200) < 900; },       // 15 min every 2 h: 2 h/day
  idle: t => { const d = t % 86400; return d < 16 * 3600 && (d % 14400) < 300; },        // 5 min every 4 h: 20 min/day
};

function run(who, seed, nirRuns) {
  const R = loadRules(seed * 7919 + who.length);
  let S = R.newState();
  const DT = .1, T = HOURS * 3600, online = SCHED[who];
  let D = R.derive(S), dirty = false, t = 0, offSince = null;
  const log = { runs: [{}], zone: {}, evo: [], boss: {}, deaths: 0, bossFails: 0, ups: [], nir: [], power: [], firstMin: [] };
  let lastPow = 0, lastAct = -1e9, bossWait = 0, lastBossPow = 0;
  const E = (type, d) => {
    if (type === 'kill' || type === 'level' || type === 'item') dirty = true;
    if (type === 'level' || type === 'item') log.firstMin.push(t);
    if (type === 'death') log.deaths++;
    if (type === 'bossFail') { log.bossFails++; log.boss[d.z] = log.boss[d.z] || { tries: 0 }; log.boss[d.z].tries++; }
    if (type === 'bossWin' && d.first) {
      log.runs[log.runs.length - 1][d.z] = t - runStart;
      if (log.runs.length > 1) return;
      log.boss[d.z] = log.boss[d.z] || { tries: 0 }; log.boss[d.z].tries++; log.boss[d.z].t = t;
      log.boss[d.z].p0 = D.power; log.boss[d.z].tj = t + 60;
    }
  };
  const lines = ['fox', 'fierce', 'dragon', 'auspicious'];
  const act = () => {
    // evolve first
    if (R.canEvolve(S)) { const p0 = R.derive(S).power; R.evolve(S, 'f' + (S.stage + 1)); const p1 = R.derive(S).power; log.evo.push({ t, stage: S.stage, jump: p1 / p0 }); log.firstMin.push(t); dirty = true; }
    // reserve materials for the next evolution once its level + boss conditions are met
    const en = R.evoNeed(S), resv = en && S.lv >= en.lv - 2 && (en.boss < 0 || S.bossWins[en.boss]) ? en : null;
    for (let g = 0; g < 400; g++) {
      const opts = [];
      for (const sl of R.SLOTS) {
        const s = S.slots[sl.id]; if (s.r < 0 || s.l >= R.slotCap(S)) continue;
        const c = R.slotCost(sl.id, s.l);
        if (S.gold < c.gold || R.matZone(S, c, resv) < 0) continue;
        opts.push({ sl: sl.id, cost: c.mat * (sl.k === 'atk' || sl.k === 'hp' ? 1 : 1.3) + s.l * .01 });
      }
      if (!opts.length) break;
      opts.sort((a, b) => a.cost - b.cost);
      R.upgradeSlot(S, opts[0].sl); log.firstMin.push(t); dirty = true;
    }
    if (dirty) { D = R.derive(S); dirty = false; }
    // boss: try when unlocked and stronger than last failed attempt
    const z = S.maxZone, u = S.unlocked[z];
    if (u && u[4] && !S.bossWins[z] && S.f && S.f.t !== 4 && t >= bossWait && D.power > lastBossPow * 1.15) {
      lastBossPow = D.power; bossWait = t + 30;
      R.setFight(S, z, 4);
    }
    if (S.bossWins[z] && S.zone < S.maxZone) { S.zone = S.maxZone; S.tier = 0; S.f = null; }
  };
  let nextAct = 0, nextLog = 0, runStart = 0;
  while (t < T) {
    if (online(t)) {
      if (offSince !== null) { const g = R.offlineGain(S, t - offSince); offSince = null; dirty = true; }
      R.step(S, DT, E, D);
      if (dirty) { D = R.derive(S); dirty = false; }
      t += DT;
      for (const z in log.boss) { const b = log.boss[z]; if (b.tj && t >= b.tj) { b.jump = D.power / b.p0; b.tj = 0; } }
      if (t >= nextAct) { act(); nextAct = t + (who === 'active' ? 5 : 15); }
      // nirvana when the 大荒 boss is down
      if (R.canNirvana(S) && log.nir.length < nirRuns) { log.nir.push({ t, runT: t - runStart, souls: R.nirvanaSouls(S) }); S = R.nirvana(S); runStart = t; D = R.derive(S); lastBossPow = 0; bossWait = 0; log.runs.push({}); }
    } else {
      if (offSince === null) offSince = t;
      t += 60;
    }
    if (t >= nextLog) { const b = R.enemyStats(S.maxZone, 4), e3 = R.enemyStats(S.maxZone, 3);
      log.power.push({ t, p: D.power, z: S.maxZone, lv: S.lv, st: S.stage, M: D.M, Me: D.Me, parts: D.parts,
        sl: Object.values(S.slots).map(x => x.l + '/' + x.r).join(' '), cap: R.slotCap(S), mat: Math.round(S.mats[S.maxZone]),
        bttk: (b.hp / D.dps).toFixed(0), bhtd: (D.hp / b.atk * 2).toFixed(0), ttk3: (e3.hp / D.dps).toFixed(1), htd3: (D.hp / e3.atk * 2).toFixed(0) }); nextLog = t + 1800; }
  }
  log.final = { S, D };
  return log;
}

const fmt = s => s == null ? '  -  ' : s < 3600 ? (s / 60).toFixed(0) + 'm' : (s / 3600).toFixed(1) + 'h';
for (const who of WHO) {
  const runs = [];
  for (let k = 1; k <= SEEDS; k++) runs.push(run(who, k, NIR));
  console.log(`\n=== ${who} (${SEEDS} seeds, ${HOURS}h) ===`);
  console.log('boss clear time per zone (median / min / max), tries, power jump at kill');
  for (let z = 0; z < 8; z++) {
    const ts = runs.map(r => r.boss[z] && r.boss[z].t).filter(x => x != null).sort((a, b) => a - b);
    const tries = runs.map(r => r.boss[z] ? r.boss[z].tries : 0);
    const jumps = runs.map(r => r.boss[z] && r.boss[z].jump).filter(Boolean);
    console.log(`  Z${z}: ${ts.length}/${SEEDS} ${fmt(ts[ts.length >> 1])} [${fmt(ts[0])}..${fmt(ts[ts.length - 1])}] tries ${(tries.reduce((a, b) => a + b, 0) / SEEDS).toFixed(1)} jump x${jumps.length ? (jumps.reduce((a, b) => a + b, 0) / jumps.length).toFixed(2) : '-'}`);
  }
  const ev = [];
  for (let s = 1; s <= 5; s++) { const ts = runs.map(r => (r.evo.find(e => e.stage === s) || {}).t).filter(x => x != null).sort((a, b) => a - b); const j = runs.map(r => (r.evo.find(e => e.stage === s) || {}).jump).filter(Boolean); ev.push(`E${s} ${fmt(ts[ts.length >> 1])} x${j.length ? (j.reduce((a, b) => a + b) / j.length).toFixed(2) : '-'}`); }
  console.log('  evolutions: ' + ev.join(' | '));
  const r0 = runs[0];
  console.log(`  deaths ${(runs.reduce((a, r) => a + r.deaths, 0) / SEEDS).toFixed(0)}  bossFails ${(runs.reduce((a, r) => a + r.bossFails, 0) / SEEDS).toFixed(1)}`);
  // early cadence: gaps between improvements in the first 5 min (online players only)
  const gaps = []; let prev = 0; for (const x of r0.firstMin.filter(x => x < 300)) { if (x - prev > .5) gaps.push(Math.round(x - prev)); prev = x; }
  console.log(`  first 5 min: ${gaps.length} improvements, longest gap ${Math.max(0, ...gaps).toFixed(0)}s [${gaps.join(',')}]`);
  const fin = r0.final.D, P = fin.parts, tot = Math.log(fin.power);
  console.log(`  final: Lv${r0.final.S.lv} stage${r0.final.S.stage} zone${r0.final.S.maxZone} power ${fin.power.toExponential(2)} M ${fin.M}/${fin.cap}`);
  console.log(`  ln-share of atk: lv ${(Math.log(P.lv) / Math.log(fin.atk / 10) * 100).toFixed(0)}% evo ${(Math.log(P.evo) / Math.log(fin.atk / 10) * 100).toFixed(0)}% gear ${(Math.log(P.gearA) / Math.log(fin.atk / 10) * 100).toFixed(0)}% M ${(Math.log(P.MM) / Math.log(fin.atk / 10) * 100).toFixed(0)}% nir ${(Math.log(P.nir) / Math.log(fin.atk / 10) * 100).toFixed(0)}%`);
  if (r0.nir.length) { console.log('  nirvana: ' + r0.nir.map(n => `run ${fmt(n.runT)} souls ${n.souls}`).join(' | '));
    r0.runs.forEach((r, i) => console.log(`   run ${i + 1}: ` + [0,1,2,3,4,5,6,7].map(z => fmt(r[z])).join(' ')));
  }
  if (TRACE) for (const p of r0.power) console.log(`   ${fmt(p.t).padStart(6)} z${p.z} lv${p.lv} st${p.st} pow ${p.p.toExponential(2)} M${p.M}/${p.Me} slots[${p.sl}] cap${p.cap} mat${p.mat} | t3 ttk ${p.ttk3}s htd ${p.htd3}s | boss ttk ${p.bttk}s htd ${p.bhtd}s`);
}
