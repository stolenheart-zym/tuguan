/* ═══════════════════════════════════════════════════════════════
   图学馆 · 可视化研究常数库
   本文件收录的排序、配色、矩阵均取自公开发表的论文 / 官方实现，
   用于教学演示，非杜撰。
   ═══════════════════════════════════════════════════════════════ */

/* ── Mackinlay 1986 ──────────────────────────────────────────────
   J. Mackinlay, "Automating the Design of Graphical Presentations
   of Relational Information", ACM TOG 5(2), 1986.
   对 13 个视觉通道按「数据类型」的有效性排序（越靠前越精确）。 */
const MACKINLAY = {
  quantitative: ['位置 Position', '长度 Length', '角度 Angle', '斜率 Slope', '面积 Area',
    '体积 Volume', '密度 Density', '色彩饱和度 Saturation', '色相 Hue',
    '纹理 Texture', '连接 Connection', '包含 Containment', '形状 Shape'],
  ordinal: ['位置 Position', '密度 Density', '色彩饱和度 Saturation', '色相 Hue',
    '纹理 Texture', '连接 Connection', '包含 Containment', '长度 Length',
    '角度 Angle', '斜率 Slope', '面积 Area', '体积 Volume', '形状 Shape'],
  nominal: ['位置 Position', '色相 Hue', '纹理 Texture', '连接 Connection',
    '包含 Containment', '密度 Density', '色彩饱和度 Saturation', '形状 Shape',
    '长度 Length', '角度 Angle', '斜率 Slope', '面积 Area', '体积 Volume']
};

/* ── Cleveland & McGill 1984 ────────────────────────────────────
   W. Cleveland & R. McGill, "Graphical Perception: Theory,
   Experimentation, and Application...", JASA 79(387), 1984.
   （Heer & Bostock, CHI 2010 众包复现得到一致排序）
   bars 为「判读难度递增」的定性刻度，用于示意排序而非实测数值。 */
const CLEVELAND = [
  { name: '位置（共轴）', en: 'Position / common axis', rank: 1, note: '条形图、折线图共用同一坐标轴' },
  { name: '位置（非对齐轴）', en: 'Position / nonaligned', rank: 2, note: '散点图：两个独立轴上的位置' },
  { name: '长度', en: 'Length', rank: 3, note: '条形长度' },
  { name: '角度 / 方向', en: 'Angle / Direction', rank: 4, note: '0° 与 90° 附近判读最准' },
  { name: '斜率', en: 'Slope', rank: 5, note: '折线的倾斜程度' },
  { name: '面积', en: 'Area', rank: 6, note: '气泡图、方块树图' },
  { name: '体积 / 曲面', en: 'Volume / Curvature', rank: 7, note: '3D 最差，尽量避免' },
  { name: '密度 / 明暗', en: 'Density / Shading', rank: 8, note: '填充浓度' },
  { name: '色彩饱和度', en: 'Color saturation', rank: 9, note: '同一色相的浓淡' },
  { name: '色相', en: 'Color hue', rank: 10, note: '不同颜色，仅适合分类' }
];

/* ── Stevens 1946 测量尺度 ──────────────────────────────────────
   S. S. Stevens, "On the Theory of Scales of Measurement",
   Science 103(2684), 1946. */
const STEVENS = {
  nominal: {
    cn: '定类（Nominal）', en: 'Nominal',
    q: '它属于哪一类？',
    ok: ['= ≠', '众数', '频数 / 占比', '卡方检验'],
    no: ['排序', '加减', '均值', '倍数'],
    ex: '性别、籍贯、民族、颜色名、物种',
    viz: '条形图（按频数排序）、饼图、分类色散点、树图',
    demo: { field: 'gender', label: '性别' }
  },
  ordinal: {
    cn: '定序（Ordinal）', en: 'Ordinal',
    q: '谁在前谁在后？',
    ok: ['= ≠', '< >', '中位数', '百分位', '秩相关'],
    no: ['加减差值', '均值', '倍数'],
    ex: '满意度等级、学历层次、星级评分、名次',
    viz: '有序条形图、 Likert 堆叠条、顺序色阶（sequential colormap）',
    demo: { field: 'level', label: '等级' }
  },
  interval: {
    cn: '定距（Interval）', en: 'Interval',
    q: '相差多少？',
    ok: ['= ≠', '< >', '加减', '均值', '标准差', '皮尔逊相关'],
    no: ['倍数（无绝对零点）', '几何平均'],
    ex: '摄氏温度、公元年份、标准分数',
    viz: '折线图、直方图、发散色阶（diverging colormap）',
    demo: { field: 'tempC', label: '摄氏温度' }
  },
  ratio: {
    cn: '定比（Ratio）', en: 'Ratio',
    q: '是它的几倍？',
    ok: ['全部运算', '加减乘除', '均值 / 中位数', '几何平均', '变异系数'],
    no: ['（无禁止项）'],
    ex: '身高、体重、人口、金额、开尔文温度、计数',
    viz: '散点图、直方图、箱线图、对数轴、面积编码',
    demo: { field: 'body_mass_g', label: '体重 (g)' }
  }
};

