// Problem → Solution scene. Four beats, all scrubbed by scroll:
// A (.12–.32) DISCONNECTED: five tools drift apart; mismatched links and stale-data warnings build up.
// B (.40–.62) CONNECTED: tools pull into orbit around NEXORA; their IDs resolve to one customer.
// C (.58–.70) LIVE: links draw in and data starts flowing.
// D (.76–.92) INSIGHT: the joined record surfaces something no single tool could see, and acts on it.
import { addScene } from '../core/scroll.js';
import { clamp, lerp, range, ease, reducedMotion, isCompact, pauseOffscreen } from '../core/motion.js';

const SVG = 'http://www.w3.org/2000/svg';
// [x, y, rotation] as fractions of the field
const SCATTER = [[0.2, 0.16, -2], [0.78, 0.12, 2], [0.82, 0.56, -1.5], [0.19, 0.6, 1.5], [0.54, 0.88, -1]];
const ORBIT_DEG = [-90, -18, 54, 198, 126];
const TANGLE = [[0, 1], [0, 3], [1, 2], [2, 4], [3, 4], [1, 4], [0, 2], [3, 2]];
const NEQ = [6, 5, 4]; // which tangle pairs get a "≠" marker
const STEP_AT = [0.22, 0.48, 0.74]; // progress where copy beats change
const STEP_JUMP = [0.06, 0.34, 0.64, 0.9]; // where clicking a beat in the rail lands

const fmtTime = (m) => {
  m = Math.round(m / 5) * 5 || Math.round(m);
  if (m < 60) return `${Math.max(1, m)} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}h ${String(r).padStart(2, '0')}m` : `${h}h`;
};

