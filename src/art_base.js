// ============================================================ beast art (procedural pixel portraits)
// ramp(base): n tones dark->light with hue shift (shadows lean purple, lights lean warm)
function ramp(c, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(t < .5 ? mixHex(c, '#24143a', (.5 - t) * 1.3) : mixHex(c, '#fff6d8', (t - .5) * .95));
  }
  return out;
}
const LX = -.42, LY = -.62, LZ = .66;   // light from the top-left, a bit in front
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function qv(pal, v, x, y) {   // quantise a 0..1 light value onto a palette with 4x4 ordered dither
  const f = clamp(v, 0, .999) * pal.length + (BAYER[y & 3][x & 3] / 16 - .47) * .55;
  return pal[clamp(Math.floor(f), 0, pal.length - 1)];
}
function lam(nx, ny, nz) { return clamp(.18 + .82 * (nx * LX + ny * LY + nz * LZ), 0, 1); }
// ellipsoid blob lit like a sphere; o.flat squashes the depth (flatter = more even light)
function blob(G, cx, cy, rx, ry, pal, o = {}) {
  const x0 = Math.floor(cx - rx - 1), x1 = Math.ceil(cx + rx + 1), y0 = Math.floor(cy - ry - 1), y1 = Math.ceil(cy + ry + 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, rr = nx * nx + ny * ny;
    if (rr > 1) continue;
    if (o.clip && !o.clip(x, y)) continue;
    let p = pal;
    if (o.belly && ny > o.bellyY) p = o.belly;
    const nz = Math.sqrt(1 - rr) * (o.flat || 1);
    let v = lam(nx, ny, nz) + (o.add || 0);
    if (o.pat) { const pc = o.pat(x, y, nx, ny); if (pc === 'skip') continue; if (pc) { G.set(x, y, typeof pc === 'string' ? pc : qv(pc, v, x, y)); continue; } }
    G.set(x, y, qv(p, v, x, y));
  }
}
function bez(p0, p1, p2, t) { const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]; }
// tapered tube along a quadratic bezier p0 -> (p1) -> p2, radius r0 -> r2, shaded like a cylinder
function tube(G, p0, p1, p2, r0, r2, pal, o = {}) {
  const N = o.n || 40, pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([...bez(p0, p1, p2, t), o.rf ? o.rf(t) : r0 + (r2 - r0) * t, t]); }
  const rmax = Math.max(...pts.map(p => p[2])) + 1;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.floor(Math.min(...xs) - rmax), x1 = Math.ceil(Math.max(...xs) + rmax), y0 = Math.floor(Math.min(...ys) - rmax), y1 = Math.ceil(Math.max(...ys) + rmax);
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
function poly(G, pts, pal, o = {}) {   // flat-ish lit polygon (ears, horns, fins): light by height within its box
  const ys = pts.map(p => p[1]), xs = pts.map(p => p[0]);
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside;
    }
    if (!inside) continue;
    const v = (o.v0 === undefined ? .75 : o.v0) - (y - y0) / Math.max(1, y1 - y0) * (o.dv === undefined ? .45 : o.dv) - (x - x0) / Math.max(1, x1 - x0) * .12;
    G.set(x, y, qv(pal, v, x, y));
  }
}
