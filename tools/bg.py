#!/usr/bin/env python3
"""AI background (.cache/art/mon/bg<z>_01.png, 5:4) -> img/bg<z>.png, 180 x 160 pixel art.
Crops the sides to 9:8, box-downscales, quantises to a small palette."""
import pathlib, sys
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
for z in range(8):
    src = root / '.cache/art/mon' / f'bg{z}_01.png'
    if not src.exists(): continue
    im = Image.open(src).convert('RGB')
    w = round(im.height * 180 / 160); x0 = (im.width - w) // 2
    im = im.crop((x0, 0, x0 + w, im.height)).resize((180, 160), Image.BOX)
    im = im.quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    im.save(root / 'img' / f'bg{z}.png'); print('bg', z)
