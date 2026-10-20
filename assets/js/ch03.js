/* ═══════════════════════════════════════════════════════════════
   第三展厅 · 色彩 —— 交互脚本
   ═══════════════════════════════════════════════════════════════ */

let PENGUINS = [];

Promise.all([
  U.csv('data/penguins.csv')
]).then(([p]) => {
  PENGUINS = p.filter(r => r.bill_length_mm && r.body_mass_g);
  initModel(); initCmap(); initGamut(); initHarmony(); initPalettes(); initPair(); initGenerator(); initCVD();
}).catch(e => document.querySelectorAll('.demo-body').forEach(n => U.err(n, e.message)));

/* ════════ 3.1 颜色模型 ════════ */
function initModel() {
  const H = document.getElementById('cmH'), S = document.getElementById('cmS'), L = document.getElementById('cmL');
  const hueBox = document.getElementById('cmHue');
  const ws = 200, wh = 56;
  const hsvg = d3.select(hueBox).append('svg').attr('viewBox', `0 0 ${ws} ${wh}`).style('max-width', ws + 'px');
  // 色相条
  const defs = hsvg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'hueG').attr('x1', 0).attr('x2', 1);
  d3.range(0, 1.001, .05).forEach(t => grad.append('stop').attr('offset', t).attr('stop-color', d3.hsl(t * 360, .7, .5)));
  hsvg.append('rect').attr('x', 0).attr('y', 10).attr('width', ws).attr('height', 16).attr('rx', 8).attr('fill', 'url(#hueG)');
  const marker = hsvg.append('circle').attr('cy', 18).attr('r', 8).attr('fill', '#fff').attr('stroke', '#26221c').attr('stroke-width', 2);

  function render() {
    const h = +H.value, s = +S.value / 100, l = +L.value / 100;
    const c = d3.hsl(h, s, l);
    const rgb = d3.rgb(c);
    const lab = d3.lab(c);
    const hex = rgb.formatHex();
    document.getElementById('cmSwatch').style.background = hex;
    marker.attr('cx', h / 360 * ws);
    document.getElementById('cmHv').textContent = h + '°';
    document.getElementById('cmSv').textContent = Math.round(s * 100) + '%';
    document.getElementById('cmLv').textContent = Math.round(l * 100) + '%';
    document.getElementById('cmOut').innerHTML = `
      <span>HEX <b>${hex.toUpperCase()}</b></span>
      <span>RGB <b>(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})</b></span>
      <span>HSL <b>(${h}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)</b></span>
      <span>CIE Lab <b>(${lab.l.toFixed(1)}, ${lab.a.toFixed(1)}, ${lab.b.toFixed(1)})</b></span>`;
  }
  [H, S, L].forEach(el => el.addEventListener('input', render));
  render();
}

/* ════════ 3.2 colormap 画廊 ════════ */
function cmapBar(interpolator, w = 240, h = 22) {
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  const s = d3.create('svg').attr('viewBox', `0 0 ${w} ${h}`).style('width', w + 'px').style('height', h + 'px');
  const defs = s.append('defs');
  const g = defs.append('linearGradient').attr('id', id);
  d3.range(0, 1.001, .04).forEach(t => g.append('stop').attr('offset', t).attr('stop-color', interpolator(t)));
  s.append('rect').attr('width', w).attr('height', h).attr('rx', 3).attr('fill', `url(#${id})`).attr('stroke', '#e2d9c6');
  return s.node();
}
function cmapCat(colors) {
  const w = 240, h = 22, bw = w / colors.length;
  const s = d3.create('svg').attr('viewBox', `0 0 ${w} ${h}`).style('width', w + 'px').style('height', h + 'px');
  s.selectAll('rect').data(colors).join('rect')
    .attr('x', (d, i) => i * bw).attr('width', bw).attr('height', h).attr('fill', d => d);
  s.append('rect').attr('width', w).attr('height', h).attr('rx', 3).attr('fill', 'none').attr('stroke', '#e2d9c6');
  return s.node();
}

