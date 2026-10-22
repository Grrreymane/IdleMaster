# 山海异兽录 Shanhai Beasts

![山海异兽录](cover.png)

放置养成：你是一只《山海经》里的小异兽（狌狌），自动战斗、吞噬、进化，最后成为上古神兽。

**在线试玩：** https://grrreymane.github.io/IdleMaster/

## 怎么玩

- 你是一只《山海经》里的**翼虎幼崽**，自动打怪，攒**精元**（自动升级）、**灵玉**和各区**材料**。
- **装备**：7 个部位，掉落自动换上，画在立绘上；用灵玉 + 材料强化。
- **进化**：6 次，一路长成**上古穷奇**（翼虎幼崽 → 小翼虎 → 嗥虎 → 赤翼虎 → 邽山凶虎 → 穷奇 → 上古穷奇），每次战力 ×2.5、换立绘。
- **山海**：8 个分区（南山经 → 大荒），每区一只守关大妖，各有一条规则；打倒后**图鉴上限放开**、开新区。
- **涅槃**：打倒大荒的夔之后重生，带走精魄，再修一世。
- 离线最多结算 12 小时。看不懂就点顶上的「前往」或「变强」。

## 开发

- 源码在 `src/`，`python tools/sync.py` 写回单文件 `index.html`（别手改生成区）。`sh tools/dev.sh` = sync + 生成 `_test.html` + 语法检查。
- 数值：`docs/NUMBERS.md`；模拟器 `node tools/sim.js --seeds 6 --hours 200 --nir 2`（直接跑 index.html 里的规则段）。
- 浏览器试玩脚本：`_test.html#window.PLAY_H=40;fetch('tests/play.js').then(r=>r.text()).then(t=>eval(t))`。
- 美术（立绘、怪物、背景、装备图标）是 AI 起稿再缩成像素图，流程见 `docs/art-prompts.md`。
- 改了文字跑 `python D:/Minigame/_workflow/tools/subset_font.py .`（字体是本地子集，全用像素字）。
- 设计决定见 `docs/DECISIONS.md`，进度见 `docs/PROGRESS.md`。
