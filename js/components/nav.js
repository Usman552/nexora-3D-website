// Navigation: glass state on scroll, hide on scroll-down, reading progress, active chapter, mobile menu.
import { onFrame } from '../core/scroll.js';

export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const btn = nav.querySelector('.menu-btn');
  const menu = document.getElementById('mobile-menu');
  const bar = nav.querySelector('.nav-progress i');
  let lastY = scrollY, lastP = -1;

  onFrame((y, vh) => {
    nav.classList.toggle('scrolled', y > 8);
    if (!nav.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > 480) nav.classList.add('hide');
      else if (y < lastY - 6) nav.classList.remove('hide');
    }
    lastY = y;
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    if (bar && Math.abs(p - lastP) > 0.0005) { lastP = p; bar.style.transform = `scaleX(${p.toFixed(4)})`; }
  });
  nav.addEventListener('focusin', () => nav.classList.remove('hide'));

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    nav.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a')?.focus();
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); }
  });

  // Mark the chapter currently under the middle of the viewport.
  const links = [...nav.querySelectorAll('.nav-links a')];
  const byId = new Map(links.map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((l) => l.removeAttribute('aria-current'));
      byId.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}
