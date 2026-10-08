// Small delights. All pointer-driven or one-shot, none of them run continuously.
import { reducedMotion, finePointer } from '../core/motion.js';

/** Buttons lean toward the cursor a few pixels, and ripple where they are pressed. */
function buttons() {
  const fine = finePointer();
  document.addEventListener('pointermove', (e) => {
    if (!fine) return;
    const b = e.target.closest?.('.btn');
    document.querySelectorAll('.btn.mag').forEach((x) => { if (x !== b) { x.classList.remove('mag'); x.style.translate = ''; } });
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.classList.add('mag');
    b.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 8}px ${((e.clientY - r.top) / r.height - 0.5) * 6}px`;
  }, { passive: true });
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest?.('.btn, .fire button, .tour button, .seg button');
    if (!b) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
    const rip = document.createElement('i');
    rip.className = 'ripple';
    rip.style.cssText = `left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px;width:${s}px;height:${s}px`;
    b.appendChild(rip);
    rip.addEventListener('animationend', () => rip.remove());
  });
}

/** A soft light that follows the cursor across the hero. */
function heroGlow() {
  const hero = document.querySelector('.hero .sticky');
  if (!hero || !finePointer() || reducedMotion()) return;
  let x = 0, y = 0, raf = 0;
  hero.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; hero.style.setProperty('--gx', x + 'px'); hero.style.setProperty('--gy', y + 'px'); });
  }, { passive: true });
}

/** Section headlines rise word by word. */
function headlines() {
  if (reducedMotion()) return;
  const titles = [...document.querySelectorAll('.sec-title .h2, .wf-title .h2')];
  const split = (node, grad) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(' '); return; }
          const o = document.createElement('span'); o.className = 'wo';
          const w = document.createElement('span'); w.className = 'wd' + (grad ? ' grad' : ''); w.textContent = t;
          o.append(w); frag.append(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) split(n, grad || n.classList.contains('grad'));
    }
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  for (const h of titles) {
    h.removeAttribute('data-reveal');
    h.classList.remove('pre');
    split(h, false);
    h.querySelectorAll('.wd').forEach((w, i) => w.style.setProperty('--k', i));
    h.classList.add('split');
    if (h.getBoundingClientRect().top < innerHeight * 0.88) h.classList.add('in'); else io.observe(h);
  }
}

/** One-shot burst of confetti from an element. */
export function burst(el, n = 26) {
  if (reducedMotion() || !el) return;
  const r = el.getBoundingClientRect();
  const colors = ['#7B61FF', '#A595FF', '#6ED6E6', '#5AD8A6', '#E9B865', '#fff'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${colors[i % colors.length]};width:${5 + (i % 3) * 2}px;height:${8 + (i % 4) * 2}px`;
    document.body.appendChild(p);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5, v = 90 + Math.random() * 170;
    p.animate([
      { transform: 'translate(-50%,-50%) rotate(0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * v - 4}px,${Math.sin(a) * v - 70}px) rotate(${Math.random() * 540}deg) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${Math.cos(a) * v * 1.15}px,${Math.sin(a) * v + 90}px) rotate(${Math.random() * 900}deg) scale(.6)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).finished.then(() => p.remove(), () => p.remove());
  }
}

export function initFun() {
  buttons();
  heroGlow();
  headlines();
}
