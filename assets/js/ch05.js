/* ═══════════════════════════════════════════════════════════════
   第五展厅 · 时序数据 —— 交互脚本
   数据：flights.csv（1949–1960 国际航线月度乘客，144 个月）
   ═══════════════════════════════════════════════════════════════ */

const MONTH_CN = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EN2N = Object.fromEntries(MONTH_EN.map((m, i) => [m, i]));

let FL = []; // [{i, year, month(0-11), passengers}]

U.csv('data/flights.csv').then(raw => {
  FL = raw.map((d, i) => ({ i, year: +d.year, month: EN2N[d.month], v: +d.passengers }));
  initTimeProps(); initLine(); initCal(); initSpiral(); initStory();
}).catch(e => document.querySelectorAll('.demo-body').forEach(n => U.err(n, e.message)));

/* ════════ 5.1 时间的五种属性 ════════ */
const TIME_PROPS = [
  {
    k: 'point', name: '时间点', q: '这件事「何时」发生？',
    desc: '一个瞬间、无长度。日志时间戳、交易时刻、地震发生的秒。',
    viz: '散点图（时间为 x）、甘特图的端点',
    draw(g, W, H) {
      const xs = [40, 120, 200, 280, 360];
      g.append('line').attr('x1', 20).attr('x2', W - 20).attr('y1', H / 2).attr('y2', H / 2)
        .attr('stroke', '#c9beab').attr('stroke-width', 1.5);
      xs.forEach(x => g.append('circle').attr('cx', x).attr('cy', H / 2).attr('r', 5)
        .attr('fill', '#1e3a6b'));
      g.append('text').attr('x', xs[2]).attr('y', H / 2 - 14).attr('text-anchor', 'middle')
        .style('font-size', 11).style('fill', '#7d7365').text('时间轴上的「点」');
    }
  },
  {
    k: 'span', name: '时间区间', q: '这件事「持续多久」？',
    desc: '有起点和终点。项目周期、皇帝在位、电影中角色在场的时间段。',
    viz: '甘特图、Storyline、生命线（lifeline）',
    draw(g, W, H) {
      [[30, 140, '#1e3a6b'], [90, 260, '#b08d3f'], [200, 370, '#4a7c6f']].forEach(([a, b, c], i) => {
        g.append('rect').attr('x', a).attr('y', 26 + i * 28).attr('width', b - a).attr('height', 14)
          .attr('rx', 7).attr('fill', c).attr('opacity', .85);
      });
      g.append('text').attr('x', W / 2).attr('y', H - 6).attr('text-anchor', 'middle')
        .style('font-size', 11).style('fill', '#7d7365').text('每条线段 = 一段起止时间');
    }
  },
  {
    k: 'order', name: '顺序', q: '谁先谁后？',
    desc: '只关心先后、不关心间隔。工序流程、体育比赛名次、编辑历史。',
    viz: '折线图（斜率）、序数轴条形图、流程图',
    draw(g, W, H) {
      const y = d3.scaleLinear().domain([0, 10]).range([H - 30, 26]);
      const line = d3.line().x(d => d[0]).y(d => y(d[1])).curve(d3.curveMonotoneX);
      g.append('path').attr('d', line([[30, 2], [110, 5], [190, 3], [270, 8], [360, 6]]))
        .attr('fill', 'none').attr('stroke', '#1e3a6b').attr('stroke-width', 2);
      g.append('text').attr('x', W / 2).attr('y', 16).attr('text-anchor', 'middle')
        .style('font-size', 11).style('fill', '#7d7365').text('连接顺序点 → 折线（斜率才可判读）');
    }
  },
  {
    k: 'cycle', name: '周期', q: '它是否周而复始？',
    desc: '按年 / 周 / 日重复。季节、通勤早晚高峰、GitHub 提交热图。',
    viz: '日历热图、螺旋图、径向图（本厅主角）',
    draw(g, W, H) {
      const cx = W / 2, cy = H / 2;
      d3.range(3).forEach(k => {
        const r = 22 + k * 22;
        g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r).attr('fill', 'none')
          .attr('stroke', '#c9beab').attr('stroke-dasharray', '2 3');
      });
      d3.range(12).forEach(m => {
        const a = m / 12 * Math.PI * 2 - Math.PI / 2;
        d3.range(3).forEach(k => {
          const r = 22 + k * 22 + 8;
          g.append('circle').attr('cx', cx + Math.cos(a) * r).attr('cy', cy + Math.sin(a) * r)
            .attr('r', 3.5).attr('fill', m >= 6 && m <= 8 ? '#a63a2e' : '#4a7c6f');
        });
      });
      g.append('text').attr('x', cx).attr('y', cy + 4).attr('text-anchor', 'middle')
        .style('font-size', 10.5).style('fill', '#7d7365').text('同相位对齐');
    }
  },
  {
    k: 'gran', name: '粒度', q: '年、月、日，还是混合？',
    desc: '同一段数据里同时存在多种时间粒度：年 → 月 → 日 → 时。粒度决定下钻层次。',
    viz: '交互式下钻（drill-down）、小型多图、层次时间轴',
    draw(g, W, H) {
      const rows = [
        { y: 24, segs: 1, c: '#1e3a6b', lab: '年' },
        { y: 48, segs: 4, c: '#4a7c6f', lab: '季' },
        { y: 72, segs: 12, c: '#b08d3f', lab: '月' },
        { y: 96, segs: 24, c: '#a89e8d', lab: '…更细' }
      ];
      rows.forEach(r => {
        d3.range(r.segs).forEach(j => {
          g.append('rect')
            .attr('x', 56 + j * (300 / r.segs)).attr('y', r.y).attr('width', 300 / r.segs - 3).attr('height', 14)
            .attr('rx', 2).attr('fill', r.c).attr('opacity', .85);
        });
        g.append('text').attr('x', 40).attr('y', r.y + 11).attr('text-anchor', 'end')
          .style('font-size', 11).style('fill', '#4a4238').text(r.lab);
      });
    }
  }
];

