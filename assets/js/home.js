/* ═══════════════════════════════════════════════════════════════
   图学馆 · 门厅脚本
   门厅背景（缓动山脊线）+ 五间展厅封面缩略图
   ═══════════════════════════════════════════════════════════════ */

/* ─────────── 门厅背景：缓慢起伏的山脊线 ─────────── */
(function ridge() {
  const cv = document.getElementById('heroCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, t = 0, raf = null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function size() {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ROWS = 8;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < ROWS; i++) {
      const k = i / (ROWS - 1);
      const base = H * (0.42 + k * 0.62);
      const amp = 10 + k * 22;
      const gold = 176 + k * 40;
      ctx.beginPath();
      for (let x = -10; x <= W + 10; x += 6) {
        const p = x / W;
        const y = base
          - amp * Math.sin(p * 3.1 + t * 0.55 + k * 1.9)
          - amp * 0.42 * Math.sin(p * 6.7 - t * 0.32 + k * 3.1);
        x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${gold}, ${130 + k * 40}, ${60 + k * 90}, ${0.30 - k * 0.20})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function loop() { t += 0.006; draw(); raf = requestAnimationFrame(loop); }

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) { if (!raf && !reduce) loop(); }
      else if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0 });
  io.observe(cv);

  addEventListener('resize', () => { size(); draw(); }, { passive: true });
  size(); draw();
})();

/* ─────────── 缩略图工具 ─────────── */
const TW = 340, TH = 158;
function thumb() {
  const s = d3.create('svg').attr('viewBox', `0 0 ${TW} ${TH}`).attr('preserveAspectRatio', 'xMidYMid meet');
  s.style('width', '100%').style('height', '100%');
  return s;
}

/* 封面 1 · 数据：年龄直方图（新生数据，真实） */
function artAges(rows) {
  const s = thumb();
  const m = { t: 14, r: 12, b: 22, l: 12 };
  const w = TW - m.l - m.r, h = TH - m.t - m.b;
  const bins = d3.rollups(rows, v => v.length, d => d.age).sort((a, b) => a[0] - b[0]);
  const x = d3.scaleBand().domain(bins.map(b => b[0])).range([m.l, m.l + w]).padding(0.28);
  const y = d3.scaleLinear().domain([0, d3.max(bins, b => b[1])]).range([m.t + h, m.t]);
  const gold = ['#c9a44e', '#b08d3f', '#9a7730'];
  s.selectAll('rect').data(bins).join('rect')
    .attr('x', d => x(d[0])).attr('y', d => y(d[1]))
    .attr('width', x.bandwidth()).attr('height', d => m.t + h - y(d[1]))
    .attr('rx', 2)
    .attr('fill', (d, i) => gold[i % 3]);
  s.selectAll('text.lab').data(bins).join('text')
    .attr('class', 'lab').attr('x', d => x(d[0]) + x.bandwidth() / 2)
    .attr('y', m.t + h + 14).attr('text-anchor', 'middle')
    .style('font-size', '9px').style('fill', '#7d7365').text(d => d[0]);
  s.append('text').attr('x', m.l).attr('y', m.t - 3)
    .style('font-size', '10px').style('fill', '#a89e8d')
    .text('年龄分布 · 80 名新生');
  return s.node();
}

/* 封面 2 · 流程：Card 数据流模型 */
function artPipeline() {
  const s = thumb();
  const stages = ['Value', 'Analytical\nAbstraction', 'Visualization\nAbstraction', 'View', 'Inter-\npretation'];
  const bw = 52, gap = 8, total = stages.length * bw + (stages.length - 1) * gap;
  const x0 = (TW - total) / 2, y = 62;
  stages.forEach((s2, i) => {
    const x = x0 + i * (bw + gap);
    s.append('rect').attr('x', x).attr('y', y).attr('width', bw).attr('height', 44)
      .attr('rx', 3).attr('fill', '#fffdf8').attr('stroke', '#b08d3f').attr('stroke-width', 1);
    if (i % 2 === 0) s.append('rect').attr('x', x).attr('y', y).attr('width', 4).attr('height', 44)
      .attr('rx', 2).attr('fill', '#b08d3f');
    s2.split('\n').forEach((ln, j) => {
      s.append('text').attr('x', x + bw / 2).attr('y', y + 19 + j * 13)
        .attr('text-anchor', 'middle').style('font-size', '8.5px').style('fill', '#4a4238').text(ln);
    });
    if (i) s.append('path')
      .attr('d', `M${x - gap + 1} ${y + 22} l${gap - 3} 0 m-2 -3 l3 3 l-3 3`)
      .attr('stroke', '#b08d3f').attr('stroke-width', 1).attr('fill', 'none');
  });
  // 反向：人的感知
  s.append('path').attr('d', `M${x0 + 10} ${y + 54} L${x0 + total - 10} ${y + 54}`)
    .attr('stroke', '#1e3a6b').attr('stroke-dasharray', '3 3').attr('fill', 'none');
  s.append('text').attr('x', TW / 2).attr('y', y + 72).attr('text-anchor', 'middle')
    .style('font-size', '9px').style('fill', '#1e3a6b').text('人的感知与调节（反向回路）');
  s.append('text').attr('x', TW / 2).attr('y', 26).attr('text-anchor', 'middle')
    .style('font-size', '11px').style('fill', '#26221c').style('font-family', 'serif')
    .text('Card 数据流模型 · 1999');
  return s.node();
}

