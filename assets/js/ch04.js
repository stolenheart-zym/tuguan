/* ═══════════════════════════════════════════════════════════════
   第四展厅 · 低维数据 —— 交互脚本
   ═══════════════════════════════════════════════════════════════ */

let CRIME = [], PENGUINS = [], FLIGHTS = [];

Promise.all([U.csv('data/crime.csv'), U.csv('data/penguins.csv'), U.csv('data/flights.csv')])
  .then(([c, p, f]) => {
    CRIME = c;
    PENGUINS = p.filter(r => r.flipper_length_mm && r.body_mass_g);
    FLIGHTS = f;
    initRate(); initAxis(); initFit(); initBanking(); initDensity();
  }).catch(e => document.querySelectorAll('.demo-body').forEach(n => U.err(n, e.message)));

/* ════════ 4.1 总量 → 人均 ════════ */
function initRate() {
  const box = document.getElementById('rateChart');
  let mode = 'count';
  document.querySelectorAll('#s1 .btn-sm[data-m]').forEach(b => b.onclick = () => {
    document.querySelectorAll('#s1 .btn-sm[data-m]').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); mode = b.dataset.m; render();
  });

  function render() {
    box.innerHTML = '';
    const val = d => mode === 'count' ? d.murder : d.murder / d.population * 100000;
    const data = [...CRIME].sort((a, b) => d3.descending(val(a), val(b))).slice(0, 12);
    const W = 660, H = 320, m = { t: 10, r: 60, b: 8, l: 130 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const x = d3.scaleLinear().domain([0, d3.max(data, val) * 1.05]).range([m.l, W - m.r]);
    const y = d3.scaleBand().domain(data.map(d => d.state)).range([m.t, H - m.b]).padding(0.24);
    s.selectAll('rect').data(data).join('rect')
      .attr('x', m.l).attr('y', d => y(d.state)).attr('width', d => x(val(d)) - m.l).attr('height', y.bandwidth())
      .attr('rx', 2).attr('fill', mode === 'count' ? '#b08d3f' : '#1e3a6b');
    s.selectAll('text.st').data(data).join('text')
      .attr('x', m.l - 8).attr('y', d => y(d.state) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end')
      .style('font-size', '11px').style('fill', '#4a4238').text(d => d.state);
    s.selectAll('text.v').data(data).join('text')
      .attr('x', d => x(val(d)) + 5).attr('y', d => y(d.state) + y.bandwidth() / 2 + 4)
      .style('font-size', '10.5px').style('font-family', 'var(--mono)').style('fill', '#7d7365')
      .text(d => mode === 'count' ? d.murder.toLocaleString() : val(d).toFixed(1));
    const ca = CRIME.find(d => d.state === 'California');
    const top = data[0].state;
    document.getElementById('rateStat').textContent = mode === 'count'
      ? `总量第一：${top}（${CRIME.find(d => d.state === top).murder.toLocaleString()} 件）· 加州排第 1（人口最多）`
      : `人均第一：${top}（每 10 万人 ${val(data[0]).toFixed(1)} 起）· 加州人均仅 ${(ca.murder / ca.population * 100000).toFixed(1)}，跌出前列`;
  }
  render();
}

/* ════════ 4.2 坐标轴变换 ════════ */
function initAxis() {
  const box = document.getElementById('axisChart');
  const axX = document.getElementById('axX'), axY = document.getElementById('axY');
  function render() {
    box.innerHTML = '';
    const W = 660, H = 360, m = { t: 14, r: 16, b: 46, l: 64 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const xDom = d3.extent(CRIME, d => d.population);
    const yDom = d3.extent(CRIME, d => d.murder);
    const x = (axX.value === 'log' ? d3.scaleLog().domain([xDom[0] * 0.9, xDom[1] * 1.1]) : d3.scaleLinear().domain([0, xDom[1] * 1.05])).nice().range([m.l, W - m.r]);
    const y = (axY.value === 'log' ? d3.scaleLog().domain([yDom[0] * 0.9, yDom[1] * 1.1]) : d3.scaleLinear().domain([0, yDom[1] * 1.05])).nice().range([H - m.b, m.t]);
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6, '~s'));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6, '~s'));
    s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 8).attr('text-anchor', 'middle').style('font-size', '11px').style('fill', '#7d7365').text(`人口（${axX.value === 'log' ? '对数轴' : '线性轴'}）`);
    s.append('text').attr('x', 16).attr('y', (m.t + H - m.b) / 2).attr('text-anchor', 'middle').attr('transform', `rotate(-90 16 ${(m.t + H - m.b) / 2})`).style('font-size', '11px').style('fill', '#7d7365').text(`谋杀案数（${axY.value === 'log' ? '对数轴' : '线性轴'}）`);
    s.selectAll('circle').data(CRIME).join('circle')
      .attr('cx', d => x(d.population)).attr('cy', d => y(d.murder)).attr('r', 4.5)
      .attr('fill', '#1e3a6b').attr('fill-opacity', .55).attr('stroke', '#fff').attr('stroke-width', .5)
      .on('mouseenter', (e, d) => showTip(`<b>${d.state}</b><br>人口 ${d3.format(',')(d.population)}<br>谋杀案 ${d3.format(',')(d.murder)}`, e.clientX, e.clientY))
      .on('mousemove', (e, d) => showTip(`<b>${d.state}</b><br>人口 ${d3.format(',')(d.population)}<br>谋杀案 ${d3.format(',')(d.murder)}`, e.clientX, e.clientY))
      .on('mouseleave', hideTip);
    const both = axX.value === 'log' && axY.value === 'log';
    document.getElementById('axisStat').textContent = both
      ? '双对数轴：点近似沿直线分布，说明「谋杀案数 ∝ 人口^k」的幂律关系'
      : '线性轴上点挤在左下角，小州与大州无法同时看清 —— 这就是该换对数轴的信号';
  }
  axX.onchange = render; axY.onchange = render;
  render();
}