export function initConverge() {
  const scene = document.querySelector('.converge');
  if (!scene) return;
  const field = scene.querySelector('.cv-field');
  const copy = scene.querySelector('.cv-copy');
  const nodes = [...field.querySelectorAll('.cv-node')];
  const core = field.querySelector('.cv-core');
  const insight = field.querySelector('.cv-insight');
  const rows = insight ? [...insight.querySelectorAll('[data-row]')] : [];
  const steps = [...scene.querySelectorAll('.cv-step')];
  const brows = [...scene.querySelectorAll('.cv-eyebrows span')];
  const rail = [...scene.querySelectorAll('.cv-rail button')];
  const stat = (k) => scene.querySelector(`[data-stat="${k}"]`);
  const sTools = stat('tools'), sExports = stat('exports'), sTime = stat('time');
  const svg = field.querySelector('.cv-lines');
  const gT = svg.querySelector('.tangle'), gN = svg.querySelector('.neq'), gL = svg.querySelector('.links'), gP = svg.querySelector('.pulses');
  pauseOffscreen(scene.querySelector('.sticky'));

  const mk = (tag, parent, attrs = {}) => {
    const el = document.createElementNS(SVG, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  };
  const tLines = TANGLE.map(() => mk('line', gT));
  const neq = NEQ.map(() => { const t = mk('text', gN, { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }); t.textContent = '≠'; return t; });
  const links = nodes.map(() => mk('path', gL, { pathLength: 1 }));
  const pulses = nodes.map(() => mk('path', gP, { pathLength: 1 }));

  let W = 0, H = 0, nw = 0, nh = 0, lastP = 0, step = -1, shown = -1;
  const measure = () => {
    W = field.clientWidth; H = field.clientHeight;
    nw = nodes[0].offsetWidth; nh = nodes[0].offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    render(lastP);
  };

  function render(p) {
    lastP = p;
    if (!W) return;
    const compact = isCompact();
    const tF = ease.smooth(range(p, 0.12, 0.32));
    const tS = ease.inOut(range(p, 0.4, 0.62));
    const tL = range(p, 0.58, 0.7);
    const tI = ease.out(range(p, 0.76, 0.9));
    const spread = 1 + 0.1 * tF;
    const sc = lerp(1, compact ? 0.9 : 0.8, tS) * lerp(1, 0.92, tI);
    const hw = (nw * sc) / 2 + 6, hh = (nh * sc) / 2 + 6;
    const rx = Math.min(W * (compact ? 0.33 : 0.38), W / 2 - hw);
    const ry = Math.min(H * 0.38, H / 2 - hh);
    const cx = W / 2, cy = H / 2;
    const pos = [];

    nodes.forEach((n, i) => {
      const [fx, fy, r0] = SCATTER[i];
      const sx = (0.5 + (fx - 0.5) * spread) * W;
      const sy = (0.5 + (fy - 0.5) * spread) * H;
      const a = (ORBIT_DEG[i] * Math.PI) / 180;
      // During the insight beat the orbit widens a touch to make room for the record.
      const grow = 1 + 0.06 * tI;
      const ox = cx + Math.cos(a) * rx * grow, oy = cy + Math.sin(a) * ry * grow;
      const x = clamp(lerp(sx, ox, tS), hw, W - hw);
      const y = clamp(lerp(sy, oy, tS), hh, H - hh);
      const rot = r0 * (1 + tF * 0.8) * (1 - tS);
      pos.push([x, y]);
      n.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      n.style.opacity = String(1 - 0.55 * tI);
    });

    gT.style.opacity = String((0.18 + 0.82 * tF) * (1 - tS));
    TANGLE.forEach(([a, b], k) => {
      const l = tLines[k];
      l.setAttribute('x1', pos[a][0]); l.setAttribute('y1', pos[a][1]);
      l.setAttribute('x2', pos[b][0]); l.setAttribute('y2', pos[b][1]);
    });
    gN.style.opacity = String(tF * (1 - tS));
    NEQ.forEach((k, j) => {
      const [a, b] = TANGLE[k];
      neq[j].setAttribute('x', (pos[a][0] + pos[b][0]) / 2);
      neq[j].setAttribute('y', (pos[a][1] + pos[b][1]) / 2);
    });

    // Links recede with the tools when the record takes the stage.
    gL.style.opacity = gP.style.opacity = String(1 - 0.7 * tI);
    pos.forEach(([x, y], i) => {
      const d = `M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}`;
      links[i].setAttribute('d', d);
      links[i].style.strokeDashoffset = String(1 - tL);
      pulses[i].setAttribute('d', d);
    });
    core.style.setProperty('--cs', (lerp(0.4, 1, tS) * lerp(1, 0.7, tI)).toFixed(3));
    core.style.setProperty('--co', (tS * (1 - tI)).toFixed(3));

    if (insight) {
      insight.style.setProperty('--ti', tI.toFixed(3));
      const n = tI <= 0 ? 0 : Math.min(rows.length, Math.floor(range(p, 0.79, 0.93) * rows.length + 0.001) + 1);
      if (n !== shown) { shown = n; rows.forEach((r, i) => r.classList.toggle('on', i < n)); }
      insight.classList.toggle('done', p > 0.93);
    }

    const friction = tF > 0.4 && tS < 0.35, unified = tS > 0.55;
    field.classList.toggle('is-friction', friction);
    field.classList.toggle('is-unified', unified);
    field.classList.toggle('flowing', tL > 0.96);
    copy.classList.toggle('is-friction-copy', friction);
    copy.classList.toggle('is-unified-copy', unified);

    const s = STEP_AT.filter((t) => p >= t).length;
    if (s !== step) {
      step = s;
      steps.forEach((el, i) => el.classList.toggle('is-active', i === s));
      brows.forEach((el, i) => el.classList.toggle('is-active', i === s));
      rail.forEach((el, i) => { el.classList.toggle('is-active', i === s); el.classList.toggle('is-past', i < s); el.setAttribute('aria-current', i === s ? 'step' : 'false'); });
    }

    sTools.textContent = String(Math.round(lerp(5, 1, tS)));
    sExports.textContent = String(Math.round(tS > 0 ? lerp(14, 0, tS) : lerp(3, 14, tF)));
    sTime.textContent = fmtTime(tS > 0 ? lerp(220, 6, tS) : lerp(45, 220, tF));
  }

  // The rail lets the reader jump to a beat instead of scrubbing to find it.
  rail.forEach((b, i) => b.addEventListener('click', () => {
    const r = scene.getBoundingClientRect();
    const span = scene.offsetHeight - innerHeight;
    scrollTo({ top: scrollY + r.top + span * STEP_JUMP[i], behavior: reducedMotion() ? 'auto' : 'smooth' });
  }));

  new ResizeObserver(measure).observe(field);
  addScene(scene, render, {
    // Reduced motion: no scrubbing, just four discrete states.
    map: (p) => (reducedMotion() ? (p < 0.22 ? 0 : p < 0.48 ? 0.3 : p < 0.74 ? 0.72 : 1) : p),
  });
}
