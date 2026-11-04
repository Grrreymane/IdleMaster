// What a phone player does with one thumb. Run through tests/touch.mjs.
export default async ({ ev, touch, touchEl, rectOf, check, sleep }) => {
  // stage coordinates (the game's own 180 x 128) -> screen
  const stage = async (x, y) => { const r = await ev(`(()=>{const c=document.getElementById('c').getBoundingClientRect();return {l:c.left,t:c.top,w:c.width,h:c.height}})()`); return [r.l + x / 180 * r.w, r.t + y / 128 * r.h]; };
  const tapStage = async (x, y) => { const [a, b] = await stage(x, y); await touch(a, b); };
  await ev('__t.TUT.i = 99; for (const k of ["tele","gift","sk0","tap"]) __t.TUT.f[k] = 1; __t.closeModal()');
  // ---- buttons outside the scrolling pane (they used to swallow touches)
  await touchEl('[data-act="tab"][data-v="gear"]'); await sleep(80);
  check('tab switches by touch', await ev('__t.TAB') === 'gear');
  await touchEl('[data-act="guide"]'); await sleep(80);
  check('变强 opens by touch', await ev('document.getElementById("modal").classList.contains("on")'));
  await touchEl('#mbox [data-act="close"]'); await sleep(80);
  check('modal button closes by touch', !await ev('document.getElementById("modal").classList.contains("on")'));
  // ---- taps on the stage
  const g0 = await ev('__t.S.gold'), t0 = await ev('__t.S.stats.taps');
  for (let i = 0; i < 4; i++) { await tapStage(50, 80); await sleep(60); }
  check('stage taps count and pay', await ev('__t.S.stats.taps') === t0 + 4 && await ev('__t.S.gold') > g0, `taps ${await ev('__t.S.stats.taps')}`);
  // ---- the skill row appears with the first evolution, and fires by touch
  check('no skill row before the first evolution', (await rectOf('#skills')).h === 0);
  await ev('__t.S.stage = 1; __t.S.form = "f1"; __t.S.forms.f1 = 1; __t.recalc(); __t.renderUI(); __t.S.cd[0] = 0');
  await sleep(120);
  const row = await rectOf('#skills');
  check('skill row shows with a thumb-sized button', row.h >= 30, `row ${Math.round(row.w)}x${Math.round(row.h)}`);
  const c0 = await ev('__t.S.stats.casts');
  await touchEl('[data-k="sk0"]'); await sleep(100);
  check('裂爪 casts by touch and starts its cooldown', await ev('__t.S.stats.casts') === c0 + 1 && await ev('__t.S.cd[0]') > 8);
  await touchEl('[data-k="sk0"]'); await sleep(80);
  check('a cooling skill does not fire again', await ev('__t.S.stats.casts') === c0 + 1);
  // ---- the chest
  await ev('__t.GIFT = { x: 90, y: 50, t: 9 }'); await sleep(60);
  const gifts = await ev('__t.S.stats.gifts');
  await tapStage(90, 50); await sleep(80);
  check('chest opens by touch and goes away', await ev('__t.S.stats.gifts') === gifts + 1 && await ev('__t.GIFT === null'));
  // ---- a boss's "!": taps on the beast do not answer it, a tap on the enemy's side does
  await ev('__t.S.unlocked[0][4] = 1; __t.S.zone = 0; __t.spawn(__t.S, 0, 4); __t.S.f.hp = __t.S.f.max = 1e12; __t.S.f.hits = 3; __t.S.f.eT = 0; __t.S.hp = __t.DER.hp');
  for (let i = 0; i < 80 && !await ev('!!(__t.S.f && __t.S.f.tele)'); i++) await sleep(40);
  check('蛊雕 raises a "!" before its heavy blow', await ev('!!(__t.S.f && __t.S.f.tele)'));
  const p0 = await ev('__t.S.stats.parries');
  await tapStage(40, 90); await sleep(50);
  check('a tap on the beast leaves it unanswered', await ev('__t.S.stats.parries') === p0);
  await tapStage(140, 60); await sleep(80);
  check('a tap on the enemy answers it', await ev('__t.S.stats.parries') === p0 + 1 && await ev('__t.S.f.dodge') === 1);
  // ---- patrol: with 自动 on the fights go through the open tiers
  await ev('__t.S.f = null; __t.S.zone = 0; __t.S.tier = 0; __t.S.auto = true; __t.S.unlocked[0] = [1,1,1,1,0]; __t.S.calm = 0; __t.S.lv = 60; __t.S.bossWins = {0:1}; __t.recalc()');
  const seen = new Set(); for (let i = 0; i < 120 && seen.size < 4; i++) { const t = await ev('__t.S.f ? __t.S.f.t : -1'); if (t >= 0) seen.add(t); await sleep(120); }
  check('patrol visits all four tiers', seen.size === 4, [...seen].join(','));
};