function initCmap() {
  const gal = document.getElementById('cmapGallery');
  const groups = [
    { k: 'sequential', maps: [['Viridis', d3.interpolateViridis], ['Cividis', d3.interpolateCividis], ['Blues', t => d3.interpolateBlues(t)], ['YlGnBu', d3.interpolateYlGnBu]] },
    { k: 'diverging', maps: [['RdBu', d3.interpolateRdBu], ['PuOr', d3.interpolatePuOr], ['BrBG', d3.interpolateBrBG], ['PRGn', d3.interpolatePRGn]] },
    { k: 'categorical', maps: [] }
  ];
  groups.forEach(g => {
    const info = COLORMAP_KINDS[g.k];
    const div = document.createElement('div'); div.style.marginBottom = '20px';
    div.innerHTML = `<h4 style="color:var(--cobalt);margin:0 0 4px">${info.cn}</h4>
      <p style="font-size:13px;color:var(--ink-soft);margin:0 0 10px"><b>适用：</b>${info.use}　<b>例：</b>${info.ex}　<b>禁忌：</b>${info.bad}</p>`;
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:18px;flex-wrap:wrap';
    if (g.k === 'categorical') {
      [['Okabe-Ito', PALETTES['okabe-ito'].colors], ['Tol Bright', PALETTES['tol-bright'].colors], ['Tableau 10', PALETTES['tableau10'].colors]].forEach(([n, c]) => {
        const item = document.createElement('div');
        item.innerHTML = `<div style="font-size:12px;margin-bottom:5px;color:var(--ink-2)">${n}</div>`;
        item.appendChild(cmapCat(c.slice(0, 8)));
        row.appendChild(item);
      });
    } else {
      g.maps.forEach(([n, f]) => {
        const item = document.createElement('div');
        item.innerHTML = `<div style="font-size:12px;margin-bottom:5px;color:var(--ink-2)">${n}</div>`;
        item.appendChild(cmapBar(f));
        row.appendChild(item);
      });
    }
    div.appendChild(row); gal.appendChild(div);
  });

  // 配对练习
  const quiz = [
    { s: '全国各省人口密度（越大越高）', a: 'sequential', why: '有方向的数值，单极点，用顺序色阶。' },
    { s: '各地气温与多年平均的差值（正负都有）', a: 'diverging', why: '围绕「平均值」这个有意义的中点向两侧发散。' },
    { s: '三种企鹅物种的分布', a: 'categorical', why: '物种之间无顺序，用色相区分。' },
    { s: '海拔高度（0–4000m）', a: 'sequential', why: '连续数值、单调递增，顺序色阶。' }
  ];
  const box = document.getElementById('cmapQuiz');
  const ans = new Array(quiz.length).fill(null);
  const kinds = ['sequential', 'diverging', 'categorical'];
  function renderQuiz() {
    box.innerHTML = '';
    quiz.forEach((q, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--line)';
      const ok = ans[i] === q.a;
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:14px">${q.s}</span>
          <span style="color:${ans[i] == null ? 'var(--ink-faint)' : ok ? 'var(--jade)' : 'var(--seal)'}">${ans[i] == null ? '○' : ok ? '✓' : '✗'}</span>
        </div>
        <div class="chips" style="margin-top:8px">
          ${kinds.map(k => `<button class="chip ${ans[i] === k ? 'on' : ''} ${ans[i] != null && k === q.a ? 'on' : ''}" data-k="${k}">${COLORMAP_KINDS[k].cn}</button>`).join('')}
        </div>
        ${ans[i] != null ? `<div style="margin-top:6px;font-size:13px;color:${ok ? 'var(--jade)' : 'var(--seal)'}">${ok ? '正确。' : '应选 <b>' + COLORMAP_KINDS[q.a].cn + '</b>。'} ${q.why}</div>` : ''}`;
      row.querySelectorAll('.chip').forEach(c => c.onclick = () => { ans[i] = c.dataset.k; renderQuiz(); });
      box.appendChild(row);
    });
    document.getElementById('cmapScore').textContent = `答对 ${ans.filter((a, i) => a === quiz[i].a).length} / ${quiz.length}`;
  }
  renderQuiz();
}

/* ════════ 3.3 Lab 色域 ════════ */
function initGamut() {
  // 预采样 sRGB 网格 → Lab
  const samples = [];
  const step = 0.12;
  for (let r = 0; r <= 1.001; r += step)
    for (let g = 0; g <= 1.001; g += step)
      for (let b = 0; b <= 1.001; b += step) {
        const lab = d3.lab(d3.rgb(r * 255, g * 255, b * 255));
        samples.push({ l: lab.l, a: lab.a, b: lab.b, hex: d3.rgb(r * 255, g * 255, b * 255).formatHex() });
      }

  const W = 560, H = 420, m = { t: 16, r: 16, b: 44, l: 48 };
  const s = d3.select('#gamutSvg').append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const x = d3.scaleLinear().domain([-110, 110]).range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([110, -110]).range([m.t, H - m.b]);
  const g = s.append('g').attr('transform', `translate(0,0)`);
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${y(0)})`).call(d3.axisBottom(x).ticks(6));
  g.append('g').attr('class', 'axis').attr('transform', `translate(${x(0)},0)`).call(d3.axisLeft(y).ticks(6));
  s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 8).attr('text-anchor', 'middle')
    .style('font-size', '11px').style('fill', '#7d7365').text('a*（绿 ←→ 红）');
  s.append('text').attr('x', 14).attr('y', (m.t + H - m.b) / 2).attr('text-anchor', 'middle')
    .attr('transform', `rotate(-90 14 ${(m.t + H - m.b) / 2})`)
    .style('font-size', '11px').style('fill', '#7d7365').text('b*（蓝 ←→ 黄）');
  const pts = g.append('g');

  const Lslider = document.getElementById('gamL');
  function render() {
    const L = +Lslider.value;
    document.getElementById('gamLv').textContent = 'L* = ' + L;
    const sel = samples.filter(p => Math.abs(p.l - L) <= 4);
    pts.selectAll('circle').data(sel, d => d.hex).join('circle')
      .attr('cx', d => x(d.a)).attr('cy', d => y(d.b)).attr('r', 2.6).attr('fill', d => d.hex).attr('opacity', .9);
    document.getElementById('gamStat').textContent =
      `L* = ${L} 处 sRGB 可显示 ${sel.length} 个采样点 · 该切片即此亮度下的色域截面`;
  }
  Lslider.addEventListener('input', render);
  render();
}

