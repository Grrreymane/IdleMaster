#!/bin/sh
# Cut the AI monster sheets (.cache/art/mon/z<zone>_01.png = 4 monsters in a row, b<zone>_01.png = boss) into img/m<zone>-<tier>.png
cd "$(dirname "$0")/.."
for z in 0 1 2 3 4 5 6 7; do
  [ -f .cache/art/mon/z${z}_01.png ] && python tools/pixelize.py .cache/art/mon/z${z}_01.png .cache/art/mon/cut${z}_ --split 4 --heights 42,46,50,54 --maxw 72 --keepgreen \
    && for t in 0 1 2 3; do cp .cache/art/mon/cut${z}_${t}.png img/m${z}-${t}.png; done
  [ -f .cache/art/mon/b${z}_01.png ] && python tools/pixelize.py .cache/art/mon/b${z}_01.png img/m${z}-4.png --h 88 --maxw 112 --keepgreen
done
true
# item icons: .cache/art/mon/icon_<slot>_01.png = 6 rarities in a row -> img/i-<slot>-<r>.png (fit in 28 x 28)
for s in horn collar armor claw tail orb rune; do
  [ -f .cache/art/mon/icon2_${s}_01.png ] && python tools/pixelize.py .cache/art/mon/icon2_${s}_01.png .cache/art/mon/ic_${s}_ --split 6 --box 28 --nomerge --keepgreen \
    && for r in 0 1 2 3 4 5; do cp .cache/art/mon/ic_${s}_${r}.png img/i-${s}-${r}.png; done
done
python tools/bg.py
true
