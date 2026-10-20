/* ═══════════════════════════════════════════════════════════════
   实验室 · 交互工具脚本
   T1 图表明鉴 / T2 配色检影 / T3 感知测谎仪 / T4 图表解剖
   ═══════════════════════════════════════════════════════════════ */

/* ════════ T1 图表明鉴 ════════ */
function initRules() {
  const chips = document.getElementById('taskChips');
  const cards = document.getElementById('ruleCards');
  const tasks = [...new Set(CHART_RULES.map(r => r.task))];
  let cur = tasks[0];
  tasks.forEach((t, i) => {
    const c = U.el('button', { class: 'chip' + (i === 0 ? ' on' : ''), text: t });
    c.onclick = () => {
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      c.classList.add('on'); cur = t; render();
    };
    chips.appendChild(c);
  });
  function render() {
    cards.innerHTML = '';
    CHART_RULES.filter(r => r.task === cur).forEach(r => {
      const star = '★'.repeat(r.star) + '☆'.repeat(5 - r.star);
      const card = document.createElement('div');
      card.className = 'rule-card';
      card.innerHTML = `
        <div class="rc-charts">${r.charts.map(c => `<b>${c}</b>`).join(' · ')}</div>
        <div class="rc-why">${r.why}</div>
        <div class="rc-meta">
          <span class="rc-star" title="推荐度 ${r.star}/5">${star}</span>
          <span>适用数据：${r.types.join(' + ')}</span>
        </div>`;
      cards.appendChild(card);
    });
  }
  render();
}

/* ════════ T2 配色检影 ════════ */
function initPalette() {
  const chips = document.getElementById('palChips');
  const view = document.getElementById('palView');
  const keys = Object.keys(PALETTES);
  let cur = keys[0];
  keys.forEach((k, i) => {
    const c = U.el('button', { class: 'chip' + (i === 0 ? ' on' : ''), text: PALETTES[k].name });
    c.onclick = () => {
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      c.classList.add('on'); cur = k; render();
    };
    chips.appendChild(c);
  });

  const MODES = [
    ['normal', '正常视野'],
    ['protanopia', '红色盲 Protanopia'],
    ['deuteranopia', '绿色盲 Deuteranopia'],
    ['tritanopia', '蓝色盲 Tritanopia']
  ];

  function render() {
    view.innerHTML = '';
    const pal = PALETTES[cur];
    const info = document.createElement('p');
    info.style.cssText = 'font-size:13px;color:var(--ink-soft);margin:0 0 12px';
    info.textContent = `${pal.sub} · 来源：${pal.ref}`;
    view.appendChild(info);

    const grid = document.createElement('div');
    grid.className = 'pal-grid';
    MODES.forEach(([mode, label]) => {
      const row = document.createElement('div');
      row.className = 'pal-row';
      const lab = document.createElement('span');
      lab.className = 'pal-lab'; lab.textContent = label;
      const sw = document.createElement('div');
      sw.className = 'pal-swatches';
      pal.colors.forEach(c => {
        const cc = mode === 'normal' ? c : cvdSimulate(c, mode);
        const s = document.createElement('span');
        s.className = 'pal-swatch';
        s.style.background = cc;
        s.title = `${c} → ${cc}`;
        sw.appendChild(s);
      });
      row.appendChild(lab); row.appendChild(sw);
      grid.appendChild(row);
    });
    view.appendChild(grid);

    // 色盲视野下的可区分度：两两颜色在绿色盲视野下的最小 Lab 色差
    const sim = pal.colors.map(c => d3.lab(cvdSimulate(c, 'deuteranopia')));
    let minD = Infinity, worst = null;
    for (let i = 0; i < sim.length; i++) for (let j = i + 1; j < sim.length; j++) {
      const d = Math.hypot(sim[i].l - sim[j].l, sim[i].a - sim[j].a, sim[i].b - sim[j].b);
      if (d < minD) { minD = d; worst = [i, j]; }
    }
    const ok = minD >= 20;
    document.getElementById('palStat').textContent =
      `绿色盲视野下最难区分的一对：第 ${worst[0] + 1} 色与第 ${worst[1] + 1} 色（CIE Lab 距离 ${minD.toFixed(1)}）—— ${ok ? '≥20，基本可区分 ✓' : '<20，这两色对色盲读者几乎相同 ⚠ 建议换方案或加形状编码'}`;
  }
  render();
}

/* ════════ T3 感知测谎仪 ════════ */
const QUIZ_CHANNELS = [
  { k: 'position', cn: '位置（共轴）', en: 'Position' },
  { k: 'length', cn: '长度', en: 'Length' },
  { k: 'angle', cn: '角度', en: 'Angle' },
  { k: 'area', cn: '面积', en: 'Area' }
];
const QUIZ_N = 5;

