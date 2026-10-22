#!/usr/bin/env python3
"""Turn an AI-drawn sprite on a flat green background into a clean game sprite.

    python tools/pixelize.py <in.png> <out.png> --h 96 [--colors 40] [--key 00ff00]

1. Key out the background: green excess (G - max(R, B)) -> transparent, despill the edge.
2. Crop to the creature, downscale with box filtering so the height is --h pixels.
3. Quantise to a small palette (keeps the pixel-art look), hard alpha (no half-transparent pixels).
"""
import argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--h', type=int, default=96)
ap.add_argument('--colors', type=int, default=40)
ap.add_argument('--key', default='00ff00')
a = ap.parse_args()

im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
R, G, B = im[..., 0], im[..., 1], im[..., 2]
if a.key.lower() == '00ff00':
    ex = G - np.maximum(R, B)                      # how "green-screen" a pixel is
    alpha = np.clip(1 - (ex - 40) / 90, 0, 1)      # >130 excess: background, <40: creature
    spill = np.maximum(0, G - np.maximum(R, B))    # pull leftover green out of edge pixels
    im[..., 1] = G - spill * (1 - alpha) - np.minimum(spill, 30) * (alpha < 1)
else:
    k = np.array([int(a.key[i:i + 2], 16) for i in (0, 2, 4)], np.float32)
    d = np.sqrt(((im - k) ** 2).sum(-1))
    alpha = np.clip((d - 40) / 60, 0, 1)
rgba = np.dstack([np.clip(im, 0, 255), alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA')
ys, xs = np.where(alpha > .5)
img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
w = max(1, round(img.width * a.h / img.height))
# premultiply so the box filter does not drag background colour into the edges
arr = np.asarray(img).astype(np.float32); arr[..., :3] *= arr[..., 3:4] / 255
small = np.asarray(Image.fromarray(arr.astype(np.uint8), 'RGBA').resize((w, a.h), Image.BOX)).astype(np.float32)
al = small[..., 3]
small[..., :3] = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
mask = al > 110
rgb = Image.fromarray(np.clip(small[..., :3], 0, 255).astype(np.uint8), 'RGB')
q = rgb.quantize(colors=a.colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
out = np.dstack([np.asarray(q), mask * 255]).astype(np.uint8)
Image.fromarray(out, 'RGBA').save(a.dst)
print(f'{a.dst}: {w}x{a.h}')
