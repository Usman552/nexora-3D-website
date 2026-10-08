// Hero: a live miniature of the product. Firing an event shows the core idea in one beat:
// the source lights up, the event lands in the stream, the right KPI moves by the real amount,
// the matching automation runs, and a receipt says how many tools heard about it and how fast.
// It auto-plays a few events, then hands control to the reader ("your turn").
import { addScene } from '../core/scroll.js';
import { reducedMotion, finePointer, lerp, wait, countTo, bump, DUR, watchVisibility } from '../core/motion.js';
import { money, esc } from '../ui/format.js';

const EVENTS = {
  upgrade: {
    label: 'Seat upgrade', src: ['billing', 'crm'], kpi: 'mrr', color: 'var(--cyan)', type: 'seats.updated',
    flow: 'Expansion signal → CRM', steps: ['Seats > 90%', 'Score account', 'CRM opportunity', 'Owner pinged'],
    variants: [
      { who: 'Halden Studio', detail: '9 → 12 seats', amt: 54, today: 41 },
      { who: 'Lumen Health', detail: '58 → 64 seats', amt: 108, today: 86 },
      { who: 'Tidewater Finance', detail: '31 → 35 seats', amt: 72, today: 55 },
    ],
    say: (v) => `${v.who} added seats: MRR +${money(v.amt)}, a CRM opportunity opened and the owner was pinged.`,
  },
  failed: {
    label: 'Payment fails', src: ['billing', 'auto'], kpi: 'rec', color: 'var(--bad)', type: 'invoice.payment_failed',
    flow: 'Failed payment recovery', steps: ['Payment fails', 'Smart retry', 'Card update email', 'Recovered'],
    after: { type: 'payment.recovered', color: 'var(--good)' },
    variants: [
      { who: 'Brightwell Learning', detail: '$940 · card declined', amt: 940, today: 940 },
      { who: 'Parcel & Pine', detail: '$189 · card expired', amt: 189, today: 189 },
      { who: 'Orbitly', detail: '$1,890 · insufficient funds', amt: 1890, today: 1890 },
    ],
    say: (v) => `${v.who}'s payment failed and was recovered on a smart retry: ${money(v.amt)} back, no one had to chase it.`,
  },
  signup: {
    label: 'New signup', src: ['product', 'crm', 'inbox'], kpi: 'trials', color: 'var(--good)', type: 'user.signed_up',
    flow: 'Onboarding sequence', steps: ['Sign up', 'Profile unified', 'Welcome email', 'Day 3 tips queued'],
    variants: [
      { who: 'Mosaic Labs', detail: '3 seats · Growth trial', amt: 1 },
      { who: 'Copperline Media', detail: '5 seats · Growth trial', amt: 1 },
      { who: 'Fernway Studio', detail: '2 seats · Launch trial', amt: 1 },
    ],
    say: (v) => `${v.who} signed up: one profile created across product, CRM and inbox, and onboarding started.`,
  },
};
const ORDER = ['upgrade', 'failed', 'signup'];
const fmtK = (n) => '$' + (n / 1000).toFixed(1) + 'k';

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const scene = addScene(hero, null, { map: (p) => (reducedMotion() ? 0 : p) });

  const rig = hero.querySelector('#hero-rig');
  const base = rig.querySelector('.l-base');
  const $ = (s) => rig.querySelector(s);
  const kpi = { mrr: $('[data-kpi="mrr"]'), trials: $('[data-kpi="trials"]'), rec: $('[data-kpi="rec"]') };
  const delta = { mrr: $('[data-delta="mrr"]'), trials: $('[data-delta="trials"]'), rec: $('[data-delta="rec"]') };
  const today = $('[data-today]');
  const feed = $('.l-feed ul');
  const flow = $('.l-flow'), flowName = flow.querySelector('b'), flowSteps = [...flow.querySelectorAll('.steps i')], flowNote = flow.querySelector('small');
  const receipt = $('.l-receipt');
  const packet = $('.packet');
  const endDot = $('.b-now');
  const fire = hero.querySelector('.fire');
  const mode = fire.querySelector('.fire-mode');
  const status = hero.querySelector('.fire-status');
  const buttons = [...fire.querySelectorAll('[data-ev]')];

  const state = { mrr: 482310, trials: 214, rec: 18420, today: 16482 };
  const turn = { upgrade: 0, failed: 0, signup: 0 };
  let busy = false, auto = !reducedMotion(), autoIdx = 0, visible = true, run = 0;

  const fmt = { mrr: money, trials: (n) => String(Math.round(n)), rec: fmtK };

  function pushFeed(type, text, color) {
    const li = document.createElement('li');
    li.className = 'in';
    li.innerHTML = `<code style="color:${color}">${esc(type)}</code><span>${esc(text)}</span>`;
    feed.prepend(li);
    while (feed.children.length > 3) feed.lastElementChild.remove();
  }

  // Glowing packet from the source chip to the KPI it changes. Positions are layout offsets inside
  // the base card, so they stay correct under the rig's 3D transform.
  function sendPacket(fromEl, toEl, color) {
    if (reducedMotion() || !fromEl || !toEl) return Promise.resolve();
    const b = base.getBoundingClientRect();
    const off = (el) => { let x = 0, y = 0; for (let n = el; n && n !== base; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; } return [x, y]; };
    const [fx, fy] = off(fromEl), [tx, ty] = off(toEl);
    const x0 = fx + fromEl.offsetWidth / 2, y0 = fy + fromEl.offsetHeight / 2;
    const x1 = tx + toEl.offsetWidth / 2, y1 = ty + toEl.offsetHeight - 4;
    if (!b.width) return Promise.resolve();
    packet.style.setProperty('--c', color);
    const a = packet.animate([
      { transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 0 },
      { transform: `translate(${x0}px,${y0 - 10}px) scale(1)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${x1}px,${y1}px) scale(1)`, opacity: 1, offset: 0.85 },
      { transform: `translate(${x1}px,${y1}px) scale(2.2)`, opacity: 0 },
    ], { duration: 620, easing: 'cubic-bezier(.65,0,.35,1)' });
    return a.finished.catch(() => {});
  }

  async function play(key, fromUser) {
    if (busy) return;
    busy = true;
    const id = ++run;
    const ev = EVENTS[key];
    const v = ev.variants[turn[key]++ % ev.variants.length];
    const fast = reducedMotion();
    const t0 = performance.now();
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ev === key)));
    rig.classList.add('firing');
    receipt.classList.remove('show');

    // 1. Sources light up.
    const chips = ev.src.map((s) => $(`.b-src [data-src="${s}"]`));
    chips.forEach((c, i) => setTimeout(() => c?.classList.add('hot'), i * 90));
    // 2. The event lands in the stream.
    pushFeed(ev.type, `${v.who} · ${v.detail}`, ev.color);
    // 3. A packet carries it to the number it changes.
    await sendPacket(chips[0], kpi[ev.kpi].parentElement, ev.color);
    if (id !== run) return;
    const from = state[ev.kpi];
    state[ev.kpi] += v.amt;
    countTo(kpi[ev.kpi], from, state[ev.kpi], fmt[ev.kpi], DUR.enter);
    bump(kpi[ev.kpi].parentElement);
    delta[ev.kpi].textContent = ev.kpi === 'trials' ? '+1 trial' : `+${money(v.amt)}`;
    bump(delta[ev.kpi], 'pop');
    if (v.today) {
      const t = state.today; state.today += v.today;
      countTo(today, t, state.today, money, DUR.enter);
      bump(endDot, 'ping');
    }
    // 4. The automation that cares about this event runs, step by step.
    flow.classList.add('swap');
    flowName.textContent = ev.flow;
    flowSteps.forEach((s) => s.className = '');
    for (let i = 0; i < flowSteps.length; i++) {
      flowSteps[i].className = 'cur';
      flowNote.textContent = `Step ${i + 1} of ${flowSteps.length} · ${ev.steps[i]}`;
      await wait(fast ? 0 : 230);
      if (id !== run) return;
      flowSteps[i].className = 'on';
    }
    flowNote.textContent = key === 'failed' ? `Done · ${money(v.amt)} recovered` : 'Done · all steps complete';
    if (ev.after) pushFeed(ev.after.type, `${v.who} · ${money(v.amt)} on retry 2`, ev.after.color);
    flow.classList.remove('swap');
    // 5. Receipt: how many tools, how fast. Real elapsed time of this choreography, so it never lies.
    const ms = Math.round(performance.now() - t0);
    receipt.querySelector('b').textContent = 'All 5 tools in sync';
    receipt.querySelector('span').textContent = `in ${(ms / 1000).toFixed(1)} s`;
    receipt.classList.add('show');
    status.textContent = ev.say(v);
    chips.forEach((c) => c?.classList.remove('hot'));
    rig.classList.remove('firing');
    busy = false;
  }

  fire.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ev]');
    if (!b) return;
    if (auto) { auto = false; mode.textContent = 'Your turn'; fire.classList.add('manual'); }
    if (busy) { run++; busy = false; rig.classList.remove('firing'); rig.querySelectorAll('.hot').forEach((c) => c.classList.remove('hot')); }
    play(b.dataset.ev, true);
  });

  // Auto-demo: one event every few seconds while the hero is on screen and near the top.
  watchVisibility(hero.querySelector('.sticky'), (v) => { visible = v; });
  const loop = async () => {
    await wait(1400);
    while (auto) {
      if (visible && scene.progress < 0.25 && !document.hidden && !busy) await play(ORDER[autoIdx++ % ORDER.length], false);
      await wait(3600);
    }
  };
  if (auto) loop();

  // Pointer parallax on the rig.
  if (!finePointer() || reducedMotion()) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const tick = () => {
    cx = lerp(cx, tx, 0.08);
    cy = lerp(cy, ty, 0.08);
    hero.style.setProperty('--mx', cx.toFixed(3));
    hero.style.setProperty('--my', cy.toFixed(3));
    raf = Math.abs(cx - tx) + Math.abs(cy - ty) > 0.002 ? requestAnimationFrame(tick) : 0;
  };
  hero.addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(tick);
  });
  hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
}