function initQuiz() {
  const chips = document.getElementById('quizChips');
  const stage = document.getElementById('quizStage');
  const input = document.getElementById('quizInput');
  const slider = document.getElementById('quizSlider');
  const estEl = document.getElementById('quizEst');
  const nextBtn = document.getElementById('quizNext');
  const sub = document.getElementById('quizSub');
  const stat = document.getElementById('quizStat');
  const result = document.getElementById('quizResult');

  const scores = JSON.parse(localStorage.getItem('tuguan-quiz') || '{}');
  let cur = null, round = 0, truth = 1, errs = [];

  QUIZ_CHANNELS.forEach(c => {
    const b = U.el('button', { class: 'chip', text: c.cn });
    b.onclick = () => {
      chips.querySelectorAll('.chip').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      cur = c; round = 0; errs = []; input.style.display = ''; nextBtn.style.display = '';
      nextBtn.disabled = false; next();
    };
    chips.appendChild(b);
  });
  slider.oninput = () => estEl.textContent = (slider.value / 50).toFixed(2);

  function next() {
    round++;
    truth = 0.4 + Math.random() * 2.4;         // B/A ∈ [0.4, 2.8]
    sub.textContent = `${cur.cn} · 第 ${round}/${QUIZ_N} 题`;
    slider.value = 100; estEl.textContent = '2.00'; estEl.textContent = (100 / 50).toFixed(2);
    drawMarks(cur.k, truth);
  }

  nextBtn.onclick = () => {
    if (round > QUIZ_N) return;
    const est = slider.value / 50;
    errs.push(Math.abs(Math.log2(est / truth)));   // log 误差，与 Cleveland 的误差度量一致
    if (round < QUIZ_N) { next(); return; }
    // 收卷
    input.style.display = 'none'; nextBtn.disabled = true;
    const avg = d3.mean(errs);
    scores[cur.k] = avg;
    localStorage.setItem('tuguan-quiz', JSON.stringify(scores));
    stage.innerHTML = '';
    sub.textContent = '测试完成';
    stat.textContent = `${cur.cn} 平均对数误差 ${avg.toFixed(3)}${avg < 0.15 ? '（很准）' : avg < 0.35 ? '（一般）' : '（偏大——这个通道本来就不适合精确判断）'}`;
    renderResult();
  };

  function renderResult() {
    result.innerHTML = '';
    const done = QUIZ_CHANNELS.filter(c => scores[c.k] != null);
    if (!done.length) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<p style="font-size:13px;color:var(--ink-2);margin:0 0 8px">
      你的个人误差曲线（越短越准，与 Cleveland 1984 的群体结论对照）</p>`;
    const s = d3.select(wrap).append('svg').attr('viewBox', '0 0 560 150').style('max-width', '560px').style('width', '100%');
    const x = d3.scaleLinear().domain([0, d3.max(done, c => scores[c.k]) * 1.15 || 1]).range([110, 540]);
    done.forEach((c, i) => {
      const y = 22 + i * 32;
      s.append('text').attr('x', 102).attr('y', y + 12).attr('text-anchor', 'end')
        .style('font-size', 11.5).style('fill', '#4a4238').text(c.cn);
      s.append('rect').attr('x', 110).attr('y', y).attr('width', x(scores[c.k]) - 110).attr('height', 18)
        .attr('rx', 2).attr('fill', scores[c.k] === d3.max(done, d => scores[d.k]) ? '#a63a2e' : '#1e3a6b').attr('opacity', .85);
      s.append('text').attr('x', x(scores[c.k]) + 6).attr('y', y + 13)
        .style('font-size', 11).style('font-family', 'var(--mono)').style('fill', '#7d7365').text(scores[c.k].toFixed(3));
    });
    result.appendChild(wrap);
  }
  renderResult();

  /* 画两种标记：A 恒为基准 1.0，B = truth */
  function drawMarks(kind, ratio) {
    stage.innerHTML = '';
    const W = 560, H = 220;
    const s = d3.select(stage).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px').style('width', '100%');
    const tag = (x, y, t) => s.append('text').attr('x', x).attr('y', y)
      .attr('text-anchor', 'middle').style('font-size', 13).style('fill', '#4a4238').style('font-weight', 700).text(t);

    if (kind === 'position') {
      s.append('line').attr('x1', 40).attr('x2', W - 40).attr('y1', 150).attr('y2', 150).attr('stroke', '#c9beab');
      [90, 90 + 300 * ratio / 3].forEach((px, i) => {
        s.append('line').attr('x1', px).attr('x2', px).attr('y1', 90).attr('y2', 150)
          .attr('stroke', '#1e3a6b').attr('stroke-width', 2);
        tag(px, 80, i ? 'B' : 'A');
      });
    } else if (kind === 'length') {
      [[90, 60, 120], [90 + 0, 60 + 90, 120 * Math.min(ratio, 2.8)]].forEach((r, i) => {
        s.append('rect').attr('x', 60).attr('y', r[1]).attr('width', r[2]).attr('height', 34)
          .attr('fill', '#1e3a6b').attr('opacity', .8);
        tag(46, r[1] + 21, i ? 'B' : 'A');
      });
    } else if (kind === 'angle') {
      // 两个饼图扇形：A=90°，B=90*ratio°（截到 300°）
      const arc = d3.arc().innerRadius(0).outerRadius(64);
      s.append('path').attr('d', arc({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 + Math.PI / 2 }))
        .attr('transform', 'translate(150,130)').attr('fill', '#1e3a6b').attr('opacity', .8);
      s.append('circle').attr('cx', 150).attr('cy', 130).attr('r', 64).attr('fill', 'none').attr('stroke', '#c9beab');
      const angB = Math.min(ratio, 2.8) * Math.PI / 2;
      s.append('path').attr('d', arc({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 + angB }))
        .attr('transform', 'translate(390,130)').attr('fill', '#a63a2e').attr('opacity', .85);
      s.append('circle').attr('cx', 390).attr('cy', 130).attr('r', 64).attr('fill', 'none').attr('stroke', '#c9beab');
      tag(150, 46, 'A'); tag(390, 46, 'B');
    } else { // area
      const r1 = 34, r2 = 34 * Math.sqrt(Math.min(ratio, 2.8));
      s.append('circle').attr('cx', 150).attr('cy', 120).attr('r', r1).attr('fill', '#1e3a6b').attr('opacity', .8);
      s.append('circle').attr('cx', 390).attr('cy', 120).attr('r', r2).attr('fill', '#a63a2e').attr('opacity', .85);
      tag(150, 46, 'A'); tag(390, 46, 'B');
    }
  }
}

/* ════════ T4 图表解剖 ════════ */
function initAnatomy() {
  const box = document.getElementById('anatomy');
  const W = 660, H = 380, m = { t: 46, r: 30, b: 58, l: 72 };
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');

  // 用 tips.csv 画一张「合格的账单金额分布直方图」
  U.csv('data/tips.csv').then(tips => {
    const bins = d3.bin().domain([0, 52]).thresholds(26).value(d => +d.total_bill)(tips);
    const x = d3.scaleLinear().domain([0, 52]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, d3.max(bins, b => b.length) * 1.1]).range([H - m.b, m.t]);

    // 结论式标题
    s.append('text').attr('x', m.l).attr('y', 22).style('font-size', 14.5).style('font-weight', 700).style('fill', '#2f2a22')
      .text('晚餐账单的金额集中在 10–26 美元，长尾延伸至 50 美元');
    s.append('text').attr('x', m.l).attr('y', 40).style('font-size', 11).style('fill', '#7d7365')
      .text('n = 244 条账单记录 · seaborn tips 数据集（Bryant & Smith, 1995）');

    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(13).tickFormat(v => '$' + v));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));

    s.selectAll('rect.bar').data(bins).join('rect')
      .attr('x', b => x(b.x0) + 1).attr('y', b => y(b.length))
      .attr('width', b => x(b.x1) - x(b.x0) - 2).attr('height', b => y(0) - y(b.length))
      .attr('fill', '#1e3a6b').attr('opacity', .82);

    s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 18).attr('text-anchor', 'middle')
      .style('font-size', 11).style('fill', '#7d7365').text('账单金额（美元）');
    s.append('text').attr('x', 18).attr('y', (m.t + H - m.b) / 2).attr('text-anchor', 'middle')
      .attr('transform', `rotate(-90 18 ${(m.t + H - m.b) / 2})`).style('font-size', 11).style('fill', '#7d7365').text('账单数（条）');

    s.append('text').attr('x', m.l).attr('y', H - 4).style('font-size', 10).style('fill', '#a89e8d')
      .text('来源：Bryant & Smith (1995) 餐厅账单数据 · 直方图分箱 12 组');

    // 解剖标注点
    const marks = [
      { x: 90, y: 22, t: '标题写「结论」，不是「XX 图」——读者 3 秒内知道你想说什么' },
      { x: 90, y: 40, t: '副题给样本量与数据集，让图可信' },
      { x: 200, y: 130, t: '图元（柱）：高度编码频数——用「长度」这一高精度通道' },
      { x: W - m.r - 4, y: H - m.b - 4, t: '坐标轴：刻度带单位（$），数字无多余小数位' },
      { x: (m.l + W - m.r) / 2, y: H - 18, t: '轴标签：变量名 + 单位，永远不可省略' },
      { x: 300, y: H - 4, t: '角落注明来源与口径：可追溯、可复现' }
    ];
    marks.forEach((mk, i) => {
      s.append('circle').attr('cx', mk.x).attr('cy', mk.y).attr('r', 9)
        .attr('fill', '#b08d3f').attr('stroke', '#fff').attr('stroke-width', 1.5).attr('cursor', 'pointer')
        .on('mouseenter', e => showTip(mk.t, e.clientX, e.clientY))
        .on('mousemove', e => showTip(mk.t, e.clientX, e.clientY))
        .on('mouseleave', hideTip);
      s.append('text').attr('x', mk.x).attr('y', mk.y + 3.5).attr('text-anchor', 'middle')
        .style('font-size', 10).style('fill', '#fff').style('font-weight', 700).attr('pointer-events', 'none').text(i + 1);
    });
  }).catch(e => U.err(box, e.message));
}

document.addEventListener('DOMContentLoaded', () => {
  initRules(); initPalette(); initQuiz(); initAnatomy();
});
