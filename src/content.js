// ============================================================ content (names, text, colours)
const ZONES = [
  { n: '南山经', sub: '招摇之山', mat: '桂枝', mons: ['旋龟', '鯥', '猼訑', '长右'], boss: '蛊雕', intro: '婴啼声起，雕影掠水', defeat: '角断羽散，没入泽中', rule: '每第 4 击 ×3',
    sky: ['#9ad8f0', '#c4ecf0', '#e4f6d8'], far: '#7ab8a0', mid: '#4a9a68', near: '#2e7a48', ground: '#5aa848', soil: '#3a6a30', deco: 'tree' },
  { n: '西山经', sub: '昆仑之丘', mat: '赭石', mons: ['蛮蛮', '举父', '土蝼', '毕方'], boss: '帝江', intro: '黄囊起舞，无面无目', defeat: '歌舞骤停，散作红雾', rule: '不吃暴击；起舞回血',
    sky: ['#f0a868', '#f8c890', '#fce4b0'], far: '#f4f0f0', mid: '#b0583a', near: '#8a3a2a', ground: '#c87a48', soil: '#7a4028', deco: 'rock' },
  { n: '北山经', sub: '钩吾之山', mat: '寒铁', mons: ['耳鼠', '何罗鱼', '孟极', '诸怀'], boss: '狍鸮', intro: '腋下双目，贪欲无尽', defeat: '贪食反噬，自毁其身', rule: '越咬越凶',
    sky: ['#7a8aa8', '#a0b0c8', '#c8d4e0'], far: '#d8e0ec', mid: '#7a8aa0', near: '#4a5a70', ground: '#e8eef4', soil: '#a8b8c8', deco: 'deadtree' },
  { n: '东山经', sub: '泰山之阳', mat: '海贝', mons: ['从从', '犰狳', '合窳', '蜚'], boss: '梼杌', intro: '人面虎足，顽凶难训', defeat: '凶名散尽，伏地不起', rule: '半血后出手翻倍',
    sky: ['#f0b8b0', '#f8d4c0', '#fcecd8'], far: '#a8c0d8', mid: '#5a8ab0', near: '#5a6a78', ground: '#a89888', soil: '#6a5a50', deco: 'rock' },
  { n: '中山经', sub: '伊水之畔', mat: '青铜', mons: ['朏朏', '山膏', '化蛇', '犀渠'], boss: '马腹', intro: '婴啼伊水，虎身人面', defeat: '人面失色，遁回伊水', rule: '每 12 秒让你落空一击',
    sky: ['#4a7a5a', '#6a9a70', '#a8c8a0'], far: '#5a8a6a', mid: '#2e5a3a', near: '#1e4028', ground: '#3a6a38', soil: '#24402a', deco: 'ding' },
  { n: '海外', sub: '南海之外', mat: '珊瑚', mons: ['比翼鸟', '并封', '龙鱼', '蛩蛩'], boss: '相柳', intro: '九首人面，食于九山', defeat: '血腥污地，五谷不生', rule: '断一首就喷毒',
    sky: ['#6ac0f0', '#a0dcf8', '#d8f4fc'], far: '#88d0c0', mid: '#3a8ad0', near: '#2a6ab0', ground: '#f0e0b0', soil: '#c8b080', deco: 'palm' },
  { n: '海内', sub: '昆仑之虚', mat: '琅玕', mons: ['蜪犬', '陵鱼', '兕', '巴蛇'], boss: '窫窳', intro: '不死药香，尸起弱水', defeat: '弱水沉沉，再无复苏', rule: '倒下一次会复活',
    sky: ['#3a2a6a', '#5a3a8a', '#8a5aa8'], far: '#7a5aa0', mid: '#4a7a8a', near: '#2a4a5a', ground: '#8ad0b0', soil: '#4a8a78', deco: 'jade' },
  { n: '大荒', sub: '流波之山', mat: '日精', mons: ['双双', '屏蓬', '九凤', '强良'], boss: '夔', intro: '雷声动地，一足踏海', defeat: '其皮为鼓，声闻五百里', rule: '日相凶猛，月相回血',
    sky: ['#3a0e14', '#6a1a1a', '#a03a20'], far: '#5a2020', mid: '#3a1414', near: '#24100e', ground: '#5a3020', soil: '#2a160e', deco: 'sun' },
];
const TIER_N = ['易', '中', '难', '凶', '大妖'];
// equipment names: [slot][rarity]
const ITEMS = {
  horn: ['骨角箍', '青玉角环', '玄玉角冠', '瑾瑜角饰', '凤皇翎冠', '若木枝冠'],
  collar: ['草绳铜铃', '文贝项圈', '鸣磬铃', '青鸟项铃', '三珠项链', '夔鼓铃'],
  armor: ['藤皮甲', '鯥鳞甲', '旋龟背甲', '文鳐鳞衣', '犀兕重甲', '息壤玄甲'],
  claw: ['石片爪套', '赤铜爪', '白金利爪', '毕方焰爪', '雷兽骨爪', '昆吾神爪'],
  tail: ['草绳尾结', '迷穀尾坠', '碧玉尾环', '帝台棋坠', '扶桑枝尾环', '建木尾饰'],
  orb: ['河石珠', '水玉珠', '丹砂珠', '玉膏珠', '琅玕珠', '不死丹珠'],
  rune: ['泥涂纹', '赭石兽纹', '云雷纹', '百兽山纹', '干戚战纹', '十日金纹'],
};
const RAR_N = ['凡', '灵', '玄', '仙', '圣', '神'];
const ORB_COL = ['#a8a8a0', '#c8f0ff', '#ff6a4a', '#fff4e0', '#5af0c0', '#ffb030'];
const QUOTE = {   // 西山经 / 海内北经
  f0: '其状如虎', f1: '其状如牛，猬毛', f2: '音如嗥狗', f3: '状如虎，有翼', f4: '邽山，其上有兽焉', f5: '名曰穷奇，是食人', f6: '穷奇状如虎，有翼，食人从首始',
};
const TIPS = ['大妖一倒，图鉴上限全开', '卡关了？看看变强指引', '强化等级跟着部位走', '换新装备不掉强化', '材料不够就多刷本区', '后面区的材料也能用', '离线也在吞噬精元', '装备久不出，保底会来', '进化一次，战力翻倍', '涅槃后可走另一条线'];
// big-number display: 万 / 亿 / 兆 / 京 / 垓, one decimal truncated
function fmt(n) {
  if (!isFinite(n)) return '-';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1e4) return n < 100 && n % 1 ? (Math.floor(n * 10) / 10).toString() : Math.floor(n).toString();
  const U = [[1e20, '垓'], [1e16, '京'], [1e12, '兆'], [1e8, '亿'], [1e4, '万']];
  if (n >= 1e24) return n.toExponential(1).replace('e+', 'e');
  for (const [v, u] of U) if (n >= v) { const x = n / v; return (x >= 1000 ? Math.floor(x) : Math.floor(x * 10) / 10) + u; }
}
const itemName = id => { const [sl, r] = id.split(':'); return ITEMS[sl][+r]; };