/* ════════ 4.3 曲线拟合 ════════ */
function polyFit(data, x, y, deg) {
  // 最小二乘多项式拟合（法方程）
  const n = data.length;
  const xs = data.map(x), ys = data.map(y);
  const X = xs.map(v => d3.range(deg + 1).map(p => Math.pow(v, p)));
  // 构建 X^T X 与 X^T y
  const A = d3.range(deg + 1).map(i => d3.range(deg + 1).map(j => d3.sum(X.map(r => r[i] * r[j]))));
  const b = d3.range(deg + 1).map(i => d3.sum(X.map((r, k) => r[i] * ys[k])));
  // 高斯消元
  for (let i = 0; i <= deg; i++) {
    let mx = i; for (let k = i + 1; k <= deg; k++) if (Math.abs(A[k][i]) > Math.abs(A[mx][i])) mx = k;
    [A[i], A[mx]] = [A[mx], A[i]]; [b[i], b[mx]] = [b[mx], b[i]];
    for (let k = i + 1; k <= deg; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j <= deg; j++) A[k][j] -= f * A[i][j];
      b[k] -= f * b[i];
    }
  }
  const coef = new Array(deg + 1);
  for (let i = deg; i >= 0; i--) {
    coef[i] = (b[i] - d3.sum(d3.range(i + 1, deg + 1).map(j => A[i][j] * coef[j]))) / A[i][i];
  }
  return v => d3.sum(coef.map((c, p) => c * Math.pow(v, p)));
}

function initFit() {
  const box = document.getElementById('fitChart');
  let mode = 'none';
  document.querySelectorAll('#s3 .chip[data-f]').forEach(b => b.onclick = () => {
    document.querySelectorAll('#s3 .chip[data-f]').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); mode = b.dataset.f; render();
  });
  const xf = d => d.flipper_length_mm, yf = d => d.body_mass_g;

  function render() {
    box.innerHTML = '';
    const W = 660, H = 340, m = { t: 14, r: 16, b: 42, l: 60 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const x = d3.scaleLinear().domain(d3.extent(PENGUINS, xf)).nice().range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain(d3.extent(PENGUINS, yf)).nice().range([H - m.b, m.t]);
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(7));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6, '~s'));
    s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 6).attr('text-anchor', 'middle').style('font-size', '11px').style('fill', '#7d7365').text('鳍长 flipper_length_mm');
    s.selectAll('circle').data(PENGUINS).join('circle')
      .attr('cx', d => x(xf(d))).attr('cy', d => y(yf(d))).attr('r', 3)
      .attr('fill', '#a89e8d').attr('fill-opacity', .5);

    let stat = '未拟合 · 拖动上方按钮选择拟合方式';
    if (mode !== 'none') {
      let fn;
      if (mode === 'movavg') {
        const sorted = [...PENGUINS].sort((a, b) => xf(a) - xf(b));
        const win = 15;
        fn = v => {
          const near = sorted.filter(d => Math.abs(xf(d) - v) <= win);
          return near.length ? d3.mean(near, yf) : NaN;
        };
      } else {
        const deg = { linear: 1, quad: 2, cubic: 3 }[mode];
        fn = polyFit(PENGUINS, xf, yf, deg);
      }
      const xs = d3.range(x.domain()[0], x.domain()[1], 1);
      const pts = xs.map(v => [v, fn(v)]).filter(p => isFinite(p[1]));
      s.append('path').datum(pts).attr('d', d3.line().x(d => x(d[0])).y(d => y(d[1])))
        .attr('fill', 'none').attr('stroke', '#a63a2e').attr('stroke-width', 2.2);
      // 残差（抽样显示垂线）
      if (mode !== 'movavg') {
        s.selectAll('line.res').data(PENGUINS.filter((d, i) => i % 6 === 0)).join('line')
          .attr('x1', d => x(xf(d))).attr('x2', d => x(xf(d)))
          .attr('y1', d => y(yf(d))).attr('y2', d => y(fn(xf(d))))
          .attr('stroke', '#b08d3f').attr('stroke-width', 1).attr('stroke-dasharray', '2 2').attr('opacity', .7);
      }
      const resid = PENGUINS.map(d => yf(d) - fn(xf(d))).filter(isFinite);
      const rmse = Math.sqrt(d3.mean(resid, r => r * r));
      const names = { linear: '线性', quad: '二次', cubic: '三次', movavg: '移动平均' };
      stat = `${names[mode]}拟合 · RMSE = ${rmse.toFixed(0)} g${mode === 'cubic' ? '（最低，但注意端部上翘——可能过拟合）' : mode === 'linear' ? '（残差仍有轻微 U 形，说明关系非完全线性）' : ''}`;
    }
    document.getElementById('fitStat').textContent = stat;
  }
  render();
}