function initTimeProps() {
  const chips = document.getElementById('timeChips');
  const info = document.getElementById('timeInfo');
  TIME_PROPS.forEach((p, i) => {
    const c = U.el('button', { class: 'chip' + (i === 0 ? ' on' : ''), text: p.name });
    c.onclick = () => {
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      c.classList.add('on'); show(p);
    };
    chips.appendChild(c);
  });
  function show(p) {
    info.innerHTML = '';
    const W = 420, H = 128;
    const card = d3.select(info).append('div').attr('class', 'tp-card').node();
    const s = d3.select(card).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px').style('width', '100%');
    p.draw(s, W, H);
    const txt = document.createElement('div');
    txt.className = 'tp-txt';
    txt.innerHTML = `
      <h4>${p.name} <span>${p.q}</span></h4>
      <p>${p.desc}</p>
      <p class="tp-viz">推荐图形 → <b>${p.viz}</b></p>`;
    info.appendChild(txt);
  }
  show(TIME_PROPS[0]);
}

/* ════════ 5.2 折线图 ════════ */
function initLine() {
  const box = document.getElementById('lineChart');
  const W = 700, H = 330, m = { t: 18, r: 14, b: 34, l: 52 };
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');

  const x = d3.scaleLinear().domain([0, FL.length - 1]).range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, d3.max(FL, d => d.v) * 1.08]).range([H - m.b, m.t]);

  s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(i => 1949 + Math.floor(i / 12)).tickSizeOuter(0));
  s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));

  // 面积 + 折线
  s.append('path').datum(FL)
    .attr('d', d3.area().x(d => x(d.i)).y0(H - m.b).y1(d => y(d.v)).curve(d3.curveMonotoneX))
    .attr('fill', '#1e3a6b').attr('opacity', .07);
  s.append('path').datum(FL)
    .attr('d', d3.line().x(d => x(d.i)).y(d => y(d.v)).curve(d3.curveMonotoneX))
    .attr('fill', 'none').attr('stroke', '#1e3a6b').attr('stroke-width', 1.8);

  // 轴标签
  s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 6).attr('text-anchor', 'middle')
    .style('font-size', 11).style('fill', '#7d7365').text('年份（1949–1960，共 144 个月）');
  s.append('text').attr('x', 14).attr('y', (m.t + H - m.b) / 2).attr('text-anchor', 'middle')
    .attr('transform', `rotate(-90 14 ${(m.t + H - m.b) / 2})`).style('font-size', 11).style('fill', '#7d7365').text('月度乘客数（千人）');

  // 悬停指示线 + 圆点
  const marker = s.append('g').style('display', 'none');
  marker.append('line').attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#b08d3f').attr('stroke-dasharray', '3 3');
  marker.append('circle').attr('r', 4.5).attr('fill', '#a63a2e').attr('stroke', '#fff').attr('stroke-width', 1.5);
  marker.append('text').attr('class', 'mt').attr('y', m.t + 10).style('font-size', 11)
    .style('font-family', 'var(--mono)').style('fill', '#4a4238').attr('text-anchor', 'middle');

  s.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.r - m.l).attr('height', H - m.b - m.t)
    .attr('fill', 'transparent')
    .on('mousemove', e => {
      const [mx] = d3.pointer(e);
      const i = Math.round(x.invert(mx));
      const d = FL[Math.max(0, Math.min(FL.length - 1, i))];
      marker.style('display', null);
      marker.select('line').attr('x1', x(d.i)).attr('x2', x(d.i));
      marker.select('circle').attr('cx', x(d.i)).attr('cy', y(d.v));
      const t = marker.select('text').attr('x', Math.max(m.l + 30, Math.min(W - m.r - 30, x(d.i))));
      t.text(`${d.year}年${MONTH_CN[d.month]} · ${d.v} 千人`);
      showTip(`<b>${d.year} 年 ${MONTH_CN[d.month]}</b><br>乘客 ${d.v} 千人`, e.clientX, e.clientY);
    })
    .on('mouseleave', () => { marker.style('display', 'none'); hideTip(); });
}

