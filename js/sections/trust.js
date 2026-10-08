// Reliability: live-ish latency sample, 90-day uptime strip, event freshness meter.
import { visibleInterval, reducedMotion } from '../core/motion.js';
import { seeded } from '../ui/format.js';

export function init(section) {
  // Uptime: 90 days, two degraded (not down) days.
  const bars = section.querySelector('[data-uptime]');
  const degraded = { 23: 'Aug 2: elevated API latency for 14 min', 61: 'Sep 9: delayed webhooks for 22 min' };
  bars.innerHTML = Array.from({ length: 90 }, (_, i) =>
    degraded[i] ? `<i class="deg" title="${degraded[i]}"></i>` : '<i title="Operational"></i>').join('');

  // Latency: a rolling one-minute sample.
  const rnd = seeded(7);
  const sample = () => (rnd() < 0.06 ? 70 + rnd() * 45 : 31 + rnd() * 16);
  const pts = Array.from({ length: 40 }, sample);
  const path = section.querySelector('.lat path.l');
  const p50 = section.querySelector('[data-p50]'), p99 = section.querySelector('[data-p99]');
  const draw = () => {
    const y = (v) => 84 - (Math.min(v, 120) / 120) * 80;
    path.setAttribute('d', pts.map((v, i) => `${i ? 'L' : 'M'}${((i / (pts.length - 1)) * 300).toFixed(1)} ${y(v).toFixed(1)}`).join(''));
    const s = [...pts].sort((a, b) => a - b);
    p50.textContent = `${Math.round(s[Math.floor(s.length * 0.5)])} ms`;
    p99.textContent = `${Math.round(Math.max(s[s.length - 1], 104))} ms`;
  };
  draw();

  // Freshness: time since the last event, which arrives every 0.3–1.6 s.
  const bar = section.querySelector('[data-fresh-bar]');
  const label = section.querySelector('[data-fresh]');
  let last = performance.now(), next = 900;
  const tick = () => {
    const t = performance.now() - last;
    if (t > next) { last = performance.now(); next = 300 + Math.random() * 1300; }
    const s = (performance.now() - last) / 1000;
    label.textContent = `${s.toFixed(1)}s`;
    bar.style.width = `${Math.min(100, (s / 2) * 100)}%`;
  };

  if (reducedMotion()) { label.textContent = '0.8s'; bar.style.width = '40%'; return; }
  visibleInterval(section.querySelector('.lat'), () => { pts.shift(); pts.push(sample()); draw(); }, 1500);
  visibleInterval(bar, tick, 100);
}
