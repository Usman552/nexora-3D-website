// Final CTA: the hero dashboard returns and reassembles as the reader arrives.
import { addScene } from '../core/scroll.js';
import { reducedMotion } from '../core/motion.js';

export function initCta() {
  const cta = document.querySelector('.cta');
  if (!cta) return;
  const stage = cta.querySelector('.cta-stage');
  const rig = document.getElementById('hero-rig');
  if (rig && stage) {
    const clone = rig.cloneNode(true);
    clone.removeAttribute('id');
    stage.appendChild(clone);
  }
  // Reach the settled state a little before the scene ends so the form is usable while pinned.
  addScene(cta, null, { map: (p) => (reducedMotion() ? 1 : Math.min(1, p / 0.8)) });

  const form = cta.querySelector('.cta-form');
  const input = form.querySelector('input');
  const msg = cta.querySelector('.cta-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      msg.className = 'cta-msg err';
      msg.textContent = 'Enter a work email like name@company.com to start your trial.';
      input.focus();
      return;
    }
    msg.className = 'cta-msg ok';
    msg.textContent = `Trial reserved for ${v}. This is a concept page, so no email was sent.`;
    form.querySelector('button').textContent = 'Reserved';
  });
}
