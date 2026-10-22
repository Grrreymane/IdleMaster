// ------------------------------------------------------------ quadruped (facing right)
// f: form look, gear: {horn, collar, armor, claw, tail, rune} -> rarity 0..5 or undefined
// Sprite box QW x QH (112 x 104), feet on the ground line GY.
const QW = 112, QH = 104, GY = QH - 6;   // GY = ground line
function quadGrid(f, gear = {}) {
  const G = new Grid(QW, QH), B = ramp(f.body), BD = ramp(shade(f.body, -38)), BL = ramp(f.belly || shade(f.body, 40));
  const s = f.size || 1, bl = f.bodyLen || 1, lg = f.leg || 1, dy = (1 - lg) * 12;
  const X = x => 56 + (x - 56) * s, Y = y => GY - (86 - y - (y < 70 ? dy : 0)) * s, S = v => v * s;
  const A = {};
  const legTop = Y(60), foot = GY;
  const legs = [[X(36 - 8 * (bl - 1)), true, 1], [X(68 + 4 * (bl - 1)), true, 0], [X(42 - 8 * (bl - 1)), false, 1], [X(63 + 4 * (bl - 1)), false, 0]];
  const leg = (x, far, hind) => {
    const pal = far ? BD : B, top = legTop;
    const r0 = S(f.thick ? 6 : 5) * (far ? .9 : 1), r1 = S(f.thick ? 4 : 3);
    if (hind) {   // haunch + backward-bent shin
      blob(G, x - S(1), top - S(2), S(9), S(10), pal, { belly: far ? BD : B, bellyY: 2 });
      tube(G, [x - S(1), top + S(4)], [x - S(6), (top + foot) / 2 + S(2)], [x + S(1), foot - S(3)], r0 * .9, r1, pal);
    } else tube(G, [x, top - S(2)], [x + S(2), (top + foot) / 2], [x + S(1), foot - S(3)], r0, r1, pal);
    blob(G, x + S(2.5), foot - S(2.2), S(f.thick ? 5 : 4.2), S(2.6), far ? BD : (f.paw ? ramp(f.paw) : B));
    if (f.hoof) G.rect(R(x - S(1.5)), R(foot - S(2)), R(S(8)), R(S(2)), shade(f.hoof, far ? -30 : 0));
    else if (!far) for (let k = 0; k < 3; k++) G.set(R(x + S(1.5) + k * S(1.6)), R(foot - S(.8)), shade(B[1], -10));
  };
  legs.filter(l => l[1]).forEach(l => leg(l[0], true, l[2]));
  drawTails(G, f, X, Y, S, A, gear);
  if (f.wings) wing(G, f, X(52), Y(42), S, true);
  const bodyPat = (x, y, nx, ny) => {
    if (f.stripes && ny < .45 && Math.abs(Math.sin((x * .9 + y * .35) * .55)) < .26) return ramp(Array.isArray(f.stripes) ? f.stripes[Math.floor((x * .9 + y * .35) * .55 / Math.PI + 100) % f.stripes.length] : f.stripes);
    if (f.spots && ((x * 7 + y * 13) % 23 === 0 || (x * 5 + y * 11) % 29 === 0) && ny < .4) return f.spots;
    return null;
  };
  blob(G, X(38 - 8 * (bl - 1)), Y(53), S(14), S(13), B, { belly: BL, bellyY: .55, pat: bodyPat });
  blob(G, X(52), Y(55), S(23 * bl), S(13.5), B, { belly: BL, bellyY: .5, pat: bodyPat });
  blob(G, X(66 + 4 * (bl - 1)), Y(52), S(13), S(14), B, { belly: BL, bellyY: .35, pat: bodyPat });
  A.body = [X(52), Y(52)]; A.back = [X(48), Y(41)];
  if (gear.armor !== undefined) armorG(G, gear.armor, X, Y, S, bl);
  legs.filter(l => !l[1]).forEach(l => leg(l[0], false, l[2]));
  A.paw = [legs[3][0] + S(2.5), foot - S(2)];
  if (gear.claw !== undefined) clawG(G, gear.claw, A.paw[0], A.paw[1], S);
  const hx = X(82), hy = Y(29 - (f.neckUp || 0));
  tube(G, [X(64), Y(50)], [X(72), Y(44)], [hx - S(3), hy + S(6)], S(10), S(8), B, { pat: (x, y, t, dx, dy) => dx > .2 && dy > -.1 ? BL : null });
  if (f.wings) wing(G, f, X(56), Y(42), S, false);
  if (f.mane) maneG(G, f, hx, hy, S);
  A.neck = [X(70), Y(44)];
  if (gear.collar !== undefined) collarG(G, gear.collar, X(71), Y(44), S);
  headG(G, f, hx, hy, S, f.headCol ? ramp(f.headCol) : B, f.headCol ? ramp(shade(f.headCol, 20)) : BL, A, gear);
  return { G, A };
}
function headG(G, f, hx, hy, S, B, BL, A, gear) {
  const sn = f.snout || 'mid', snL = sn === 'long' ? 11 : sn === 'short' ? 5 : 8, snR = sn === 'short' ? 6 : 5.5;
  const earPal = ramp(f.ear || f.body);
  if (f.ears === 'fox' || f.ears === 'cat' || !f.ears) {
    const h = f.ears === 'cat' ? 8 : 12;
    poly(G, [[hx - S(9), hy - S(5)], [hx - S(6), hy - S(5 + h)], [hx - S(1), hy - S(7)]], ramp(shade(f.ear || f.body, -20)));
    poly(G, [[hx - S(4), hy - S(7)], [hx + S(1), hy - S(7 + h)], [hx + S(5), hy - S(6)]], earPal);
    poly(G, [[hx - S(1.5), hy - S(7)], [hx + S(1), hy - S(4 + h)], [hx + S(3), hy - S(6.5)]], ramp(f.earIn || '#f2a8a0'), { v0: .6 });
  } else if (f.ears === 'round') {
    blob(G, hx - S(6), hy - S(9), S(4), S(4), ramp(shade(f.body, -20)));
    blob(G, hx + S(1), hy - S(10), S(4.5), S(4.5), earPal);
    blob(G, hx + S(1.2), hy - S(9.6), S(2.2), S(2.2), ramp(f.earIn || '#f2a8a0'));
  } else if (f.ears === 'long') {
    poly(G, [[hx - S(4), hy - S(6)], [hx - S(16), hy - S(10)], [hx - S(5), hy - S(2)]], earPal);
  }
  blob(G, hx, hy, S(11), S(10), B, { belly: BL, bellyY: .55 });
  blob(G, hx + S(snL * .8), hy + S(4), S(snL * .55 + 3), S(snR), B, { belly: BL, bellyY: .1 });
  if (f.cheek) blob(G, hx + S(2), hy + S(6), S(6), S(4), BL);
  A.horn = [hx - S(1), hy - S(9)]; A.brow = [hx + S(4), hy - S(5)];
  if (f.horn) hornG(G, f.horn, f.hornCol || '#e8d8b0', hx - S(1), hy - S(8), S, 0);
  if (gear.horn !== undefined && !f.horn) hornG(G, 'gear', RAR[gear.horn].c, hx - S(1), hy - S(8), S, gear.horn);
  else if (gear.horn !== undefined) circletG(G, gear.horn, hx, hy - S(7), S);
  const ex = hx + S(4), ey = hy - S(1);
  eyeG(G, R(ex), R(ey), Math.max(1.6, S(f.eyeR || 2.3)), f.eye || '#ffd23a', f.pupil || 'slit');
  const nx = hx + S(snL * .8 + snL * .55 + 2), ny = hy + S(2.5);
  G.set(R(nx), R(ny), OUT); G.set(R(nx - 1), R(ny), OUT); G.set(R(nx), R(ny + 1), shade(f.nose || '#3a2030', 20));
  for (let k = 0; k < S(snL * .8); k++) G.set(R(nx - 2 - k), R(hy + S(6.5) + (k > S(snL * .5) ? 1 : 0)), shade(B[0], -20));
  if (f.fangs) { G.set(R(nx - S(3)), R(hy + S(7.5)), '#fff8e8'); G.set(R(nx - S(3)), R(hy + S(8.5)), '#fff8e8'); G.set(R(nx - S(6)), R(hy + S(7.5)), '#fff8e8'); }
  if (f.beard) tube(G, [hx + S(6), hy + S(8)], [hx + S(6), hy + S(13)], [hx + S(3), hy + S(16)], S(2.5), S(1), ramp(f.beard));
  A.face = [ex, ey]; A.nose = [nx, ny];
  if (gear.rune !== undefined) runeG(G, gear.rune, hx + S(1), hy - S(4), S);
}
function hornG(G, kind, col, x, y, S, gearR) {
  const P = ramp(col), PD = ramp(shade(col, -30));
  if (kind === 'single') tube(G, [x + S(3), y + S(1)], [x + S(6), y - S(8)], [x + S(11), y - S(14)], S(2.6), S(.6), P);
  else if (kind === 'twin' || kind === 'gear') {
    tube(G, [x - S(3), y + S(1)], [x - S(6), y - S(7)], [x - S(3), y - S(12)], S(2.4), S(.6), PD);
    tube(G, [x + S(2), y + S(1)], [x + S(3), y - S(8)], [x + S(8), y - S(12)], S(2.6), S(.6), P);
  } else if (kind === 'antler') {
    for (const [d, pal] of [[-4, PD], [2, P]]) {
      tube(G, [x + S(d), y + S(1)], [x + S(d - 2), y - S(8)], [x + S(d + 3), y - S(15)], S(1.8), S(.8), pal);
      tube(G, [x + S(d - 1), y - S(6)], [x + S(d + 4), y - S(7)], [x + S(d + 6), y - S(11)], S(1.2), S(.6), pal);
      tube(G, [x + S(d - 1), y - S(10)], [x + S(d - 5), y - S(12)], [x + S(d - 6), y - S(16)], S(1.1), S(.6), pal);
    }
  } else if (kind === 'curl') {
    tube(G, [x - S(2), y], [x - S(10), y - S(6)], [x - S(9), y + S(4)], S(3), S(1.2), P);
  } else if (kind === 'ox') {
    tube(G, [x - S(4), y + S(2)], [x - S(12), y - S(2)], [x - S(10), y - S(10)], S(2.8), S(.8), PD);
    tube(G, [x + S(3), y + S(1)], [x + S(12), y - S(2)], [x + S(10), y - S(11)], S(3), S(.8), P);
  }
}
function circletG(G, r, x, y, S) {   // horn slot on a beast that already has horns: a jewelled circlet
  const P = ramp(r >= 4 ? '#f0c040' : '#c8a060');
  tube(G, [x - S(8), y + S(2)], [x, y - S(2)], [x + S(8), y + S(2)], S(1.4), S(1.4), P);
  blob(G, x, y - S(1), S(2), S(2), ramp(RAR[r].c));
}
function drawTails(G, f, X, Y, S, A, gear) {
  const n = f.tails || 1, kind = f.tail || 'fox', P = ramp(f.tailCol || f.body), TP = ramp(f.tailTip || f.tailCol || f.body);
  const base = [X(30), Y(47)];
  for (let i = n - 1; i >= 0; i--) {
    const spread = n === 1 ? 0 : (i / (n - 1) - .5);
    const ang = -2.25 + spread * (n > 3 ? 1.25 : 1.7) + (f.tailLen ? .5 : 0), len = S(kind === 'fox' ? 30 : 26) * (f.tailLen || 1) * (1 - Math.abs(spread) * .2);
    const tip = [base[0] + Math.cos(ang) * len, base[1] + Math.sin(ang) * len], ctrl = [base[0] - S(16), base[1] + S(4) - spread * S(8)];
    const pal = i === 0 ? P : ramp(shade(f.tailCol || f.body, -10 - 12 * Math.abs(spread)));
    let end = tip;
    if (kind === 'fox') {
      const rf = t => S(2.5 + (n > 3 ? 4.5 : 6.5) * Math.sin(Math.pow(t, .75) * Math.PI * .92));
      if (n > 1 && i < n - 1) tube(G, base, ctrl, tip, 0, 0, [shade(pal[0], -30)], { rf: t => rf(t) + 1 });   // dark rim separates the tails
      tube(G, base, ctrl, tip, 0, 0, t => t > .72 ? TP : pal, { rf });
    }
    else if (kind === 'lion' || kind === 'thin') { tube(G, base, ctrl, tip, S(2.4), S(1.4), pal); blob(G, tip[0], tip[1], S(kind === 'lion' ? 4.5 : 2.5), S(kind === 'lion' ? 4.5 : 2.5), TP); }
    else if (kind === 'dragon') { end = [base[0] - S(30), base[1] + S(22)]; tube(G, base, [base[0] - S(26), base[1] - S(4)], end, S(6), S(1.2), pal, { pat: (x, y, t, dx, dy) => dy > .4 ? ramp(f.belly || '#f0d890') : null }); }
    else if (kind === 'stub') { end = [base[0] - S(3), base[1] - S(2)]; blob(G, end[0], end[1], S(4.5), S(4.5), TP); }
    if (i === 0) A.tail = end;
  }
  if (gear.tail !== undefined) tailG(G, gear.tail, A.tail[0], A.tail[1], S);
}
function wing(G, f, x, y, S, far) {
  const P = ramp(far ? shade(f.wings, -34) : f.wings), dx = far ? -S(5) : 0;
  const tips = [[x - S(28) + dx, y - S(26)], [x - S(16) + dx, y - S(36)], [x - S(2) + dx, y - S(34)]];
  poly(G, [[x - S(8) + dx, y + S(2)], tips[0], tips[1], tips[2], [x + S(8) + dx, y - S(4)]], P, { v0: .9, dv: .45 });
  if (!far) for (let i = 0; i < 4; i++) { const t = (i + 1) / 5; gLine(G, x + dx, y - S(2), lerp(tips[0][0], tips[2][0], t), lerp(tips[0][1], tips[2][1], t) + S(4), shade(P[1], -6), true); }
}
function maneG(G, f, hx, hy, S) {
  const P = ramp(f.mane);
  for (let i = 0; i < 7; i++) {
    const a = -2.7 + i * .44, r = S(12 + (i & 1) * 3);
    tube(G, [hx - S(3), hy + S(3)], [hx - S(3) + Math.cos(a) * r * .6, hy + S(3) + Math.sin(a) * r * .6], [hx - S(5) + Math.cos(a) * r, hy + S(5) + Math.sin(a) * r], S(5), S(1.5), P);
  }
}
// ------------------------------------------------------------ gear overlays (rarity colours)
const RAR = [
  { n: '凡', c: '#b8b0a0' },
  { n: '良', c: '#6fd06a' },
  { n: '珍', c: '#58a8ff' },
  { n: '稀', c: '#c47cff' },
  { n: '极', c: '#ffae3a' },
  { n: '神', c: '#ff5a5a' },
];
function collarG(G, r, x, y, S) {
  const P = ramp(r >= 4 ? '#e8b030' : r >= 2 ? '#c8a050' : '#8a6a48');
  tube(G, [x - S(5), y - S(6)], [x - S(2), y + S(1)], [x + S(6), y + S(2)], S(2), S(2), P);
  blob(G, x + S(2), y + S(5), S(2.6 + r * .25), S(2.8 + r * .25), ramp(RAR[r].c));
  G.set(R(x + S(2)), R(y + S(6.5)), OUT);
}
function armorG(G, r, X, Y, S, bl) {   // scaled saddle plate over the back, clipped to the body
  const P = ramp(RAR[r].c), D = ramp(shade(RAR[r].c, -35));
  const cx = X(52), cy = Y(47), rx = S(20 * bl), ry = S(9);
  for (let y = Math.floor(cy - ry - 1); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry;
    if (nx * nx + ny * ny > 1 || ny > .55 || !G.get(x, y)) continue;
    const row = Math.floor((y - cy + ry) / S(3.2)), col = (x + (row & 1) * S(2.5)) / S(5);
    const fx = col - Math.floor(col), edge = fx > .82 || (y - cy + ry) / S(3.2) - row > .78;
    const v = lam(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))) - (edge ? .3 : 0);
    G.set(x, y, qv(ny > .3 ? D : P, v, x, y));
  }
  if (r >= 3) for (let i = 0; i < 3; i++) blob(G, cx - S(10) + i * S(10), cy + S(2), S(1.6), S(1.6), ramp(r >= 5 ? '#fff0a0' : '#ffffff'));
}
function clawG(G, r, x, y, S) {
  const P = ramp(RAR[r].c);
  blob(G, x, y - S(3), S(4.5), S(3), ramp(shade(RAR[r].c, -30)));
  for (let k = 0; k < 3; k++) tube(G, [x + S(1 + k * 1.6), y - S(1)], [x + S(3 + k * 1.6), y], [x + S(4.5 + k * 1.8), y + S(1.5)], S(1), S(.5), P, { n: 8 });
}
function tailG(G, r, x, y, S) {
  const P = ramp(RAR[r].c);
  blob(G, x, y + S(2), S(2.6), S(2.6), ramp(r >= 3 ? '#ffe070' : '#c03030'));
  tube(G, [x, y + S(3)], [x - S(1), y + S(7)], [x + S(1), y + S(11)], S(1.6), S(.8), P);
  tube(G, [x + S(1), y + S(3)], [x + S(3), y + S(7)], [x + S(4), y + S(10)], S(1.4), S(.7), P);
}
function runeG(G, r, x, y, S) {
  const c = RAR[r].c;
  G.set(R(x), R(y - 1), c); G.set(R(x - 1), R(y), c); G.set(R(x + 1), R(y), c); G.set(R(x), R(y + 1), c); G.set(R(x), R(y), '#ffffff');
}
