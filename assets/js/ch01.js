/* ═══════════════════════════════════════════════════════════════
   第一展厅 · 数据 —— 交互脚本
   ═══════════════════════════════════════════════════════════════ */

let STUDENTS = [];

U.students().then(d => {
  STUDENTS = d;
  initRowMap(); initDIKW(); initScales(); initQuiz(); initPipeline(); initJoin();
}).catch(e => {
  document.querySelectorAll('.demo-body').forEach(n => U.err(n, e.message));
});

/* ════════ 1.1 CSV → JS 对象 ════════ */
function initRowMap() {
  const sel = document.getElementById('rowSel');
  const parseDate = d3.timeParse('%Y-%m-%d');
  STUDENTS.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = `${d.id} · ${d.name}`; sel.appendChild(o);
  });
  const render = () => {
    const d = STUDENTS[+sel.value];
    const raw = `序号,name_unused\n${d.id},${d.name}`;
    // 还原一条「原始 CSV 文本」用于对照
    const rawLine = [
      d.id, d.name, d.gender,
      d3.timeFormat('%Y-%m-%d')(d.birthday), d.age, d.class, d.hometown, d.ethnic
    ].map(v => `"${v}"`).join(',');
    document.getElementById('rawOut').textContent =
      '序号,姓名,性别,生日,年龄,班级,籍贯,民族\n' + rawLine +
      '\n\n注意：所有值都带引号，typeof 全部是 "string"';
    const obj = {
      id: +d.id, name: d.name.trim(), gender: d.gender,
      birthday: parseDate(d3.timeFormat('%Y-%m-%d')(d.birthday)),
      age: +d.age, class: d.class.trim(),
      hometown: d.hometown.trim(), ethnic: d.ethnic.trim()
    };
    document.getElementById('objOut').textContent =
      JSON.stringify(obj, (k, v) => v instanceof Date ? `Date(${d3.timeFormat('%Y-%m-%d')(v)})` : v, 2);
    document.getElementById('typeNote').textContent =
      `age: ${typeof obj.age} · birthday: ${obj.birthday instanceof Date ? 'Date 对象' : '无效'} · class: ${JSON.stringify(obj.class)}（已 trim）`;
  };
  sel.onchange = render;
  document.getElementById('rowRand').onclick = () => {
    sel.value = Math.floor(Math.random() * STUDENTS.length); render();
  };
  render();
}

/* ════════ 1.2 DIKW 金字塔 ════════ */
const DIKW = [
  { k: 'W', cn: '智慧 Wisdom', en: 'Wisdom',
    q: '据此该做什么？', add: '加了「判断与行动」',
    ex: '新生中 17 岁者占 39%，且集中在数据科学1班 —— 据此为该班配置入学适应辅导。',
    col: '#8a6c26' },
  { k: 'K', cn: '知识 Knowledge', en: 'Knowledge',
    q: '为什么会这样？', add: '加了「关系与规律」',
    ex: '男女各 40 人（1:1）；17 岁学生 31 人，全部集中在两个软件工程班之外的数据科学1班。',
    col: '#b08d3f' },
  { k: 'I', cn: '信息 Information', en: 'Information',
    q: '谁、在何时、有多少？', add: '加了「上下文与汇总」',
    ex: '2025 级共 80 名新生，平均年龄 17.6 岁，来自 23 个省级行政区。',
    col: '#3f6b5a' },
  { k: 'D', cn: '数据 Data', en: 'Data',
    q: '（只是符号）', add: '—— 原始起点',
    ex: '张明, 男, 2007-08-15, 18, 软件工程1班, 山东青岛, 汉',
    col: '#1e3a6b' }
];

