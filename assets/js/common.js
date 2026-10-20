/* ═══════════════════════════════════════════════════════════════
   图学馆 · 公共脚本
   导航 / 目录高亮 / 滚动揭示 / 学习进度 / 代码复制 / 提示气泡
   ═══════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');

const SITE = {
  title: '图学馆',
  sub: '《可视化导论》交互讲义',
  chapters: [
    { n: '01', href: 'ch01.html', cn: '数据',           en: 'Data' },
    { n: '02', href: 'ch02.html', cn: '可视化流程',      en: 'Process' },
    { n: '03', href: 'ch03.html', cn: '色彩',           en: 'Color' },
    { n: '04', href: 'ch04.html', cn: '低维数据',        en: 'Low-Dim' },
    { n: '05', href: 'ch05.html', cn: '时序数据',        en: 'Time Series' }
  ]
};

/* ─────────── 学习进度（localStorage） ─────────── */
const Progress = {
  key: 'tuguan-progress-v1',
  read() { try { return JSON.parse(localStorage.getItem(this.key) || '{}'); } catch { return {}; } },
  write(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); } catch {} },
  set(id, on) { const o = this.read(); if (on) o[id] = 1; else delete o[id]; this.write(o); this.paint(); },
  has(id) { return !!this.read()[id]; },
  count() { return Object.keys(this.read()).length; },
  paint() {
    document.querySelectorAll('.donebox[data-sec]').forEach(b => {
      const on = this.has(b.dataset.sec);
      b.classList.toggle('on', on);
      const lb = b.querySelector('.lb');
      if (lb) lb.textContent = on ? '已学完' : '标记学完';
    });
    const chip = document.getElementById('progChip');
    if (chip) chip.querySelector('b').textContent = this.count();
    // 首页展厅卡标记
    document.querySelectorAll('.hall[data-hall]').forEach(h => {
      h.classList.toggle('done', this.has('ch' + h.dataset.hall));
    });
  }
};

