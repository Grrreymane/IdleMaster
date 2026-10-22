// ============================================================ 山海异兽录 · enemies (procedural pixel art, facing right)
// monsterGrid(z, t): zone 0..7; t 0..3 normal (72x64 grid), t 4 boss (120x100 grid). Needs prim.js + art.js + art2.js.
// Each beast is drawn into a big workspace (ground at MGY), then fit() crops it, centres it and puts the feet on row h-2.
// The game calls selOutline itself. Deterministic (no Math.random).
const MON_W = 72, MON_H = 64, BOSS_W = 120, BOSS_H = 100, MGY = 132;   // MGY: workspace ground line
const qFoot = () => typeof GY === "number" ? GY : 86;   // quadGrid feet row (lab art2.js: 86, game src/art_quad.js: global GY)
const ws = () => new Grid(200, 140);
function stamp(D, S, dx = 0, dy = 0, flip = false, f) {
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
    const c = S.get(x, y); if (c) D.set(R(dx) + (flip ? S.w - 1 - x : x), R(dy) + y, f ? f(c) : c);
  }
}
function fit(G, w, h) {
  let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) if (G.get(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const D = new Grid(w, h); stamp(D, G, Math.floor((w - 1 - x1 - x0) / 2), h - 2 - y1);
  D.fitInfo = [x1 - x0 + 1, y1 - y0 + 1]; return D;
}
function recol(G, test, pairs) { const m = new Map(); pairs.forEach(([a, b]) => a.forEach((c, i) => m.set(c, b[i]))); G.map((x, y, c) => test(x, y) && m.get(c)); }
function halo(G, r, c1, c2, test) {   // glow ring around the silhouette
  const add = [];
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
    if (G.get(x, y) || !test(x, y)) continue;
    let near = 99;
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (G.get(x + i, y + j)) near = Math.min(near, i * i + j * j);
    if (near <= r * r) add.push([x, y, near <= 2 || BAYER[y & 3][x & 3] < 7 ? c1 : c2]);
  }
  add.forEach(([x, y, c]) => G.set(x, y, c));
}
// Catmull-Rom tube through points (snakes, necks); rf(t) = radius, pal or pal(t)
function ptube(G, P, rf, pal, o = {}) {
  const pts = [], n = P.length;
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < 10; s++) {
    const t = s / 10, a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n - 1, i + 2)], t2 = t * t, t3 = t2 * t;
    const f = k => .5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
    pts.push([f(0), f(1)]);
  }
  pts.push(P[n - 1]);
  pts.forEach((p, i) => { p[3] = i / (pts.length - 1); p[2] = rf(p[3]); });
  const m = Math.max(...pts.map(p => p[2])) + 1;
  const x0 = Math.floor(Math.min(...pts.map(p => p[0])) - m), x1 = Math.ceil(Math.max(...pts.map(p => p[0])) + m);
  const y0 = Math.floor(Math.min(...pts.map(p => p[1])) - m), y1 = Math.ceil(Math.max(...pts.map(p => p[1])) + m);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let best = 1e9, bp = null;
    for (const p of pts) { const dx = x + .5 - p[0], dy = y + .5 - p[1], d = dx * dx + dy * dy - p[2] * p[2]; if (d < best) { best = d; bp = p; } }
    if (best > 0) continue;
    const dx = (x + .5 - bp[0]) / bp[2], dy = (y + .5 - bp[1]) / bp[2], rr = Math.min(1, dx * dx + dy * dy);
    const v = lam(dx, dy, Math.sqrt(1 - rr)) + (o.add || 0);
    if (o.pat) { const pc = o.pat(x, y, bp[3], dx, dy); if (pc === 'skip') continue; if (pc) { G.set(x, y, typeof pc === 'string' ? pc : qv(pc, v, x, y)); continue; } }
    G.set(x, y, qv(typeof pal === 'function' ? pal(bp[3]) : pal, v, x, y));
  }
}
// ------------------------------------------------------------ parts
const SKIN = '#f0d2b4', INK = '#2a1a24';
function face(G, x, y, r, o = {}) {   // simple human face, 3/4 view looking right
  const sk = ramp(o.skin || SKIN), hr = o.hair && ramp(o.hair);
  if (hr) { if (r < 5) blob(G, x - r * .3, y - r * .3, r * .85, r * .8, hr); else blob(G, x - r * .45, y - r * .05, r * .95, r * 1.05, hr); if (o.long) tube(G, [x - r * .7, y], [x - r * 1.1, y + r * .8], [x - r * 1.4, y + r * 1.5], r * .55, r * .2, hr); }
  blob(G, x + r * .1, y + r * .12, r * .88, r * .95, sk, { flat: .7 });
  if (hr) blob(G, x - r * .25, y - r * .5, r * .95, r * .55, hr, { clip: (px, py) => py < y - r * .5 - Math.max(0, px - x) * .25 });
  const ey = R(y + r * .1), lid = shade(sk[1], -25);
  if (o.eyes === 'closed') for (const ex of [R(x + r * .02), R(x + r * .62)]) gLine(G, ex - 1, ey, ex + 1, ey + 1, INK);
  if (o.eyes === true || o.eyes === undefined) for (const ex of [R(x + r * .02), R(x + r * .62)]) {
    if (r < 4.5) G.set(ex, ey, o.eye || INK);
    else if (r > 8.5) { G.rect(ex - 2, ey, 4, 2, '#fbf6ee'); G.rect(ex, ey, 2, 2, o.eye || INK); G.set(ex + 1, ey, INK); gLine(G, ex - 2, ey - 1, ex + 1, ey - 1, lid); }
    else { G.set(ex - 1, ey, '#fbf6ee'); G.set(ex, ey, o.eye || INK); G.set(ex - 1, ey - 1, lid); G.set(ex, ey - 1, lid); if (r > 7) G.set(ex + 1, ey - 1, lid); }
  }
  if (r >= 4.5) G.set(R(x + r * .9), R(y + r * .38), sk[1]);   // nose
  const mx = R(x + r * .45), my = R(y + r * .66), M = o.mouth || 'line';
  if (r < 4.5) return;
  if (M === 'open') { G.rect(mx - 1, my - 1, 3, 2, '#4a1828'); G.set(mx - 1, my - 1, '#fff8ee'); G.set(mx + 1, my - 1, '#fff8ee'); }
  else { gLine(G, mx - 1, my, mx + 1, my, '#8a3a40'); }
  if (M === 'fang') { G.set(mx - 1, my + 1, '#fff8ee'); G.set(mx + 1, my + 1, '#fff8ee'); if (r > 8) { G.set(mx - 1, my + 2, '#fff8ee'); G.set(mx + 1, my + 2, '#fff8ee'); } }
  if (M === 'tusk') { const T = ramp('#f4ecd8'); tube(G, [mx + 1, my], [mx + r * .6, my + 1], [mx + r * .7, my - r * .55], r * .14, r * .06, T, { n: 10 }); tube(G, [mx - 2, my], [mx - r * .4, my + 1], [mx - r * .55, my - r * .45], r * .12, r * .05, ramp('#c8bca8'), { n: 10 }); }
}
function humanEye(G, x, y) { G.set(x - 1, y, '#fbf6ee'); G.set(x, y, '#fbf6ee'); G.set(x + 1, y, INK); gLine(G, x - 2, y - 1, x + 1, y - 1, INK); }
function pigEars(G, x, y, S, col) {
  poly(G, [[x - S(6), y - S(3)], [x - S(9), y - S(10)], [x - S(1), y - S(5)]], ramp(shade(col, -25)));
  poly(G, [[x - S(2), y - S(5)], [x + S(5), y - S(10)], [x + S(5), y - S(2)]], ramp(col));
  poly(G, [[x, y - S(5)], [x + S(4), y - S(8)], [x + S(4), y - S(3.5)]], ramp('#f0a0a0'), { v0: .55 });
}
function rabbitEars(G, x, y, S, col) {
  for (const [d, c] of [[-4, shade(col, -25)], [1, col]]) {
    poly(G, [[x + S(d - 2), y], [x + S(d - 4), y - S(13)], [x + S(d - 1), y - S(17)], [x + S(d + 2), y - S(1)]], ramp(c), { v0: .85 });
    if (d > 0) poly(G, [[x + S(d - 1), y - S(2)], [x + S(d - 2.5), y - S(12)], [x + S(d - 1), y - S(14)], [x + S(d + .6), y - S(2)]], ramp('#f0b0b8'), { v0: .6 });
  }
}
function flame(G, x, y, S, dir = 1, big = 1) {   // flame puff pointing in dir (1 = right)
  const F = ['#a01810', '#e03a18', '#ff7a1a', '#ffb02a', '#ffe070', '#fff8c8'];
  poly(G, [[x, y - S(3) * big], [x + dir * S(10) * big, y - S(4) * big], [x + dir * S(7) * big, y], [x + dir * S(12) * big, y + S(3) * big], [x, y + S(3) * big]], F, { v0: .95, dv: .5 });
  poly(G, [[x, y - S(1.5) * big], [x + dir * S(6) * big, y - S(1) * big], [x, y + S(1.5) * big]], ['#ffe070', '#fff8c8', '#ffffff'], { v0: .9 });
}
function quadSet(f, s) {   // coordinate helpers matching quadGrid's own mapping, offset into the workspace
  const ox = 44, oy = MGY - qFoot(), dy = (1 - (f.leg || 1)) * 12;
  return { ox, oy, s, X: x => ox + 56 + (x - 56) * s, Y: y => oy + qFoot() - (86 - y - (y < 70 ? dy : 0)) * s, S: v => v * s };
}
// quadruped from art2.js; o.pre(C) draws behind it, o.post(C) on top. C: { G, X, Y, S, A, hx, hy, B, BD, BL }
function quad(f, s, o = {}) {
  const G = ws(), C = quadSet(f, s); C.G = G;
  C.B = ramp(f.body); C.BD = ramp(shade(f.body, -38)); C.BL = ramp(f.belly || shade(f.body, 40));
  if (o.pre) o.pre(C);
  const q = quadGrid(Object.assign({}, f, { size: s }));
  stamp(G, q.G, C.ox, C.oy);
  C.A = {}; for (const k in q.A) C.A[k] = [q.A[k][0] + C.ox, q.A[k][1] + C.oy];
  C.hx = C.A.face[0] - C.S(4); C.hy = C.A.face[1] + C.S(1);
  if (o.post) o.post(C);
  return G;
}
function headAlone(f, s) { const G = new Grid(70, 70), S = v => v * s; headG(G, f, 30, 40, S, ramp(f.body), ramp(f.belly || shade(f.body, 40)), {}, {}); return G; }
function extraLeg(C, x, far) {   // matching quadGrid's front leg
  const { G, S, Y } = C, pal = far ? C.BD : C.B, foot = C.oy + qFoot();
  tube(G, [x, Y(56)], [x + S(2), (Y(56) + foot) / 2], [x + S(1), foot - S(3)], S(5) * (far ? .9 : 1), S(3), pal);
  blob(G, x + S(2.5), foot - S(2.2), S(4.2), S(2.6), pal);
}
function snakeTail(G, p0, p1, p2, r0, col, belly) {
  const P = ramp(col), BL = ramp(belly || shade(col, 50));
  tube(G, p0, p1, p2, r0, r0 * .25, P, { pat: (x, y, t, dx, dy) => dy > .35 ? BL : ((x + y * 2) % 7 === 0 && dy < 0 ? ramp(shade(col, -30)) : null) });
}
// ------------------------------------------------------------ bird
// o: x, y(ground), k, body, belly, wing, rx, ry, legLen, legs(0|1|2), legCol, neck, neckX, neckR, headR, head, beak, beakLen, hook, flat,
//    wingUp, tail, tailLen, tailUp, crest, horn, eye, pat, headFn(G, hx, hy, k), talon
function wingUp(G, x, y, S, pal, far, len = 1, dir = 1) {
  const L = v => S(v) * len;
  const pts = [[x + S(5), y + S(2)], [x + S(5), y - L(8)], [x + L(1), y - L(18)], [x - L(6), y - L(25)], [x - L(9), y - L(19)], [x - L(12), y - L(20)], [x - L(13), y - L(14)], [x - L(16), y - L(14)], [x - L(16), y - L(8)], [x - L(19), y - L(7)], [x - S(12), y + S(2)]];
  if (dir < 0) pts.forEach(p => p[0] = 2 * x - p[0]);
  poly(G, pts, pal, { v0: far ? .6 : .95, dv: .5 });
  if (!far) for (const i of [4, 6, 8]) gLine(G, x + S(1) * dir, y - S(1), lerp(pts[i][0], x, .2), lerp(pts[i][1], y, .2), pal[1], true);
}
function bird(G, o) {
  const k = o.k || 1, S = v => v * k, B = ramp(o.body), BL = ramp(o.belly || shade(o.body, 45)), WG = ramp(o.wing || o.body), WD = ramp(shade(o.wing || o.body, -40));
  const rx = S(o.rx || 12), ry = S(o.ry || 8), ll = S(o.legLen === undefined ? 8 : o.legLen), bx = o.x, by = o.y - ll - ry * .75, legs = o.legs === undefined ? 2 : o.legs;
  const legC = o.legCol || '#e8a040';
  const leg = (lx, far) => {
    const c = far ? shade(legC, -45) : legC;
    tube(G, [lx, by + ry * .4], [lx + S(1.5), by + ry * .5 + ll * .5], [lx, o.y - 1], S(o.talon ? 2 : 1.2), S(o.talon ? 1.3 : .9), ramp(c));
    gLine(G, lx - S(2.5), o.y - 1, lx + S(4), o.y - 1, shade(c, -25));
    if (o.talon) for (let i = 0; i < 3; i++) { const tx = R(lx - S(2) + i * S(3)); G.set(tx + 1, o.y, '#1a1418'); G.set(tx, o.y, '#1a1418'); G.set(tx, o.y - 1, shade(c, -10)); }
  };
  if (legs === 2) leg(bx - S(2), true);
  if (o.tail) {
    const tl = S(o.tailLen || 8), tu = S(o.tailUp || 3);
    poly(G, [[bx - rx * .5, by - S(3)], [bx - rx - tl, by - tu - S(3)], [bx - rx - tl + S(2), by - tu + S(1)], [bx - rx - tl + S(1), by - tu + S(4)], [bx - rx * .4, by + S(4)]], ramp(o.tail), { v0: .8 });
    if (o.tail2) poly(G, [[bx - rx * .5, by], [bx - rx - tl * 1.2, by - tu + S(5)], [bx - rx - tl * 1.1, by - tu + S(8)], [bx - rx * .4, by + S(5)]], ramp(o.tail2), { v0: .7 });
  }
  if (o.wingUp) wingUp(G, bx - S(3), by - ry * .45, S, WD, true, o.wingLen || 1);
  blob(G, bx, by, rx, ry, B, { belly: BL, bellyY: .2, pat: o.pat });
  if (o.wingUp) wingUp(G, bx + S(1), by - ry * .35, S, WG, false, o.wingLen || 1);
  else if (o.wing !== false) {
    const pts = [[bx + rx * .55, by - ry * .55], [bx + rx * .1, by - ry * .85], [bx - rx * .7, by - ry * .5], [bx - rx - S(5), by + ry * .1], [bx - rx * .3, by + ry * .45], [bx + rx * .3, by + ry * .25]];
    poly(G, pts, WG, { v0: .85 });
    for (let i = 1; i < 4; i++) gLine(G, bx + rx * .4 - S(i * 4), by - ry * .3 + S(i), bx - rx * .2 - S(i * 4), by + ry * .25, WG[1], true);
  }
  const hx = bx + rx * .7 + S(o.neckX === undefined ? 3 : o.neckX), hy = by - ry * .4 - S(o.neck === undefined ? 5 : o.neck), hr = S(o.headR || 5.5);
  tube(G, [bx + rx * .45, by - ry * .1], [hx - S(2), (by + hy) / 2 + S(2)], [hx, hy + S(1)], S(o.neckR || 4.5), S(3.4), B, { pat: (x, y, t, dx, dy) => dx > .25 && dy > -.2 ? BL : null });
  if (o.headFn) o.headFn(G, hx, hy, k);
  else {
    if (o.crest) for (let i = 0; i < 3; i++) tube(G, [hx - S(1), hy - hr * .6], [hx - S(4 + i * 2), hy - S(7 + i)], [hx - S(7 + i * 3), hy - S(5 + i * 3)], S(1.4), S(.6), ramp(o.crest), { n: 12 });
    blob(G, hx, hy, hr, hr * .95, ramp(o.head || o.body));
    const bl = S(o.beakLen || 5), BK = ramp(o.beak || '#f0c040');
    if (o.flat) { poly(G, [[hx + hr * .6, hy - S(1.5)], [hx + hr + bl, hy + S(.5)], [hx + hr + bl, hy + S(2.5)], [hx + hr * .5, hy + S(2.5)]], BK, { v0: .9 }); }
    else poly(G, [[hx + hr * .7, hy - S(2)], [hx + hr + bl, hy + S(o.hook ? 0 : .5)], [hx + hr + bl - S(o.hook ? 1 : 0), hy + S(o.hook ? 3 : 1.4)], [hx + hr * .6, hy + S(2)]], BK, { v0: .95 });
    if (o.hook) G.set(R(hx + hr + bl - S(1)), R(hy + S(3)), BK[1]);
    if (o.horn) tube(G, [hx - S(1), hy - hr * .7], [hx - S(1), hy - hr - S(5)], [hx + S(4), hy - hr - S(9)], S(2.2), S(.6), ramp(o.horn));
    eyeG(G, R(hx + hr * .25), R(hy - hr * .2), Math.max(1.4, S(o.eyeR || 1.6)), o.eye || '#ffd23a', 'round');
    if (o.brow) gLine(G, R(hx + hr * .25 - S(2)), R(hy - hr * .2 - S(2.6)), R(hx + hr * .25 + S(2.5)), R(hy - hr * .2 - S(1.5)), INK);
  }
  if (legs >= 1) leg(bx + S(legs === 1 ? 0 : 3), false);
  return { bx, by, hx, hy, rx, ry, S };
}
// ------------------------------------------------------------ fish (lying on the ground, facing right)
function fish(G, o) {
  const k = o.k || 1, S = v => v * k, L = S(o.len || 20), Hh = S(o.h || 9), cx = o.x, cy = o.y - Hh - S(o.lift || 0);
  const B = ramp(o.body), BL = ramp(o.belly || shade(o.body, 45)), FN = ramp(o.fin || shade(o.body, 25));
  if (o.tailFn) o.tailFn(cx - L * .8, cy);
  else poly(G, [[cx - L * .7, cy - S(1)], [cx - L - S(9), cy - S(9)], [cx - L - S(5), cy], [cx - L - S(9), cy + S(8)], [cx - L * .7, cy + S(2)]], FN, { v0: .85 });
  if (o.dorsal !== false) poly(G, [[cx - L * .5, cy - Hh * .7], [cx - L * .3, cy - Hh - S(6)], [cx + L * .1, cy - Hh - S(3)], [cx + L * .25, cy - Hh * .8]], FN, { v0: .9 });
  if (o.pre) o.pre(cx, cy, L, Hh, S);
  const scale = (x, y, nx, ny) => { const r = Math.floor(y / S(3)), c = (x + (r & 1) * 2) % 4; return ny < .3 && nx < .45 && (c === 0 && y % Math.max(3, R(S(3))) !== 0) ? ramp(shade(o.body, -22)) : null; };
  blob(G, cx, cy, L, Hh, B, { belly: BL, bellyY: .3, pat: o.plain ? null : scale });
  if (o.post) o.post(cx, cy, L, Hh, S);
  if (!o.noHead) {
    gLine(G, R(cx + L * .45), R(cy - Hh * .6), R(cx + L * .38), R(cy + Hh * .6), shade(B[1], -10), true);
    eyeG(G, R(cx + L * .68), R(cy - Hh * .2), Math.max(1.5, S(o.eyeR || 2)), o.eye || '#f8f0d8', 'round');
    gLine(G, R(cx + L * .86), R(cy + Hh * .25), R(cx + L * .97), R(cy + Hh * .15), INK, true);
  }
  if (o.pec !== false) poly(G, [[cx + L * .3, cy + Hh * .2], [cx + L * .05, cy + Hh * .9], [cx + L * .25, cy + Hh * .75]], FN, { v0: .8 });
  return { cx, cy, L, Hh, S };
}
// ------------------------------------------------------------ ape / humanoid (facing right)
// o: x, y, k, body, belly, face, spots, stripes, ears(pairs), arms 'up'|'fwd'|'down', stand, hoof, tail, headFn(G, hx, hy, k)
function ape(G, o) {
  const k = o.k || 1, S = v => v * k, x = o.x, gy = o.y, B = ramp(o.body), BD = ramp(shade(o.body, -34)), BL = ramp(o.belly || shade(o.body, 40));
  const FC = ramp(o.face || '#e8c8b0'), st = o.stand ? S(6) : 0;
  const pat = (px, py, nx, ny) => o.spots && ((px * 7 + py * 13) % 19 < 2) && ny < .6 ? ramp(o.spots) : o.stripes && Math.abs(Math.sin((py + px * .3) * .7)) < .22 ? ramp(o.stripes) : null;
  const hand = (hx, hy, far) => o.hoof ? blob(G, hx, hy, S(2.6), S(2.2), ramp(shade(o.hoof, far ? -30 : 0))) : blob(G, hx, hy, S(2.6), S(2.4), far ? ramp(shade(o.face || '#e8c8b0', -40)) : FC);
  const foot = (fx, far) => { if (o.hoof) { G.rect(R(fx - S(3)), R(gy - S(2.5)), R(S(6)), R(S(2.5)), shade(o.hoof, far ? -30 : 0)); } else blob(G, fx, gy - S(1.6), S(4), S(1.8), far ? BD : FC); };
  const sh = [x + S(3), gy - S(24) - st], hip = [x - S(4), gy - S(11) - st];
  if (o.tail !== false) tube(G, [hip[0] - S(3), hip[1] + S(2)], [x - S(24), gy - S(2)], [x - S(20), gy - S(26) - st], S(2.2), S(1.3), BD);
  const arm = (far) => {
    const P = far ? BD : B, s0 = [sh[0] + (far ? -S(3) : 0), sh[1] + (far ? -S(1) : 0)];
    let h;
    if (o.arms === 'up') h = [s0[0] + S(far ? -2 : 10), s0[1] - S(19)];
    else if (o.arms === 'fwd') h = [s0[0] + S(far ? 9 : 11), s0[1] + S(far ? 4 : 7)];
    else h = [s0[0] + S(far ? 5 : 7), gy - S(2.5)];
    tube(G, s0, [lerp(s0[0], h[0], .5) + S(o.arms === 'up' ? (far ? -3 : 5) : -2), lerp(s0[1], h[1], .5)], h, S(3), S(2.2), P);
    hand(h[0], h[1], far);
    return h;
  };
  const legF = (far) => {
    const P = far ? BD : B, hp = [hip[0] + (far ? -S(2) : S(1)), hip[1]];
    if (o.stand) { tube(G, hp, [hp[0] + S(3), lerp(hp[1], gy, .5)], [hp[0] + S(1), gy - S(2)], S(4.5), S(3), P); foot(hp[0] + S(2), far); }
    else { blob(G, hp[0] + S(2), hp[1] + S(1), S(7), S(6.5), P); tube(G, [hp[0] + S(6), hp[1] + S(3)], [hp[0] + S(8), gy - S(4)], [hp[0] + S(5), gy - S(2)], S(3), S(2.5), P); foot(hp[0] + S(7), far); }
  };
  legF(true); const hFar = arm(true);
  blob(G, x - S(1), gy - S(18) - st, S(9), S(11.5), B, { belly: BL, bellyY: .05, pat });
  legF(false);
  const hx = x + S(4), hy = gy - S(33) - st;
  if (o.headFn) o.headFn(G, hx, hy, k);
  else {
    const ear = (ex, ey, sz) => { blob(G, ex, ey, S(sz), S(sz * 1.2), B); blob(G, ex + S(.4), ey + S(.3), S(sz * .55), S(sz * .75), ramp(shade(o.face || '#e8c8b0', -10))); };
    for (let i = 0; i < (o.ears || 1); i++) ear(hx - S(8.5) + S(i * 4), hy - S(1) - S(i * 8), 3.4 - i * .4);
    blob(G, hx, hy, S(8.5), S(8), B, { pat });
    
    blob(G, hx + S(3), hy + S(1), S(5.5), S(5.2), FC);
    blob(G, hx + S(5.5), hy + S(4), S(3.6), S(2.6), FC);
    eyeG(G, R(hx + S(3)), R(hy), Math.max(1.4, S(1.6)), o.eye || '#3a2418', 'round');
    eyeG(G, R(hx + S(7.2)), R(hy), Math.max(1.2, S(1.3)), o.eye || '#3a2418', 'round');
    gLine(G, R(hx + S(1)), R(hy - S(2.5)), R(hx + S(8.5)), R(hy - S(2.5)), shade(B[1], -20));
    G.set(R(hx + S(8.5)), R(hy + S(3)), INK);
    gLine(G, R(hx + S(5)), R(hy + S(5)), R(hx + S(7.5)), R(hy + S(5)), shade(FC[1], -30));
  }
  const hNear = arm(false);
  if (o.post) o.post(G, { hx, hy, hFar, hNear, S, x, gy });
}
// ------------------------------------------------------------ the bestiary
const MON = [
  [ // Z0 南山经
    () => {   // 旋龟: black shell, bird head, snake tail
      const G = ws(), x = 70, y = MGY, SK = ramp('#7a8650'), SKD = ramp('#566038'), SH = ramp('#3a4048'), RIM = ramp('#a89060');
      snakeTail(G, [x - 14, y - 8], [x - 32, y - 2], [x - 30, y - 22], 4, '#5a6a3a', '#c8c088');
      for (const [lx, P] of [[x - 12, SKD], [x + 9, SKD]]) blob(G, lx, y - 3, 4, 3.5, P);
      tube(G, [x + 10, y - 10], [x + 20, y - 14], [x + 22, y - 24], 4.2, 3.6, SK);
      blob(G, x, y - 12, 19, 13, SH, { clip: (px, py) => py < y - 4, pat: (px, py, nx, ny) => {
        if (ny > .45) return ny > .62 ? RIM : null;
        const band = ny < -.35 ? 0 : 1, u = nx * 2.6 + band * .5;
        return (Math.abs(u - Math.round(u)) < .12 || Math.abs(ny + .35) < .07 || Math.abs(ny - .45) < .07) ? ramp('#16181e') : null;
      } });
      for (const [lx, P] of [[x - 10, SK], [x + 11, SK]]) { blob(G, lx, y - 3, 4.5, 3.6, P); for (let i = 0; i < 3; i++) G.set(lx + i * 2 - 1, y - 1, '#e8e0c0'); }
      const hx = x + 24, hy = y - 26;
      for (let i = 0; i < 3; i++) tube(G, [hx - 2, hy - 3], [hx - 5 - i, hy - 8 - i], [hx - 9 - i * 2, hy - 6 - i * 2], 1.3, .6, ramp('#c84a30'), { n: 12 });
      blob(G, hx, hy, 6, 5.5, ramp('#8a3a2a'));
      poly(G, [[hx + 4, hy - 2], [hx + 12, hy + 1], [hx + 11, hy + 3], [hx + 4, hy + 2]], ramp('#f0c040'));
      eyeG(G, hx + 1, hy - 1, 1.6, '#ffe080', 'round');
      return G;
    },
    () => {   // 鯥: ox-headed fish on the hills, snake tail, wings under the ribs
      const G = ws(), BR = '#a87a50';
      fish(G, { x: 70, y: MGY, len: 17, h: 11, lift: 5, body: BR, belly: '#ecd8b0', fin: '#c89a68', noHead: true, pec: false,
        tailFn: (tx, ty) => ptube(G, [[tx + 8, ty], [tx - 6, ty + 6], [tx - 16, ty - 2], [tx - 12, ty - 14], [tx - 18, ty - 20]], t => 6 - t * 4.8, ramp('#7a6040'), { pat: (x, y, t, dx, dy) => dy > .35 ? ramp('#e0c898') : null }),
        pre: (cx, cy) => { for (const d of [-9, 7]) { tube(G, [cx + d, cy + 6], [cx + d + 1, cy + 12], [cx + d, MGY - 3], 3.4, 2.8, ramp('#7a5638')); G.rect(cx + d - 3, MGY - 3, 6, 3, '#3a2a20'); } },
        post: (cx, cy, L, Hh, S) => {
          for (const d of [-6, 9]) { tube(G, [cx + d, cy + 6], [cx + d + 1, cy + 12], [cx + d, MGY - 3], 3.6, 3, ramp(BR)); G.rect(cx + d - 3, MGY - 3, 7, 3, '#4a3426'); }
          wingUp(G, cx - 2, cy + 4, v => v * .75, ramp('#e8f0f0'), false);
          const hx = cx + L * .8, hy = cy - 4;
          hornG(G, 'ox', '#f0e6c8', hx - 1, hy - 7, v => v * .8, 0);
          blob(G, hx, hy, 9, 8, ramp(BR));
          blob(G, hx + 7, hy + 3, 5, 4.5, ramp('#d8b088'));
          G.set(hx + 10, hy + 2, INK); G.set(hx + 10, hy + 4, INK);
          eyeG(G, hx + 2, hy - 2, 1.7, '#ffd23a', 'round');
        } });
      return G;
    },
    () => quad({ body: '#ece6d8', belly: '#ffffff', tail: 'fox', tails: 9, tailCol: '#e4dccc', tailTip: '#b8a8d8', ears: 'long', ear: '#d8cfc0', horn: 'curl', hornCol: '#b8a080', hoof: '#6a5a4a', snout: 'mid', eye: '#9a7ad8' }, 0.66, {
      post: C => {   // second pair of ears, eyes on its back
        const { G, S, hx, hy } = C;
        poly(G, [[hx - S(2), hy - S(7)], [hx - S(10), hy - S(16)], [hx - S(1), hy - S(4)]], ramp('#c8bfb0'));
        eyeG(G, R(C.A.back[0] - S(4)), R(C.A.back[1] + S(3)), 1.8, '#9a7ad8', 'slit');
        eyeG(G, R(C.A.back[0] + S(9)), R(C.A.back[1] + S(5)), 1.6, '#9a7ad8', 'slit');
      } }),
    () => { const G = ws(); ape(G, { x: 66, y: MGY, k: 1.18, body: '#8a8e9a', belly: '#b8bcc4', face: '#e0c8c0', ears: 2, arms: 'down', eye: '#c03a3a',
      post: (G, a) => { [[13, 4, 2], [17, 1, 2.6], [19, -4, 3.2], [16, -9, 2.6], [19, -13, 1.8]].forEach(([dx, dy, r]) => blob(G, a.hx + dx, a.hy + dy, r, r, ramp('#e4f2f6'), { flat: .4 })); } }); return G; },
    () => {   // BOSS 蛊雕: horned eagle
      const G = ws();
      bird(G, { x: 72, y: MGY, k: 1.95, body: '#5a3a2a', belly: '#a07a58', wing: '#4a2e20', head: '#c8b090', beak: '#f0c040', beakLen: 5, hook: 1, rx: 13, ry: 10, legLen: 8, neck: 4, neckX: 2, headR: 6, wingUp: 1, wingLen: 1.15, tail: '#3a2418', tailLen: 9, tailUp: -2, horn: '#f0e0b8', eye: '#ff4a2a', brow: 1, talon: 1, legCol: '#e8b040',
        pat: (x, y, nx, ny) => ny > .2 && (x + (y >> 1)) % 5 === 0 ? ramp('#6a4a30') : null });
      return G;
    },
  ],
  [ // Z1 西山经
    () => {   // 蛮蛮: duck pair, one wing one eye each
      const G = ws();
      const duck = (x, y, body, belly, up) => bird(G, { x, y, k: 1.08, body, belly, rx: 11, ry: 8, legLen: 3, neck: 3, neckX: 1, headR: 5.5, flat: 1, beak: '#f0a030', beakLen: 4, wingUp: up, wing: shade(body, -10), tail: shade(body, -20), tailLen: 4, tailUp: 5, legs: 1, legCol: '#f09030', eye: '#ffffff' });
      duck(60, MGY - 4, '#c8443a', '#f0b0a0', 1); duck(74, MGY, '#3a78c8', '#b0d0f0', 0);
      return G;
    },
    () => { const G = ws(); ape(G, { x: 66, y: MGY, k: 1.1, body: '#c89850', belly: '#f0dcb0', face: '#e8c8a0', spots: '#5a3a20', arms: 'up', eye: '#3a2418',
      post: (G, a) => blob(G, (a.hFar[0] + a.hNear[0]) / 2, Math.min(a.hFar[1], a.hNear[1]) - 5, 10, 7.5, ramp('#8a8a98'), { pat: (x, y) => (x * 3 + y * 5) % 11 === 0 ? '#5a5a68' : null }) }); return G; },
    () => quad({ body: '#8a6040', belly: '#c8a880', ears: 'long', horn: 'twin', hornCol: '#e8dcc0', fangs: 1, hoof: '#3a2a20', tail: 'stub', tailTip: '#a07a58', snout: 'mid', eye: '#ff5a3a', beard: '#c8a880' }, 0.68, {
      post: C => hornG(C.G, 'curl', '#c8b898', C.hx + C.S(2), C.hy - C.S(6), C.S, 0) }),
    () => {   // 毕方: one-legged crane breathing fire
      const G = ws(), RD = ramp('#d83a2a');
      const b = bird(G, { x: 66, y: MGY, k: 1, body: '#3a7ac0', belly: '#a8d0f0', wing: '#2a5a98', rx: 11, ry: 7, legLen: 20, legs: 1, legCol: '#d84a3a', neck: 15, neckX: 4, neckR: 3, headR: 4.5, beak: '#f4f0e8', beakLen: 9, crest: '#e03a2a', tail: '#1e3a6a', tailLen: 7, tailUp: 1, eye: '#ff5a3a',
        pat: (x, y, nx, ny) => ny < .2 && (x * 3 + y * 7) % 13 < 2 ? RD : null });
      flame(G, b.hx + 5.5 + 9, b.hy + 1, v => v * .8);
      return G;
    },
    () => {   // BOSS 帝江: faceless glowing sack, six legs, four wings
      const G = ws(), x = 74, y = MGY, Y = ramp('#f0c040', 6), RD = ramp('#e0482a', 6), WG = ramp('#e86a3a'), WD = ramp('#a83a28');
      const legs = [[-26, 1], [0, 1], [26, 1], [-34, 0], [-8, 0], [20, 0]];
      for (const [d, near] of legs.filter(l => !l[1])) { tube(G, [x + d, y - 22], [x + d - 3, y - 10], [x + d + 1, y - 3], 5, 3.5, RD.map(c => shade(c, -35))); blob(G, x + d + 3, y - 2.5, 5, 2.8, RD.map(c => shade(c, -35))); }
      wingUp(G, x - 16, y - 56, v => v * 1.3, WD, true); wingUp(G, x + 16, y - 56, v => v * 1.3, WD, true, 1, -1);
      blob(G, x, y - 38, 45, 30, Y, { pat: (px, py, nx, ny) => {
        if (ny + (BAYER[py & 3][px & 3] / 16 - .5) * .35 > .15) return RD;
        const sw = Math.sin(nx * 7 + ny * 3) + Math.cos(ny * 8 - nx * 2);
        return Math.abs(sw) < .12 && ny < .1 ? ramp('#ff8a3a') : null;
      } });
      for (const [d] of legs.filter(l => l[1])) { tube(G, [x + d, y - 16], [x + d + 4, y - 8], [x + d + 1, y - 3], 5.5, 4, RD); blob(G, x + d + 3, y - 2.5, 5.5, 3, RD); }
      wingUp(G, x - 6, y - 52, v => v * 1.1, WG, false); wingUp(G, x + 8, y - 52, v => v * 1.1, WG, false, 1, -1);
      return G;
    },
  ],
  [ // Z2 北山经
    () => quad({ body: '#b89878', belly: '#f2e4cc', ears: 'none', tail: 'fox', tailCol: '#c8aa88', tailTip: '#fff4e4', snout: 'short', eye: '#2a1a18', pupil: 'round', eyeR: 2.8, cheek: 1, hoof: '#6a5040', leg: 1.05, bodyLen: .85 }, 0.59, {
      pre: C => {}, post: C => rabbitEars(C.G, C.hx - C.S(2), C.hy - C.S(5), v => C.S(v) * 1.35, '#c8aa88') }),
    () => {   // 何罗鱼: one head, ten bodies
      const G = ws(), x = 80, y = MGY - 18, SV = '#b4c2d0';
      for (let i = 9; i >= 0; i--) {
        const a = Math.PI + (i / 9 - .45) * 1.9, len = 24 + (i % 3) * 3, tip = [x - 4 + Math.cos(a) * len, y + Math.sin(a) * len * .8];
        const P = ramp(shade(SV, -8 - (i % 2) * 22));
        tube(G, [x - 4, y], [lerp(x, tip[0], .5), lerp(y, tip[1], .5) + 3], tip, 0, 0, P, { rf: t => 2.2 + 2.8 * Math.sin(Math.min(1, t * 1.25) * Math.PI * .9) });
        const ta = a + .1, fx = tip[0] + Math.cos(ta) * 2, fy = tip[1] + Math.sin(ta) * 2;
        poly(G, [[tip[0], tip[1]], [fx + Math.cos(ta - .6) * 6, fy + Math.sin(ta - .6) * 6], [fx + Math.cos(ta) * 3, fy + Math.sin(ta) * 3], [fx + Math.cos(ta + .6) * 6, fy + Math.sin(ta + .6) * 6]], ramp('#8ab0d8'));
      }
      fish(G, { x: x + 4, y: y + 12, len: 12, h: 10, body: SV, belly: '#eef4f8', fin: '#8ab0d8', dorsal: false, eyeR: 2.6, eye: '#ffd23a', tailFn: () => {} });
      return G;
    },
    () => quad({ body: '#ece8e4', belly: '#ffffff', spots: '#5a5a6a', ears: 'cat', snout: 'short', tail: 'thin', tailCol: '#ece8e4', tailTip: '#5a5a6a', thick: 1, eye: '#5ac8f0', leg: .55, bodyLen: 1.1 }, 0.68, {
      post: C => { const { G, S, hx, hy } = C; for (let i = 0; i < 3; i++) gLine(G, R(hx - S(4) + i * 2), R(hy - S(8)), R(hx - S(2) + i * 2), R(hy - S(4)), i === 1 ? '#3a3a50' : '#7a7a90'); } }),
    () => quad({ body: '#7a8290', belly: '#aab0b8', thick: 1, hoof: '#2a2a34', horn: 'ox', hornCol: '#e8e0c8', ears: 'none', snout: 'mid', tail: 'lion', tailTip: '#4a4a58', nose: '#5a4a50' }, 0.71, {
      post: C => { const { G, S, hx, hy } = C; hornG(G, 'twin', '#d0c8b0', hx + S(1), hy - S(7), v => v * .5, 0); pigEars(G, hx - S(5), hy - S(3), v => S(v) * 1.3, '#a8a8b8'); humanEye(G, R(C.A.face[0]), R(C.A.face[1])); } }),
    () => quad({ body: '#8a7a68', belly: '#c8b8a0', horn: 'curl', hornCol: '#d8c8a0', ears: 'none', snout: 'short', tail: 'stub', tailTip: '#a89880', hoof: '#3a3028', thick: 1, mane: '#6a5a4a' }, 1.1, {
      post: C => {   // 狍鸮: human face (no eyes), tiger fangs, eyes in the armpits, human hands
        const { G, S, hx, hy } = C;
        face(G, hx + S(2), hy + S(1), S(10.5), { eyes: 'closed', mouth: 'open', hair: '#4a3a30' });
        const mx = R(hx + S(2) + S(10.5) * .45), my = R(hy + S(1) + S(10.5) * .66);
        G.rect(mx - 3, my - 1, 7, 3, '#4a1828'); for (const d of [-3, -1, 1, 3]) G.set(mx + d, my - 1, '#fff8ee'); G.set(mx - 2, my + 1, '#fff8ee'); G.set(mx + 2, my + 1, '#fff8ee');
        eyeG(G, R(C.X(64)), R(C.Y(60)), 2.4, '#ffcf3a', 'slit'); eyeG(G, R(C.X(73)), R(C.Y(58)), 2.2, '#ffcf3a', 'slit');
        const px = C.A.paw[0], py = C.A.paw[1];
        blob(G, px, py - S(1.5), S(4.5), S(3), ramp(SKIN));
        for (let i = 0; i < 4; i++) gLine(G, R(px + S(1) + i * 1.6), R(py - S(2)), R(px + S(2) + i * 1.8), R(py + S(1)), shade(SKIN, -40));
      } }),
  ],
  [ // Z3 东山经
    () => quad({ body: '#e0b040', belly: '#f8e8b8', ears: 'fox', snout: 'mid', tail: 'fox', tailTip: '#fff8e8', eye: '#3a2418', pupil: 'round', bodyLen: 1.15 }, 0.63, {
      pre: C => { extraLeg(C, C.X(48), true); extraLeg(C, C.X(54), false); } }),
    () => quad({ body: '#b8a890', belly: '#ece0cc', ears: 'none', snout: 'short', tail: 'dragon', tailCol: '#6a8048', belly2: 1, leg: .7, eye: '#ff9a1a', pupil: 'round', eyeR: 3 }, 0.59, {
      post: C => { const { G, S, hx, hy } = C; rabbitEars(G, hx - S(2), hy - S(5), v => S(v) * 1.3, '#c8b8a0'); poly(G, [[hx + S(6), hy], [hx + S(15), hy + S(3)], [hx + S(14), hy + S(7)], [hx + S(6), hy + S(6)]], ramp('#e8c040')); G.set(R(hx + S(14)), R(hy + S(7) + 1), '#a88020');
        eyeG(G, R(C.A.face[0]), R(C.A.face[1]), 2.4, '#ff9a1a', 'round'); } }),
    () => quad({ body: '#e8c048', belly: '#f8e8a8', thick: 1, leg: .7, ears: 'none', snout: 'short', tail: 'thin', tailCol: '#d83a2a', tailTip: '#d83a2a', hoof: '#6a4a2a', bodyLen: 1.05 }, 0.66, {
      post: C => { const { G, S, hx, hy } = C; pigEars(G, hx - S(3), hy - S(2), S, '#e8b040'); face(G, hx + S(2), hy + S(2), S(10), { mouth: 'line' }); } }),
    () => quad({ body: '#6a5a52', belly: '#8a7a70', thick: 1, hoof: '#2a2420', horn: 'twin', hornCol: '#d8ccb0', ears: 'none', snout: 'mid', tail: 'dragon', tailCol: '#6a7040', eye: '#ffde3a' }, 0.68, {
      post: C => {
        const { G, S, hx, hy } = C, W = ramp('#f4f0ea'), WD = ramp('#d8d0c8');
        recol(G, (x, y) => x > hx - S(13) && y < hy + S(13), [[C.B, W], [C.BD, WD], [C.BL, ramp('#ffffff')]]);
        eyeG(G, R(hx + S(3)), R(hy - S(1)), 2.8, '#ffde3a', 'slit');
        for (let i = 0; i < 8; i++) { const gx = C.X(24 + i * 10), c = i & 1 ? '#8a7a48' : '#6a5a38'; gLine(G, R(gx), MGY - 1, R(gx - 2), MGY - 5 - (i % 3), c); gLine(G, R(gx + 1), MGY - 1, R(gx + 3), MGY - 4, c); }
      } }),
    () => quad({ body: '#9a7450', belly: '#d0b088', stripes: '#3a2818', ears: 'none', snout: 'short', thick: 1, tail: 'stub', tailTip: '#8a6440', bodyLen: 1.05 }, 1.0, {
      pre: C => { const { G, S, X, Y } = C; tube(G, [X(30), Y(47)], [X(-6), Y(84)], [X(-10), Y(14)], S(3), S(1.6), C.BD, { n: 80 }); blob(G, X(-10), Y(12), S(4), S(5), ramp('#5a3a24')); },
      post: C => {   // 梼杌: shaggy dog fur, human face, boar tusks
        const { G, S, X, Y, hx, hy } = C, F = ramp('#6a4a30');
        for (let i = 0; i < 8; i++) { const bx = X(28 + i * 6.5), by = Y(66 - (i > 5 ? 2 : 0)); poly(G, [[bx - S(4), by - S(4)], [bx + S(3), by - S(4)], [bx - S(1), by + S(4 + (i & 1) * 2)]], F, { v0: .7 }); }
        for (let i = 0; i < 8; i++) { const bx = X(26 + i * 6.5), by = Y(41); poly(G, [[bx - S(1), by + S(4)], [bx + S(5), by + S(3)], [bx - S(4), by - S(3 + (i & 1) * 2)]], ramp('#b08860'), { v0: .9 }); }
        face(G, hx + S(2), hy + S(1), S(10.5), { hair: '#4a3020', mouth: 'tusk', eye: '#c02020', long: 1 });
      } }),
  ],
  [ // Z4 中山经
    () => quad({ body: '#9a8a78', belly: '#f0e6d4', ears: 'cat', snout: 'short', tail: 'fox', tailCol: '#f8f6f0', tailTip: '#ffffff', mane: '#ece4d4', eye: '#3a2418', pupil: 'round', eyeR: 3, cheek: 1, leg: .8 }, 0.57, {
      post: C => { const { G, S } = C; const ex = R(C.A.face[0]), ey = R(C.A.face[1]); G.ell(ex, ey + .5, S(5.5), S(3.6), (x, y) => G.get(x, y) && G.get(x, y) !== OUT && G.get(x, y) !== '#ffffff' && Math.abs(x - ex) + Math.abs(y - ey) > 2 ? '#4a3a32' : null); eyeG(G, ex, ey, 2, '#ffd890', 'round'); } }),
    () => quad({ body: '#e04a30', belly: '#ffa070', thick: 1, leg: .6, ears: 'none', snout: 'mid', tail: 'thin', tailTip: '#ffb030', hoof: '#6a2a1a', eye: '#ffe040', bodyLen: .95 }, 0.59, {
      post: C => {
        const { G, S, hx, hy } = C; pigEars(G, hx - S(3), hy - S(2), S, '#e85a3a');
        const nx = C.A.nose[0], ny = C.A.nose[1];
        blob(G, nx - S(1), ny + S(1), S(2.5), S(3), ramp('#f08a70')); G.set(R(nx - S(1)), R(ny), INK); G.set(R(nx - S(1)), R(ny + S(2)), INK);
        G.rect(R(nx - S(9)), R(hy + S(6)), R(S(6)), R(S(4)), '#4a1418'); gLine(G, R(nx - S(9)), R(hy + S(6)), R(nx - S(3)), R(hy + S(6)), '#fff8ee');
        gLine(G, R(C.A.face[0] - S(3)), R(C.A.face[1] - S(4)), R(C.A.face[0] + S(3)), R(C.A.face[1] - S(2)), INK);
        flame(G, C.X(44), C.Y(38), C.S, -1, .9);
        for (const [dx, dy] of [[0, 0], [S(5), -S(3)]]) { const sx = R(hx + S(20) + dx), sy = R(hy - S(10) + dy); gLine(G, sx, sy, sx + 2, sy - 2, '#ffe040'); G.set(sx + 3, sy, '#ffe040'); }
      } }),
    () => quad({ body: '#a07a48', belly: '#e0c898', ears: 'none', snout: 'short', tail: 'dragon', tailCol: '#7a8a50', wings: '#c8a878', leg: .45, bodyLen: 1.15 }, 0.66, {
      post: C => face(C.G, C.hx + C.S(2), C.hy + C.S(1), C.S(10.5), { hair: '#3a2a20', mouth: 'open' }) }),
    () => quad({ body: '#6a7a90', belly: '#a0acbc', thick: 1, hoof: '#2a3040', ears: 'round', snout: 'mid', tail: 'lion', tailTip: '#3a4458', eye: '#ffcf3a', bodyLen: 1.05 }, 0.75, {
      post: C => { const { G, S, hx, hy } = C; tube(G, [hx + S(1), hy - S(6)], [hx + S(2), hy - S(20)], [hx + S(13), hy - S(20)], S(4.8), S(1), ramp('#e8dcc0')); } }),
    () => quad({ body: '#e88a30', belly: '#fbe6c0', stripes: '#2a1810', ears: 'cat', snout: 'short', thick: 1, tail: 'thin', tailCol: '#e88a30', tailTip: '#2a1810', mane: '#5a3418' }, 1.1, {
      post: C => face(C.G, C.hx + C.S(2), C.hy + C.S(1), C.S(10.5), { hair: '#3a2010', mouth: 'fang', eye: '#c88a10', long: 1 }) }),
  ],
  [ // Z5 海外
    () => {   // 比翼鸟: blue + red bird, joined, one wing each
      const G = ws();
      const b = (x, y, body, belly, wingUp, crest) => bird(G, { x, y, k: 1, body, belly, rx: 10, ry: 6.5, legLen: 6, neck: 6, neckR: 3.5, headR: 4.8, beak: '#f0d060', beakLen: 4, wingUp, wingLen: 1.1, tail: shade(body, -15), tail2: crest, tailLen: 10, tailUp: -2, crest, eye: '#2a1a18', legs: 1, legCol: '#c8783a' });
      b(60, MGY - 6, '#d84a3a', '#f8c0a8', 1, '#ffd040'); b(74, MGY, '#3a82d0', '#c0dcf4', 0, '#60e0f0');
      return G;
    },
    () => quad({ body: '#3a3a4a', belly: '#5a5a6c', thick: 1, leg: .75, ears: 'none', snout: 'short', tail: 'stub', tailTip: '#3a3a4a', hoof: '#18181e', eye: '#ffcf3a', bodyLen: 1.1 }, 0.64, {
      post: C => {
        const { G, S, hx, hy } = C, hf = { body: '#3a3a4a', belly: '#5a5a6c', ears: 'none', snout: 'short', eye: '#ff6a3a' };
        const h = headAlone(hf, C.s); pigEars(h, 30 - 3 * C.s, 40 - 2 * C.s, v => v * C.s, '#4a4a5c');
        const rx = C.X(22), ry = C.Y(36);
        tube(G, [C.X(34), C.Y(50)], [C.X(28), C.Y(46)], [rx + S(3), ry + S(6)], S(9), S(8), C.B);
        stamp(G, h, rx - (69 - 30), ry - 40, true);
        pigEars(G, hx - S(3), hy - S(2), S, '#4a4a5c');
        for (const [x, y] of [[C.A.nose[0] - 1, C.A.nose[1]], [rx - S(8.75) + 1, ry + S(2.5)]]) blob(G, x, y + S(1), S(2.2), S(2.6), ramp('#7a6a7a'));
      } }),
    () => {   // 龙鱼: cat-headed fish crawling on short legs
      const G = ws(), legC = ramp('#c88a30');
      fish(G, { x: 66, y: MGY - 4, len: 18, h: 8, body: '#e0a040', belly: '#f8e0b0', fin: '#e86a3a', noHead: true,
        pre: (cx, cy, L, Hh) => { for (const d of [-8, 8]) tube(G, [cx + d, cy + 4], [cx + d + 1, cy + 8], [cx + d + 3, MGY - 2], 2.5, 2, ramp('#a86a28')); },
        post: (cx, cy, L, Hh) => {
          for (const d of [-11, 6]) { tube(G, [cx + d, cy + 4], [cx + d + 1, cy + 8], [cx + d + 3, MGY - 2], 2.8, 2.2, legC); gLine(G, cx + d + 2, MGY - 1, cx + d + 6, MGY - 1, '#7a4a20'); }
          const hx = cx + L * .7, hy = cy - 3;
          poly(G, [[hx - 6, hy - 4], [hx - 4, hy - 12], [hx, hy - 6]], ramp('#c88a30')); poly(G, [[hx - 1, hy - 6], [hx + 3, hy - 13], [hx + 5, hy - 5]], ramp('#e0a040'));
          blob(G, hx, hy, 8.5, 7.5, ramp('#e0a040'));
          blob(G, hx + 5, hy + 3, 4, 3, ramp('#f8e0b0'));
          eyeG(G, hx + 2, hy - 1, 2, '#6aff8a', 'slit');
          G.set(hx + 9, hy + 1, INK); for (const d of [-1, 1]) gLine(G, hx + 7, hy + 3 + d, hx + 14, hy + 2 + d * 3, '#5a3a20');
        } });
      return G;
    },
    () => quad({ body: '#f6f6f2', belly: '#ffffff', mane: '#d8e4f8', tail: 'fox', tailCol: '#dce6f6', tailTip: '#ffffff', ears: 'fox', ear: '#e8e8e4', snout: 'long', hoof: '#9aa0b0', eye: '#5a9ae8', pupil: 'round', leg: 1.15, bodyLen: 1.05 }, 0.68),
    () => {   // BOSS 相柳: nine human heads on snake necks above a coiled body
      const G = ws(), x = 74, y = MGY, SN = ramp('#3a9a88'), SD = ramp('#2a6a68'), BL = ramp('#d8e0a0');
      const pat = (px, py, t, dx, dy) => dy > .45 ? BL : ((px * 2 + py * 3) % 9 === 0 && dy < .2 ? ramp('#1e4a4a') : null);
      ptube(G, [[x + 30, y - 6], [x + 10, y - 3], [x - 22, y - 5], [x - 34, y - 12], [x - 20, y - 20], [x + 10, y - 20], [x + 24, y - 16]], t => 5 + 4 * Math.sin(t * Math.PI), SD, { pat });
      const heads = [[-46, -60], [-24, -72], [0, -78], [24, -72], [46, -60], [-36, -42], [-12, -54], [12, -54], [36, -42]];
      heads.forEach(([hx, hy], i) => {
        const back = i < 5, P = back ? SD : SN, ex = x + hx, ey = y + hy;
        ptube(G, [[x + hx * .15, y - 18], [x + hx * .2 + 5, y + hy * .45], [x + hx * .75 - 3, y + hy * .75], [ex - 2, ey + 6]], t => 4.4 - t * 1.4, P, { pat });
        face(G, ex, ey, 6.5, { hair: back ? '#1e2a30' : '#2a3a40', skin: back ? '#d8c0a8' : SKIN, eye: '#c09010', mouth: i === 2 ? 'open' : 'line' });
      });
      ptube(G, [[x - 30, y - 4], [x - 8, y - 9], [x + 22, y - 7], [x + 38, y - 4]], t => 7 - t * 3, SN, { pat });
      return G;
    },
  ],
  [ // Z6 海内
    () => quad({ body: '#4a7ac0', belly: '#a8c8ec', ears: 'fox', snout: 'long', fangs: 1, mane: '#2a4a88', tail: 'fox', tailTip: '#2a4a88', eye: '#ff3a2a', thick: 1, leg: .9 }, 0.66, {
      post: C => { const { G, S } = C; gLine(G, R(C.A.face[0] - S(3)), R(C.A.face[1] - S(4)), R(C.A.face[0] + S(3)), R(C.A.face[1] - S(2)), INK); } }),
    () => {   // 陵鱼: human-faced fish with arms and legs
      const G = ws(), SKP = ramp('#f0c8b0');
      fish(G, { x: 66, y: MGY - 8, len: 17, h: 8.5, body: '#e89aa0', belly: '#fbe0d8', fin: '#f0b8c8', noHead: true, pec: false,
        pre: (cx, cy) => { tube(G, [cx - 4, cy + 4], [cx - 2, cy + 10], [cx - 4, MGY - 2], 2.4, 2, ramp('#d8a890')); blob(G, cx - 2, MGY - 1.6, 3.5, 1.8, ramp('#d8a890')); },
        post: (cx, cy, L) => {
          tube(G, [cx + 3, cy + 4], [cx + 6, cy + 10], [cx + 4, MGY - 2], 2.6, 2.2, SKP); blob(G, cx + 6, MGY - 1.6, 3.8, 1.8, SKP);
          const hx = cx + L * .72, hy = cy - 4;
          face(G, hx, hy, 7.5, { hair: '#2a4a5a', mouth: 'line', eye: '#2a4a8a' });
          tube(G, [hx - 3, hy + 9], [hx + 6, hy + 14], [hx + 12, hy + 10], 2.2, 1.6, SKP); blob(G, hx + 12, hy + 10, 2.2, 2.2, SKP);
        } });
      return G;
    },
    () => quad({ body: '#2e3a52', belly: '#4a5672', thick: 1, leg: .8, bodyLen: 1.1, hoof: '#141822', ears: 'round', snout: 'mid', tail: 'lion', tailTip: '#141822', eye: '#ff8a3a' }, 0.73, {
      post: C => { const { G, S, X, Y } = C, nx = C.A.nose[0], ny = C.A.nose[1]; tube(G, [nx - S(4), ny - S(2)], [nx + S(2), ny - S(10)], [nx - S(1), ny - S(20)], S(4.2), S(.8), ramp('#d8ccb0'));
        for (const xx of [44, 60]) gLine(G, R(X(xx)), R(Y(42)), R(X(xx + 2)), R(Y(64)), '#1e2638', true); } }),
    () => {   // 巴蛇: black python with a swallowed elephant
      const G = ws(), x = 60, y = MGY, P = ramp('#2e2e38'), YL = ramp('#b8a040'), BL = ramp('#d8c8a0');
      ptube(G, [[x - 25, y - 3], [x - 19, y - 9], [x - 8, y - 12], [x + 6, y - 11], [x + 16, y - 6], [x + 22, y - 14], [x + 20, y - 28], [x + 24, y - 38]],
        t => t < .12 ? 1.5 + t * 25 : t > .74 ? 4.5 : 4.5 + 9 * Math.pow(Math.sin(clamp((t - .14) / .5, 0, 1) * Math.PI), .8), P,
        { pat: (px, py, t, dx, dy) => dy > .5 ? BL : ((Math.abs(((px + py * .6) % 8) - 4) < 1.2 && Math.abs(dy) < .5) ? YL : null) });
      const hx = x + 28, hy = y - 40;
      blob(G, hx, hy, 7.5, 5, P); blob(G, hx + 4, hy + 1.5, 5, 3.4, P);
      eyeG(G, hx + 2, hy - 2, 1.6, '#ff4a2a', 'slit');
      gLine(G, hx + 9, hy + 3, hx + 13, hy + 4, '#e03a3a'); G.set(hx + 14, hy + 3, '#e03a3a'); G.set(hx + 14, hy + 5, '#e03a3a');
      return G;
    },
    () => quad({ body: '#c8382a', belly: '#f0a060', thick: 1, hoof: '#3a1810', horn: 'antler', hornCol: '#f0d890', mane: '#f09030', beard: '#f8c060', ears: 'long', snout: 'long', fangs: 1, tail: 'dragon', tailCol: '#c8382a', eye: '#ffe040', leg: .95 }, 1.0, {
      post: C => {   // 窫窳 floats over water
        const { G } = C, Wv = ['#2a5a9a', '#3a7ac0', '#6aaee0', '#bfe6ff'];
        for (let y = MGY - 6; y <= MGY; y++) for (let x = C.X(0); x <= C.X(108); x++) {
          const w = Math.sin(x * .35 + y * 1.3) * 1.2, top = MGY - 4 + Math.sin(x * .3) * 1.2;
          if (y >= top) G.set(x, y, Wv[clamp(Math.floor((y - top) * .3 + w + 1.5 + (BAYER[y & 3][x & 3] / 16 - .5)), 0, 3)] );
        }
      } }),
  ],
  [ // Z7 大荒
    () => {   // 双双: three green beasts joined
      const G = ws();
      [['#2e7a48', 12, -5, -6], ['#3a9a58', 6, -2.5, -3], ['#52b46c', 0, 0, 0]].forEach(([c, nu, dx, dy], i) => {
        const q = quadGrid({ body: c, belly: '#c8ecb0', ears: 'fox', snout: 'mid', tail: 'fox', tailTip: '#e8f8d0', eye: '#ffe040', neckUp: nu, size: .56 }).G;
        stamp(G, q, 40 + dx, MGY - qFoot() + dy);
      });
      return G;
    },
    () => quad({ body: '#c8402c', belly: '#f0a070', ears: 'cat', snout: 'mid', tail: 'lion', tailTip: '#6a1a10', thick: 1, eye: '#ffe040', mane: '#7a1e14' }, 0.64, {
      pre: C => {   // 屏蓬: a second head turned to the left
        const h = headAlone({ body: '#b03a28', belly: '#e09060', ears: 'cat', snout: 'mid', eye: '#ffe040' }, C.s);
        const ex = C.X(70), ey = C.Y(16);
        tube(C.G, [C.X(64), C.Y(50)], [C.X(60), C.Y(34)], [ex + C.S(2), ey + C.S(6)], C.S(9), C.S(8), C.BD);
        stamp(C.G, h, ex - 30, ey - 40);
      } }),
    () => {   // 九凤: bird with nine human heads
      const G = ws();
      const b = bird(G, { x: 62, y: MGY, k: .95, body: '#7a4ab8', belly: '#f0c060', wing: '#e04a6a', rx: 12, ry: 8, legLen: 7, wingUp: 1, tail: '#40b0a0', tail2: '#f0c040', tailLen: 14, tailUp: 0, legCol: '#e0a030',
        headFn: () => {} });
      const bx = b.hx - 2, by = b.hy + 2;
      [[-17, -20], [-7, -28], [4, -30], [14, -25], [20, -15], [-11, -12], [0, -16], [10, -11], [17, -3]].forEach(([dx, dy], i) => {
        const P = ramp(i < 5 ? '#5a3a90' : '#7a4ab8');
        tube(G, [bx, by], [bx + dx * .4, by + dy * .7], [bx + dx, by + dy + 2], 1.8, 1.3, P, { n: 16 });
        face(G, bx + dx, by + dy, 4.4, { hair: ['#2a1a30', '#3a2040'][i & 1], skin: i < 5 ? '#e0c0a8' : SKIN, eye: INK });
      });
      return G;
    },
    () => { const G = ws(); ape(G, { x: 66, y: MGY, k: 1.22, body: '#e8a040', belly: '#f8e0b8', stripes: '#3a2010', stand: 1, hoof: '#3a2a20', arms: 'fwd', tail: false,
      headFn: (G, hx, hy) => {
        const T = ramp('#e8a040'), TL = ramp('#fbecd0');
        poly(G, [[hx - 6, hy - 4], [hx - 4, hy - 12], [hx + 1, hy - 7]], T);
        blob(G, hx, hy, 8.5, 8, T, { pat: (x, y, nx, ny) => ny < 0 && Math.abs(Math.sin((x - y * .2) * .9)) < .22 ? ramp('#3a2010') : null });
        blob(G, hx + 6, hy + 3.5, 4.5, 3.5, TL);
        eyeG(G, hx + 3, hy - 1, 1.8, '#9cff5a', 'slit'); G.set(hx + 10, hy + 2, INK);
        snakeTail(G, [hx - 4, hy + 9], [hx + 8, hy + 2], [hx + 18, hy + 10], 2.4, '#4a8a3a', '#d8e0a0');
        snakeTail(G, [hx + 2, hy + 8], [hx + 2, hy + 18], [hx - 6, hy + 22], 2.4, '#4a8a3a', '#d8e0a0');
        G.set(hx + 7, hy + 6, '#fff8ee'); G.set(hx + 9, hy + 6, '#fff8ee');
      } }); return G; },
    () => {   // BOSS 夔: hornless one-legged ox, glowing
      const G = ws(), x = 76, y = MGY, B = ramp('#6a7c90'), BL = ramp('#a8b8c8'), BD = ramp('#4a5a70');
      tube(G, [x - 34, y - 52], [x - 46, y - 48], [x - 46, y - 34], 3, 1.6, BD); blob(G, x - 46, y - 32, 4, 5, ramp('#3a4a5e'));
      blob(G, x - 8, y - 46, 32, 21, B, { belly: BL, bellyY: .55 });
      blob(G, x + 14, y - 49, 18, 19, B, { belly: BL, bellyY: .5 });
      tube(G, [x + 6, y - 32], [x + 12, y - 17], [x + 7, y - 6], 10, 7.5, B, { pat: (px, py, t, dx) => dx > .45 ? BD : null });
      G.rect(x - 1, y - 6, 16, 6, '#2a2a38'); gLine(G, x + 7, y - 6, x + 7, y - 1, '#14141c');
      poly(G, [[x + 30, y - 60], [x + 18, y - 66], [x + 21, y - 61], [x + 30, y - 55]], BD);
      blob(G, x + 38, y - 50, 12.5, 11, B, { belly: BL, bellyY: .4 });
      blob(G, x + 46, y - 44, 7.5, 6.5, ramp('#8e9cae'));
      poly(G, [[x + 40, y - 58], [x + 50, y - 64], [x + 46, y - 56]], B);
      eyeG(G, x + 41, y - 53, 2.4, '#ffe070', 'round');
      G.set(x + 51, y - 46, INK); G.set(x + 52, y - 45, INK); gLine(G, x + 44, y - 40, x + 50, y - 41, '#4a5a70');
      const sx = x + 8, sy = y - 52;   // sun on the flank, moon on the haunch
      for (let a = 0; a < 8; a++) gLine(G, R(sx + Math.cos(a * .785) * 7), R(sy + Math.sin(a * .785) * 7), R(sx + Math.cos(a * .785) * 10), R(sy + Math.sin(a * .785) * 10), '#ffe070');
      blob(G, sx, sy, 5.5, 5.5, ramp('#ffb020'));
      blob(G, x - 22, y - 48, 6, 6, ramp('#f0f4ff'), { clip: (px, py) => (px - (x - 19)) ** 2 + (py - (y - 50)) ** 2 > 22 });
      halo(G, 2, '#fff4b0', '#ffd860', (px, py) => py < y - 7);
      return G;
    },
  ],
];
function monsterGrid(z, t) {
  const big = t === 4, G = MON[clamp(z, 0, 7)][clamp(t, 0, 4)]();
  return fit(G, big ? BOSS_W : MON_W, big ? BOSS_H : MON_H);
}
