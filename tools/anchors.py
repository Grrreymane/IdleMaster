#!/usr/bin/env python3
"""Draw a sprite big with a coordinate grid (and optional anchor dots) so gear anchors can be read off it.

    python tools/anchors.py img/f3.png out.png [--mark "head:30,8 neck:40,30"]
"""
import argparse
from PIL import Image, ImageDraw

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--z', type=int, default=8)
ap.add_argument('--mark', default='')
a = ap.parse_args()
im = Image.open(a.src).convert('RGBA'); z = a.z; M = 30
W, H = im.width * z + M, im.height * z + M
o = Image.new('RGBA', (W, H), (60, 66, 84, 255))
o.alpha_composite(im.resize((im.width * z, im.height * z), Image.NEAREST), (M, M))
d = ImageDraw.Draw(o)
for x in range(0, im.width + 1, 5):
    col = (255, 255, 255, 90) if x % 10 else (255, 230, 120, 140)
    d.line([(M + x * z, M), (M + x * z, H)], fill=col, width=1)
    if x % 10 == 0: d.text((M + x * z + 2, 4), str(x), fill=(255, 230, 120, 255))
for y in range(0, im.height + 1, 5):
    col = (255, 255, 255, 90) if y % 10 else (255, 230, 120, 140)
    d.line([(M, M + y * z), (W, M + y * z)], fill=col, width=1)
    if y % 10 == 0: d.text((2, M + y * z + 2), str(y), fill=(255, 230, 120, 255))
for m in a.mark.split():
    k, v = m.split(':'); x, y = [float(t) for t in v.split(',')[:2]]
    cx, cy = M + x * z, M + y * z
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], outline=(0, 255, 255, 255), width=3)
    d.text((cx + 8, cy - 6), k, fill=(0, 255, 255, 255))
o.save(a.dst)
