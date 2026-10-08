// Scroll choreography engine.
// Each registered element gets one progress value (0..1) written to a CSS variable (default --p).
// CSS does the transforms; JS computes one number per active element per frame.
//
// Progress eases toward the scroll position with frame-rate independent damping, so a mouse
// wheel's discrete steps turn into continuous motion instead of jumps. Geometry is cached and
// re-measured only when the page resizes, so frames never read layout.
import { clamp, reducedMotion } from './motion.js';

const items = new Set();
const frameFns = new Set();
const TAU = 70; // ms. Follow time constant: settles in ~3τ, short enough to never feel laggy.
let raf = 0, last = 0, vh = innerHeight;

function measure() {
  vh = innerHeight;
  const y = scrollY;
  for (const s of items) {
    const r = s.el.getBoundingClientRect();
    s.top = r.top + y;
    s.height = r.height;
  }
}

// Pinned scene: 0 when its top meets the viewport top, 1 when its bottom meets the viewport bottom.
const pinned = (s, y) => {
  const span = s.height - vh;
  return span <= 0 ? (y >= s.top ? 1 : 0) : clamp((y - s.top) / span);
};
// Range: 0 when the element's top sits at `from` (fraction of viewport), 1 when it reaches `to`.
const ranged = (s, y) => clamp((s.top - y - vh * s.from) / (vh * s.to - vh * s.from));

function tick(now) {
  raf = 0;
  const dt = last ? Math.min(64, now - last) : 16;
  last = now;
  const k = reducedMotion() ? 1 : 1 - Math.exp(-dt / TAU);
  const y = scrollY;
  let moving = false;

  for (const s of items) {
    if (!s.active) continue;
    const raw = s.calc(s, y);
    const target = s.map ? s.map(raw) : raw;
    let p;
    if (s.cur < 0 || !s.smooth) p = target;
    else {
      p = s.cur + (target - s.cur) * k;
      if (Math.abs(target - p) < 0.0006) p = target; else moving = true;
    }
    s.cur = p;
    if (Math.abs(p - s.p) < 0.0002 && p !== target) continue;
    if (p === s.p) continue;
    s.p = p;
    if (s.prop) s.el.style.setProperty(s.prop, p.toFixed(4));
    s.fn?.(p);
  }
  for (const fn of frameFns) fn(y, vh);
  if (moving) schedule(); else last = 0;
}

export function schedule() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function register(s) {
  items.add(s);
  const io = new IntersectionObserver(([e]) => {
    s.active = e.isIntersecting;
    if (!s.active) s.cur = -1; // re-entering snaps to the true position instead of sweeping from stale state
    schedule();
  }, { rootMargin: '30% 0px' });
  io.observe(s.el);
  const r = s.el.getBoundingClientRect();
  s.top = r.top + scrollY; s.height = r.height;
  schedule();
  return {
    refresh() { s.p = -1; s.cur = -1; schedule(); },
    get progress() { return Math.max(0, s.p); },
  };
}

/**
 * Register a pinned scene (a tall container with a .sticky child).
 * @param {HTMLElement} el
 * @param {(p:number)=>void} [fn]
 * @param {{map?:(p:number)=>number, prop?:string|null, smooth?:boolean}} [opts]
 */
export function addScene(el, fn, opts = {}) {
  return register({ el, fn, calc: pinned, map: opts.map, prop: opts.prop === undefined ? '--p' : opts.prop, smooth: opts.smooth ?? true, p: -1, cur: -1, active: true });
}

/** Progress of an element travelling through the viewport, for scroll-linked entrances. */
export function addRange(el, fn, { from = 1, to = 0.35, map, prop = '--e', smooth = true } = {}) {
  return register({ el, fn, calc: ranged, from, to, map, prop, smooth, p: -1, cur: -1, active: true });
}

/** Run fn(scrollY, viewportHeight) once per frame while scrolling (for global UI like the progress bar). */
export function onFrame(fn) { frameFns.add(fn); schedule(); return () => frameFns.delete(fn); }

addEventListener('scroll', schedule, { passive: true });
let rq = 0;
const remeasure = () => { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; measure(); items.forEach((s) => (s.p = -1)); schedule(); }); };
addEventListener('resize', remeasure);
// Lazy sections fill in and change the page height; keep cached offsets honest.
new ResizeObserver(remeasure).observe(document.body);
