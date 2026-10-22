#!/usr/bin/env python3
"""Turn AI-drawn sprites on a flat background into clean game sprites.

    python tools/pixelize.py <in.png> <out.png> --h 96 [--colors 40]
    python tools/pixelize.py <sheet.png> <out_prefix> --split 7 --heights 40,48,56,66,76,86,96

1. Key out the background: its colour is sampled from the image border (AI "pure green" is often a darker green),
   pixels close to it become transparent and leftover green is pulled out of the edges.
2. --split N: cut a sheet of N creatures standing in a row at the empty columns between them (left to right).
3. Crop each creature, downscale with box filtering to its height, quantise to a small palette, hard alpha.
"""
import argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--h', type=int, default=96)
ap.add_argument('--colors', type=int, default=40)
ap.add_argument('--split', type=int, default=0)
ap.add_argument('--heights', default='')
ap.add_argument('--native', action='store_true', help='the source is upscaled pixel art: find its pixel grid, size = native size, each output pixel = the most common colour of its cell (crisp, no blending)')
ap.add_argument('--period', type=float, default=0, help='with --native: the source pixel size (default: measured on the whole image)')
ap.add_argument('--nomerge', action='store_true', help='keep only the N biggest blobs (icons: drop ghost reflections) instead of merging the small ones in')
ap.add_argument('--maxw', type=int, default=0, help='also shrink so the width stays within N pixels')
ap.add_argument('--box', type=int, default=0, help='fit the larger side into N pixels (icons) instead of using a height')
ap.add_argument('--keepgreen', action='store_true', help='the creature itself has green: skip the green-cast cleanup')
a = ap.parse_args()

im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
border = np.concatenate([im[:4].reshape(-1, 3), im[-4:].reshape(-1, 3), im[:, :4].reshape(-1, 3), im[:, -4:].reshape(-1, 3)])
bg = np.median(border, 0)
dist = np.sqrt(((im - bg) ** 2).sum(-1))
alpha = np.clip((dist - 45) / 70, 0, 1)
# despill: a creature pixel that leans toward the background's dominant channel gets it pulled back
ch = int(np.argmax(bg)); others = [c for c in range(3) if c != ch]
if bg[0] > 150 and bg[2] > 150 and bg[1] < 100:   # magenta screen: R and B both spill
    ch = -1
    spill = np.minimum(im[..., 0], im[..., 2]) - im[..., 1]
    for c in (0, 2): im[..., c] -= np.clip(spill, 0, None) * (alpha < 1) * .8
else:
    excess = im[..., ch] - im[..., others].max(-1)
    im[..., ch] -= np.clip(excess, 0, None) * (alpha < 1) * .9 + np.clip(excess - 20, 0, None) * (alpha >= 1) * .5


PER = 0


def grid_period(rgb):
    """Pixel size of upscaled pixel art: the spacing of colour edges (autocorrelation, sub-pixel by checking 4 multiples)."""
    best = (0, 6)
    for axis in (0, 1):
        d = np.abs(np.diff(rgb, axis=1 - axis)).sum(-1).sum(axis)
        d = d - d.mean(); ac = np.correlate(d, d, 'full')[len(d) - 1:]; ac = ac / ac[0]
        for p in np.arange(3, 30, .05):
            sc = sum(np.interp(k * p, np.arange(len(ac)), ac) for k in (1, 2, 3, 4)) / 4
            if sc > best[0]: best = (sc, p)
    return best[1]


def mode_resize(rgba, w, h):
    """Upscaled pixel art back to its own grid: each output pixel is the source pixel at the centre of its cell (no blending,
    no palette squeeze, so 1-pixel pupils and highlights survive); a cell is opaque when most of its inner part is."""
    H, W = rgba.shape[:2]
    op = rgba[..., 3] > 127
    out = np.zeros((h, w, 3), np.int16); mask = np.zeros((h, w), bool)
    for j in range(h):
        ya, yb = j * H / h, (j + 1) * H / h; m = (yb - ya) * .25
        for i in range(w):
            xa_, xb_ = i * W / w, (i + 1) * W / w; n = (xb_ - xa_) * .25
            if op[int(ya + m):max(int(ya + m) + 1, int(yb - m)), int(xa_ + n):max(int(xa_ + n) + 1, int(xb_ - n))].mean() < .5: continue
            out[j, i] = rgba[min(H - 1, int((ya + yb) / 2)), min(W - 1, int((xa_ + xb_) / 2)), :3]; mask[j, i] = True
    return out, mask


