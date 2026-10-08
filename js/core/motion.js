// Shared motion primitives: math, easing, timing tokens, tweens, media-query helpers.
//
// Motion language (mirrors the CSS tokens in index.html):
//   micro  160ms  hover, press, toggles             — acknowledges input
//   state  280ms  a value or mode changes            — shows what changed
//   enter  560ms  something new arrives              — shows where it came from
//   scene  900ms  a multi-step demonstration beat    — shows cause → effect
// One easing family: `out` for arrivals, `inOut` for things that travel between two places.
// Stagger between siblings is 60ms. Distances: 8px micro, 16px enter, ≥24px only for scene moves.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Map v from [a,b] to [0,1], clamped. */
export const range = (v, a, b) => clamp((v - a) / (b - a));

export const DUR = { micro: 160, state: 280, enter: 560, scene: 900 };
export const STAGGER = 60;

export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smooth: (t) => t * t * (3 - 2 * t),
};

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => rmq.matches;
export const onReducedMotionChange = (fn) => rmq.addEventListener?.('change', fn);

const compactMq = matchMedia('(max-width: 860px)');
export const isCompact = () => compactMq.matches;
export const onCompactChange = (fn) => compactMq.addEventListener?.('change', fn);
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Animate a number from `from` to `to`. Returns a cancel function.
 * Reduced motion jumps straight to the end value.
 */
export function tween(from, to, dur, onUpdate, fn = ease.out) {
  if (reducedMotion() || dur <= 0) { onUpdate(to, 1); return () => {}; }
  let id = 0;
  const t0 = performance.now();
  const step = (now) => {
    const t = clamp((now - t0) / dur);
    onUpdate(lerp(from, to, fn(t)), t);
    if (t < 1) id = requestAnimationFrame(step);
  };
  id = requestAnimationFrame(step);
  return () => cancelAnimationFrame(id);
}

/** Count an element's text from one value to another, formatted. Cancels any count already running on it. */
const counting = new WeakMap();
export function countTo(el, from, to, fmt, dur = DUR.enter) {
  counting.get(el)?.();
  counting.set(el, tween(from, to, dur, (v) => { el.textContent = fmt(v); }));
}

/** Briefly mark an element as just-changed (CSS .bump draws the highlight). */
export function bump(el, cls = 'bump') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/** Calls cb(true|false) as el enters/leaves the viewport. Returns the observer. */
export function watchVisibility(el, cb, rootMargin = '0px', threshold = 0) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting, e)), { rootMargin, threshold });
  io.observe(el);
  return io;
}

/** Pause every CSS animation inside el while it is off screen (class .is-off). */
export function pauseOffscreen(el) {
  if (!el) return;
  watchVisibility(el, (v) => el.classList.toggle('is-off', !v), '120px 0px');
}

/** setInterval that only ticks while `el` is on screen and the tab is visible. Returns {stop, start}. */
export function visibleInterval(el, fn, ms) {
  let onScreen = false, id = 0, enabled = true;
  const sync = () => {
    const run = enabled && onScreen && !document.hidden;
    if (run && !id) id = setInterval(fn, ms);
    if (!run && id) { clearInterval(id); id = 0; }
  };
  watchVisibility(el, (v) => { onScreen = v; sync(); });
  document.addEventListener('visibilitychange', sync);
  return { stop() { enabled = false; sync(); }, start() { enabled = true; sync(); } };
}
