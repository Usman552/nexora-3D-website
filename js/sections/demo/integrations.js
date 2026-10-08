// Integrations panel: connect (with a visible backfill) or disconnect (with an in-page confirm).
import { esc } from '../../ui/format.js';
import { liveSources } from './store.js';
import { reducedMotion } from '../../core/motion.js';

const fmtN = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n.toLocaleString('en-US'));

function cardInner(i) {
  let status, actions, prog = '';
  switch (i.status) {
    case 'on':
      status = `<span class="ig-status ok">● Live · ${i.synced || 'synced 12s ago'}<br>${i.rate.toLocaleString('en-US')} events/min</span>`;
      actions = `<button type="button" class="btn-xs" data-act="ask">Disconnect</button>`;
      break;
    case 'confirm':
      status = `<span class="ig-status">Stop syncing ${esc(i.name)}? History stays on each customer record.</span>`;
      actions = `<button type="button" class="btn-xs danger" data-act="disconnect">Disconnect</button><button type="button" class="btn-xs" data-act="cancel">Keep</button>`;
      break;
    case 'connecting':
      status = `<span class="ig-status busy">Backfilling ${fmtN(i.records)} records…</span>`;
      prog = `<div class="ig-prog"><i></i></div>`;
      actions = `<button type="button" class="btn-xs" disabled>Connecting</button>`;
      break;
    default:
      status = `<span class="ig-status">Not connected</span>`;
      actions = `<button type="button" class="btn-xs solid" data-act="connect">Connect</button>`;
  }
  return `<div class="ig-top"><span class="ig-logo" aria-hidden="true">${esc(i.name[0])}</span><div><h4>${esc(i.name)}</h4><p>${esc(i.cat)}</p></div></div>${status}${prog}<div class="ig-actions">${actions}</div>`;
}

export function mountIntegrations(panel, store) {
  const list = store.state.integrations;
  panel.innerHTML = `
    <div class="ph"><div><h3>Integrations</h3><p data-ig-sum></p></div></div>
    <div class="ig-grid">${list.map((i) => `<article class="panel ig" data-id="${i.id}" aria-label="${esc(i.name)}">${cardInner(i)}</article>`).join('')}</div>`;

  const card = (id) => panel.querySelector(`.ig[data-id="${id}"]`);
  const paint = (i, focusAct) => {
    const el = card(i.id);
    el.innerHTML = cardInner(i);
    if (focusAct) (el.querySelector(`[data-act="${focusAct}"]`) || el.querySelector('button:not([disabled])'))?.focus();
  };

  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const i = list.find((x) => x.id === b.closest('.ig').dataset.id);
    const act = b.dataset.act;
    if (act === 'ask') { i.status = 'confirm'; paint(i, 'cancel'); }
    else if (act === 'cancel') { i.status = 'on'; paint(i, 'ask'); }
    else if (act === 'disconnect') { i.status = 'off'; paint(i, 'connect'); store.emit(); }
    else if (act === 'connect') {
      i.status = 'connecting';
      paint(i);
      const bar = card(i.id).querySelector('.ig-prog i');
      requestAnimationFrame(() => requestAnimationFrame(() => { if (bar) bar.style.width = '100%'; }));
      setTimeout(() => {
        i.status = 'on';
        i.synced = 'synced just now';
        paint(i);
        card(i.id).querySelector('button')?.focus();
        store.emit();
        panel.dispatchEvent(new CustomEvent('tried', { detail: 'connect', bubbles: true }));
      }, reducedMotion() ? 300 : 1600);
    }
  });

  store.subscribe((s) => {
    const live = liveSources(s);
    const rate = live.reduce((n, i) => n + i.rate, 0).toLocaleString('en-US');
    panel.querySelector('[data-ig-sum]').textContent = `${live.length} of ${s.integrations.length} sources live · ${rate} events/min into one model`;
    document.querySelector('[data-ig-count]').textContent = `${live.length}/${s.integrations.length}`;
    const sync = document.querySelector('[data-sync]');
    if (sync) sync.textContent = `${live.length} sources live · ${rate} events/min`;
  });
}