/* 封面 3 · 色彩：Okabe-Ito 原色 vs 色盲模拟 */
function artColor() {
  const s = thumb();
  const c = PALETTES['okabe-ito'].colors.filter(d => d !== '#000000');
  const bw = 32, gap = 7, total = c.length * bw + (c.length - 1) * gap;
  const x0 = (TW - total) / 2;
  s.append('text').attr('x', TW / 2).attr('y', 24).attr('text-anchor', 'middle')
    .style('font-size', '10.5px').style('fill', '#26221c').style('font-family', 'serif')
    .text('Okabe-Ito 配色 · 色盲友好');
  c.forEach((hex, i) => {
    const x = x0 + i * (bw + gap);
    s.append('rect').attr('x', x).attr('y', 40).attr('width', bw).attr('height', 40)
      .attr('rx', 2).attr('fill', hex).attr('stroke', '#e2d9c6');
    const sim = cvdSimulate(hex, 'deuteranopia', 1);
    s.append('rect').attr('x', x).attr('y', 88).attr('width', bw).attr('height', 40)
      .attr('rx', 2).attr('fill', sim).attr('stroke', '#e2d9c6');
  });
  s.append('text').attr('x', x0 - 8).attr('y', 65).attr('text-anchor', 'end')
    .style('font-size', '9px').style('fill', '#7d7365').text('正常');
  s.append('text').attr('x', x0 - 8).attr('y', 113).attr('text-anchor', 'end')
    .style('font-size', '9px').style('fill', '#a63a2e').text('红绿色盲');
  s.append('text').attr('x', TW / 2).attr('y', 146).attr('text-anchor', 'middle')
    .style('font-size', '9px').style('fill', '#7d7365').text('模拟后八色依然可区分');
  return s.node();
}

/* 封面 4 · 低维：企鹅散点（真实数据） */
function artPenguins(rows) {
  const s = thumb();
  const d = rows.filter(r => r.bill_length_mm && r.flipper_length_mm && r.body_mass_g);
  const m = { t: 18, r: 12, b: 24, l: 34 };
  const w = TW - m.l - m.r, h = TH - m.t - m.b;
  const x = d3.scaleLinear().domain(d3.extent(d, r => r.bill_length_mm)).nice().range([m.l, m.l + w]);
  const y = d3.scaleLinear().domain(d3.extent(d, r => r.flipper_length_mm)).nice().range([m.t + h, m.t]);
  const col = d3.scaleOrdinal().domain(['Adelie', 'Chinstrap', 'Gentoo'])
    .range(['#E69F00', '#CC79A7', '#0072B2']);
  s.append('g').selectAll('circle').data(d).join('circle')
    .attr('cx', r => x(r.bill_length_mm)).attr('cy', r => y(r.flipper_length_mm))
    .attr('r', 2.6).attr('fill', r => col(r.species)).attr('fill-opacity', .72);
  s.append('g').attr('class', 'axis').attr('transform', `translate(0,${m.t + h})`)
    .call(d3.axisBottom(x).ticks(5)).selectAll('text').style('font-size', '8px');
  s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(4)).selectAll('text').style('font-size', '8px');
  s.append('text').attr('x', m.l + w / 2).attr('y', 12).attr('text-anchor', 'middle')
    .style('font-size', '9.5px').style('fill', '#a89e8d').text('喙长 vs 鳍长 · Palmer 企鹅 344 只');
  return s.node();
}

/* 封面 5 · 时序：航线乘客 1949–1960（真实） */
function artFlights(rows) {
  const s = thumb();
  const m = { t: 16, r: 10, b: 20, l: 10 };
  const w = TW - m.l - m.r, h = TH - m.t - m.b;
  const data = rows.map((r, i) => ({ i, v: +r.passengers }));
  const x = d3.scaleLinear().domain([0, data.length - 1]).range([m.l, m.l + w]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.v)]).range([m.t + h, m.t]);
  const area = d3.area().x(d => x(d.i)).y0(m.t + h).y1(d => y(d.v)).curve(d3.curveMonotoneX);
  const line = d3.line().x(d => x(d.i)).y(d => y(d.v)).curve(d3.curveMonotoneX);
  s.append('path').datum(data).attr('d', area).attr('fill', '#1e3a6b').attr('opacity', .09);
  s.append('path').datum(data).attr('d', line).attr('fill', 'none')
    .attr('stroke', '#1e3a6b').attr('stroke-width', 1.4);
  // 标注首尾
  [[0, '1949'], [data.length - 1, '1960']].forEach(([i, lab]) => {
    s.append('text').attr('x', x(i) + (i ? -2 : 2)).attr('y', m.t + h + 13)
      .attr('text-anchor', i ? 'end' : 'start')
      .style('font-size', '9px').style('fill', '#7d7365').text(lab);
  });
  s.append('text').attr('x', m.l).attr('y', 11)
    .style('font-size', '9.5px').style('fill', '#a89e8d').text('月度乘客数 · 趋势 ↑ + 季节 ↻');
  return s.node();
}