/* ─────────── 门楣 + 页脚注入 ─────────── */
function buildChrome(active) {
  const cur = location.pathname.split('/').pop() || 'index.html';
  const navs = [
    { href: 'index.html', t: '门厅' },
    ...SITE.chapters.map(c => ({ href: c.href, t: c.cn })),
    { href: 'lab.html', t: '实验室' }
  ];
  const navHTML = navs.map(a =>
    `<a href="${a.href}" class="${a.href === cur ? 'on' : ''}">${a.t}</a>`).join('');

  const bar = document.createElement('div');
  bar.className = 'topbar';
  bar.innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="index.html">
        <span class="brand-seal">圖</span>
        <span class="brand-txt">
          <span class="brand-cn">${SITE.title}</span>
          <span class="brand-en">${SITE.sub}</span>
        </span>
      </a>
      <nav class="topnav">${navHTML}
        <span class="progress-chip" id="progChip" title="你已标记为「学完」的小节数">
          已学 <b>0</b> 节
        </span>
      </nav>
    </div>`;
  document.body.prepend(bar);

  const ft = document.createElement('footer');
  ft.innerHTML = `
    <div class="wrap">
      <div class="fgrid">
        <div>
          <h5>课程</h5>
          <p>《可视化导论》· 中国石油大学（华东）<br>授课教师：李昕<br>参考教材：陈为《数据可视化》</p>
        </div>
        <div>
          <h5>展厅</h5>
          <ul>
            ${SITE.chapters.map(c => `<li><a href="${c.href}">第 ${c.n} 展厅 · ${c.cn}</a></li>`).join('')}
            <li><a href="lab.html">实验室 · 交互工具集</a></li>
          </ul>
        </div>
        <div>
          <h5>技术</h5>
          <p>零依赖静态站点：HTML + CSS + ES Modules<br>D3.js v7（本地内置，离线可用）<br>无后端、无追踪、无外链请求</p>
        </div>
        <div>
          <h5>数据</h5>
          <p>全部数据均为真实公开数据集，随站内置于 <code>data/</code> 目录，每一处图表均标注来源。</p>
        </div>
      </div>
      <div class="fbottom">
        © 2026 图学馆 · 可视化导论交互讲义 · 为学习而设计
      </div>
    </div>`;
  document.body.appendChild(ft);

  // 返回顶部
  const tp = document.createElement('button');
  tp.className = 'totop'; tp.innerHTML = '↑'; tp.title = '回到顶部';
  tp.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(tp);
  window.addEventListener('scroll', () => tp.classList.toggle('on', scrollY > 500), { passive: true });

  Progress.paint();
}

/* ─────────── 目录滚动高亮 ─────────── */
function initTOC() {
  const links = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (!links.length) return;
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const targets = [...byId.keys()].map(id => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.classList.remove('on'));
        byId.get(e.target.id)?.classList.add('on');
      }
    });
  }, { rootMargin: '-70px 0px -68% 0px', threshold: 0 });
  targets.forEach(t => io.observe(t));
}

/* ─────────── 滚动揭示（带兜底） ─────────── */
let _revealedAll = false;
function initReveal() {
  if (!('IntersectionObserver' in window)) { _revealedAll = true; document.querySelectorAll('.rv').forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver((es, o) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: .04 });
  document.querySelectorAll('.rv:not(.in)').forEach(el => io.observe(el));
  // 兜底：1.6s 后仍未被观察到的元素一律显示，绝不留空白页
  setTimeout(() => {
    document.querySelectorAll('.rv:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 1.2) el.classList.add('in');
    });
  }, 1600);
}

/* ─────────── 提示气泡 ─────────── */
let tipEl = null;
function tip() {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'vtip'; document.body.appendChild(tipEl); }
  return tipEl;
}
function showTip(html, x, y) {
  const t = tip();
  t.innerHTML = html; t.classList.add('on');
  const pad = 14, w = t.offsetWidth, h = t.offsetHeight;
  let L = x + pad, T = y + pad;
  if (L + w > innerWidth - 8) L = x - w - pad;
  if (T + h > innerHeight - 8) T = y - h - pad;
  t.style.left = Math.max(8, L) + 'px'; t.style.top = Math.max(8, T) + 'px';
}
function hideTip() { tip().classList.remove('on'); }
function bindTip(sel) {
  document.querySelectorAll(sel || '[data-tip]').forEach(el => {
    el.addEventListener('mouseenter', e => showTip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener('mousemove', e => showTip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener('mouseleave', hideTip);
  });
}

/* ─────────── 代码复制 ─────────── */
function initCode() {
  document.querySelectorAll('.codebox').forEach(box => {
    const pre = box.querySelector('pre');
    if (!pre || box.querySelector('.cp')) return;
    const b = document.createElement('button');
    b.className = 'cp'; b.textContent = '复制';
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(pre.innerText); b.textContent = '已复制 ✓'; }
      catch { b.textContent = '请手动复制'; }
      setTimeout(() => b.textContent = '复制', 1600);
    };
    box.querySelector('.cb-head').appendChild(b);
  });
}

/* ─────────── 「标记学完」 ─────────── */
function initDone() {
  document.querySelectorAll('.donebox[data-sec]').forEach(b => {
    b.innerHTML = `<span class="box">✓</span><span class="lb">标记学完</span>`;
    b.onclick = () => Progress.set(b.dataset.sec, !Progress.has(b.dataset.sec));
  });
}

/* ─────────── 极简语法高亮（JS 片段） ─────────── */
function hl(src) {
  let s = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const stash = [];
  const keep = re => s = s.replace(re, m => { stash.push(m); return ` ${stash.length - 1} `; });
  s = s.replace(/(\/\/[^\n]*)/g, '<span class="cmt">$1</span>');
  s = s.replace(/('[^'\n]*'|"[^"\n]*"|`[^`]*`)/g, '<span class="str">$1</span>');
  s = s.replace(/\b(const|let|var|function|return|new|await|async|if|else|for|of|in|class|=>)\b/g, '<span class="kw">$1</span>');
  s = s.replace(/\b(d3|data|svg|selection)\b/g, '<span class="fn">$1</span>');
  s = s.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
  return s;
}

/* ─────────── 启动 ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  try { buildChrome(); } catch (e) { console.error('chrome', e); }
  initTOC(); initReveal(); initCode(); initDone(); bindTip();
  window.addEventListener('load', () => { initReveal(); });
});

/* ─────────── 通用小工具 ─────────── */
const U = {
  el(tag, attrs = {}, children = []) {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => c && e.appendChild(c));
    return e;
  },
  svg(w, h, cls = '') {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', `0 0 ${w} ${h}`);
    s.setAttribute('width', '100%');
    if (cls) s.setAttribute('class', cls);
    s.style.maxWidth = w + 'px';
    return s;
  },
  async csv(p) {
    const r = await fetch(p);
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return d3.csvParse(await r.text(), d3.autoType);
  },
  /* 新生数据：中文表头 → 英文字段（映射本身就是 1.1 节的教学点） */
  async students() {
    const raw = await this.csv('data/newstudent.csv');
    const p = d3.timeParse('%Y-%m-%d');
    return raw.map(d => ({
      id: +d['序号'], name: d['姓名'], gender: d['性别'],
      birthday: d['生日'] instanceof Date ? d['生日'] : p(d['生日']),
      age: +d['年龄'], class: d['班级'],
      hometown: d['籍贯'], ethnic: d['民族']
    }));
  },
  fmt(n, d = 1) { return n == null || isNaN(n) ? '—' : n.toFixed(d); },
  err(node, msg) {
    node.innerHTML = `<div class="loaderr">数据加载失败：${msg}<br><small>请用本地服务器打开（如 <code>python -m http.server</code>）</small></div>`;
  }
};
