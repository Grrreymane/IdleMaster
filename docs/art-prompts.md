# 立绘生图记录

主角穷奇线的 7 张立绘用 AI 生图生成，再用 `tools/pixelize.py` 抠绿幕、缩成像素图（`img/f0.png` … `img/f6.png`）。装备挂点在 `src/art_forms.js` 的 `ANCH`，用 `tools/anchors.py` 出带坐标格的放大图来量。

流程：
```
python tools/pixelize.py <设定图.png> .cache/art/a5/s --split 5 --heights 40,56,66,86,96   # 一排 5 只切开
python tools/pixelize.py <单只.png> img/f1.png --h 48
python tools/anchors.py img/f1.png _lab/anc_f1.png
```

对应关系：设定图 A 的第 1/2/3/4/5 只 → f0/f2/f3/f5/f6；过渡形态 f1、f4 单独以设定图为参考生成。

设计要点（用户反馈后定下的）：身体始终是老虎（宽肩粗颈大爪短吻），翼长在肩胛、翼根和鬃毛衔接；角、獠牙、胸前白鬃、火焰逐阶增加；只有幼崽可爱，之后越来越凶越帅；配色墨黑 + 赤红纹 + 漩涡纹 + 骨白角 + 红色蝠翼。

## 设定图 A（5 阶，16:9，文生图）

```
Generate an image. Creature design evolution sheet of an ORIGINAL winged tiger demon beast called Qiongqi from the ancient Chinese bestiary Shan Hai Jing, for a pixel-art game. Five evolution stages of the SAME tiger in one row from left to right, each clearly larger, all facing RIGHT, full body, evenly spaced, clearly the same lineage (same palette, same stripe pattern, same face markings). THE BODY MUST STAY A TIGER at every stage: heavy muscular feline build, broad powerful shoulders, thick neck, big round paws with claws, short broad tiger muzzle, bold tiger stripes, thick tail. NOT a wolf, NOT a dog, NOT slender or long-legged. Wings sprout from the shoulder blades with a thick muscular furry wing root that blends smoothly into the neck mane, wing size balanced against the body. Demon features grow stage by stage: horns, fangs, a fierce mask-like face, a fluffy white chest ruff, elemental flames. Stage 1: an adorable chubby tiger cub with big head, big shiny eyes and two tiny fluffy wing buds. Stage 2: a young tiger with small wings and little horn nubs. Stage 3: a strong young adult tiger with medium wings, short horns and a growing chest ruff. Stage 4: a big muscular adult tiger demon with large wings, curved horns, bared fangs, crouching predatory stance. Stage 5: the legendary Qiongqi, the largest, huge spread wings, a crown of horns, flaming mane, glowing eyes, ferocious and majestic, crouched forward ready to pounce. Only stage 1 is cute; each later stage is more fierce, cool and imposing. High-quality pixel art sprite rendering, clean dark outline, 4-to-5-tone shading. Original design. Background: one flat solid pure green colour #00FF00 everywhere, no ground, no shadow, no text, no labels, no frame. Palette A, ink tiger: black-and-charcoal fur with crimson and ember-red stripes and swirl markings, a white fluffy chest ruff, deep red leathery bat-like wings with dark bony fingers, bone-white horns, molten orange flames on the mane at the last stages, golden eyes.
```

## （没用上：让它补成 7 阶整排，结果仍是 5 阶）

```
Redraw this evolution sheet as SEVEN stages of the same winged tiger demon in ONE straight row from left to right, all facing RIGHT, all standing on the same baseline, evenly spaced with clear empty green gaps between them, each stage a little larger than the previous one. Keep the exact same design, palette, pixel-art style, stripes, swirl markings, white chest ruff, red bat-like wings, bone horns and flames as in the reference image. The seven stages: 1) the cute chubby cub with tiny wing buds (same as reference stage 1). 2) NEW in-between: a slightly bigger cub with small red wings now clearly visible, still cute, no horns yet. 3) the young tiger with small wings and horn nubs (reference stage 2). 4) the young adult with medium wings, short horns and a white chest ruff (reference stage 3). 5) NEW in-between: a bigger adult with larger wings, horns starting to curve, a few small sparks and embers around the mane, more serious face. 6) the big muscular adult with flaming mane and curved horns in a crouching stance (reference stage 4). 7) the legendary final form with huge spread wings, crown of horns and blazing flaming mane, roaring (reference stage 5). Background: one flat solid pure green colour #00FF00 everywhere, no ground, no shadow, no text, no labels, no frame.
```

## 过渡形态 f1 / f4（图生图，参考图 = 设定图 A）

f1：在设定图第 1、2 只之间——更大一点的幼崽，红色小蝠翼已经张开，还没长角，大圆眼，玩闹姿态。

f4：在第 3、4 只之间——站立的成年虎，翼更大半张，角变长开始弯，鬃毛只有零星火星（还没整片着火），闭嘴、神情凶。

两条提示词都以「Using the reference evolution sheet, draw ONLY ONE creature … same pixel-art style, same palette …」开头，背景要求纯绿 #00FF00。

## 怪物、背景、装备图标

生成脚本在 `.cache/art/mon/gen.py`（每区 4 只小怪一张 16:9 + 大妖一张 1:1）和 `gen2.py`（8 张背景 5:4、7 张装备图 21:9），提示词原文保存在同目录的 `*.txt`。缓存目录不进仓库，下面记要点：

- 风格句统一：高品质像素 RPG 图鉴风、1 像素深色描边、4~5 档明暗、轮廓清楚、神异但不血腥、全部朝右、原创设计。
- 底色用纯洋红 #FF00FF（有几只怪本身是绿色，绿幕会抠坏）。
- 大妖要加一句「约 160 像素高、细节到像素级，不要粗颗粒」，否则会画成很粗的大块像素。
- 装备图要写死「正好 6 个、只画物件本身：不要底板、卡片、边框、光晕、阴影」，否则会画成带框的卡片或多画几个。
- 切图：`sh tools/monsters.sh`（怪物按连通块切、宽度上限 72 / 大妖 112；图标 `--nomerge` 丢掉 AI 画的模糊倒影、装进 28×28）；背景 `python tools/bg.py`（裁成 9:8 缩到 180×160）。