/* ════════ 3.4 色系搭配 ════════ */
const HARMONIES = {
  analogous: { cn: '同类色 / 邻近', offsets: [0, 30, -30], desc: '色相相近，柔和统一，适合同一主题下的渐变与分层。' },
  complementary: { cn: '互补色', offsets: [0, 180], desc: '对角相对，对比最强，适合「正 vs 负」「冷 vs 暖」两类对照。' },
  split: { cn: '分裂互补', offsets: [0, 150, 210], desc: '比互补更柔和的三色方案，一主两辅，层次丰富。' },
  triadic: { cn: '三角色', offsets: [0, 120, 240], desc: '三等分色相环，活泼均衡，适合三个并列类别。' },
  tetradic: { cn: '四角色', offsets: [0, 90, 180, 270], desc: '两对互补，信息量大，需控制主次避免杂乱。' }
};

function initHarmony() {
  const chips = document.getElementById('harmChips');
  let cur = 'triadic';
  Object.entries(HARMONIES).forEach(([k, v]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (k === cur ? ' on' : ''); b.textContent = v.cn;
    b.onclick = () => { cur = k; chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); render(); };
    chips.appendChild(b);
  });
  const W = 240, Hh = 240, cx = 120, cy = 120, R = 100;
  const s = d3.select('#wheelSvg').append('svg').attr('viewBox', `0 0 ${W} ${Hh}`).style('max-width', W + 'px');
  // 色相环
  const n = 48;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * 2 * Math.PI, a1 = (i + 1) / n * 2 * Math.PI;
    s.append('path').attr('d', d3.arc()({ innerRadius: R - 22, outerRadius: R - 4, startAngle: a0, endAngle: a1 }))
      .attr('transform', `translate(${cx},${cy})`).attr('fill', d3.hsl(i / n * 360, .72, .55));
  }
  const sel = s.append('g');
  const hInput = document.getElementById('harmH');

  function render() {
    const h = +hInput.value;
    const offs = HARMONIES[cur].offsets;
    document.getElementById('harmDesc').textContent = HARMONIES[cur].desc;
    sel.selectAll('*').remove();
    // 连线
    const pts = offs.map(o => {
      const a = ((h + o) % 360 + 360) % 360 / 360 * 2 * Math.PI - Math.PI / 2;
      return [cx + Math.cos(a) * (R - 13), cy + Math.sin(a) * (R - 13)];
    });
    if (pts.length > 2) sel.append('polygon').attr('points', pts.map(p => p.join(',')).join(' '))
      .attr('fill', 'none').attr('stroke', '#26221c').attr('stroke-width', 1).attr('stroke-dasharray', '3 3').attr('opacity', .55);
    pts.forEach((p, i) => {
      sel.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 8)
        .attr('fill', d3.hsl((h + offs[i] + 360) % 360, .6, .55)).attr('stroke', '#fff').attr('stroke-width', 2);
    });
    // 色板
    const sw = document.getElementById('harmSwatches');
    sw.innerHTML = '';
    offs.forEach(o => {
      const c = d3.hsl((h + o + 360) % 360, .6, .55).formatHex();
      const d = document.createElement('div');
      d.style.cssText = 'display:inline-block;text-align:center;margin-right:10px';
      d.innerHTML = `<div style="width:52px;height:38px;border-radius:4px;background:${c};border:1px solid var(--line-2)"></div><div style="font-size:11px;font-family:var(--mono);margin-top:4px">${c}</div>`;
      sw.appendChild(d);
    });
  }
  hInput.addEventListener('input', render);
  render();
}

