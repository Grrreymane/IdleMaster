// ------------------------------------------------------------ serpent / dragon (facing right), same QW x QH box, ground at GY
// f: body, belly, size, legs (0 | 4 | 6), wings ('small4' | 'thin4' | 'big'), wingCol, horn, hornCol, whisk, mane, face ('dragon' | 'human'), eye, crest
function snakeGrid(f, gear = {}) {
  const G = new Grid(QW, QH), B = ramp(f.body), BD = ramp(shade(f.body, -34)), BL = ramp(f.belly || '#f0d890');
  const s = f.size || 1, X = x => 56 + (x - 56) * s, Y = y => GY - (86 - y) * s, S = v => v * s, P = (x, y) => [X(x), Y(y)];
  const A = {}, th = f.thick || 1;
  const scales = (x, y, t, dx, dy) => dy > .38 ? BL : (((x + (y >> 1)) & 3) === 0 && (y & 3) === 0 && dy < -.2 ? shade(B[2], -8) : null);
  const scalesD = (x, y, t, dx, dy) => dy > .38 ? ramp(shade(f.belly || '#f0d890', -30)) : null;
  // far wings first
  if (f.wings) snakeWing(G, f, P(64, 50), S, true);
  // far legs
  const legAt = f.legs === 6 ? [[30, 76], [50, 80], [70, 78]] : f.legs === 4 ? [[42, 80], [72, 76]] : [];
  legAt.forEach(([x, y]) => snakeLeg(G, X(x - 4), Y(y), S, BD, f, true));
  // tail curl (back), ground coil, neck
  tube(G, P(42, 77), P(14, 88), P(8, 64), S(8 * th), S(1.5), BD, { pat: scalesD });
  tube(G, P(40, 77), P(92, 92), P(80, 64), S(9 * th), S(9 * th), B, { pat: scales });
  A.tail = P(8, 64);
  if (f.fin) for (let i = 0; i < 6; i++) { const t = i / 6, [x, y] = bez(P(42, 77), P(14, 88), P(8, 64), t); poly(G, [[x, y - S(6)], [x - S(2), y - S(11)], [x + S(3), y - S(7)]], ramp(f.fin)); }
  A.body = P(64, 76); A.back = P(66, 68);
  if (gear.armor !== undefined) { const P2 = ramp(RAR[gear.armor].c), D2 = ramp(shade(RAR[gear.armor].c, -35)); for (let i = 0; i < 6; i++) { const [x, y] = bez(P(40, 77), P(92, 92), P(80, 64), .25 + i * .11); blob(G, x, y - S(5), S(4), S(3.2), i & 1 ? D2 : P2); } }
  legAt.forEach(([x, y]) => snakeLeg(G, X(x + 3), Y(y), S, B, f, false));
  if (legAt.length) { A.paw = [X(legAt[legAt.length - 1][0] + 6), GY]; if (gear.claw !== undefined) clawG(G, gear.claw, A.paw[0], A.paw[1], S); }
  const hx = X(86), hy = Y(30);
  tube(G, P(80, 66), P(64, 50), [hx - S(6), hy + S(8)], S(9 * th), S(7), B, { pat: scales });
  if (f.mane) for (let i = 0; i < 7; i++) { const [x, y] = bez(P(80, 66), P(64, 50), [hx - S(6), hy + S(8)], i / 7); tube(G, [x - S(4), y], [x - S(9), y - S(2)], [x - S(12), y + S(3)], S(2.4), S(.8), ramp(f.mane)); }
  if (!legAt.length && gear.claw !== undefined) { A.paw = P(70, 62); clawG(G, gear.claw, A.paw[0], A.paw[1], S); }
  if (f.wings) snakeWing(G, f, P(66, 52), S, false);
  A.neck = [hx - S(6), hy + S(9)];
  if (gear.collar !== undefined) collarG(G, gear.collar, hx - S(5), hy + S(9), S);
  // head
  if (f.face === 'human') {
    if (f.mane) tube(G, [hx - S(2), hy - S(6)], [hx - S(14), hy - S(4)], [hx - S(16), hy + S(10)], S(6), S(2), ramp(f.mane));
    blob(G, hx, hy, S(9), S(10), ramp(f.skin || '#f0c8a0'));
    const ex = hx + S(3), ey = hy - S(1);
    G.rect(R(ex - S(1)), R(ey - S(3)), Math.max(2, R(S(2))), Math.max(4, R(S(6))), OUT);   // upright eye (竖目)
    G.rect(R(ex - S(1)) + 1, R(ey - S(2)), 1, Math.max(2, R(S(4))), f.eye || '#ffde3a');
    G.set(R(hx + S(8)), R(hy + S(2)), shade(f.skin || '#f0c8a0', -60));
    for (let k = 0; k < 4; k++) G.set(R(hx + S(4) + k), R(hy + S(6)), shade(f.skin || '#f0c8a0', -70));
    if (f.candle) { blob(G, hx + S(9), hy + S(7), S(2), S(2), ramp('#ffe060')); A.candle = [hx + S(9), hy + S(3)]; }
    A.horn = [hx, hy - S(9)];
  } else {
    blob(G, hx, hy, S(10), S(8.5), B, { belly: BL, bellyY: .6 });
    blob(G, hx + S(10), hy + S(3), S(9), S(5), B, { belly: BL, bellyY: .25 });            // snout
    blob(G, hx + S(8), hy + S(8), S(7), S(2.6), BL);                                          // jaw
    G.set(R(hx + S(18)), R(hy + S(1)), OUT); G.set(R(hx + S(17)), R(hy + S(1)), OUT);
    for (let k = 0; k < S(10); k++) G.set(R(hx + S(7) + k), R(hy + S(6.2)), shade(B[0], -20));
    eyeG(G, R(hx + S(3)), R(hy - S(2)), Math.max(1.6, S(2.3)), f.eye || '#ffde3a', 'slit');
    G.set(R(hx + S(1)), R(hy - S(5)), OUT); G.set(R(hx + S(2)), R(hy - S(5.5)), OUT); G.set(R(hx + S(4)), R(hy - S(5.5)), OUT);
    if (f.fangs) { G.set(R(hx + S(15)), R(hy + S(7)), '#fff8e8'); G.set(R(hx + S(11)), R(hy + S(7)), '#fff8e8'); }
    if (f.crest) for (let i = 0; i < 3; i++) poly(G, [[hx - S(6 + i * 4), hy - S(4 - i)], [hx - S(9 + i * 4), hy - S(11 - i * 2)], [hx - S(3 + i * 4), hy - S(6 - i)]], ramp(f.crest));
    A.horn = [hx - S(1), hy - S(7)];
    if (f.horn) hornG(G, f.horn, f.hornCol || '#f0e0b0', hx - S(1), hy - S(6), S, 0);
  }
  if (gear.horn !== undefined) { if (f.horn) circletG(G, gear.horn, hx, hy - S(6), S); else hornG(G, 'gear', RAR[gear.horn].c, hx - S(1), hy - S(6), S, gear.horn); }
  if (gear.rune !== undefined) runeG(G, gear.rune, hx + S(1), hy - S(4), S);
  if (gear.tail !== undefined) tailG(G, gear.tail, A.tail[0], A.tail[1], S);
  A.face = [hx + S(3), hy - S(2)];
  return { G, A, whisk: f.whisk ? [[hx + S(16), hy + S(4)], f.whisk] : null };
}
function snakeLeg(G, x, y, S, pal, f, far) {
  tube(G, [x, y - S(8)], [x + S(5), y - S(4)], [x + S(3), y - S(1.5)], S(3.4), S(2.2), pal);
  for (let k = 0; k < 3; k++) G.set(R(x + S(4) + k * S(1.4)), R(y - S(.5)), far ? shade(pal[1], -20) : '#f0e8d0');
}
function snakeWing(G, f, at, S, far) {
  const col = f.wingCol || shade(f.body, 20), P = ramp(far ? shade(col, -34) : col), dx = far ? -S(6) : 0, [x, y] = at;
  if (f.wings === 'big') {
    const tips = [[x - S(30) + dx, y - S(28)], [x - S(18) + dx, y - S(40)], [x - S(4) + dx, y - S(38)], [x + S(6) + dx, y - S(28)]];
    poly(G, [[x - S(10) + dx, y + S(4)], ...tips, [x + S(8) + dx, y - S(2)]], P, { v0: .95, dv: .45 });
    if (!far) for (let i = 0; i < 5; i++) { const t = (i + .5) / 5; gLine(G, x + dx, y, lerp(tips[0][0], tips[3][0], t), lerp(tips[0][1], tips[3][1], t) + S(5), shade(P[1], -10), true); }
  } else {
    const n = 2, big = f.wings === 'thin4' ? 1.25 : 1;
    for (let i = 0; i < n; i++) {
      const ox = x - S(i * 10) + dx, oy = y + S(i * 6);
      poly(G, [[ox, oy], [ox - S(14 * big), oy - S(16 * big)], [ox - S(4), oy - S(20 * big)], [ox + S(6), oy - S(6)]], P, { v0: .95, dv: .5 });
    }
  }
}
