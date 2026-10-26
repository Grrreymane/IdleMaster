// ============================================================ DOM interface: HUD, goal line, tabs, panes, modals, guide hand
const $ = id => document.getElementById(id);
const elHud = $('hud'), elGoal = $('goal'), elPane = $('pane'), elTabs = $('tabs'), elModal = $('modal'), elMbox = $('mbox'), elHand = $('hand'), elToast = $('toast'), elOver = $('over');
let TAB = 'beast';
const TABS = [
  { id: 'beast', n: '异兽', ic: () => miscIcon('beast'), open: () => true },
  { id: 'gear', n: '装备', ic: () => slotIcon('claw', 1), open: () => true },
  { id: 'map', n: '山海', ic: () => miscIcon('map'), open: () => S.stats.kills >= 5 },
  { id: 'book', n: '图鉴', ic: () => miscIcon('book'), open: () => Object.keys(S.items).length >= 2 },
  { id: 'nir', n: '涅槃', ic: () => miscIcon('fire'), open: () => canNirvana(S) || S.nirCount > 0 },
];
const img = (src, cls) => `<img class="ic${cls ? ' ' + cls : ''}" src="${src}" alt="">`;
const setHTML = (el, h) => { if (el.__h !== h) { el.innerHTML = h; el.__h = h; } };
function pct(x) { return (x * 100 >= 100 ? Math.round(x * 100) : Math.round(x * 1000) / 10) + '%'; }
// ------------------------------------------------------------ HUD
function renderHud() {
  const D = DER, need = needXp(S.lv), z = S.zone;
  setHTML(elHud, `<div class="row"><span class="gold">Lv${S.lv}</span><div class="bar grow"><i style="width:${clamp(S.xp / need * 100, 0, 100).toFixed(1)}%"></i><b>精元 ${fmt(S.xp)}/${fmt(need)}</b></div>${img(miscIcon('pow'))}<span>战力 ${fmt(D.power)}</span></div>
<div class="row" style="margin-top:3px"><span class="res">${img(miscIcon('gold'))}${fmt(S.gold)}</span><span class="res">${img(matIcon(z))}${ZONES[z].mat} ${fmt(S.mats[z])}</span><span class="grow"></span><span class="res" data-act="tab" data-v="book">${img(miscIcon('m'))}图鉴 ${D.Me}${D.M > D.Me ? '<span class="dim">/' + D.M + '</span>' : ''}</span></div>`);
}
// ------------------------------------------------------------ guide: what can the player do right now (each row has a 前往)
function bossOdds(z) {
  const key = z + '|' + Math.round(Math.log(DER.power) * 20);
  if (bossOdds.k === key) return bossOdds.v;
  const saved = rnd; let wins = 0, seed = 7;
  setRnd(() => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; });
  for (let n = 0; n < 6; n++) {
    const C = JSON.parse(JSON.stringify(S)); C.dead = 0; C.hp = DER.hp; spawn(C, z, 4);
    let won = false; const E = (ty) => { if (ty === 'bossWin') won = true; };
    for (let i = 0; i < (BAL.bossTime + 1) * 10 && C.f && C.f.t === 4 && !(C.dead > 0); i++) step(C, .1, E, DER);
    if (won) wins++;
  }
  setRnd(saved);
  bossOdds.k = key; bossOdds.v = wins / 6; return bossOdds.v;
}
function evoReserve() {   // keep the evolution's materials once its other conditions are met
  const e = evoNeed(S); return e && S.lv >= e.lv && (e.boss < 0 || S.bossWins[e.boss]) ? e : null;
}
function cheapestUpgrade() {
  let best = null; const rv = evoReserve();
  for (const sl of SLOTS) { const s = S.slots[sl.id]; if (s.r < 0 || s.l >= slotCap(S)) continue; const c = slotCost(sl.id, s.l); if (S.gold >= c.gold && matZone(S, c, rv) >= 0 && (!best || c.mat < best.c.mat)) best = { id: sl.id, c }; }
  return best;
}
function guideList() {
  const L = [], z = S.maxZone;
  if (canEvolve(S)) L.push({ t: '可以进化了！', go: ['beast', 'evo'], k: 'evo' });
  if (canNirvana(S) && S.nirCount === 0) L.push({ t: '涅槃重生，带走精魄', go: ['nir', 'nir'], k: 'nir' });
  const u = S.unlocked[z];
  if (u && u[4] && !S.bossWins[z]) { const o = bossOdds(z); if (o >= .5) L.push({ t: `挑战大妖 ${ZONES[z].boss}（胜算 ${Math.round(o * 100)}%）`, go: ['map', 'boss' + z], k: 'boss' }); }
  if (S.zone < S.maxZone && !(S.f && S.f.t === 4)) L.push({ t: `去新地图 ${ZONES[S.maxZone].n}`, go: ['map', 'zone' + S.maxZone], k: 'zone' });
  if (cheapestUpgrade()) L.push({ t: '强化装备', go: ['gear', 'allup'], k: 'up' });
  const ev = evoNeed(S);
  if (ev && !canEvolve(S)) {
    if (ev.boss >= 0 && !S.bossWins[ev.boss]) {
      const cu = S.unlocked[S.zone], key = ev.boss === S.zone ? (cu[4] ? 'boss' + S.zone : 'tier' + cu.lastIndexOf(1)) : ev.boss <= S.maxZone ? 'zone' + ev.boss : (cu[4] ? 'boss' + S.zone : 'tier' + cu.lastIndexOf(1));
      L.push({ t: `打倒${ZONES[ev.boss].boss}，取精血进化`, go: ['map', key], k: 'needboss', wait: 1 });
    }
    else if (S.lv < ev.lv) L.push({ t: `自动战斗中，升到 Lv${ev.lv} 可进化`, go: ['beast', 'evo'], k: 'needlv', wait: 1 });
    else L.push({ t: `攒 ${ZONES[ev.z].mat} ${ev.mat} 个可进化`, go: ['beast', 'evo'], k: 'needmat', wait: 1 });
  }
  if (u && !u[4]) { const t = u.lastIndexOf(1); L.push({ t: t < 3 ? `打 ${TIER_N[t]}档 ${BAL.unlockKills} 只，开下一档` : `打 凶档 ${BAL.bossUnlockKills} 只，引出大妖`, go: ['map', 'tier' + t], k: 'tier', wait: 1 }); }
  else if (u && u[4] && !S.bossWins[z]) L.push({ t: `攒材料强化，再战${ZONES[z].boss}（胜算 ${Math.round(bossOdds(z) * 100)}%）`, go: ['gear', 'allup'], k: 'farm', wait: 1 });
  return L;
}
function renderGoal() {
  const L = guideList(), top = L[0];
  const h = top ? `<span class="t">${top.wait ? '⏳ ' : '▶ '}${top.t}</span><button class="btn s ${top.wait ? 'b' : 'g'}" data-act="go" data-v="${top.go.join(':')}">前往</button><button class="btn s" data-act="guide">变强</button>`
    : `<span class="t">⏳ 挂机即可</span><button class="btn s" data-act="guide">变强</button>`;
  setHTML(elGoal, h);
}
// ------------------------------------------------------------ tabs
const SEEN = load('seen', { beast: 1, gear: 1 });
function renderTabs() {
  setHTML(elTabs, TABS.map(t => {
    const open = t.open(), isNew = open && !SEEN[t.id];
    const dot = open && ((t.id === 'beast' && canEvolve(S)) || (t.id === 'gear' && cheapestUpgrade()) || (t.id === 'nir' && canNirvana(S)));
    return `<button data-act="tab" data-v="${t.id}" class="${TAB === t.id ? 'on' : ''}${open ? '' : ' lock'}">${open ? img(t.ic()) : '<span style="height:20px;line-height:20px">？</span>'}<span>${open ? t.n : '？？？'}</span>${isNew ? '<span class="new">新</span>' : dot ? '<span class="dot"></span>' : ''}</button>`;
  }).join(''));
}
// ------------------------------------------------------------ panes
function paneBeast() {
  const f = FORMS[S.form], D = DER, ev = evoNeed(S);
  let h = `<div class="card"><div class="row" style="margin-bottom:2px">${img(formIcon(S.form), 'b')}<span class="gold" style="font-size:16px">${f.n}</span><span class="dim">第 ${S.stage} 阶</span><span class="grow nm good" style="text-align:right">${f.td}</span></div>
<div class="stats"><span>攻击 <b class="gold">${fmt(D.atk)}</b></span><span>生命 <b class="gold">${fmt(D.hp)}</b></span><span>攻速 ${pct(D.spd)}</span>
<span>暴击 ${pct(D.crit)}</span><span>暴伤 ×${(1 + D.critD).toFixed(1)}</span><span>对大妖 +${pct(D.boss)}</span>
<span>精元 +${pct(D.xp - 1)}</span><span>灵玉 +${pct(D.gold - 1)}</span></div>
<div class="dim nm">战力：等级 ×${fmt(D.parts.lv)} · 进化 ×${fmt(D.parts.evo)} · 装备 ×${fmt(Math.sqrt(D.parts.gearA * D.parts.gearH))} · 图鉴 ×${fmt(D.parts.MM)}${D.parts.nir > 1 ? ' · 涅槃 ×' + D.parts.nir.toFixed(2) : ''}</div></div>`;
  if (ev) {
    const id = f.next[0], ok = canEvolve(S), mz = matZone(S, ev);
    const chk = (b, t) => `<span>${b ? '<span class="good">○</span>' : '<span class="bad">×</span>'} ${t}</span>`;
    h += `<div class="card"><div class="row"><img class="ic${S.forms[id] ? '' : ' sil'}" style="width:52px;height:46px;object-fit:contain" src="${formIcon(id, !S.forms[id])}">
<div class="grow"><div class="gold">进化 · 第 ${S.stage + 1} 阶</div>
<div class="chk">${chk(S.lv >= ev.lv, `等级 ${S.lv}/${ev.lv}`)}${ev.boss >= 0 ? chk(!!S.bossWins[ev.boss], `${ZONES[ev.boss].boss}精血`) : ''}${chk(mz >= 0, `${ZONES[ev.z].mat} ${fmt(S.mats[ev.z])}/${ev.mat}`)}</div>
${ev.z < S.maxZone ? '<div class="dim">后面区的材料也行</div>' : ''}</div>
<button class="btn ${ok ? 'g glow' : 'off'}" data-k="evo" data-act="evo" ${ok ? '' : 'disabled'}>进化<br>战力×${BAL.evoMul}</button></div></div>`;
  } else h += `<div class="card"><span class="gold">已是上古神兽</span><span class="dim"> · 打倒夔后可以涅槃，从幼崽再修一世</span></div>`;
  return h + `<div class="dim" style="text-align:center;margin-top:2px">「${QUOTE[S.form] || ''}」</div>`;
}
function slotGain(sl) {   // power change of the next level, for the row label
  const s = S.slots[sl]; s.l++; const p = derive(S).power; s.l--; return p / DER.power - 1;
}
function paneGear() {
  const cap = slotCap(S), nb = Object.keys(S.bossWins).length;
  let h = `<div class="row" style="margin:0 0 4px 2px"><span class="grow">强化上限 <b class="gold">Lv${cap}</b>${nb < 8 ? `<span class="dim">（打倒${ZONES[Math.min(7, nb)].boss} +10）</span>` : ''}</span><button class="btn g s" data-k="allup" data-act="allup">一键强化</button></div><div class="card">`;
  for (const sl of SLOTS) {
    const s = S.slots[sl.id];
    if (s.r < 0) { h += `<div class="slot"><div class="frame">${img(slotIcon(sl.id, -1), 'b')}</div><div class="grow dim">${sl.n} · 未获得 · 打怪掉落</div></div>`; continue; }
    const c = slotCost(sl.id, s.l), mz = matZone(S, c), full = s.l >= cap, ok = !full && S.gold >= c.gold && mz >= 0;
    const v = slotVal(sl.id, s.r, s.l), side = sl.k === 'spd' ? `攻速 ${pct(v.spd)} 暴击 ${pct(v.crit)}` : sl.k === 'gain' ? `精元灵玉 +${pct(v.xp)}` : sl.k === 'crit' ? `暴伤 +${pct(v.critD)} 大妖 +${pct(v.boss)}` : sl.k === 'atk' ? '攻击' : '生命';
    h += `<div class="slot"><div class="frame" style="border-color:${RAR[s.r].c}">${img(slotIcon(sl.id, s.r), 'b')}</div><div class="grow">
<div class="row"><span class="nm grow"><span class="r${s.r}">${ITEMS[sl.id][s.r]}</span> <span class="chip r${s.r}">${RAR_N[s.r]}</span> Lv${s.l}</span>${full ? '<span class="dim">已到上限</span>' : `<span class="res">${img(miscIcon('gold'))}<span class="${S.gold >= c.gold ? '' : 'bad'}">${fmt(c.gold)}</span></span><span class="res">${img(matIcon(c.z))}<span class="${mz >= 0 ? '' : 'bad'}">${c.mat}</span></span>`}</div>
<div class="dim nm">${side} · 下一级 战力 +${pct(slotGain(sl.id))}</div></div>
<button class="btn s ${ok ? '' : 'off'}" data-act="up" data-v="${sl.id}" ${ok ? '' : 'disabled'}>强化</button></div>`;
  }
  return h + '</div>';
}
function paneMap() {
  let h = `<div class="row" style="margin:0 0 4px 2px"><span class="grow dim">打赢自动去下一档，打输退一档</span><button class="btn s ${S.auto ? 'g' : 'off'}" data-act="auto">自动推进 ${S.auto ? '开' : '关'}</button></div>`;
  for (let z = 0; z <= Math.min(7, S.maxZone + 1); z++) {
    const Z = ZONES[z], open = z <= S.maxZone, cur = z === S.zone;
    if (!open) { h += `<div class="zone"><span class="grow dim">？？？ · 打倒${ZONES[z - 1].boss}后开放</span></div>`; break; }
    h += `<div class="zone${cur ? ' cur' : ''}" data-k="zone${z}" data-act="zone" data-v="${z}"><span class="grow"><b class="gold">${Z.n}</b> <span class="dim">${Z.sub}</span></span>${img(matIcon(z))}<span>${fmt(S.mats[z])}</span>${S.bossWins[z] ? '<span class="good">已胜' + Z.boss + '</span>' : ''}</div>`;
    if (cur) {
      const u = S.unlocked[z];
      h += '<div class="tiers">';
      for (let t = 0; t < 5; t++) {
        const on = S.tier === t && S.zone === z, lock = !u[t], kills = S.kills[z + '-' + t] || 0;
        const name = t === 4 ? Z.boss : Z.mons[t];
        h += `<button class="tier${on ? ' on' : ''}${lock ? ' lock' : ''}${t === 4 ? ' boss' : ''}" data-k="${t === 4 ? 'boss' + z : 'tier' + t}" data-act="tier" data-v="${t}" ${lock ? 'disabled' : ''}>${lock ? '？？？<br>' + (t === 4 ? '凶档杀' + BAL.bossUnlockKills : '杀' + BAL.unlockKills + '只') : `${name}<br><span class="dim">${t === 4 ? (S.bossWins[z] ? '再战' : '胜算' + Math.round(bossOdds(z) * 100) + '%') : TIER_N[t] + ' ' + fmt(kills)}</span>`}</button>`;
      }
      h += '</div>';
      if (u[4]) h += `<div class="card" style="margin-top:-2px"><span class="gold">${Z.boss}</span>：${Z.rule}<span class="dim"> · 限时 ${BAL.bossTime} 秒，输了不掉东西</span></div>`;
    }
  }
  return h;
}
function paneBook() {
  const D = DER, nb = Object.keys(S.bossWins).length;
  let h = `<div class="card"><h3>${img(miscIcon('m'))}山海图鉴 ${D.M}</h3><div class="bar m"><i style="width:${clamp(D.Me / Math.max(D.M, D.cap === 1e9 ? D.M : D.cap) * 100, 0, 100)}%"></i><b>生效 ${D.Me}${D.cap < 1e9 ? ' / 上限 ' + D.cap : ''}</b></div>
<div style="margin-top:3px">攻击、生命 <b class="gold">×${fmt(D.MM)}</b>${D.cap < 1e9 ? `<span class="dim"> · 打倒${ZONES[Math.min(7, nb)].boss}，上限放开到 ${BAL.mCap[nb + 1] >= 1e9 ? '无限' : BAL.mCap[nb + 1]}</span>` : ''}</div>
<div class="dim">每种怪杀 10/50/200/800/3000 只、每件装备、每个形态、每只大妖都加点</div></div>`;
  h += `<div class="card"><h3>形态 ${Object.keys(S.forms).length}/${Object.keys(FORMS).length}</h3><div class="grid" style="grid-template-columns:repeat(4,1fr)">`;
  for (const id in FORMS) { const own = S.forms[id]; h += `<div style="text-align:center"><img style="width:100%;image-rendering:pixelated" src="${formIcon(id, !own)}"${own ? '' : ' class="sil"'}><div class="${own ? '' : 'dim'}">${own ? FORMS[id].n : '？？？'}</div></div>`; }
  h += '</div></div><div class="card"><h3>装备 ' + Object.keys(S.items).length + '/42</h3><div class="grid">';
  for (let r = 0; r < 6; r++) for (const sl of SLOTS) { const own = S.items[sl.id + ':' + r]; h += `<div class="frame" style="border-color:${own ? RAR[r].c : '#000'}">${img(slotIcon(sl.id, PIX['i-' + sl.id + '-' + r] ? r : own ? r : -1), own ? 'b' : 'b sil')}</div>`; }
  const seen = Object.keys(S.kills).filter(k => S.kills[k] > 0).length;
  h += `</div></div><div class="card"><h3>妖兽 ${seen}/${ZONES.length * 5}</h3>`;
  for (let z = 0; z <= S.maxZone; z++) {
    const Z = ZONES[z];
    h += `<div class="row"><span class="gold">${Z.n}</span><span class="dim">${Z.sub}</span><span class="grow"></span>${S.bossWins[z] ? `<span class="good">已胜${Z.boss}</span>` : ''}</div><div class="mons">`;
    for (let t = 0; t < 5; t++) {
      const k = S.kills[z + '-' + t] || 0, st = BAL.mileKills.filter(c => k >= c).length;
      h += `<div class="mon${t === 4 ? ' boss' : ''}"><img src="${monIcon(z, t)}"${k ? '' : ' class="sil"'}><div class="nm${k ? '' : ' dim'}">${k ? (t === 4 ? Z.boss : Z.mons[t]) : '？？'}</div><div class="stars">${'★'.repeat(st) || '&nbsp;'}</div></div>`;
    }
    h += '</div>';
  }
  return h + '</div>';
}
function paneNir() {
  const can = canNirvana(S), gain = nirvanaSouls(S);
  return `<div class="card"><h3>${img(miscIcon('fire'))}涅槃</h3><div>浴火重生：回到南山从头修，带走<b class="gold">精魄</b>。</div>
<div class="dim">保留：图鉴、形态、装备品质。重置：等级、强化、进度。</div>
<div style="margin-top:4px">每点精魄：攻击、生命、精元、灵玉 +${Math.round(BAL.nirPct * 100)}%，材料 +${(BAL.nirPct * 20).toFixed(1)}%（最多 ${BAL.nirMax} 点）</div>
<div>现有精魄 <b class="gold">${S.souls}</b>${can ? ` · 这次涅槃 +${Math.min(gain, BAL.nirMax - S.souls)}` : ''}</div>
<div style="text-align:center;margin-top:6px"><button class="btn r ${can ? 'glow' : 'off'}" data-k="nir" data-act="nir" ${can ? '' : 'disabled'}>${can ? '涅槃重生' : '打倒夔后开放'}</button></div></div>`;
}
const PANES = { beast: paneBeast, gear: paneGear, map: paneMap, book: paneBook, nir: paneNir };
function renderPane() { setHTML(elPane, PANES[TAB]()); }
function renderUI() { renderHud(); renderGoal(); renderTabs(); renderPane(); renderOver(); }
// overlay on the stage: mute + a boss button when the boss is waiting
function renderOver() {
  const z = S.maxZone, u = S.unlocked[z], showBoss = u && u[4] && !S.bossWins[z] && !(S.f && S.f.t === 4) && S.zone === z;
  setHTML(elOver, `<button class="mute" data-act="mute">${muted ? '静音' : '声音'}</button>${showBoss ? `<button class="btn r bossbtn${bossOdds(z) >= .5 ? ' glow' : ''}" data-k="bossS" data-act="boss" data-v="${z}">挑战${ZONES[z].boss} ${Math.round(bossOdds(z) * 100)}%</button>` : ''}`);
}
// ------------------------------------------------------------ toasts and modals
function toast(h) { const t = document.getElementById('toast'); if (!t) return; const d = document.createElement('div'); d.innerHTML = h; t.appendChild(d); setTimeout(() => d.remove(), 2700); while (t.children.length > 3) t.firstChild.remove(); }
let MODAL = null;
function modal(h, onBtn) { MODAL = onBtn || (() => true); elMbox.innerHTML = h; elModal.classList.add('on'); layoutModal(); }
function closeModal() { elModal.classList.remove('on'); MODAL = null; }
// ------------------------------------------------------------ the "前往" hand
const HAND = { el: null, until: 0 };
function goTo(tab, key) {
  closeModal(); if (TAB !== tab) setTab(tab);
  renderUI();
  let el = document.querySelector(`[data-k="${key}"]`);
  if (!el && /^(boss|tier)/.test(key)) { key = 'zone' + (key.startsWith('boss') ? key.slice(4) : S.maxZone); el = document.querySelector(`[data-k="${key}"]`); }   // that zone is folded: point at its header
  if (!el) return;
  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); }
  document.querySelectorAll('.glow.guide').forEach(e => e.classList.remove('glow', 'guide'));
  el.classList.add('glow', 'guide'); HAND.key = key; HAND.until = performance.now() + 12000;
}
function updateHand() {
  if (!HAND.key || performance.now() > HAND.until) { elHand.style.display = 'none'; HAND.key = null; return; }
  const el = document.querySelector(`[data-k="${HAND.key}"]`);
  if (!el) { elHand.style.display = 'none'; return; }
  if (!el.classList.contains('glow')) el.classList.add('glow', 'guide');
  const r = el.getBoundingClientRect();
  if (elHand.textContent !== '👆') elHand.textContent = '👆';
  elHand.style.display = 'block'; elHand.style.left = (r.left + r.width / 2 - 6) + 'px'; elHand.style.top = (r.bottom - 6) + 'px';
}
function setTab(t) {
  const T = TABS.find(x => x.id === t); if (!T || !T.open()) return;
  TAB = t; SEEN[t] = 1; save('seen', SEEN); elPane.scrollTop = 0; renderUI();
}