/* ════════ 3.5 配色画廊 ════════ */
function initPalettes() {
  const gal = document.getElementById('palGallery');
  Object.entries(PALETTES).forEach(([key, p]) => {
    const div = document.createElement('div'); div.style.marginBottom = '18px';
    div.innerHTML = `<h4 style="margin:0 0 2px;color:var(--ink)">${p.name} <small style="color:var(--ink-faint);font-weight:400">${p.sub}</small></h4>
      <p style="font-size:12px;color:var(--ink-faint);margin:0 0 8px">${p.ref}</p>`;
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    p.colors.forEach(hex => {
      const d = document.createElement('div');
      d.style.cssText = `width:46px;height:46px;border-radius:4px;background:${hex};border:1px solid var(--line-2);cursor:pointer`;
      d.title = hex + '（点击复制）';
      d.onclick = async () => {
        try { await navigator.clipboard.writeText(hex); showTip('已复制 <b>' + hex + '</b>', d.getBoundingClientRect().left, d.getBoundingClientRect().top - 40); setTimeout(hideTip, 900); }
        catch { }
      };
      row.appendChild(d);
    });
    div.appendChild(row); gal.appendChild(div);
  });
}

/* ════════ 3.6 对错案例 ════════ */
function penguinBars(container, colors, title) {
  const data = d3.rollups(PENGUINS, v => d3.mean(v, d => d.body_mass_g), d => d.species)
    .sort((a, b) => a[1] - b[1]);
  const W = 340, H = 200, m = { t: 8, r: 12, b: 30, l: 92 };
  const s = d3.select(container).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d[1]) * 1.1]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(data.map(d => d[0])).range([m.t, H - m.b]).padding(0.3);
  s.selectAll('rect').data(data).join('rect')
    .attr('x', m.l).attr('y', d => y(d[0])).attr('width', d => x(d[1]) - m.l).attr('height', y.bandwidth())
    .attr('rx', 2).attr('fill', (d, i) => colors[i % colors.length]);
  s.selectAll('text.sp').data(data).join('text')
    .attr('x', m.l - 8).attr('y', d => y(d[0]) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end')
    .style('font-size', '11px').style('fill', '#4a4238').text(d => d[0]);
  s.selectAll('text.v').data(data).join('text')
    .attr('x', d => x(d[1]) + 5).attr('y', d => y(d[0]) + y.bandwidth() / 2 + 4)
    .style('font-size', '10px').style('fill', '#7d7365').style('font-family', 'var(--mono)')
    .text(d => Math.round(d[1]) + 'g');
}

function initPair() {
  penguinBars(document.getElementById('badChart'), ['#d62728', '#ff7f0e', '#ffbf00']);
  penguinBars(document.getElementById('goodChart'), ['#0072B2', '#E69F00', '#009E73']);
}

