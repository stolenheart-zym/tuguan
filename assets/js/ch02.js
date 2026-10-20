/* ═══════════════════════════════════════════════════════════════
   第二展厅 · 可视化流程 —— 交互脚本
   ═══════════════════════════════════════════════════════════════ */

let STUDENTS = [];
let HIER = null; // {name, children, value?}

U.students().then(d => {
  STUDENTS = d;
  initCard(); initRollup(); initTree(); initTreeList();
}).catch(e => document.querySelectorAll('.demo-body').forEach(n => U.err(n, e.message)));

/* ════════ 2.1 Card 数据流模型 ════════ */
const CARD_STAGES = [
  { id: 'value', cn: '数据值 Value', desc: '原始的数据项：一行 CSV、一个传感器读数。它们还没有结构。',
    err: '字段类型没转换、编码错乱、空值没处理。', tip: '先做数据质量检查（准确性/完整性/一致性/时效性）' },
  { id: 'analytical', cn: '分析抽象 Analytical', desc: '对数据做「业务上的整理」：过滤、聚合、派生新字段。产出一张「能回答问题的表」。',
    err: '聚合粒度选错（按日还是按月）、漏掉关键维度。', tip: '问问自己：读者要回答什么问题？粒度够不够？' },
  { id: 'visual', cn: '可视化抽象 Visual', desc: '决定「用什么视觉通道编码什么字段」：横轴放什么、纵轴放什么、颜色放什么。',
    err: '给无序类别用了顺序色阶、用面积编码定量数据。', tip: '参照 Mackinlay 排序：位置 > 长度 > 角度 > 面积…' },
  { id: 'view', cn: '视图 View', desc: '把抽象结构渲染成具体图形：坐标轴、图例、交互、动画。',
    err: '坐标轴刻度误导、图例缺失、元素遮挡。', tip: '检查标注是否完整、零基线是否被截断' },
  { id: 'human', cn: '人 Human', desc: '读者用感知系统读取视图，形成理解，并可能通过交互反向调整上游。',
    err: '读者的注意力、色觉差异、认知负荷。', tip: '用色盲模拟检查、控制信息密度' }
];

function initCard() {
  const W = 680, H = 190, box = document.getElementById('cardSvg');
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const info = document.getElementById('cardInfo');
  const cols = ['#1e3a6b', '#3f6b5a', '#b08d3f', '#a63a2e', '#7d7365'];
  const bw = 108, bh = 54, gap = (W - 40 - CARD_STAGES.length * bw) / (CARD_STAGES.length - 1), y = 46;
  let cur = 1;
  CARD_STAGES.forEach((d, i) => {
    const x = 20 + i * (bw + gap);
    const g = s.append('g').style('cursor', 'pointer').on('click', () => { cur = i; paint(); });
    g.append('rect').attr('x', x).attr('y', y).attr('width', bw).attr('height', bh)
      .attr('rx', 4).attr('fill', cols[i]).attr('fill-opacity', .12)
      .attr('stroke', '#e2d9c6').attr('class', 'card-stage');
    g.append('rect').attr('x', x).attr('y', y).attr('width', 4).attr('height', bh).attr('rx', 2).attr('fill', cols[i]);
    g.append('text').attr('x', x + bw / 2).attr('y', y + 25).attr('text-anchor', 'middle')
      .attr('font-size', 12.5).attr('font-family', 'serif').attr('fill', '#26221c')
      .text(d.cn.split(' ')[0]);
    g.append('text').attr('x', x + bw / 2).attr('y', y + 40).attr('text-anchor', 'middle')
      .attr('font-size', 9).attr('fill', '#a89e8d').text(d.cn.split(' ')[1] || '');
    if (i) {
      s.append('path').attr('d', `M${x - gap + 4} ${y + bh / 2} L${x - 6} ${y + bh / 2}`)
        .attr('stroke', '#b08d3f').attr('stroke-width', 1.2);
      s.append('path').attr('d', `M${x - 6} ${y + bh / 2} l-4 -3.4 v6.8 z`).attr('fill', '#b08d3f');
    }
  });
  // 反向回路
  s.append('path').attr('d', `M${W - 30} ${y + bh + 10} L${W - 30} ${y + bh + 30} L${30} ${y + bh + 30} L${30} ${y + bh + 12}`)
    .attr('stroke', '#1e3a6b').attr('stroke-width', 1).attr('stroke-dasharray', '4 4').attr('fill', 'none');
  s.append('path').attr('d', `M30 ${y + bh + 12} l-4 5 v-10 z`).attr('fill', '#1e3a6b');
  s.append('text').attr('x', W / 2).attr('y', y + bh + 24).attr('text-anchor', 'middle')
    .attr('font-size', 10).attr('fill', '#1e3a6b').text('感知反馈回路：人 → 交互 → 重新变换');

  function paint() {
    s.selectAll('.card-stage').attr('stroke-width', (d, i) => i === cur ? 2 : 1)
      .attr('stroke', (d, i) => i === cur ? cols[cur] : '#e2d9c6');
    const d = CARD_STAGES[cur];
    info.innerHTML = `
      <div class="t">${d.cn}</div>
      <p><strong>职责：</strong>${d.desc}</p>
      <p><strong>这里最容易出错：</strong>${d.err}</p>
      <p><strong>检查方法：</strong>${d.tip}</p>`;
  }
  paint();
}