function initDIKW() {
  const W = 640, H = 260, box = document.getElementById('dikwSvg');
  const s = d3.select(box).append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const info = document.getElementById('dikwInfo');
  const topW = 150, botW = 470, bh = 46, x0 = (W - botW) / 2;
  DIKW.forEach((d, i) => {
    const w = topW + (botW - topW) * (i / (DIKW.length - 1));
    const x = (W - w) / 2, y = 16 + i * (bh + 8);
    const g = s.append('g').style('cursor', 'pointer')
      .on('click', () => select(i)).on('mouseenter', () => { if (cur !== i) g.select('rect').attr('stroke', '#b08d3f'); })
      .on('mouseleave', () => { if (cur !== i) g.select('rect').attr('stroke', '#e2d9c6'); });
    g.append('rect').attr('x', x).attr('y', y).attr('width', w).attr('height', bh)
      .attr('rx', 3).attr('fill', d.col).attr('fill-opacity', .10)
      .attr('stroke', '#e2d9c6').attr('stroke-width', 1);
    g.append('rect').attr('x', x).attr('y', y).attr('width', 4).attr('height', bh).attr('rx', 2).attr('fill', d.col);
    g.append('text').attr('x', x + 16).attr('y', y + 20).attr('font-size', 13)
      .attr('font-family', 'serif').attr('fill', '#26221c').text(d.cn);
    g.append('text').attr('x', x + 16).attr('y', y + 36).attr('font-size', 11).attr('fill', '#7d7365').text(d.q);
  });
  let cur = -1;
  function select(i) {
    cur = i; const d = DIKW[i];
    s.selectAll('g').select('rect').attr('stroke', (_, j) => j === i ? '#b08d3f' : '#e2d9c6')
      .attr('stroke-width', (_, j) => j === i ? 2 : 1)
      .attr('fill-opacity', (_, j) => j === i ? .20 : .08);
    info.innerHTML = `
      <div class="t">${d.cn} <small>${d.add}</small></div>
      <p><strong>要回答的问题：</strong>${d.q}</p>
      <p><strong>在新生数据里的例子：</strong>${d.ex}</p>`;
  }
  select(2);
}

/* ════════ 1.3 四尺度判定器 ════════ */
function initScales() {
  const chips = document.getElementById('scaleChips');
  const out = document.getElementById('scaleOut');
  const keys = ['nominal', 'ordinal', 'interval', 'ratio'];
  let cur = 'nominal';
  keys.forEach(k => {
    const b = document.createElement('button');
    b.className = 'chip' + (k === cur ? ' on' : ''); b.textContent = STEVENS[k].cn;
    b.onclick = () => { cur = k; chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); render(); };
    chips.appendChild(b);
  });
  function render() {
    const d = STEVENS[cur];
    out.innerHTML = `
      <div class="pair">
        <div class="side">
          <h5 style="color:var(--jade)">✓ 允许的操作与统计</h5>
          <ul style="margin:0 0 0 18px;font-size:14px">${d.ok.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
        <div class="side">
          <h5 style="color:var(--seal)">✗ 不允许（做了就是错的）</h5>
          <ul style="margin:0 0 0 18px;font-size:14px">${d.no.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="term" style="margin-top:14px">
        <div class="t">回答的问题 <small>${d.q}</small></div>
        <p><strong>典型例子：</strong>${d.ex}</p>
        <p><strong>推荐图形：</strong>${d.viz}</p>
      </div>`;
  }
  render();
}

/* ════════ 1.3 练习 ════════ */
const QUIZ = [
  { f: 'newstudent.csv · 性别', a: 'nominal', why: '只有「男 / 女」两类，无顺序，不能比较大小。' },
  { f: 'newstudent.csv · 年龄', a: 'ratio', why: '可以加减，也有绝对零点（0 岁有意义），可以说 18 岁是 9 岁的两倍。' },
  { f: 'newstudent.csv · 生日', a: 'interval', why: '可以算相差多少天，但「公元 0 年」不是绝对零点，不能说 2008 年是 2004 年的两倍。' },
  { f: 'newstudent.csv · 班级', a: 'nominal', why: '「软件工程1班」与「数据科学1班」只是不同类别，编号不代表大小。' },
  { f: 'penguins.csv · body_mass_g（体重/克）', a: 'ratio', why: '0 克是真实的零点，可以说 6000g 是 3000g 的两倍。' },
  { f: 'tips.csv · day（星期几）', a: 'ordinal', why: '星期有确定的先后顺序，但「周四 − 周二」没有数值意义，间隔也不一定是等距的。' }
];