/* ════════ 3.7 低饱和生成器 ════════ */
function initGenerator() {
  const H = document.getElementById('genH'), S = document.getElementById('genS'), N = document.getElementById('genN');
  const out = document.getElementById('genSwatches');
  function render() {
    const h = +H.value, s = +S.value / 100, n = +N.value;
    out.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const l = 0.82 - (i / (n - 1)) * 0.52;  // 亮 → 深
      const c = d3.hsl(h, s, l).formatHex();
      const d = document.createElement('div');
      d.style.cssText = 'text-align:center;cursor:pointer';
      d.innerHTML = `<div style="width:70px;height:64px;border-radius:4px;background:${c};border:1px solid var(--line-2)"></div>
        <div style="font-size:11px;font-family:var(--mono);margin-top:4px">${c}</div>`;
      d.onclick = async () => { try { await navigator.clipboard.writeText(c); } catch { } };
      out.appendChild(d);
    }
    document.getElementById('genStat').textContent = `色相 ${h}° · 饱和度 ${Math.round(s * 100)}% · 亮度从 82% 渐降到 30% · 点击复制`;
  }
  [H, S, N].forEach(el => el.addEventListener('input', render));
  render();
}

/* ════════ 3.8 CVD 模拟 ════════ */
function initCVD() {
  const chips = document.getElementById('cvdChips');
  const palSel = document.getElementById('cvdPal');
  Object.keys(PALETTES).forEach(k => {
    const o = document.createElement('option'); o.value = k; o.textContent = PALETTES[k].name; palSel.appendChild(o);
  });
  palSel.value = 'okabe-ito';
  const types = [['none', '正常'], ['protanopia', '红色盲 Protan'], ['deuteranopia', '绿色盲 Deutan'], ['tritanopia', '蓝色盲 Tritan']];
  let cvd = 'none';
  types.forEach(([k, n]) => {
    const b = document.createElement('button'); b.className = 'chip' + (k === 'none' ? ' on' : ''); b.textContent = n;
    b.onclick = () => { cvd = k; chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); render(); };
    chips.appendChild(b);
  });
  palSel.onchange = render;

  const species = ['Adelie', 'Chinstrap', 'Gentoo'];
  function render() {
    const pal = PALETTES[palSel.value].colors;
    const sim = c => cvd === 'none' ? c : cvdSimulate(c, cvd, 1);
    const box = document.getElementById('cvdChart');
    box.innerHTML = '';
    const W = 660, H = 300, m = { t: 14, r: 14, b: 38, l: 46 };
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const x = d3.scaleLinear().domain(d3.extent(PENGUINS, d => d.bill_length_mm)).nice().range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain(d3.extent(PENGUINS, d => d.body_mass_g)).nice().range([H - m.b, m.t]);
    s.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6));
    s.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
    s.append('text').attr('x', (m.l + W - m.r) / 2).attr('y', H - 6).attr('text-anchor', 'middle').style('font-size', '11px').style('fill', '#7d7365').text('喙长 bill_length_mm');
    s.selectAll('circle').data(PENGUINS).join('circle')
      .attr('cx', d => x(d.bill_length_mm)).attr('cy', d => y(d.body_mass_g)).attr('r', 4)
      .attr('fill', d => sim(pal[species.indexOf(d.species) % pal.length]))
      .attr('fill-opacity', .8).attr('stroke', '#fff').attr('stroke-width', .5);
    // 图例
    const leg = s.append('g').attr('transform', `translate(${W - m.r - 150},${m.t + 6})`);
    species.forEach((sp, i) => {
      const yy = i * 20;
      leg.append('rect').attr('x', 0).attr('y', yy).attr('width', 12).attr('height', 12).attr('rx', 2)
        .attr('fill', sim(pal[i % pal.length])).attr('stroke', '#e2d9c6');
      leg.append('text').attr('x', 18).attr('y', yy + 10).style('font-size', '11px').style('fill', '#4a4238').text(sp);
    });
    document.getElementById('cvdStat').textContent =
      `配色：${PALETTES[palSel.value].name} · 视角：${types.find(t => t[0] === cvd)[1]} · 检查三个物种是否仍可区分`;
  }
  render();
}
