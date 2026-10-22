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
ap.add_argument('--keepgreen', action='store_true', help='the creature itself has green: skip the green-cast cleanup')
a = ap.parse_args()

im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
border = np.concatenate([im[:4].reshape(-1, 3), im[-4:].reshape(-1, 3), im[:, :4].reshape(-1, 3), im[:, -4:].reshape(-1, 3)])
bg = np.median(border, 0)
dist = np.sqrt(((im - bg) ** 2).sum(-1))
alpha = np.clip((dist - 45) / 70, 0, 1)
# despill: a creature pixel that leans toward the background's dominant channel gets it pulled back
ch = int(np.argmax(bg)); others = [c for c in range(3) if c != ch]
excess = im[..., ch] - im[..., others].max(-1)
im[..., ch] -= np.clip(excess, 0, None) * (alpha < 1) * .9 + np.clip(excess - 20, 0, None) * (alpha >= 1) * .5


def finish(x0, x1, h, dst):
    sub_a = alpha[:, x0:x1]
    ys, xs = np.where(sub_a > .5)
    y0, y1, xa, xb = ys.min(), ys.max() + 1, xs.min() + x0, xs.max() + 1 + x0
    rgba = np.dstack([np.clip(im[y0:y1, xa:xb], 0, 255), alpha[y0:y1, xa:xb] * 255])
    w = max(1, round((xb - xa) * h / (y1 - y0)))
    pre = rgba.copy(); pre[..., :3] *= pre[..., 3:4] / 255   # premultiply: no background bleeding into edges
    small = np.asarray(Image.fromarray(pre.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
    al = small[..., 3]
    small[..., :3] = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    mask = al > 110
    q = Image.fromarray(np.clip(small[..., :3], 0, 255).astype(np.uint8), 'RGB').quantize(colors=a.colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    q = np.asarray(q).astype(np.int16)
    if ch == 1 and not a.keepgreen:   # green-screen leftovers: the creatures are drawn without green, so pull any green cast out
        q[..., 1] = np.minimum(q[..., 1], np.maximum(q[..., 0], q[..., 2]) + 8)
    Image.fromarray(np.dstack([np.clip(q, 0, 255), mask * 255]).astype(np.uint8), 'RGBA').save(dst)
    print(f'{dst}: {w}x{h}')


if not a.split:
    finish(0, im.shape[1], a.h, a.dst)
else:
    col = (alpha > .5).sum(0) > 2
    runs, x = [], 0
    while x < len(col):
        if col[x]:
            s = x
            while x < len(col) and col[x]: x += 1
            runs.append([s, x])
        x += 1
    # merge runs separated by tiny gaps (sparks, wing tips) until N remain
    while len(runs) > a.split:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps)); runs[i][1] = runs[i + 1][1]; del runs[i + 1]
    if len(runs) != a.split:
        raise SystemExit(f'found {len(runs)} creatures, expected {a.split}')
    hs = [int(v) for v in a.heights.split(',')] if a.heights else [a.h] * a.split
    for k, (x0, x1) in enumerate(runs):
        finish(x0, x1, hs[k], f'{a.dst}{k}.png')
