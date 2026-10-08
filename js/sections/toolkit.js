// Toolkit: a bento of capability cards. Each card carries a small live preview of the capability
// that plays on hover or focus (or when scrolled into view on touch screens), reacts to the cursor
// with a restrained tilt and spotlight, and expands in place for the detail.
import { reducedMotion, finePointer, watchVisibility } from '../core/motion.js';

// Net revenue retention by signup cohort (rows) over months since signup (cols).
const COHORT = [
  ['Apr', [100, 104, 107, 111, 114, 118]],
  ['May', [100, 102, 106, 109, 112]],
  ['Jun', [100, 105, 108, 113]],
  ['Jul', [100, 103, 107]],
  ['Aug', [100, 101]],
  ['Sep', [100]],
];

function buildCohort(el) {
  if (!el) return;
  let html = '<span class="h"></span>' + [0, 1, 2, 3, 4, 5].map((m) => `<span class="h">M${m}</span>`).join('');
  COHORT.forEach(([label, row], r) => {
    html += `<span class="rl">${label}</span>`;
    for (let i = 0; i < 6; i++) {
      const v = row[i];
      html += v == null ? '<span></span>'
        : `<span class="cell" style="--a:${(0.12 + (v - 100) / 22).toFixed(2)};--k:${r + i}">${v}%</span>`;
    }
  });
  el.innerHTML = html;
}

// The message preview resolves its fields one after another, like a template rendering.
function tokens(card) {
  const toks = [...card.querySelectorAll('.tok')];
  if (!toks.length) return;
  let timers = [];
  new MutationObserver(() => {
    timers.forEach(clearTimeout);
    const on = card.classList.contains('play');
    timers = toks.map((t, i) => setTimeout(() => t.classList.toggle('on', on), on && !reducedMotion() ? 160 + i * 130 : 0));
  }).observe(card, { attributes: true, attributeFilter: ['class'] });
}

export function init(section) {
  buildCohort(section.querySelector('[data-cohort]'));
  const cards = [...section.querySelectorAll('.tk-card')];
  const fine = finePointer() && !reducedMotion();

  cards.forEach((card) => {
    tokens(card);
    const more = card.querySelector('.tk-more');
    const detail = card.querySelector('.tk-detail');
    more.addEventListener('click', () => {
      const open = more.getAttribute('aria-expanded') !== 'true';
      more.setAttribute('aria-expanded', String(open));
      card.classList.toggle('open', open);
      detail.toggleAttribute('inert', !open);
    });
    detail.setAttribute('inert', '');

    if (fine) {
      card.addEventListener('pointerenter', () => card.classList.add('play'));
      card.addEventListener('pointerleave', () => {
        card.classList.remove('play');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--hx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--hy', `${(y * 100).toFixed(1)}%`);
        // Wider cards tilt less, so every card moves the same visible distance at its edge.
        const k = 3.2 / Math.max(1, r.width / 380);
        card.style.setProperty('--ry', `${((x - 0.5) * k).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * k).toFixed(2)}deg`);
      });
    } else {
      // Touch: each preview plays once as it comes into view.
      watchVisibility(card, (v) => { if (v) card.classList.add('play'); }, '0px 0px -20% 0px', 0.5);
    }
    card.addEventListener('focusin', () => card.classList.add('play'));
  });
}