/* ── 真实科研配色方案（十六进制取自原始文献 / 官方实现） ───────── */
const PALETTES = {
  'okabe-ito': {
    name: 'Okabe & Ito (2008)',
    sub: '色盲友好八色 · Color Universal Design',
    ref: 'Okabe & Ito, "Color Universal Design", 2008（Wong, Nature Methods 2011 推荐）',
    colors: ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7']
  },
  'tol-bright': {
    name: 'Paul Tol · Bright',
    sub: '定性配色（7 色）',
    ref: 'Paul Tol, "Colour Schemes", SRON technical note',
    colors: ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB']
  },
  'tol-muted': {
    name: 'Paul Tol · Muted',
    sub: '低饱和定性配色（7 色）',
    ref: 'Paul Tol, "Colour Schemes", SRON technical note',
    colors: ['#332288', '#88CCEE', '#44AA99', '#117733', '#999933', '#DDCC77', '#AA4499']
  },
  'tableau10': {
    name: 'Tableau 10',
    sub: '商业 BI 默认定性配色',
    ref: 'Tableau 官方默认调色板',
    colors: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC']
  },
  'd3-cat10': {
    name: 'D3 schemeCategory10',
    sub: 'D3.js 内置定性配色',
    ref: 'D3.js v7 d3-scale-chromatic',
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
  },
  'npg': {
    name: 'NPG (Nature 风格)',
    sub: '低饱和学术风',
    ref: 'ggsci 收录 Nature Publishing Group 配色',
    colors: ['#E64B35', '#4DBBD5', '#00A087', '#3C5488', '#F39B7F', '#8491B4', '#91D1C2', '#DC0000']
  }
};

/* ── Machado, Oliveira & Fernandes (2009) 色觉障碍模拟矩阵 ──────
   "A Physiologically-based Model for Simulation of Color Vision
   Deficiency", IEEE TVCG 15(6), 2009. 此处为 severity = 1.0。 */
const CVD_MATRIX = {
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  tritanopia: [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900]
};

/* 线性 RGB → 模拟后 sRGB（Machado 矩阵作用于线性空间） */
function cvdSimulate(hex, type, severity = 1) {
  const m = CVD_MATRIX[type]; if (!m) return hex;
  const { r, g, b } = d3.rgb(hex);
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const unlin = v => { const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, c)) * 255); };
  const R = lin(r), G = lin(g), B = lin(b);
  const i = (a, b, k) => a * (1 - k) + b * k;
  const oR = m[0] * R + m[1] * G + m[2] * B;
  const oG = m[3] * R + m[4] * G + m[5] * B;
  const oB = m[6] * R + m[7] * G + m[8] * B;
  return d3.rgb(unlin(i(R, oR, severity)), unlin(i(G, oG, severity)), unlin(i(B, oB, severity))).formatHex();
}

/* ── colormap 三类 ─────────────────────────────────────────────── */
const COLORMAP_KINDS = {
  sequential: {
    cn: '顺序型 Sequential', use: '数值从低到高（有方向、单极点）',
    ex: '人口密度、温度、降水量',
    bad: '彩虹色 jet（亮度非单调，制造虚假边界）',
    good: ['Viridis', 'Cividis', 'Blues', 'YlGnBu']
  },
  diverging: {
    cn: '发散型 Diverging', use: '围绕一个有意义的中点向两侧发散',
    ex: '气温距平、正负增长、满意度差值',
    bad: '用顺序型硬套（中点位置被掩盖）',
    good: ['RdBu', 'PuOr', 'BrBG', 'coolwarm']
  },
  categorical: {
    cn: '分类型 Categorical', use: '彼此无顺序的类别',
    ex: '物种、性别、州、产品类别',
    bad: '用同一色相的深浅表示类别（暗示了不存在的顺序）',
    good: ['Okabe-Ito', 'Tol Bright', 'Tableau 10', 'Category10']
  }
};

/* ── 图表选择规则（基于数据任务 + 数据类型） ───────────────────── */
const CHART_RULES = [
  { task: '比较大小', types: ['定类', '定序'], charts: ['条形图'], why: '长度判读精度仅次于位置；类别名长时优于饼图', star: 5 },
  { task: '比较大小', types: ['定比'], charts: ['条形图', '点图 (dot plot)'], why: '避免面积/体积编码', star: 5 },
  { task: '看分布', types: ['定比'], charts: ['直方图', '箱线图', '小提琴图', '核密度图'], why: '箱线图看分位数与离群点；直方图看形状（注意分箱数）', star: 5 },
  { task: '看关系', types: ['定比', '定比'], charts: ['散点图'], why: '两个定量变量首选；可加趋势线、对数轴', star: 5 },
  { task: '看构成', types: ['定类'], charts: ['堆叠条形图', '树图'], why: '饼图仅在 ≤3 类且需表达「半/四分之一」时使用', star: 2 },
  { task: '看趋势', types: ['时间', '定比'], charts: ['折线图'], why: '斜率判读优于面积；线条数 ≤5', star: 5 },
  { task: '看周期', types: ['时间', '定比'], charts: ['日历热图', '螺旋日历', '径向堆叠图'], why: '周期性数据映射到圆周更符合直觉', star: 4 },
  { task: '看地理', types: ['地理', '定比'], charts: ['分级统计图 Choropleth', '比例符号图'], why: '面积已被地理边界占用，只能用颜色/符号编码数值', star: 4 },
  { task: '看层级', types: ['定类'], charts: ['树图 Treemap', '节点链接树', '旭日图'], why: 'Treemap 看占比，节点链接看结构', star: 4 },
  { task: '看流动', types: ['定类', '定比'], charts: ['桑基图'], why: '守恒流量，宽度编码数值', star: 3 },
  { task: '看相关矩阵', types: ['定比'], charts: ['相关矩阵热力图', '散点图矩阵 SPLOM'], why: '≤10 变量用 SPLOM，更多用热力图', star: 4 }
];
