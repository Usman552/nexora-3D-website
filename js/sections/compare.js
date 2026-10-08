// Comparison as a race: two teams get the same question at 1:00 pm.
// One playhead runs both lanes on the same clock, so the difference is something you watch happen
// rather than read: NEXORA answers at 1:06, the traditional stack is still exporting CSVs at 3:00.
import { reducedMotion, watchVisibility, clamp } from '../core/motion.js';
import { esc } from '../ui/format.js';

const TOTAL = 220; // minutes on the axis
const PLAY_MS = 8000;
const TOOL = {
  Billing: '#E9B865', Analytics: '#D99A6C', Spreadsheet: '#C98A8A', CRM: '#B48AAE', Chat: '#8F86B8', Slides: '#7A83A6',
};
const OLD = [
  ['Export last quarter’s invoices', 'Billing', 25],
  ['Pull seat and usage data', 'Analytics', 40],
  ['Match accounts by hand', 'Spreadsheet', 70],
  ['Read account notes', 'CRM', 35],
  ['Ask the success team what changed', 'Chat', 30],
  ['Rebuild the chart for the meeting', 'Slides', 20],
];
const NX = [
  ['Filter expansion MRR to September', 2],
  ['Drill into the 14 accounts that didn’t expand', 3],
  ['Share the live view with the team', 1],
  ['Turn the finding into a seat-offer automation', 3],
];
// [label, traditional, nexora]
const METRICS = [
  ['Time to answer', '3h 40m', '6 min'],
  ['Tools touched', '6', '1'],
  ['People involved', '2, with 4 hand-offs', '1'],
  ['Data freshness', 'Up to 24 hours old', 'Under 2 seconds'],
  ['Follow-up', 'A ticket for next sprint', 'Automation live at 1:09'],
  ['Who sees the answer', 'Whoever got the slides', 'The whole team, same numbers'],
];

const clock = (m) => {
  const total = 13 * 60 + Math.round(m);
  const h = Math.floor(total / 60), mm = String(total % 60).padStart(2, '0');
  return `${h > 12 ? h - 12 : h}:${mm} pm`;
};
const dur = (m) => (m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`);

export function init(section) {
  const race = section.querySelector('.race');
  const head = race.querySelector('.race-head');
  const oldTrack = race.querySelector('.lane-old .lane-track');
  const nxTrack = race.querySelector('.lane-nx .lane-track');
  const oldStatus = race.querySelector('.lane-old [data-status]');
  const nxStatus = race.querySelector('.lane-nx [data-status]');
  const clockEl = race.querySelector('[data-clock]');
  const elapsed = race.querySelector('[data-elapsed]');
  const metrics = race.querySelector('.race-out tbody');

  // Blocks are laid out once, on a shared minute axis.
  let t0 = 0;
  const oldBlocks = OLD.map(([label, tool, m]) => {
    const b = document.createElement('div');
    b.className = 'blk';
    b.style.cssText = `--l:${t0 / TOTAL};--w:${m / TOTAL};--c:${TOOL[tool]}`;
    b.innerHTML = `<i></i><span>${esc(tool)}</span>`;
    b.title = `${label} · ${m} min`;
    oldTrack.appendChild(b);
    const r = { el: b, start: t0, end: t0 + m, label, tool };
    t0 += m;
    return r;
  });
  t0 = 0;
  const nxBlocks = NX.map(([label, m]) => {
    const b = document.createElement('div');
    b.className = 'blk nx';
    b.style.cssText = `--l:${t0 / TOTAL};--w:${m / TOTAL}`;
    b.innerHTML = '<i></i>';
    b.title = `${label} · ${m} min`;
    nxTrack.appendChild(b);
    const r = { el: b, start: t0, end: t0 + m, label };
    t0 += m;
    return r;
  });
  const free = document.createElement('div');
  free.className = 'free';
  free.style.setProperty('--l', t0 / TOTAL);
  free.innerHTML = '<span>Rest of the afternoon: free</span>';
  nxTrack.appendChild(free);
  metrics.innerHTML = METRICS.map(([l, a, b], i) => `<tr style="--i:${i}"><th scope="row">${esc(l)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('');

  let raf = 0, last = { o: -1, n: -1 };

  function paint(m) {
    race.style.setProperty('--t', (m / TOTAL).toFixed(4));
    clockEl.textContent = clock(m);
    elapsed.textContent = `${dur(m)} elapsed`;
    const fill = (b) => b.el.style.setProperty('--f', clamp((m - b.start) / (b.end - b.start)).toFixed(3));
    oldBlocks.forEach(fill); nxBlocks.forEach(fill);

    const oi = oldBlocks.findIndex((b) => m < b.end);
    if (oi !== last.o) {
      last.o = oi;
      oldBlocks.forEach((b, i) => b.el.classList.toggle('cur', i === oi));
      oldStatus.innerHTML = oi < 0
        ? `<b>Answered at ${clock(TOTAL)}</b> · 6 tools, 2 people`
        : `Step ${oi + 1} of 6 · ${esc(oldBlocks[oi].label)} <small>${esc(oldBlocks[oi].tool)}</small>`;
      race.classList.toggle('old-done', oi < 0);
    }
    const ni = nxBlocks.findIndex((b) => m < b.end);
    if (ni !== last.n) {
      last.n = ni;
      nxBlocks.forEach((b, i) => b.el.classList.toggle('cur', i === ni));
      nxStatus.innerHTML = ni < 0
        ? `<b>Answered at 1:06 pm</b> · follow-up automation live at 1:09`
        : `Step ${ni + 1} of 4 · ${esc(nxBlocks[ni].label)}`;
      race.classList.toggle('nx-done', ni < 0);
    }
  }

  function play() {
    cancelAnimationFrame(raf);
    race.classList.remove('done', 'old-done', 'nx-done');
    last = { o: -1, n: -1 };
    if (reducedMotion()) { paint(TOTAL); race.classList.add('done'); return; }
    const start = performance.now();
    const step = (now) => {
      const u = clamp((now - start) / PLAY_MS);
      // Slow motion at the start, where NEXORA's whole run happens; fast-forward through the rest.
      // NEXORA's 9 minutes take ~1.6 s of playback; the remaining 3.5 hours take the other ~6 s.
      paint(TOTAL * u * u);
      if (u < 1) raf = requestAnimationFrame(step);
      else race.classList.add('done');
    };
    raf = requestAnimationFrame(step);
  }

  paint(0);
  race.querySelector('[data-replay]').addEventListener('click', play);
  let started = false;
  watchVisibility(head, (v) => { if (v && !started) { started = true; play(); } }, '0px 0px -30% 0px');
}
