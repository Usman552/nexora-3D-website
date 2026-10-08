// Code splitting: load a section's module when the reader approaches it, and run its init in an
// idle slot so a heavy setup never lands in the middle of a scrolling frame.
const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 400 }) : (fn) => setTimeout(fn, 60);

export function whenNear(selector, loader, rootMargin = '1400px 0px') {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    idle(() => Promise.resolve(loader(el)).catch((err) => console.error('[nexora] section failed to load', err)));
  }, { rootMargin });
  io.observe(el);
}