/* ════════ 5.3 日历热图 ════════ */
function initCal() {
  const box = document.getElementById('calChart');
  const W = 700, H = 360, m = { t: 34, r: 130, b: 8, l: 56 };
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');

  const years = d3.range(1949, 1961);
  const x = d3.scaleBand().domain(d3.range(12)).range([m.l, W - m.r]).padding(0.12);
  const y = d3.scaleBand().domain(years).range([m.t, H - m.b]).padding(0.16);
  const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([100, 660]);

  // 列标签（月份）
  d3.range(12).forEach(mm => {
    s.append('text').attr('x', x(mm) + x.bandwidth() / 2).attr('y', m.t - 10)
      .attr('text-anchor', 'middle').style('font-size', 10.5).style('fill', '#7d7365').text(MONTH_CN[mm]);
  });
  // 行标签（年份）
  years.forEach(yy => {
    s.append('text').attr('x', m.l - 10).attr('y', y(yy) + y.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end').style('font-size', 11).style('fill', '#4a4238').text(yy);
  });

  s.selectAll('rect.cell').data(FL).join('rect')
    .attr('x', d => x(d.month)).attr('y', d => y(d.year))
    .attr('width', x.bandwidth()).attr('height', y.bandwidth()).attr('rx', 2)
    .attr('fill', d => color(d.v))
    .on('mouseenter', (e, d) => showTip(`<b>${d.year} 年 ${MONTH_CN[d.month]}</b><br>乘客 ${d.v} 千人`, e.clientX, e.clientY))
    .on('mousemove', (e, d) => showTip(`<b>${d.year} 年 ${MONTH_CN[d.month]}</b><br>乘客 ${d.v} 千人`, e.clientX, e.clientY))
    .on('mouseleave', hideTip);

  // 旺季标注框：7–8 月
  const peak = [x(6) - 3, x(8) + x.bandwidth() + 3];
  s.append('rect').attr('x', peak[0]).attr('y', m.t - 4).attr('width', peak[1] - peak[0])
    .attr('height', H - m.b - m.t + 8).attr('fill', 'none')
    .attr('stroke', '#a63a2e').attr('stroke-dasharray', '4 3').attr('rx', 4);
  s.append('text').attr('x', peak[1] + 10).attr('y', m.t + 16).style('font-size', 11.5)
    .style('fill', '#a63a2e').text('← 旺季 7–8 月');
  s.append('text').attr('x', peak[1] + 10).attr('y', m.t + 34).style('font-size', 11.5)
    .style('fill', '#7d7365').text('整列颜色更深，');

  // 图例
  const lg = s.append('g').attr('transform', `translate(${W - m.r + 16},${m.t + 70})`);
  lg.append('text').attr('y', -8).style('font-size', 10.5).style('fill', '#7d7365').text('乘客数（千人）');
  d3.range(10).forEach(i => {
    lg.append('rect').attr('x', i * 11).attr('y', 0).attr('width', 11).attr('height', 10)
      .attr('fill', color(100 + i / 9 * 560));
  });
  lg.append('text').attr('x', 0).attr('y', 22).style('font-size', 9.5).style('fill', '#7d7365').text('100');
  lg.append('text').attr('x', 92).attr('y', 22).attr('text-anchor', 'end').style('font-size', 9.5).style('fill', '#7d7365').text('660');
}

/* ════════ 5.4 阿基米德螺旋 ════════ */
function initSpiral() {
  const box = document.getElementById('spiralChart');
  const W = 680, H = 420, cx = 250, cy = H / 2;
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const R0 = 42, R1 = 182;
  const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([100, 660]);

  const pt = d => {
    const a = d.month / 12 * Math.PI * 2 - Math.PI / 2;
    const r = R0 + (d.i / (FL.length - 1)) * (R1 - R0);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  // 年份刻度环（每 12 个月一圈虚线）
  d3.range(12).forEach(yi => {
    const r = R0 + (yi * 12 / 143) * (R1 - R0);
    s.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r).attr('fill', 'none')
      .attr('stroke', '#d9cfbc').attr('stroke-dasharray', '1 4');
    s.append('text').attr('x', cx).attr('y', cy - r - 3).attr('text-anchor', 'middle')
      .style('font-size', 9).style('fill', '#a89e8d').text(1949 + yi);
  });

  // 月份径向参考线
  d3.range(12).forEach(mm => {
    const a = mm / 12 * Math.PI * 2 - Math.PI / 2;
    s.append('line')
      .attr('x1', cx + Math.cos(a) * (R0 - 14)).attr('y1', cy + Math.sin(a) * (R0 - 14))
      .attr('x2', cx + Math.cos(a) * (R1 + 8)).attr('y2', cy + Math.sin(a) * (R1 + 8))
      .attr('stroke', '#e4dbc8').attr('stroke-width', 1);
    s.append('text')
      .attr('x', cx + Math.cos(a) * (R0 - 26)).attr('y', cy + Math.sin(a) * (R0 - 26) + 3)
      .attr('text-anchor', 'middle').style('font-size', 9.5)
      .style('fill', mm >= 6 && mm <= 8 ? '#a63a2e' : '#7d7365')
      .style('font-weight', mm >= 6 && mm <= 8 ? 700 : 400).text(MONTH_CN[mm]);
  });

  // 螺旋：分段着色的路径 + 数据点
  for (let i = 0; i < FL.length - 1; i++) {
    const [x1, y1] = pt(FL[i]), [x2, y2] = pt(FL[i + 1]);
    s.append('line')
      .attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
      .attr('stroke', color((FL[i].v + FL[i + 1].v) / 2)).attr('stroke-width', 3).attr('stroke-linecap', 'round');
  }
  s.selectAll('circle.sp').data(FL).join('circle')
    .attr('cx', d => pt(d)[0]).attr('cy', d => pt(d)[1]).attr('r', 2.6)
    .attr('fill', d => color(d.v)).attr('stroke', '#fff').attr('stroke-width', .5)
    .on('mouseenter', (e, d) => showTip(`<b>${d.year} 年 ${MONTH_CN[d.month]}</b><br>乘客 ${d.v} 千人`, e.clientX, e.clientY))
    .on('mousemove', (e, d) => showTip(`<b>${d.year} 年 ${MONTH_CN[d.month]}</b><br>乘客 ${d.v} 千人`, e.clientX, e.clientY))
    .on('mouseleave', hideTip);

  // 说明面板（右侧）
  const nx = 480;
  s.append('text').attr('x', nx).attr('y', 90).style('font-size', 13).style('fill', '#1e3a6b')
    .style('font-weight', 700).text('怎么读这张图');
  const notes = [
    ['一圈 = 一年', '半径从内到外是 1949 → 1960'],
    ['角度 = 月份', '12 点钟方向是 1 月，顺时针走到 12 月'],
    ['颜色 = 乘客数', '黄绿 → 深蓝，由浅到深'],
    ['径向条纹 = 周期', '7–8 月方向上连续 12 年都是深色——季节性在「同一方向」上重复出现']
  ];
  notes.forEach((n, i) => {
    s.append('circle').attr('cx', nx + 4).attr('cy', 118 + i * 52).attr('r', 3).attr('fill', '#b08d3f');
    s.append('text').attr('x', nx + 16).attr('y', 122 + i * 52).style('font-size', 12)
      .style('fill', '#4a4238').style('font-weight', 700).text(n[0]);
    s.append('text').attr('x', nx + 16).attr('y', 138 + i * 52).style('font-size', 11)
      .style('fill', '#7d7365').text(n[1]);
  });

  document.getElementById('spiralStat').textContent =
    '旺季（红字 7–8 月）方向上，12 个年份的点全部偏深 —— 周期结构表现为放射状条纹，这就是螺旋图存在的意义';
}

/* ════════ 5.5 Storyline 故事线 ════════ */
/* 《侏罗纪公园》教学重构：角色 × 场景片段的分组关系
   segments: 每个时间片段是一组「场景」，同组角色在该片段内同行 */
const CHARACTERS = ['Grant', 'Sattler', 'Malcolm', 'Hammond', 'Tim', 'Lex', 'Gennaro', 'Muldoon', 'Nedry', 'Arnold'];
const SEGMENTS = [
  { t: '抵达海岛', groups: [['Grant', 'Sattler', 'Malcolm', 'Gennaro'], ['Hammond'], ['Tim', 'Lex'], ['Muldoon'], ['Nedry'], ['Arnold']] },
  { t: '游客中心', groups: [['Grant', 'Sattler', 'Malcolm', 'Gennaro', 'Tim', 'Lex', 'Hammond', 'Muldoon'], ['Nedry'], ['Arnold']] },
  { t: '乘车游览', groups: [['Grant', 'Tim', 'Lex', 'Malcolm'], ['Sattler', 'Gennaro', 'Hammond', 'Muldoon'], ['Nedry'], ['Arnold']] },
  { t: '暴龙袭击', groups: [['Grant', 'Tim', 'Lex', 'Malcolm'], ['Sattler', 'Muldoon'], ['Hammond'], ['Arnold']] },
  { t: '树上报信', groups: [['Grant', 'Tim', 'Lex'], ['Sattler', 'Muldoon', 'Hammond', 'Arnold']] },
  { t: '停电失控', groups: [['Grant', 'Tim', 'Lex'], ['Nedry'], ['Sattler', 'Muldoon', 'Hammond', 'Arnold']] },
  { t: '控制室', groups: [['Grant', 'Tim', 'Lex'], ['Sattler', 'Hammond', 'Arnold', 'Muldoon']] },
  { t: '速龙围攻', groups: [['Grant', 'Tim', 'Lex', 'Sattler', 'Muldoon', 'Hammond'], ['Arnold']] },
  { t: '逃出生天', groups: [['Grant', 'Tim', 'Lex', 'Sattler', 'Malcolm', 'Hammond']] }
];

function storyLanes(optimized) {
  /* 朴素排序：每个片段独立地按角色名字母序排列——
     片段之间互不照应，位置频繁跳变，产生大量交叉 */
  if (!optimized) {
    return SEGMENTS.map(seg => {
      const gs = seg.groups.map(g => [...g].sort()).sort((a, b) => a[0] < b[0] ? -1 : 1);
      const order = gs.flat().concat(CHARACTERS.filter(c => !seg.groups.flat().includes(c)).sort());
      return { seg, pos: Object.fromEntries(order.map((c, i) => [c, i])) };
    });
  }
  /* 优化排序（Tanahashi & Ma 2012 思路的简化实现）：
     ① 前向贪心：以上一时刻位置为锚，把同组角色聚拢成 contiguous 的「发辫」；
     ② barycenter 双向扫描（借鉴 Sugiyama 层次布局）：
        每段以左右邻居的平均位置为锚重排，正反交替扫 4 轮，进一步压低交叉。 */
  let order = [...CHARACTERS];
  const lanes = SEGMENTS.map(seg => {
    const present = seg.groups.flat();
    const prev = Object.fromEntries(order.map((c, i) => [c, i]));
    const key = c => prev[c] ?? 99;
    const newOrder = [...seg.groups].sort((a, b) => d3.min(a, key) - d3.min(b, key))
      .map(g => [...g].sort((x, y) => key(x) - key(y))).flat()
      .concat(order.filter(c => !present.includes(c)));
    order = newOrder;
    return { seg, pos: Object.fromEntries(newOrder.map((c, i) => [c, i])) };
  });
  // barycenter 迭代
  const orderOf = l => Object.entries(l.pos).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  for (let it = 0; it < 4; it++) {
    for (const dir of ['fwd', 'bwd']) {
      const idx = dir === 'fwd' ? lanes.map((_, i) => i) : lanes.map((_, i) => i).reverse();
      idx.forEach(k => {
        const anchor = {};
        CHARACTERS.forEach(c => {
          const vals = [];
          if (k > 0 && c in lanes[k - 1].pos) vals.push(lanes[k - 1].pos[c]);
          if (k < lanes.length - 1 && c in lanes[k + 1].pos) vals.push(lanes[k + 1].pos[c]);
          anchor[c] = vals.length ? d3.mean(vals) : (lanes[k].pos[c] ?? 99);
        });
        const key = c => anchor[c] ?? 99;
        const seg = lanes[k].seg;
        const present = seg.groups.flat();
        const newOrder = [...seg.groups].sort((a, b) => d3.min(a, key) - d3.min(b, key))
          .map(g => [...g].sort((x, y) => key(x) - key(y))).flat()
          .concat(orderOf(lanes[k]).filter(c => !present.includes(c)));
        lanes[k].pos = Object.fromEntries(newOrder.map((c, i) => [c, i]));
      });
    }
  }
  return lanes;
}

/* 交叉数：相邻片段间，相对顺序发生翻转的角色对数 */
function countCrossings(lanes) {
  let n = 0;
  for (let k = 0; k < lanes.length - 1; k++) {
    const a = lanes[k].pos, b = lanes[k + 1].pos;
    const both = CHARACTERS.filter(c => c in a && c in b);
    for (let i = 0; i < both.length; i++)
      for (let j = i + 1; j < both.length; j++) {
        const u = both[i], v = both[j];
        if ((a[u] - a[v]) * (b[u] - b[v]) < 0) n++;
      }
  }
  return n;
}

function initStory() {
  const box = document.getElementById('storyChart');
  const btn = document.getElementById('storyToggle');
  let optimized = false;

  function render() {
    box.innerHTML = '';
    const lanes = storyLanes(optimized);
    const nCross = countCrossings(lanes);
    const W = 700, H = 380, m = { t: 30, r: 96, b: 34, l: 92 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const xs = d3.range(SEGMENTS.length + 1).map(i => m.l + i * (W - m.l - m.r) / SEGMENTS.length);

    const laneY = i => m.t + 8 + i * ((H - m.t - m.b - 16) / (CHARACTERS.length - 1));

    // 背景片段标签
    SEGMENTS.forEach((seg, i) => {
      s.append('rect').attr('x', xs[i]).attr('y', m.t - 22).attr('width', xs[i + 1] - xs[i]).attr('height', H - m.t - m.b + 30)
        .attr('fill', i % 2 ? '#f6f1e6' : 'none');
      s.append('text').attr('x', (xs[i] + xs[i + 1]) / 2).attr('y', m.t - 8)
        .attr('text-anchor', 'middle').style('font-size', 10.5).style('fill', '#7d7365').text(seg.t);
    });

    // 角色曲线
    const colorOf = c => ({
      Grant: '#1e3a6b', Sattler: '#4a7c6f', Malcolm: '#a63a2e', Hammond: '#b08d3f',
      Tim: '#5b6b8c', Lex: '#8a6d9e', Gennaro: '#8c7a5c', Muldoon: '#3d6b6b',
      Nedry: '#6b5b45', Arnold: '#556070'
    }[c]);

    CHARACTERS.forEach(c => {
      // 构建折线：在场 → 泳道位置；缺席 → 沉入下方阴影区
      let d = '';
      lanes.forEach((l, i) => {
        const yy = l.seg.groups.flat().includes(c)
          ? laneY(l.pos[c])
          : H - m.b + 12 + (l.pos[c] % 3) * 5;
        d += (i === 0 ? 'M' : ' L') + xs[i] + ',' + yy;
        const l2 = lanes[i + 1];
        if (l2) {
          const yy2 = l2.seg.groups.flat().includes(c)
            ? laneY(l2.pos[c])
            : H - m.b + 12 + (l2.pos[c] % 3) * 5;
          d += ' L' + xs[i + 1] + ',' + yy2;
        }
      });
      s.append('path').attr('d', d).attr('fill', 'none')
        .attr('stroke', colorOf(c)).attr('stroke-width', 1.8)
        .attr('opacity', .88)
        .on('mouseenter', e => showTip(`<b>${c}</b>`, e.clientX, e.clientY))
        .on('mouseleave', hideTip);
    });

    // 角色名标签（起点/终点）
    const lastPos = lanes[lanes.length - 1].pos;
    CHARACTERS.forEach(c => {
      const p0 = lanes[0].pos[c];
      s.append('text').attr('x', m.l - 8).attr('y', laneY(p0) + 3.5)
        .attr('text-anchor', 'end').style('font-size', 10.5).style('fill', '#4a4238').text(c);
      const pl = lastPos[c];
      s.append('text').attr('x', W - m.r + 8).attr('y', laneY(pl) + 3.5)
        .style('font-size', 10.5).style('fill', colorOf(c)).style('font-weight', 700).text(c);
    });

    // 事件标记：Nedry 下线、Malcolm 受伤归队
    s.append('text').attr('x', xs[5]).attr('y', H - 6).attr('text-anchor', 'middle')
      .style('font-size', 10).style('fill', '#a63a2e').text('↑ Nedry 单独行动（停电元凶）');

    document.getElementById('storyStat').textContent =
      optimized
        ? `优化排序：交叉 ${nCross} 次 —— 前向贪心聚拢 + 邻居重心双向扫描（借鉴 Sugiyama 层次布局），曲线被编成整齐的「发辫」`
        : `每段字母序（未优化）：交叉 ${nCross} 次 —— 同场角色被拆散，视线需要反复跳线才能追踪一个角色`;
    btn.textContent = optimized ? '切换为字母序（未优化）' : '切换为优化排序';
  }
  btn.onclick = () => { optimized = !optimized; render(); };
  render();
}
