// Interactive product demo: a small simulated NEXORA workspace.
// A "things to try" checklist points at real controls and ticks off when the reader actually uses them.
import { tabs } from '../../ui/keyboard.js';
import { addRange } from '../../core/scroll.js';
import { reducedMotion } from '../../core/motion.js';
import { burst } from '../fun.js';
import { createStore } from './store.js';
import { mountOverview } from './overview.js';
import { mountCustomers } from './customers.js';
import { mountAutomations } from './automations.js';
import { mountIntegrations } from './integrations.js';

// Which tab each task lives on, and the control to point at.
const TASKS = {
  chart: ['tab-ov', '.chart'],
  risk: ['tab-cu', '[data-seg="risk"]'],
  auto: ['tab-au', '.au .switch[aria-checked="true"]'],
  connect: ['tab-ig', '.ig[data-id="intercom"] [data-act="connect"], .ig[data-id="intercom"]'],
};

export function init(section) {
  const app = section.querySelector('.app');
  const store = createStore();
  const panel = (id) => app.querySelector(`#${id}`);
  const tried = new Set();

  mountOverview(panel('pn-ov'), store);
  mountCustomers(panel('pn-cu'));
  mountAutomations(panel('pn-au'), store);
  mountIntegrations(panel('pn-ig'), store);

  const tablist = tabs(app.querySelector('[role="tablist"]'), (tab) => {
    const p = panel(tab.getAttribute('aria-controls'));
    // Restart the panel entrance so switching feels like a real app navigation.
    p.style.animation = 'none';
    void p.offsetWidth;
    p.style.animation = '';
  });

  // The workspace tilts up from the page into view as you arrive, then sits flat while you use it.
  if (!reducedMotion()) addRange(section.querySelector('.app-stage'), null, { from: 1, to: 0.28 });

  const tour = section.querySelector('.tour');
  const count = tour.querySelector('[data-tour-n]');
  tour.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tour]');
    if (!b) return;
    const [tabId, sel] = TASKS[b.dataset.tour];
    tablist.select(document.getElementById(tabId));
    const target = app.querySelector(sel);
    if (!target) return;
    const r = app.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) app.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    target.classList.remove('coach');
    void target.offsetWidth;
    target.classList.add('coach');
    setTimeout(() => target.classList.remove('coach'), 2600);
    if (b.dataset.tour === 'chart') target.focus({ preventScroll: true });
  });

  app.addEventListener('tried', (e) => {
    const k = e.detail;
    if (tried.has(k)) return;
    tried.add(k);
    tour.querySelector(`[data-tour="${k}"]`)?.classList.add('done');
    count.textContent = String(tried.size);
    tour.classList.toggle('complete', tried.size === 4);
    if (tried.size === 4) burst(tour.querySelector('.tour-count'));
  });
}