def finish(x0, x1, h, dst):
    sub_a = alpha[:, x0:x1]
    ys, xs = np.where(sub_a > .5)
    y0, y1, xa, xb = ys.min(), ys.max() + 1, xs.min() + x0, xs.max() + 1 + x0
    rgba = np.dstack([np.clip(im[y0:y1, xa:xb], 0, 255), alpha[y0:y1, xa:xb] * 255])
    if a.box:
        k = a.box / max(xb - xa, y1 - y0); w, h = max(1, round((xb - xa) * k)), max(1, round((y1 - y0) * k))
    else:
        w = max(1, round((xb - xa) * h / (y1 - y0)))
        if a.maxw and w > a.maxw: h = max(1, round(h * a.maxw / w)); w = a.maxw
    if a.native:
        global PER
        if not PER: PER = a.period or grid_period(im); print(f'pixel grid {PER:.2f}')
        per = (y1 - y0) / h if a.heights or a.h != 96 else PER   # an explicit height overrides the native size
        w, h = max(1, round((xb - xa) / per)), max(1, round((y1 - y0) / per))
        if a.maxw and w > a.maxw: h = max(1, round(h * a.maxw / w)); w = a.maxw
        q, mask = mode_resize(rgba, w, h)
    else:
        pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255   # premultiply: no background bleeding into edges
        small = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
        al = small[..., 3]
        small[..., :3] = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
        mask = al > 110
        q = Image.fromarray(np.clip(small[..., :3], 0, 255).astype(np.uint8), 'RGB').quantize(colors=a.colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
        q = np.asarray(q).astype(np.int16)
    if ch == -1:   # magenta screen: edge pixels that still carry the screen colour become dark outline
        op = mask
        pad = np.pad(op, 1)
        edge = op & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        sp = np.minimum(q[..., 0], q[..., 2]) - q[..., 1]
        bad = (sp > 25) & (edge | (sp > 70))
        q[bad] = (np.stack([q[..., 1], q[..., 1], q[..., 1]], -1)[bad] * .3 + np.array([22, 16, 26])).astype(np.int16)
    if ch == 1 and not a.keepgreen:   # green-screen leftovers: the creatures are drawn without green, so pull any green cast out
        q[..., 1] = np.minimum(q[..., 1], np.maximum(q[..., 0], q[..., 2]) + 8)
    Image.fromarray(np.dstack([np.clip(q, 0, 255), mask * 255]).astype(np.uint8), 'RGBA').save(dst)
    print(f'{dst}: {w}x{h}')


def components(mask, f=4):
    """Connected blobs on a downsampled mask (thin 1-3 px lines such as a drawn ground line are dropped first)."""
    H, W = mask.shape
    # drop thin horizontal lines: pixels whose vertical opaque run is short
    m = mask.copy()
    up = np.zeros_like(m, dtype=np.int32); dn = np.zeros_like(m, dtype=np.int32)
    for y in range(H): up[y] = (up[y - 1] + 1) * m[y] if y else m[y]
    for y in range(H - 1, -1, -1): dn[y] = (dn[y + 1] + 1) * m[y] if y < H - 1 else m[y]
    m &= (up + dn - 1) > 8
    h2, w2 = H // f, W // f
    small = m[:h2 * f, :w2 * f].reshape(h2, f, w2, f).any(axis=(1, 3))
    lab = np.zeros(small.shape, np.int32); n = 0
    for y0 in range(h2):
        for x0 in range(w2):
            if small[y0, x0] and not lab[y0, x0]:
                n += 1; st = [(y0, x0)]; lab[y0, x0] = n
                while st:
                    y, x = st.pop()
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = y + dy, x + dx
                            if 0 <= yy < h2 and 0 <= xx < w2 and small[yy, xx] and not lab[yy, xx]:
                                lab[yy, xx] = n; st.append((yy, xx))
    boxes = []
    for k in range(1, n + 1):
        ys, xs = np.where(lab == k)
        boxes.append([xs.min() * f, ys.min() * f, (xs.max() + 1) * f, (ys.max() + 1) * f, len(ys)])
    return boxes, m


def merge_to(boxes, n):
    boxes = sorted(boxes, key=lambda b: -b[4])
    big, small = boxes[:n], boxes[n:]
    if a.nomerge: small = []
    for b in small:   # sparks, smoke, flames: join the nearest big blob
        d = lambda B: max(0, max(B[0], b[0]) - min(B[2], b[2])) + max(0, max(B[1], b[1]) - min(B[3], b[3]))
        B = min(big, key=d); B[0] = min(B[0], b[0]); B[1] = min(B[1], b[1]); B[2] = max(B[2], b[2]); B[3] = max(B[3], b[3])
    # reading order: rows (by vertical centre), then left to right
    big.sort(key=lambda B: (B[1] + B[3]) / 2)
    rows, cur = [], [big[0]]
    for B in big[1:]:
        if (B[1] + B[3]) / 2 - (cur[-1][1] + cur[-1][3]) / 2 > (cur[-1][3] - cur[-1][1]) * .5: rows.append(cur); cur = [B]
        else: cur.append(B)
    rows.append(cur)
    return [B for r in rows for B in sorted(r, key=lambda B: B[0])]


if not a.split:
    finish(0, im.shape[1], a.h, a.dst)
else:
    boxes, clean = components(alpha > .97)   # solid pixels only: faint ghost reflections / glows don't count as creatures
    alpha *= components(alpha > .5)[1]       # thin drawn ground lines go too
    if len(boxes) < a.split:
        raise SystemExit(f'found {len(boxes)} creatures, expected {a.split}')
    hs = [int(v) for v in a.heights.split(',')] if a.heights else [a.h] * a.split
    keep = alpha.copy()
    for k, (x0, y0, x1, y1, _) in enumerate(merge_to(boxes, a.split)):
        alpha[:] = 0; alpha[y0:y1, x0:x1] = keep[y0:y1, x0:x1]   # only this creature (neighbours' wing tips stay out)
        finish(x0, x1, hs[k], f'{a.dst}{k}.png')