/* ════════ 4.4 Banking 45° ════════ */
function initBanking() {
  const box = document.getElementById('bankChart');
  const R = document.getElementById('aspR');
  const data = FLIGHTS.map((d, i) => ({ i, v: +d.passengers }));
  function render() {
    box.innerHTML = '';
    const ratio = +R.value / 10;
    const W = 660, H = Math.round(660 / ratio / 2.2);
    const m = { t: 10, r: 12, b: 30, l: 46 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const x = d3.scaleLinear().domain([0, data.length - 1]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.v)]).range([H - m.b, m.t]);
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).ticks(12).tickFormat(i => 1949 + Math.floor(i / 12)));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4));
    s.append('path').datum(data).attr('d', d3.line().x(d => x(d.i)).y(d => y(d.v)))
      .attr('fill', 'none').attr('stroke', '#1e3a6b').attr('stroke-width', 1.6);
    document.getElementById('aspRv').textContent = ratio.toFixed(1) + ' : 1';
    document.getElementById('bankStat').textContent =
      ratio > 2.4 ? '图太扁：波动被压平，难以看出每年内部的起伏' :
        ratio < 0.8 ? '图太高：波动全是尖峰，夸大了短期抖动' :
          '接近 45°：波动节奏与整体趋势都清晰可读（推荐）';
  }
  R.addEventListener('input', render);
  render();
}

/* ════════ 4.5 等值线 ════════ */
function initDensity() {
  const box = document.getElementById('densChart');
  const BW = document.getElementById('densBW');
  function render() {
    box.innerHTML = '';
    const bw = +BW.value;
    document.getElementById('densBWv').textContent = bw;
    const W = 660, H = 380, m = { t: 12, r: 12, b: 40, l: 56 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const x = d3.scaleLinear().domain(d3.extent(PENGUINS, d => d.flipper_length_mm)).nice().range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain(d3.extent(PENGUINS, d => d.body_mass_g)).nice().range([H - m.b, m.t]);
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(7));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6, '~s'));
    // 散点
    s.selectAll('circle').data(PENGUINS).join('circle')
      .attr('cx', d => x(d.flipper_length_mm)).attr('cy', d => y(d.body_mass_g)).attr('r', 2)
      .attr('fill', '#7d7365').attr('opacity', .35);
    // 密度等值线
    const density = d3.contourDensity()
      .x(d => x(d.flipper_length_mm)).y(d => y(d.body_mass_g))
      .size([W, H]).bandwidth(bw).thresholds(12)(PENGUINS);
    s.append('g').selectAll('path').data(density).join('path')
      .attr('d', d3.geoPath())
      .attr('fill', 'none').attr('stroke', d3.interpolateYlGnBu(0.15 + 0.85 * (1 - Math.random() * 0)))
      .attr('stroke', (d, i) => d3.interpolateYlGnBu(0.2 + i / 12 * 0.8))
      .attr('stroke-width', 1.2).attr('opacity', .85);
    document.getElementById('densStat').textContent =
      `带宽 ${bw} · 等值线把 344 个散点变成了密度地形：峰值即企鹅最集中的「鳍长 × 体重」组合`;
  }
  BW.addEventListener('input', render);
  render();
}