/* ════════ 2.2 rollup 折叠 ════════ */
function buildTree(depth) {
  const keys = [d => d.class, d => d.gender, d => String(d.age) + ' 岁'].slice(0, depth);
  const map = d3.rollup(STUDENTS, v => v.length, ...keys);
  function toNode(m, name) {
    return {
      name,
      children: [...m.entries()].sort().map(([k, v]) => v instanceof Map ? toNode(v, k) : { name: k, value: v })
    };
  }
  return toNode(map, '全部新生');
}

function initRollup() {
  const out = document.getElementById('rollOut');
  const sketch = document.getElementById('rollSketch');
  let depth = 1;
  document.querySelectorAll('#s2 .chip[data-d]').forEach(b => b.onclick = () => {
    document.querySelectorAll('#s2 .chip[data-d]').forEach(c => c.classList.remove('on'));
    b.classList.add('on'); depth = +b.dataset.d; render();
  });

  function render() {
    const root = buildTree(depth);
    // 文本化嵌套 Map
    let txt = 'Map {\n';
    (function walk(node, pad) {
      node.children.forEach(c => {
        txt += pad + `  "${c.name}" → ` + (c.children ? 'Map {\n' : `${c.value} 人\n`);
        if (c.children) { walk(c, pad + '  '); txt += pad + '  }\n'; }
      });
    })(root, '');
    txt += '}';
    out.textContent = txt;

    // 草图
    sketch.innerHTML = '';
    const sw = 320, sh = 200;
    const s = d3.select(sketch).append('svg').attr('viewBox', `0 0 ${sw} ${sh}`).style('max-width', sw + 'px');
    const h = d3.hierarchy(root).sum(d => d.value);
    d3.tree().size([sh - 20, sw - 60])(h);
    const g = s.append('g').attr('transform', 'translate(30,10)');
    g.selectAll('path').data(h.links()).join('path')
      .attr('d', d3.linkHorizontal().x(d => d.y).y(d => d.x))
      .attr('stroke', '#d0c4aa').attr('fill', 'none');
    g.selectAll('circle').data(h.descendants()).join('circle')
      .attr('cx', d => d.y).attr('cy', d => d.x).attr('r', 4)
      .attr('fill', d => d.children ? '#b08d3f' : '#1e3a6b');
    g.selectAll('text').data(h.descendants()).join('text')
      .attr('x', d => d.y + 7).attr('y', d => d.x + 3).style('font-size', '8.5px').style('fill', '#7d7365')
      .text(d => d.data.name + (d.value != null && d.depth === depth ? '' : ''));
    const leaves = h.leaves().length;
    document.getElementById('rollStat').textContent = `深度 ${depth} 层 · 叶子 ${leaves} 个 · 总计 ${h.value} 人`;
  }
  render();
}

/* ════════ 2.3 Reingold-Tilford 树布局 ════════ */
function initTree() {
  const box = document.getElementById('treeSvg');
  let horizontal = false;
  document.getElementById('treeDir').onclick = () => { horizontal = !horizontal; document.getElementById('treeDir').textContent = horizontal ? '切换为垂直' : '切换为水平'; render(); };

  function render() {
    box.innerHTML = '';
    const root = d3.hierarchy(buildTree(3)).sum(d => d.value).sort((a, b) => b.value - a.value);
    const nodes = root.descendants();
    const W = 680, H = 460, pad = 30;
    if (horizontal) d3.tree().size([H - pad * 2, W - pad * 2 - 80])(root);
    else d3.tree().size([W - pad * 2, H - pad * 2 - 60])(root);
    const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
    const g = s.append('g').attr('transform', `translate(${pad},${pad})`);
    const link = horizontal ? d3.linkHorizontal().x(d => d.y).y(d => d.x) : d3.linkVertical().x(d => d.x).y(d => d.y);
    g.selectAll('path.link').data(root.links()).join('path')
      .attr('d', link).attr('stroke', '#d0c4aa').attr('fill', 'none').attr('stroke-width', 1);
    const node = g.selectAll('g.nd').data(nodes).join('g')
      .attr('transform', d => `translate(${horizontal ? d.y : d.x},${horizontal ? d.x : d.y})`)
      .style('cursor', 'default');
    node.append('circle').attr('r', d => d.depth === 0 ? 7 : 5)
      .attr('fill', d => d.children ? '#b08d3f' : '#1e3a6b')
      .attr('stroke', '#fff').attr('stroke-width', 1.5);
    node.append('text')
      .attr('dy', horizontal ? -8 : (d => d.children ? -10 : 14))
      .attr('x', horizontal ? 8 : 0)
      .attr('text-anchor', horizontal ? 'start' : 'middle')
      .style('font-size', '11px').style('fill', '#4a4238')
      .text(d => `${d.data.name} (${d.value})`);
    node.on('mouseenter', (e, d) => showTip(`<b>${d.ancestors().map(a => a.data.name).reverse().join(' › ')}</b><br>人数：${d.value} · 层级：${d.depth}`, e.clientX, e.clientY))
      .on('mousemove', e => showTip(`<b>${d.ancestors().map(a => a.data.name).reverse().join(' › ')}</b><br>人数：${d.value} · 层级：${d.depth}`, e.clientX, e.clientY))
      .on('mouseleave', hideTip);
    document.getElementById('treeStat').textContent = `节点 ${nodes.length} 个 · 最大深度 ${d3.max(nodes, n => n.depth)} 层 · 布局：Reingold-Tilford（d3.tree）`;
  }
  render();
}

