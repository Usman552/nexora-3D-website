// Entry point. Above-the-fold scenes load immediately; everything else is split
// into its own module and fetched only when the reader gets close to it.
import { initNav } from './components/nav.js';
import { initHero } from './sections/hero.js';
import { initConverge } from './sections/converge.js';
import { initCta } from './sections/cta.js';
import { initReveals } from './core/reveal.js';
import { whenNear } from './core/lazy.js';
import { initFun } from './sections/fun.js';

initNav();
initHero();
initConverge();
initCta();
initReveals();
initFun();

whenNear('#journey', (el) => import('./sections/journey.js').then((m) => m.init(el)), '1400px 0px');
whenNear('#product', (el) => import('./sections/demo/index.js').then((m) => m.init(el)));
whenNear('#workflow', (el) => import('./sections/workflow.js').then((m) => m.init(el)), '1400px 0px');
whenNear('#platform', (el) => import('./sections/toolkit.js').then((m) => m.init(el)));
whenNear('#compare', (el) => import('./sections/compare.js').then((m) => m.init(el)));
whenNear('#trust', (el) => import('./sections/trust.js').then((m) => m.init(el)));
whenNear('#pricing', (el) => import('./sections/pricing.js').then((m) => m.init(el)));

// Warm the cache for the next scenes once the page is idle, so they're instant when reached.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
idle(() => {
  for (const m of ['./sections/journey.js', './sections/demo/index.js', './sections/workflow.js', './sections/compare.js', './sections/toolkit.js', './sections/pricing.js', './sections/trust.js']) {
    const l = document.createElement('link');
    l.rel = 'modulepreload';
    l.href = new URL(m, import.meta.url).href;
    document.head.appendChild(l);
  }
});
