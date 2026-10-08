// Staggered entrance for content below the fold.
// Elements start visible; only those still off-screen at load are hidden, then revealed once.
import { reducedMotion } from './motion.js';

export function initReveals() {
  if (reducedMotion()) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.remove('pre');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });

  for (const el of document.querySelectorAll('[data-reveal]')) {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.classList.add('pre');
      io.observe(el);
    }
  }
}