/* ════════ 2.4 树形列表 ════════ */
function initTreeList() {
  const box = document.getElementById('treeList');
  const stat = document.getElementById('listStat');
  const root = d3.hierarchy(buildTree(3)).sum(d => d.value).sort((a, b) => b.value - a.value);
  root.descendants().forEach(d => { d.open = d.depth < 1; d.path = d.ancestors().map(a => a.data.name).reverse().join('/'); });
  let selected = null;

  const container = document.createElement('div');
  container.style.cssText = 'font-size:14px;user-select:none';
  box.appendChild(container);

  // 唯一监听器（事件委托）
  container.addEventListener('click', e => {
    const tg = e.target.closest('.toggle');
    const row = e.target.closest('.trow');
    if (tg) {
      const n = byPath(tg.dataset.path);
      if (n) { n.open = !n.open; render(); }
      return;
    }
    if (row) { selected = row.dataset.path; render(); }
  });

  function byPath(p) { return root.descendants().find(d => d.path === p); }

  function render() {
    container.innerHTML = '';
    let visible = 0;
    (function walk(node) {
      const isLeaf = !node.children;
      const show = node.depth === 0 || node.parent.open;
      if (!show) return;
      visible++;
      const row = document.createElement('div');
      row.className = 'trow';
      row.dataset.path = node.path;
      const sel = selected === node.path;
      row.style.cssText = `display:flex;align-items:center;gap:8px;padding:5px 10px 5px ${10 + node.depth * 22}px;
        border-radius:3px;cursor:pointer;background:${sel ? 'var(--cobalt-soft)' : 'transparent'};border:1px solid ${sel ? '#cdd9ee' : 'transparent'}`;
      const tog = document.createElement('span');
      tog.className = 'toggle'; tog.dataset.path = node.path;
      tog.style.cssText = `width:16px;text-align:center;color:${isLeaf ? 'transparent' : 'var(--gold-deep)'};font-size:11px;cursor:pointer;transition:transform .2s;display:inline-block;transform:rotate(${node.open ? 90 : 0}deg)`;
      tog.textContent = '▶';
      const name = document.createElement('span');
      name.innerHTML = `<b style="color:${node.depth === 0 ? 'var(--cobalt)' : 'var(--ink)'}">${node.data.name}</b>`;
      const cnt = document.createElement('span');
      cnt.style.cssText = 'margin-left:auto;font-family:var(--mono);font-size:12px;color:var(--ink-soft)';
      cnt.textContent = node.value + ' 人';
      const bar = document.createElement('span');
      bar.style.cssText = `width:${Math.round(node.value / 80 * 90)}px;height:5px;background:${isLeaf ? '#1e3a6b' : '#b08d3f'};border-radius:3px;opacity:.55`;
      row.append(tog, name, bar, cnt);
      container.appendChild(row);
      if (node.children && node.open) node.children.forEach(walk);
    })(root);
    const selNode = selected ? byPath(selected) : null;
    stat.textContent = `当前选中：${selNode ? selNode.path + '（' + selNode.value + ' 人）' : '无'} · 可见节点 ${visible} 个 · 监听器数量：1（事件委托）`;
  }
  document.getElementById('treeExpand').onclick = () => { root.descendants().forEach(d => d.open = true); render(); };
  document.getElementById('treeCollapse').onclick = () => { root.descendants().forEach(d => d.open = false); root.open = true; render(); };
  render();
}
