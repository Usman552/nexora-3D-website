// Automation: Trigger → Condition → (yes | no branch) → Result, scrubbed by scroll.
// The condition really evaluates: the run takes one branch, the other dims out. A runner travels
// the taken path, each node logs its step, and the result moves by the amount this run is worth.
import { addScene } from '../core/scroll.js';
import { clamp, lerp, range, ease, reducedMotion, isCompact, onCompactChange, pauseOffscreen } from '../core/motion.js';
import { radioGroup } from '../ui/keyboard.js';
import { esc, money } from '../ui/format.js';

const SVG = 'http://www.w3.org/2000/svg';
// Node ids: t (trigger), c (condition), a1 a2 (yes branch), b1 b2 (no branch), r (result)
const EDGES = [['t', 'c'], ['c', 'a1'], ['a1', 'a2'], ['a2', 'r'], ['c', 'b1'], ['b1', 'b2'], ['b2', 'r']];
// Progress at which each node on the taken path activates: t, c, x1, x2, r
const AT = [0.05, 0.22, 0.42, 0.6, 0.78];

const FLOWS = {
  failed: {
    t: ['invoice.payment_failed', 'Brightwell Learning · $940'],
    c: ['Invoice under $5,000?', '$940'],
    yes: true,
    a1: ['Smart retry', 'Oct 10, 10:40 · when they usually pay'], a2: ['Card-update email', 'One-click link, no login'],
    b1: ['Pause dunning', 'Large invoice, handle by hand'], b2: ['Owner calls customer', 'Task for the account owner'],
    r: ['Recovered this month', 18420, 19360, money, 'Paid on retry 2. Done by hand, this is ~25 minutes of chasing.'],
    log: [['+0 ms', 'event.received', 'invoice.payment_failed · in_8812'], ['+4 ms', 'condition', '$940 < $5,000 → yes'], ['+36 ms', 'retry.scheduled', 'attempt 2 · Oct 10 10:40'], ['+104 ms', 'email.sent', 'finance@brightwell.edu'], ['+1.3 s', 'metrics.updated', 'recovered_mtd +$940']],
  },
  signup: {
    t: ['user.signed_up', 'Mosaic Labs · 3 seats'],
    c: ['Team larger than 20?', '3 seats'],
    yes: false,
    a1: ['Assign account exec', 'Round-robin by region'], a2: ['Book onboarding call', 'Calendar invite sent'],
    b1: ['Welcome email', 'Day 0, written for their plan'], b2: ['Self-serve onboarding', 'Five steps, tracked by usage'],
    r: ['Trials started this week', 214, 215, (n) => String(Math.round(n)), 'Small teams skip sales and go straight to self-serve.'],
    log: [['+0 ms', 'event.received', 'user.signed_up · mosaiclabs.dev'], ['+3 ms', 'condition', '3 seats > 20 → no'], ['+41 ms', 'email.sent', 'Day 0 → priya@mosaiclabs.dev'], ['+126 ms', 'flow.entered', 'Self-serve onboarding · step 1 of 5'], ['+1.4 s', 'metrics.updated', 'trials_this_week 214 → 215']],
  },
  trial: {
    t: ['trial_ends_in_3d', 'Orbitly · 14 active users'],
    c: ['Fit score ≥ 70?', 'scored 82'],
    yes: true,
    a1: ['Annual plan offer', 'Growth, 2 months free'], a2: ['CRM task', 'Call Thursday · Jun Okafor'],
    b1: ['Extend trial 7 days', 'More time to set up'], b2: ['Send setup guide', 'Their two unused features'],
    r: ['Expected conversions · Oct', 61, 62, (n) => String(Math.round(n)), 'The forecast moves the moment the score does.'],
    log: [['+0 ms', 'schedule.fired', 'trial_ends_in_3d · orbitly.app'], ['+58 ms', 'condition', 'fit 82 ≥ 70 → yes'], ['+121 ms', 'email.sent', 'Growth offer → leo@orbitly.app'], ['+139 ms', 'crm.task_created', 'HubSpot · due Oct 9'], ['+1.5 s', 'metrics.updated', 'expected_conversions_oct 61 → 62']],
  },
};
const KIND = { t: 'Trigger', c: 'Condition', a1: 'Action', a2: 'Action', b1: 'Action', b2: 'Action', r: 'Result' };
const ICON = {
  t: '<path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  c: '<path d="M12 3l9 9-9 9-9-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  x: '<path d="M4 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  r: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

export function init(section) {
  const canvas = section.querySelector('.wf-canvas');
  const wires = canvas.querySelector('.wf-wires');
  const runner = canvas.querySelector('.wf-runner');
  const log = section.querySelector('.wf-log');
  const result = section.querySelector('.wf-result');
  pauseOffscreen(section.querySelector('.sticky'));

  const nodes = {};
  for (const id of ['t', 'c', 'a1', 'a2', 'b1', 'b2', 'r']) {
    const n = document.createElement('div');
    n.className = `wf-n n-${id}`;
    n.dataset.n = id;
    canvas.appendChild(n);
    nodes[id] = n;
  }
  const wire = EDGES.map(([a, b]) => {
    const g = document.createElementNS(SVG, 'g');
    const base = document.createElementNS(SVG, 'path');
    const fill = document.createElementNS(SVG, 'path');
    base.setAttribute('class', 'w-base'); fill.setAttribute('class', 'w-fill');
    fill.setAttribute('pathLength', '1');
    g.append(base, fill);
    wires.appendChild(g);
    return { a, b, g, base, fill };
  });

  let key = 'failed', flow = FLOWS.failed, path = [], lastP = 0, logItems = [], valEl = null;

  function build() {
    flow = FLOWS[key];
    const taken = flow.yes ? ['a1', 'a2'] : ['b1', 'b2'];
    path = ['t', 'c', ...taken, 'r'];
    for (const id in nodes) {
      const n = nodes[id];
      const ic = id === 't' || id === 'c' || id === 'r' ? ICON[id] : ICON.x;
      let title, detail;
      if (id === 'r') { title = flow.r[0]; detail = 'Updated on every dashboard'; }
      else [title, detail] = flow[id];
      const ans = id === 'c' ? `<span class="wf-ans">${flow.yes ? 'Yes' : 'No'} · ${esc(flow.c[1])}</span>` : '';
      const branch = id === 'a1' ? '<span class="wf-br">yes</span>' : id === 'b1' ? '<span class="wf-br">no</span>' : '';
      n.innerHTML = `<span class="wf-orb"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg></span>
        <span class="wf-txt"><span class="wf-kind">${KIND[id]}${branch}</span><b>${esc(title)}</b><small>${esc(detail)}</small>${ans}</span>`;
      n.classList.toggle('off-path', !path.includes(id));
      n.classList.remove('active', 'done');
    }
    wire.forEach((w) => w.g.classList.toggle('off-path', !(path.includes(w.a) && path.includes(w.b) && path.indexOf(w.b) === path.indexOf(w.a) + 1)));
    log.innerHTML = flow.log.map(([t, ev, txt]) => `<li><span>${t}</span><span><b>${esc(ev)}</b> ${esc(txt)}</span></li>`).join('');
    logItems = [...log.children];
    const [label, , to, fmt, note] = flow.r;
    result.innerHTML = `<span class="label">${esc(label)}</span><div class="big"><strong data-val>${fmt(flow.r[1])}</strong><em data-d></em></div><p>${esc(note)}</p>`;
    valEl = result.querySelector('[data-val]');
    result.dataset.to = fmt(to);
    layout();
  }

  // Wires are measured from the nodes' layout boxes, so they follow any breakpoint.
  function layout() {
    const vertical = isCompact();
    const cr = canvas.getBoundingClientRect();
    if (!cr.width) return;
    wires.setAttribute('viewBox', `0 0 ${cr.width} ${cr.height}`);
    const box = (id) => { const r = nodes[id].querySelector('.wf-orb').getBoundingClientRect(); return { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height }; };
    for (const w of wire) {
      const A = box(w.a), B = box(w.b);
      let d;
      if (vertical) {
        const x1 = A.x + A.w / 2, y1 = A.y + A.h, x2 = B.x + B.w / 2, y2 = B.y;
        d = `M${x1} ${y1}L${x2} ${y2}`;
      } else {
        const x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x, y2 = B.y + B.h / 2;
        const mx = (x1 + x2) / 2;
        d = `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
      }
      w.base.setAttribute('d', d); w.fill.setAttribute('d', d);
      w.len = w.fill.getTotalLength();
    }
    render(lastP);
  }

  function render(p) {
    lastP = p;
    // Nodes and log follow the activation schedule.
    path.forEach((id, i) => {
      const on = p >= AT[i];
      const next = i < path.length - 1 ? p >= AT[i + 1] : p >= 0.92;
      nodes[id].classList.toggle('active', on && !next);
      nodes[id].classList.toggle('done', next);
    });
    canvas.classList.toggle('decided', p >= AT[1] + 0.05);
    logItems.forEach((li, i) => li.classList.toggle('on', p >= AT[i]));
    // Wires on the taken path fill as the runner passes; the runner sits on the current one.
    let rx = null, ry = null;
    for (let i = 0; i < path.length - 1; i++) {
      const w = wire.find((e) => e.a === path[i] && e.b === path[i + 1]);
      const t = ease.inOut(range(p, AT[i] + 0.03, AT[i + 1]));
      w.fill.style.strokeDashoffset = String(1 - t);
      if (t > 0 && t < 1 && w.len) { const pt = w.fill.getPointAtLength(w.len * t); rx = pt.x; ry = pt.y; }
    }
    runner.style.opacity = rx == null ? '0' : '1';
    if (rx != null) runner.style.transform = `translate(${rx.toFixed(1)}px,${ry.toFixed(1)}px)`;
    // Result counts up once the run arrives.
    const k = range(p, AT[4], AT[4] + 0.1);
    const [, from, to, fmt] = flow.r;
    if (valEl) valEl.textContent = fmt(lerp(from, to, ease.out(k)));
    result.classList.toggle('bumped', k >= 1);
  }

  radioGroup(section.querySelector('[role="radiogroup"]'), (btn) => { key = btn.dataset.flow; build(); });
  new ResizeObserver(() => layout()).observe(canvas);
  onCompactChange(() => layout());
  build();
  addScene(section, render, {
    map: (p) => (reducedMotion() ? (p < 0.5 ? clamp(p * 2 * 0.9) : 1) : clamp(p * 1.06)),
  });
}
