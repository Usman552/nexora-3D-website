// Pricing: "priced by customers, not seats" made tangible. Drag the customer count and the plan
// that fits lights up with its price per customer; the monthly/annual switch swaps every number.
import { reducedMotion, bump } from '../core/motion.js';

const nice = (n) => {
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return Math.round(n / p) * p;
};
const fromSlider = (v) => nice(100 * Math.pow(10, (v / 100) * 3.4)); // 100 … ~250,000

export function init(section) {
  const sw = section.querySelector('[data-bill]');
  const prices = [...section.querySelectorAll('.price b[data-m]')];
  const cards = [...section.querySelectorAll('.plan-card')];
  const slider = section.querySelector('#fit-range');
  const countEl = section.querySelector('[data-fit-n]');
  const out = section.querySelector('[data-fit-out]');
  let annual = true, current = null;

  function fit() {
    const n = fromSlider(+slider.value);
    countEl.textContent = n.toLocaleString('en-US');
    slider.setAttribute('aria-valuetext', `${n.toLocaleString('en-US')} customers`);
    slider.style.setProperty('--v', slider.value + '%');
    const card = cards.find((c) => n <= +(c.dataset.max || Infinity));
    cards.forEach((c) => c.classList.toggle('fit', c === card));
    section.querySelector('.pr-grid').classList.add('fitting');
    const b = card.querySelector('.price b[data-m]');
    const name = card.querySelector('h3').textContent;
    if (!b) out.innerHTML = `<b>${name}</b> · custom pricing, talk to us`;
    else {
      const price = +(annual ? b.dataset.y : b.dataset.m);
      const per = price / n;
      out.innerHTML = `<b>${name}</b> · $${price}/mo · ${per >= 0.1 ? '$' + per.toFixed(2) : (per * 100).toFixed(1) + '¢'} per customer`;
    }
    if (card !== current) { current = card; if (!reducedMotion()) bump(out, 'pop'); }
  }

  sw.addEventListener('click', () => {
    annual = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(annual));
    prices.forEach((b) => {
      b.textContent = '$' + (annual ? b.dataset.y : b.dataset.m);
      if (!reducedMotion()) bump(b, 'swap');
    });
    fit();
  });
  slider.addEventListener('input', fit);
  fit();
  // Until the reader touches the slider, it shouldn't single out a plan: the recommended one leads.
  section.querySelector('.pr-grid').classList.remove('fitting');
  cards.forEach((c) => c.classList.remove('fit'));
  current = null;
}
