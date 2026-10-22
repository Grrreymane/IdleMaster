// ============================================================ game state, events, loop, save
let S = null, DER = null, dirty = true, T = 0;
const SAVE_V = 1;
function fresh() { const s = newState(); return s; }
function migrate(s) {   // fill fields added after a save was made (never wipe a save)
  const d = newState();
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const sl of SLOTS) if (!s.slots[sl.id]) s.slots[sl.id] = { r: -1, l: 0 };
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = d.stats[k];
  if (!FORMS[s.form]) s.form = 'f' + Math.min(6, s.stage);   // saves from the 4-line version: keep the stage, move to the Qiongqi line
  const fm = {}; for (let i = 0; i <= Math.min(6, s.stage); i++) fm['f' + i] = 1; for (const k in s.forms) if (FORMS[k]) fm[k] = 1; s.forms = fm;
  s.f = null; s.dead = 0;
  return s;
}
function loadGame() { const o = load('save', null); return o && o.S ? { S: migrate(o.S), ts: o.ts } : null; }
function saveGame() { save('save', { v: SAVE_V, S, ts: Date.now() }); }
function recalc() { DER = derive(S); dirty = false; }
// ------------------------------------------------------------ events from the rules -> visuals, sounds, toasts
function onEvent(type, d) {
  switch (type) {
    case 'hit': FX.lunge = LUNGE; FX.eHit = .12; FX.slash = SLASH; FX.slashCr = d.cr; SFX.hit(d.cr);
      if (S.f) { const e = enemySprite(S.f.z, S.f.t); pop(fmt(d.dmg) + (d.cr ? '!' : ''), W - 4 - e.w / 2 + rand(-6, 6), FLOOR - e.h + rand(4, 14), d.cr ? '#ffd040' : '#ffffff', d.cr ? 9 : 7); }
      if (d.flood) { pop('洪流', 120, 60, '#8ad0ff', 9); }
      break;
    case 'miss': pop('落空', 140, 80, '#c8c0d8', 7); break;
    case 'hurt': FX.hurt = .2; SFX.hurt(); pop('-' + fmt(d.dmg), 50 + rand(-8, 8), 70, d.heavy ? '#ff4a3a' : '#ff9a8a', d.heavy ? 10 : 7); if (d.heavy) SFX.heavy(); break;
    case 'kill': {
      const e = enemySprite(d.z, d.t); FX.eDie = EDIE; FX.eDieSpr = e; FX.eDieX = W - 4 - e.w; FX.slash = 0; SFX.kill();
      for (let i = 0; i < 8; i++) part(W - 4 - e.w / 2 + rand(-e.w / 3, e.w / 3), FLOOR - 2, rand(-14, 14), rand(-18, -4), i & 1 ? '#c8b8a0' : MAT_COL[d.z], .7);   // dust + a glint of the zone material
      pop('+' + fmt(d.gold), 150, 46, '#9af0c0', 6, .8); dirty = true; break;
    }
    case 'level': SFX.level(); pop('升级! Lv' + d, 54, 40, '#ffe080', 9, 1.3); dirty = true; break;
    case 'unlock': toast(d.t === 4 ? `<span class="bad">大妖 ${ZONES[d.z].boss} 现身了！</span>` : `开启 ${ZONES[d.z].mons[d.t]}（${TIER_N[d.t]}档）`); break;
    case 'item': SFX.item(d.r); dirty = true; toast(`获得 <span class="r${d.r}">${itemName(d.id)}</span> ${d.better ? '<span class="good">已换上</span>' : '<span class="dim">收进图鉴</span>'}`);
      for (let i = 0; i < 10; i++) part(60 + rand(-20, 20), 100 + rand(-20, 10), rand(-15, 15), rand(-40, -10), RAR[d.r].c, 1.2); break;
    case 'dup': toast(`<span class="r${d.r}">${itemName(d.id)}</span> 重复，换成灵玉 +${fmt(d.gold)}`); break;
    case 'death': toast('<span class="bad">被打倒了</span>，退回一档'); break;
    case 'spawn': FX.eIn = EIN; if (d.t === 4) { SFX.boss(); toast(`<span class="gold">${ZONES[d.z].boss}</span>：${ZONES[d.z].intro}`); toast(`<span class="dim">规则：</span>${ZONES[d.z].rule}`); } break;
    case 'bossFail': SFX.bossFail(); toast(d.why === 'time' ? '<span class="bad">时间到</span>，大妖退回了' : '<span class="bad">败给了大妖</span>，强化后再来'); bossOdds.k = null; break;
    case 'bossWin': onBossWin(d); break;
    case 'revive': pop('复活!', 150, 60, '#ff6a4a', 9); break;
    case 'head': pop('断一首', 150, 50, '#a8f0c0', 8); break;
    case 'shield': case 'bheal': pop(type === 'bheal' ? '起舞回血' : '护盾', 150, 50, '#8ad0ff', 7); break;
    case 'daze': pop('惑心', 120, 50, '#ff8ad0', 8); break;
    case 'phase': pop(d ? '月相' : '日相', 150, 40, d ? '#c8d8ff' : '#ffb040', 9); break;
  }
}
let bossPre = null;
function onBossWin(d) {
  dirty = true; SFX.bossWin(); bossOdds.k = null;
  if (!d.first) { toast(`又打倒了 ${ZONES[d.z].boss}`); return; }
  const before = bossPre || DER; recalc();
  const nb = Object.keys(S.bossWins).length, Z = ZONES[d.z];
  modal(`<h2>打倒${Z.boss}！</h2><div style="text-align:center"><div class="dim">「${Z.defeat}」</div>
<div style="margin:8px 0;font-size:24px;line-height:28px" class="gold">图鉴上限放开！</div>
<div>图鉴生效 ${before.Me} → <b class="gold">${DER.Me}</b>　战力 <b class="gold">×${(DER.power / before.power).toFixed(1)}</b></div>
<div>强化上限 → Lv${slotCap(S)}${d.z < 7 ? ` · 新地图 <b class="gold">${ZONES[d.z + 1].n}</b>` : ''}</div>
${evoNeed(S) && evoNeed(S).boss === d.z ? `<div class="good">获得 ${Z.boss}精血：可以进化了</div>` : ''}
${d.z === 7 ? '<div class="good">涅槃已开放</div>' : ''}
<div style="margin-top:10px"><button class="btn g" data-act="close">好！</button></div></div>`);
}
// ------------------------------------------------------------ actions from the UI
function doEvolve(id) {
  const p0 = DER.power;
  if (!evolve(S, id)) return;
  recalc(); FX.evo = 3; SFX.evolve(); saveGame();
  const f = FORMS[id];
  modal(`<h2>进化：${f.n}</h2><div style="text-align:center"><img style="width:224px;image-rendering:pixelated" src="${formIcon(id)}">
<div class="dim">「${QUOTE[id] || ''}」</div><div class="good">${f.td}</div><div style="margin:6px 0">战力 <b class="gold">×${(DER.power / p0).toFixed(1)}</b></div>
<button class="btn g" data-act="close">好！</button></div>`);
}
function chooseEvolve() { const nx = FORMS[S.form].next; if (nx.length) doEvolve(nx[0]); }
function allUp() {
  let n = 0;
  for (let i = 0; i < 500; i++) { const b = cheapestUpgrade(); if (!b || !upgradeSlot(S, b.id, evoReserve())) break; n++; }
  if (n) { SFX.up(); recalc(); toast(`强化了 ${n} 次`); saveGame(); } else toast(evoReserve() ? '<span class="dim">材料留着进化用</span>' : '<span class="dim">灵玉或材料不够</span>');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  initAudio();
  if (HAND.key && b.dataset.k === HAND.key) { HAND.key = null; b.classList.remove('glow', 'guide'); }
  switch (a) {
    case 'tab': SFX.click(); setTab(v); break;
    case 'go': { SFX.click(); const [t, k] = v.split(':'); goTo(t, k); break; }
    case 'guide': { SFX.click(); const L = guideList(); modal(`<h2>变强指引</h2>${L.length ? L.map(x => `<div class="slot"><span class="grow">${x.wait ? '⏳ ' : '▶ '}${x.t}</span><button class="btn s ${x.wait ? 'b' : 'g'}" data-act="go" data-v="${x.go.join(':')}">前往</button></div>`).join('') : '<div class="dim">⏳ 挂机即可</div>'}<div class="dim" style="margin-top:6px">${pick(TIPS)}</div><div style="text-align:center;margin-top:8px"><button class="btn off s" data-act="close">关闭</button></div>`); break; }
    case 'up': if (upgradeSlot(S, v)) { SFX.up(); recalc(); saveGame(); } break;
    case 'allup': allUp(); break;
    case 'evo': chooseEvolve(); break;
    case 'auto': S.auto = !S.auto; SFX.click(); break;
    case 'zone': if (+v !== S.zone) { setFight(S, +v, 0); SFX.click(); } break;
    case 'tier': { const t = +v; if (t === 4) { bossPre = DER; } if (setFight(S, S.zone, t)) SFX.click(); break; }
    case 'boss': bossPre = DER; if (setFight(S, +v, 4)) SFX.click(); break;
    case 'nir': modal(`<h2>涅槃？</h2><div style="text-align:center">回到南山从头修，带走 <b class="gold">${Math.min(nirvanaSouls(S), BAL.nirMax - S.souls)}</b> 点精魄。<div style="margin-top:8px"><button class="btn r" data-act="nirgo">涅槃</button> <button class="btn off" data-act="close">再等等</button></div></div>`); break;
    case 'nirgo': { const N = nirvana(S); if (N) { S = N; recalc(); FX.evo = 3; SFX.evolve(); saveGame(); closeModal(); setTab('beast'); toast('<span class="gold">浴火重生</span>'); } break; }
    case 'mute': muted = !muted; save('mute', muted); break;
    case 'close': SFX.click(); closeModal(); break;
  }
  renderUI();
});
// ------------------------------------------------------------ layout: a 360-wide column scaled to the window
let SCALE = 1;
function layout() {
  const vv = window.visualViewport, vw = vv ? vv.width : window.innerWidth, vh = vv ? vv.height : window.innerHeight;
  SCALE = Math.min(vw / 360, vh / 620);
  const app = document.getElementById('app'), h = vh / SCALE;
  if (!app) return;
  app.style.transform = `scale(${SCALE})`; app.style.height = h + 'px';
  app.style.left = Math.max(0, (vw - 360 * SCALE) / 2) + 'px';
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = Math.round(360 * SCALE * dpr); cv.height = Math.round(320 * SCALE * dpr); K = cv.width / W;
  TXC.clear(); layoutModal();
}
function layoutModal() { elMbox.style.transform = `scale(${SCALE}) translate(-50%, -50%)`; }
window.addEventListener('resize', layout); if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
['touchstart', 'touchmove'].forEach(ev => window.addEventListener(ev, e => {
  if (e.target.closest && (e.target.closest('#pane') || e.target.closest('#mbox') || e.target.closest('#game-err'))) return;
  if (e.cancelable) e.preventDefault();
}, { passive: false }));
window.addEventListener('contextmenu', e => e.preventDefault());
['pointerup', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, () => initAudio()));
document.getElementById('c').addEventListener('click', () => { initAudio(); FX.lunge = LUNGE; pop(pick(['吼！', '嗷呜', '呜—']), 70, 44, '#ffffff', 8); });
// ------------------------------------------------------------ simulation driving
function advance(dt) {   // dt seconds of game time, in small steps
  while (dt > 0) { const d = Math.min(.05, dt); dt -= d; step(S, d, onEvent, DER); if (dirty) recalc(); }
}
function offlineReport(secs) {
  const pre = { lv: S.lv };
  const r = offlineGain(S, secs); recalc();
  if (!r || !r.n) { if (r && secs > 300) toast('<span class="dim">离线时打不过当前的怪，没收获</span>'); return; }
  const h = Math.floor(r.secs / 3600), m = Math.floor(r.secs % 3600 / 60);
  modal(`<h2>离线修炼</h2><div style="text-align:center">离开了 ${h ? h + ' 小时 ' : ''}${m} 分${secs > BAL.offCap ? '<span class="dim">（最多算 12 小时）</span>' : ''}
<div style="margin:6px 0">吞噬 <b class="gold">${fmt(r.n)}</b> 只 ${ZONES[r.z].mons[Math.min(3, S.tier)]}</div>
<div>${img(miscIcon('xp'))}精元 ${fmt(r.xp)}${S.lv > pre.lv ? ' <span class="good">升了 ' + (S.lv - pre.lv) + ' 级</span>' : ''}</div><div>${img(miscIcon('gold'))}灵玉 ${fmt(r.gold)}　${img(matIcon(r.z))}${ZONES[r.z].mat} ${fmt(r.mat)}</div>
${r.items ? `<div class="good">新装备 ${r.items} 件</div>` : ''}<div style="margin-top:8px"><button class="btn g" data-act="close">收下</button></div></div>`);
}
let last = performance.now(), frameErr = 0, uiT = 0, saveT = 0, hiddenAt = 0;
function frame(now) {
  const real = Math.max(0, (now - last) / 1000); last = now;
  try {
    if (real > 2) { const gap = real; if (gap > 60) offlineReport(gap); else advance(gap); }
    else { const dt = clamp(real, 0, .05); T += dt; advance(dt); }
    updateFX(Math.min(real, .5)); drawStage(T); present(); musicTick(S.f && S.f.t === 4);
    uiT -= real; if (uiT <= 0) { uiT = .25; renderUI(); }
    updateHand();
    saveT -= real; if (saveT <= 0) { saveT = 10; saveGame(); }
    S.stats.play += Math.min(real, 2);
    frameErr = 0;
  } catch (e) { if (frameErr++ === 0 && window.__gameErr) window.__gameErr(String(e && e.stack || e).slice(0, 600)); }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
function boot() {
  loadPix();
  const o = loadGame();
  if (o) { S = o.S; recalc(); const gap = (Date.now() - (o.ts || Date.now())) / 1000; if (gap > 60) offlineReport(gap); }
  else { S = fresh(); recalc(); setTimeout(() => { toast('你是一只小小的<span class="gold">翼虎幼崽</span>'); toast('自动战斗 · 吞噬 · 进化'); }, 600); }
  layout(); renderUI();
}
if (location.hash === '#cover') { loadPix(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(renderCover, 800)); window.__gameBooted = true; return; }
boot();
// Test hook (tools/make_test_page.py / headless.js paste code here)
/*TEST_HOOK*/
drawStage(0); present();
window.__gameBooted = true;
requestAnimationFrame(frame);
