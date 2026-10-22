// ============================================================ first-time tutorial: a hand + one short line pointing at what to press next
// Steps run in order; a step waits until it applies (show) and ends when the thing is done (done), so old saves skip ahead.
const elTut = document.getElementById('tut');
const TUT = { i: load('tut', 0), t: 0, clicked: '' };
const sumLv = () => SLOTS.reduce((a, s) => a + S.slots[s.id].l, 0);
const TUT_STEPS = [
  { text: '你是翼虎幼崽，会自己打怪', sel: '#c', show: () => true, done: () => TUT.t > 5 || S.stats.kills > 6 },
  { text: '材料够了！点「装备」', sel: '[data-act="tab"][data-v="gear"]', show: () => !!cheapestUpgrade(), done: () => TAB === 'gear' || sumLv() > 0 },
  { text: '点「一键强化」变强', sel: '[data-k="allup"]', show: () => TAB === 'gear' && !!cheapestUpgrade(), done: () => sumLv() > 0 },
  { text: '可以进化了！点「异兽」', sel: '[data-act="tab"][data-v="beast"]', show: () => canEvolve(S), done: () => TAB === 'beast' || S.stage > 0 },
  { text: '点「进化」', sel: '[data-k="evo"]', show: () => canEvolve(S) && TAB === 'beast', done: () => S.stage > 0 },
  { text: '「山海」里能换怪、挑战大妖', sel: '[data-act="tab"][data-v="map"]', show: () => S.stage > 0 && TABS[2].open(), done: () => TAB === 'map' || S.stats.bossTries > 0 },
  { text: '大妖出现了！点这里挑战', sel: '[data-k="bossS"]', show: () => !!(S.unlocked[0] && S.unlocked[0][4]), done: () => S.stats.bossTries > 0 || !!S.bossWins[0] },
  { text: '打不过就强化再来；卡住点「变强」', sel: '[data-act="guide"]', show: () => S.stats.bossTries > 0, done: () => TUT.clicked === 'guide' || TUT.t > 8 },
];
function tutClick(act) { TUT.clicked = act; }
function updateTut(dt) {
  let st = TUT_STEPS[TUT.i];
  while (st && st.done()) { TUT.i++; TUT.t = 0; save('tut', TUT.i); st = TUT_STEPS[TUT.i]; }
  const busy = !st || !st.show() || elModal.classList.contains('on') || HAND.key;
  const el = !busy && document.querySelector(st.sel);
  if (!el || !el.getBoundingClientRect().width) { elTut.style.display = 'none'; if (!HAND.key) elHand.style.display = 'none'; return; }
  TUT.t += dt;
  // a target inside the scrolling pane but out of sight: bring it to the middle (then leave the player 4 s to scroll on their own)
  TUT.scrollT = (TUT.scrollT || 0) - dt;
  if (TUT.scrollT <= 0 && elPane.contains(el)) {
    const pr = elPane.getBoundingClientRect(), er = el.getBoundingClientRect();
    if (er.top < pr.top || er.bottom > pr.bottom) { elPane.scrollTop += ((er.top + er.bottom) - (pr.top + pr.bottom)) / 2 / SCALE; TUT.scrollT = 4; }   // screen px -> pane px (the app is scaled)
  }
  const r = el.getBoundingClientRect(), vw = window.innerWidth;
  if (elTut.__s !== st.text) { elTut.textContent = st.text; elTut.__s = st.text; }
  elTut.style.display = 'block';
  const tw = elTut.offsetWidth, th = elTut.offsetHeight, scene = st.sel === '#c', low = r.bottom > window.innerHeight * .72;
  const cx = scene ? r.left + r.width * .5 : r.left + r.width / 2;
  // targets low on the screen (tab bar): hand above pointing down, words above the hand; otherwise hand below pointing up
  const top = scene ? r.top + r.height * .62 : low ? r.top - th - 44 : r.bottom + 34;
  elTut.style.left = clamp(cx - tw / 2, 6, vw - tw - 6) + 'px'; elTut.style.top = top + 'px';
  elHand.style.display = 'block';
  const hand = low && !scene ? '👇' : '👆';
  if (elHand.textContent !== hand) elHand.textContent = hand;
  const hx = scene ? r.left + r.width * .78 : cx - 13, hy = scene ? r.top + r.height * .74 : low ? r.top - 34 : r.bottom - 6;
  elHand.style.left = hx + 'px'; elHand.style.top = hy + 'px';
  if (st.sel !== '#c' && !el.classList.contains('glow')) el.classList.add('glow', 'tutglow');
  document.querySelectorAll('.tutglow').forEach(e => { if (e !== el) e.classList.remove('glow', 'tutglow'); });
}
