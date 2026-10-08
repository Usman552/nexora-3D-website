// Customer journey: one customer (Mosaic Labs) scrubbed through five stages by scroll.
// Signup → Onboarding → Message → Conversion → Analytics.
// Everything is a pure function of progress, so scrolling back plays it in reverse exactly.
import { addScene } from '../core/scroll.js';
import { clamp, lerp, range, ease, reducedMotion, pauseOffscreen } from '../core/motion.js';
import { money } from '../ui/format.js';

const N = 5;
const CLOCK = [
  () => 'Day 0 · 09:14',
  (s) => `Day ${Math.round(lerp(0, 4, range(s, 0.15, 0.75)))} · onboarding`,
  (s) => (s < 0.74 ? 'Day 9 · 09:00' : 'Day 9 · 09:04'),
  () => 'Day 12 · 14:32',
  () => 'Day 12 · 14:32 + 2 s',
];

export function init(section) {
  const panes = [...section.querySelectorAll('.jr-pane')];
  const stages = [...section.querySelectorAll('.jr-stages li')];
  const stops = [...section.querySelectorAll('.jr-track li')];
  const track = section.querySelector('.jr-track');
  const clock = section.querySelector('[data-clock]');
  const at = panes.map((p) => [...p.querySelectorAll('[data-at]')].map((el) => [el, +el.dataset.at]));
  const q = (s) => section.querySelector(s);
  const merge = q('.jp-merge'), score = q('[data-score]'), scoreBox = q('.jp-score');
  const plan = q('.jp-plan'), mrr = q('[data-mrr]');
  const conv = q('[data-conv]'), convD = q('[data-conv-d]'), bars = q('.jp-bars');
  pauseOffscreen(section.querySelector('.sticky'));

  let stage = -1, lastClock = '';

  function setStage(i) {
    stage = i;
    panes.forEach((p, k) => { p.classList.toggle('is-active', k === i); p.classList.toggle('is-past', k < i); });
    stages.forEach((li, k) => { li.classList.toggle('is-active', k === i); li.classList.toggle('is-past', k < i); });
    stops.forEach((li, k) => li.classList.toggle('on', k <= i));
    // Panes we've left show their finished state; panes ahead are reset.
    at.forEach((list, k) => { if (k !== i) list.forEach(([el]) => el.classList.toggle('on', k < i)); });
    for (let k = 0; k < N; k++) if (k !== i) paintPane(k, k < i ? 1 : 0);
  }

  function paintPane(k, s) {
    if (k === 0) merge.style.setProperty('--m', ease.inOut(range(s, 0.45, 0.82)).toFixed(3));
    if (k === 1) {
      const v = Math.round(78 * range(s, 0.12, 0.8));
      score.textContent = String(v);
      scoreBox.style.setProperty('--sc', (v / 100).toFixed(3));
    }
    if (k === 3) {
      plan.classList.toggle('to', s > 0.12);
      plan.classList.toggle('paid', s > 0.28);
      mrr.textContent = money(482310 + 189 * ease.out(range(s, 0.42, 0.56)));
    }
    if (k === 4) {
      const t = ease.out(range(s, 0.12, 0.42));
      conv.textContent = lerp(30.8, 31.2, t).toFixed(1) + '%';
      convD.textContent = t > 0.5 ? '63 of 202 trials · +1 Mosaic Labs' : '62 of 201 trials';
      bars.style.setProperty('--g', ease.out(range(s, 0, 0.35)).toFixed(3));
      bars.classList.toggle('lit', s > 0.45);
    }
  }

  function render(p) {
    const x = clamp(p) * N;
    const i = Math.min(N - 1, Math.floor(x));
    const s = i === N - 1 ? clamp((x - i) / 0.9) : x - i;
    if (i !== stage) setStage(i);
    for (const [el, t] of at[i]) el.classList.toggle('on', s >= t);
    paintPane(i, s);
    stages[i].style.setProperty('--f', s.toFixed(3));
    // The puck rests on a stop for most of a stage, then travels to the next one.
    const pos = Math.min(N - 1, i + ease.inOut(range(s, 0.84, 1))) / (N - 1);
    track.style.setProperty('--x', pos.toFixed(4));
    const c = CLOCK[i](s);
    if (c !== lastClock) { lastClock = c; clock.textContent = c; }
  }

  addScene(section, render, {
    // Reduced motion: show each stage in its finished state, one per scroll step.
    map: (p) => (reducedMotion() ? Math.min(0.999, (Math.floor(p * N) + 0.92) / N) : p),
  });
}