function initQuiz() {
  const box = document.getElementById('quizBox');
  const score = document.getElementById('quizScore');
  const ans = new Array(QUIZ.length).fill(null);
  const keys = ['nominal', 'ordinal', 'interval', 'ratio'];
  function render() {
    box.innerHTML = '';
    QUIZ.forEach((q, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'padding:12px 0;border-bottom:1px solid var(--line)';
      const ok = ans[i] === q.a;
      row.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <code style="font-size:12.5px">${q.f}</code>
          <span style="font-size:18px;color:${ans[i] == null ? 'var(--ink-faint)' : ok ? 'var(--jade)' : 'var(--seal)'}">
            ${ans[i] == null ? '○' : ok ? '✓' : '✗'}</span>
        </div>
        <div class="chips" style="margin-top:8px">
          ${keys.map(k => `<button class="chip ${ans[i] === k ? 'on' : ''} ${ans[i] != null && k === q.a ? 'on' : ''}" data-k="${k}">${STEVENS[k].cn.split('（')[0]}</button>`).join('')}
        </div>
        <div style="margin-top:8px;font-size:13px;color:${ok ? 'var(--jade)' : 'var(--seal)'};${ans[i] == null ? 'display:none' : ''}">
          ${ans[i] == null ? '' : (ok ? '正确。' : `正确答案是 <b>${STEVENS[q.a].cn}</b>。`)} ${ans[i] != null ? q.why : ''}
        </div>`;
      row.querySelectorAll('.chip').forEach(c => c.onclick = () => { ans[i] = c.dataset.k; render(); });
      box.appendChild(row);
    });
    const n = ans.filter((a, i) => a === QUIZ[i].a).length;
    score.textContent = `答对 ${n} / ${QUIZ.length}`;
  }
  document.getElementById('quizReset').onclick = () => { ans.fill(null); render(); };
  render();
}

/* ════════ 1.4 变换流水线 ════════ */
const PIPE_STEPS = [
  { id: 'filter', t: '① filter · 只留成年人', f: d => d.filter(r => r.age >= 18) },
  { id: 'derive', t: '② map · 派生出生年份', f: d => d.map(r => ({ ...r, birthYear: r.birthday.getFullYear() })) },
  { id: 'sort', t: '③ sort · 按年龄降序', f: d => [...d].sort((a, b) => d3.descending(a.age, b.age)) },
  { id: 'slim', t: '④ map · 只保留三列', f: d => d.map(r => ({ name: r.name, age: r.age, cls: r.class, birthYear: r.birthYear ?? '—' })) }
];
const PIPE_TERM = [
  { id: 'raw', t: '明细表' },
  { id: 'group', t: '⑤ rollup · 按班级统计人数' },
  { id: 'bin', t: '⑤ bin · 年龄分箱' }
];

function initPipeline() {
  const ctl = document.getElementById('pipeCtl');
  const st = { filter: false, derive: false, sort: false, slim: true, term: 'raw' };
  PIPE_STEPS.filter(s => s.id !== 'slim').forEach(s => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="checkbox" data-s="${s.id}"> ${s.t}`;
    l.querySelector('input').onchange = e => { st[s.id] = e.target.checked; render(); };
    ctl.appendChild(l);
  });
  const sep = document.createElement('span'); sep.className = 'sep'; ctl.appendChild(sep);
  PIPE_TERM.forEach(t => {
    const b = document.createElement('button');
    b.className = 'chip' + (t.id === st.term ? ' on' : ''); b.textContent = t.t;
    b.onclick = () => { st.term = t.id; ctl.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on'); render(); };
    ctl.appendChild(b);
  });

  function render() {
    let rows = STUDENTS, chain = ['原始数据（80 条）'];
    PIPE_STEPS.forEach(s => {
      if (st[s.id] || s.id === 'slim') { rows = s.f(rows); chain.push(`${s.t.split(' · ')[1]} → ${rows.length} 条`); }
    });
    let table = rows;
    const flow = document.getElementById('pipeFlow');
    if (st.term === 'group') {
      const m = d3.rollups(rows, v => v.length, d => d.cls || d.class).sort((a, b) => b[1] - a[1]);
      table = m.map(([k, v]) => ({ '班级': k, '人数': v }));
      chain.push(`按班级聚合 → ${m.length} 组`);
    } else if (st.term === 'bin') {
      const bins = d3.bin().value(d => d.age).thresholds(4)(rows);
      table = bins.map(b => ({ '年龄区间': `${b.x0}–${b.x1}`, '人数': b.length }));
      chain.push(`年龄分箱 → ${bins.length} 箱`);
    }
    flow.innerHTML = chain.map((c, i) =>
      `<span style="font-size:12.5px;padding:3px 10px;border-radius:20px;background:${i === 0 ? 'var(--paper-2)' : 'var(--cobalt-soft)'};color:${i === 0 ? 'var(--ink-2)' : 'var(--cobalt)'};border:1px solid var(--line)">${c}</span>`
    ).join('<span style="color:var(--gold);margin:0 6px">›</span>');

    const cols = table.length ? Object.keys(table[0]) : [];
    document.getElementById('pipeTable').innerHTML =
      `<thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${
        table.slice(0, 30).map(r => `<tr>${cols.map(c => `<td>${r[c]}</td>`).join('')}</tr>`).join('')
      }${table.length > 30 ? `<tr><td colspan="${cols.length}" style="color:var(--ink-faint)">… 另有 ${table.length - 30} 行</td></tr>` : ''}</tbody>`;
    document.getElementById('pipeStat').textContent =
      `当前输出：${table.length} 行 × ${cols.length} 列 · 原始 80 条`;
  }
  render();
}

/* ════════ 1.5 Data-Join 三态 ════════ */
function initJoin() {
  const BATCHES = [
    { name: '全部新生', f: d => d },
    { name: '仅男生', f: d => d.filter(r => r.gender === '男') },
    { name: '仅女生', f: d => d.filter(r => r.gender === '女') },
    { name: '仅软件工程1班', f: d => d.filter(r => r.class === '软件工程1班') },
    { name: '仅数据科学1班', f: d => d.filter(r => r.class === '数据科学1班') },
    { name: '仅 17 岁', f: d => d.filter(r => r.age === 17) }
  ];
  const W = 660, H = 300, m = { t: 20, r: 14, b: 60, l: 40 };
  const svg = d3.select('#joinSvg').append('svg').attr('viewBox', `0 0 ${W} ${H}`).style('max-width', W + 'px');
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const g = svg.append('g').attr('transform', `translate(${m.l},${m.t})`);
  const prov = r => r.hometown.slice(0, 2);

  let bi = 0, data = [];
  const x = d3.scaleBand().padding(0.28).range([0, iw]);
  const y = d3.scaleLinear().range([ih, 0]);

  function pick(i) {
    const rows = BATCHES[i].f(STUDENTS);
    const m2 = d3.rollups(rows, v => v.length, prov).sort((a, b) => d3.descending(a[1], b[1])).slice(0, 9);
    return m2.map(([k, v]) => ({ key: k, value: v }));
  }

  function render(first) {
    data = pick(bi);
    const slow = document.getElementById('joinSlow').checked;
    const D = first ? 0 : (slow ? 900 : 550);
    x.domain(data.map(d => d.key));
    y.domain([0, d3.max(data, d => d.value)]);

    const t = svg.transition().duration(D);
    const gx = svg.selectAll('g.jx').data([0]).join(
      en => en.append('g').attr('class', 'jx axis').attr('transform', `translate(${m.l},${m.t + ih})`),
      up => up);
    gx.transition(t).call(d3.axisBottom(x)).selectAll('text').style('font-size', '10px');

    const bars = g.selectAll('g.bar').data(data, d => d.key);
    const cnt = { enter: 0, update: 0, exit: 0 };

    bars.exit().each(() => cnt.exit++).transition().duration(D)
      .select('rect').attr('y', ih).attr('height', 0).style('opacity', 0)
      .on('end', function () { d3.select(this.parentNode).remove(); });

    const en = bars.enter().append('g').attr('class', 'bar').each(() => cnt.enter++);
    en.append('rect').attr('x', d => x(d.key)).attr('width', x.bandwidth())
      .attr('y', ih).attr('height', 0).attr('rx', 2)
      .attr('fill', '#3f6b5a').style('opacity', 0);
    en.append('text').attr('x', d => x(d.key) + x.bandwidth() / 2).attr('y', ih - 4)
      .attr('text-anchor', 'middle').style('font-size', '10px').style('fill', '#4a4238')
      .style('opacity', 0).text(d => d.value);

    const all = en.merge(bars).each((d, i, n) => { if (!n[i].__new) cnt.update++; });
    en.each(function () { this.__new = true; });
    all.select('rect').transition().duration(D)
      .attr('x', d => x(d.key)).attr('width', x.bandwidth())
      .attr('y', d => y(d.value)).attr('height', d => ih - y(d.value))
      .attr('fill', (d, i, n) => {
        const el = n[i].parentNode;
        return el.__new ? '#3f6b5a' : '#1e3a6b';
      }).style('opacity', 1);
    all.select('text').transition().duration(D)
      .attr('x', d => x(d.key) + x.bandwidth() / 2)
      .attr('y', d => y(d.value) - 5).style('opacity', 1).text(d => d.value);

    document.getElementById('joinStat').textContent =
      `${BATCHES[bi].name} · 共 ${d3.sum(BATCHES[bi].f(STUDENTS), () => 1)} 人 ｜ enter ${cnt.enter} · update ${cnt.update} · exit ${cnt.exit}`;
  }

  document.getElementById('joinShuffle').onclick = () => { bi = (bi + 1) % BATCHES.length; render(false); };
  document.getElementById('joinSlow').onchange = () => { };
  render(true);
}