/* ─────────── 渲染展厅卡片 ─────────── */
const HALLS = [
  { n: '01', href: 'ch01.html', cn: '数据', en: 'Data',
    desc: '先别急着画图。数据有四种尺度——定类、定序、定距、定比，判错尺度，后面全错。',
    tags: [['Stevens 四尺度', ''], ['DIKW 金字塔', ''], ['d3 数据变换', 'cobalt'], ['Data-Join 三态', 'cobalt']],
    foot: '5 个小节 · 3 个交互' },
  { n: '02', href: 'ch02.html', cn: '可视化流程', en: 'Process',
    desc: 'Card 数据流模型把「画图」拆成七个可检查的步骤，让你知道卡在哪一步。',
    tags: [['Card 模型', ''], ['d3.rollup', 'cobalt'], ['Reingold-Tilford', 'jade'], ['事件委托', 'jade']],
    foot: '4 个小节 · 2 个交互' },
  { n: '03', href: 'ch03.html', cn: '色彩', en: 'Color',
    desc: '顺序型、发散型、分类型——三类 colormap 各有铁律。再学会用色盲模拟检查自己的图。',
    tags: [['三类 colormap', ''], ['CIE Lab 色域', ''], ['Okabe-Ito 配色', 'jade'], ['CVD 模拟', 'seal']],
    foot: '8 个小节 · 4 个交互' },
  { n: '04', href: 'ch04.html', cn: '低维数据', en: 'Low-Dim',
    desc: '散点图画完才是开始：换对数轴、加拟合线、把线 banking 到 45°，让图真正回答问题。',
    tags: [['线性 / 对数轴', 'cobalt'], ['曲线拟合', 'cobalt'], ['Cleveland 45°', ''], ['等值线', 'jade']],
    foot: '5 个小节 · 3 个交互' },
  { n: '05', href: 'ch05.html', cn: '时序数据', en: 'Time Series',
    desc: '时间有五种属性。识别出「周期」，就该把折线换成日历热图或螺旋图了。',
    tags: [['时间五属性', ''], ['日历热图', 'cobalt'], ['阿基米德螺旋', 'jade'], ['Storyline', '']],
    foot: '5 个小节 · 3 个交互' }
];

function renderHalls(arts) {
  const grid = document.getElementById('hallGrid');
  HALLS.forEach((h, i) => {
    const a = document.createElement('a');
    a.className = 'hall rv'; a.href = h.href; a.dataset.hall = h.n;
    a.innerHTML = `
      <div class="hall-art"></div>
      <div class="hall-body">
        <div class="hall-no">第 ${h.n} 展厅 · ${h.en}</div>
        <h3>${h.cn}</h3>
        <p>${h.desc}</p>
        <div class="hall-tags">${h.tags.map(t => `<span class="tag ${t[1]}">${t[0]}</span>`).join('')}</div>
        <div class="hall-foot"><span>${h.foot}</span><span class="go">进入 →</span></div>
      </div>`;
    if (arts[i]) a.querySelector('.hall-art').appendChild(arts[i]);
    grid.appendChild(a);
  });
  if (window.initReveal) initReveal();
  Progress.paint();
}

/* ─────────── 载入数据，绘制缩略图 ─────────── */
(async function () {
  const arts = [null, null, null, null, null];
  arts[1] = artPipeline();
  arts[2] = artColor();
  const jobs = [
    [U.students(), d => arts[0] = artAges(d)],
    [U.csv('data/penguins.csv'), d => arts[3] = artPenguins(d)],
    [U.csv('data/flights.csv'), d => arts[4] = artFlights(d)]
  ];
  renderHalls(arts);
  for (const [p, fn] of jobs) {
    try { fn(await p); } catch (e) { console.warn(p, e); }
  }
  // 二次渲染，把延迟加载的缩略图补进去
  const nodes = document.querySelectorAll('#hallGrid .hall-art');
  [0, 3, 4].forEach((k, j) => { if (arts[k] && nodes[k]) { nodes[k].innerHTML = ''; nodes[k].appendChild(arts[k]); } });
})();
