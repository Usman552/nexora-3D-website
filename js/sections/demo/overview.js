// Overview panel: KPIs, interactive revenue chart, live event feed.
// The feed is not decoration: each payment adds to today's revenue (the chart's last point grows),
// a failed payment adds an at-risk account, and its recovery takes it away again.
import { REVENUE, EVENTS, CUSTOMERS } from './data.js';
import { activeAutomations } from './store.js';
import { money, pct, shortDate, esc } from '../../ui/format.js';
import { reducedMotion, visibleInterval, countTo, bump, DUR } from '../../core/motion.js';

const VW = 600, VH = 200;
const RANGES = { '7D': 7, '30D': 30, '90D': 90 };
const TODAY_SO_FAR = 0.58; // it's mid-afternoon: today's bar is still filling

export function mountOverview(panel, store) {
  const series = REVENUE.map((p) => ({ ...p }));
  const last = series[series.length - 1];
  const todayFull = last.v;
  last.v = Math.round(todayFull * TODAY_SO_FAR);
  const atRisk = CUSTOMERS.filter((c) => c.health < 50);
  const risk = { n: atRisk.length, mrr: atRisk.reduce((s, c) => s + c.mrr, 0) };

  panel.innerHTML = `
    <div class="ph"><div><h3>Overview</h3><p>All revenue sources, one model · updated live</p></div></div>
    <div class="kpis">
      <div class="panel kpi"><span>Net revenue · <span data-rl>last 30 days</span></span><b data-k="rev">—</b><small data-k="revd">—</small></div>
      <div class="panel kpi"><span>MRR</span><b>$482,310</b><small class="up">+4.2% this month</small></div>
      <div class="panel kpi"><span>Active automations</span><b data-k="auto">—</b><small data-k="runs">—</small></div>
      <div class="panel kpi"><span>At-risk accounts</span><b data-k="risk">${risk.n}</b><small class="down" data-k="riskd">${money(risk.mrr)} MRR exposed</small></div>
    </div>
    <div class="ov-main">
      <section class="panel chart-card" aria-label="Net revenue chart">
        <div class="card-head"><h4>Net revenue per day</h4>
          <div class="seg-sm" role="group" aria-label="Chart range">
            ${Object.keys(RANGES).map((k) => `<button type="button" data-range="${k}" aria-pressed="${k === '30D'}">${k}</button>`).join('')}
          </div>
        </div>
        <div class="chart" tabindex="0" role="img" aria-roledescription="interactive chart">
          <div class="y-labels"></div>
          <svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none" aria-hidden="true">
            <g class="grid"></g>
            <g class="plot"><path class="area" fill="url(#area-g)"/><path class="ln"/></g>
          </svg>
          <span class="ndot" aria-hidden="true"></span>
          <div class="xhair"></div><div class="xdot"></div><div class="xtip"></div>
        </div>
        <div class="x-labels"></div>
      </section>
      <section class="panel feed-card" aria-label="Live events">
        <div class="card-head"><h4>Live events</h4><span class="live-dot">streaming</span></div>
        <ul class="feed"></ul>
      </section>
    </div>`;

  const $ = (s) => panel.querySelector(s);
  const chart = $('.chart'), grid = $('.grid'), plot = $('.plot'), area = $('.area'), line = $('.ln'), ndot = $('.ndot');
  const yl = $('.y-labels'), xl = $('.x-labels'), xhair = $('.xhair'), xdot = $('.xdot'), xtip = $('.xtip');
  const revEl = $('[data-k="rev"]');
  let data = [], lo = 0, hi = 1, idx = -1, key = '30D', revShown = 0;
  const yOf = (v) => (1 - (v - lo) / (hi - lo)) * VH;

  function paintLine() {
    const n = data.length;
    const x = (i) => (i / (n - 1)) * VW;
    const d = data.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${yOf(p.v).toFixed(1)}`).join('');
    line.setAttribute('d', d);
    area.setAttribute('d', `${d}L${VW} ${VH}L0 ${VH}Z`);
    ndot.style.top = (yOf(data[n - 1].v) / VH) * 100 + '%';
  }

  function totals() {
    const n = RANGES[key];
    const sum = data.reduce((s, p) => s + p.v, 0);
    const psum = series.slice(-2 * n, -n).reduce((s, p) => s + p.v, 0);
    return { sum, delta: ((sum - psum) / psum) * 100 };
  }

  function draw(k, animate = true) {
    key = k;
    const n = RANGES[k];
    data = series.slice(-n);
    const { sum, delta } = totals();
    $('[data-rl]').textContent = `last ${n} days`;
    revEl.textContent = money(sum); revShown = sum;
    const dEl = $('[data-k="revd"]');
    dEl.textContent = `${pct(delta)} vs prior ${n} days`;
    dEl.className = delta >= 0 ? 'up' : 'down';

    const vals = data.map((p) => p.v);
    lo = Math.floor((Math.min(...vals) * 0.8) / 1000) * 1000;
    hi = Math.ceil((Math.max(todayFull, ...vals) * 1.03) / 1000) * 1000;
    paintLine();

    const ticks = [0, 1, 2, 3].map((t) => lo + ((hi - lo) * t) / 3);
    grid.innerHTML = ticks.map((t) => `<line x1="0" x2="${VW}" y1="${yOf(t)}" y2="${yOf(t)}"/>`).join('');
    yl.innerHTML = ticks.map((t) => `<span style="top:${(yOf(t) / VH) * 100}%">$${(t / 1000).toFixed(0)}k</span>`).join('');
    const marks = [0, 0.25, 0.5, 0.75, 1].map((f) => data[Math.round(f * (n - 1))]);
    xl.innerHTML = marks.map((p, i) => `<span>${i === 4 ? 'Today' : shortDate(p.d)}</span>`).join('');
    chart.setAttribute('aria-label', `Net revenue per day, last ${n} days, from ${money(vals[0])} to ${money(vals[n - 1])} so far today. Use arrow keys to inspect days.`);

    if (animate && !reducedMotion()) { plot.classList.remove('draw'); void plot.getBBox(); plot.classList.add('draw'); }
    if (idx >= 0) show(Math.min(idx, n - 1));
  }

  function show(i) {
    idx = i;
    const p = data[i], n = data.length;
    const fx = (i / (n - 1)) * 100, fy = (yOf(p.v) / VH) * 100;
    xhair.style.left = fx + '%';
    xdot.style.left = fx + '%'; xdot.style.top = fy + '%';
    xtip.style.left = Math.min(88, Math.max(12, fx)) + '%';
    xtip.innerHTML = i === n - 1
      ? `<b>${money(p.v)}</b>Today so far`
      : `<b>${money(p.v)}</b>${shortDate(p.d)}, ${p.d.toLocaleDateString('en-US', { weekday: 'short' })}`;
    chart.classList.add('hover');
  }
  const hide = () => { idx = -1; chart.classList.remove('hover'); };
  const tried = () => panel.dispatchEvent(new CustomEvent('tried', { detail: 'chart', bubbles: true }));

  chart.addEventListener('pointermove', (e) => {
    const r = chart.getBoundingClientRect();
    show(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (data.length - 1)));
    tried();
  });
  chart.addEventListener('pointerleave', hide);
  chart.addEventListener('focus', () => show(data.length - 1));
  chart.addEventListener('blur', hide);
  chart.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    show(Math.max(0, Math.min(data.length - 1, (idx < 0 ? data.length - 1 : idx) + step)));
    tried();
  });

  const seg = panel.querySelector('.seg-sm');
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-range]');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    draw(b.dataset.range);
  });
  draw('30D', false);

  store.subscribe((s) => {
    const act = activeAutomations(s);
    $('[data-k="auto"]').textContent = `${act.length} of ${s.automations.length}`;
    $('[data-k="runs"]').textContent = `${act.reduce((n, a) => n + a.runs, 0).toLocaleString('en-US')} runs · 30 days`;
  });

  // An event's consequence on the numbers. Revenue stops growing once today reaches a normal full day.
  function apply(ev) {
    if (ev.kind === 'paid' || ev.kind === 'recovered') {
      if (last.v + ev.amt <= todayFull * 1.04) {
        last.v += ev.amt;
        paintLine();
        const { sum } = totals();
        countTo(revEl, revShown, sum, money, DUR.enter); revShown = sum;
        bump(revEl.parentElement);
        bump(ndot, 'ping');
        if (idx === data.length - 1) show(idx);
      }
    }
    if (ev.kind === 'failed' || ev.kind === 'recovered') {
      const s = ev.kind === 'failed' ? 1 : -1;
      risk.n += s; risk.mrr += s * ev.amt;
      $('[data-k="risk"]').textContent = String(risk.n);
      $('[data-k="riskd"]').textContent = `${money(risk.mrr)} MRR exposed`;
      bump($('[data-k="risk"]').parentElement);
    }
  }

  // Live feed
  const feed = $('.feed');
  const now = () => Date.now();
  let k = 0;
  const items = [4, 19, 47, 80, 130, 210, 300].map((age) => ({ ...EVENTS[k++ % EVENTS.length], t: now() - age * 1000 }));
  const age = (t) => { const s = Math.round((now() - t) / 1000); return s < 5 ? 'now' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`; };
  const li = (it, fresh) => `<li class="${fresh ? 'new' : ''}"><span class="dot" style="background:${it.c}"></span><span class="ev"><code>${esc(it.type)}</code><span>${esc(it.text)}</span></span><time>${age(it.t)}</time></li>`;
  const renderFeed = (fresh) => { feed.innerHTML = items.map((it, i) => li(it, fresh && i === 0)).join(''); };
  renderFeed(false);

  if (!reducedMotion()) {
    visibleInterval(feed, () => {
      if (panel.hidden) return;
      const ev = { ...EVENTS[k++ % EVENTS.length], t: now() };
      items.unshift(ev);
      items.length = 7;
      renderFeed(true);
      apply(ev);
    }, 3200);
  }
}
