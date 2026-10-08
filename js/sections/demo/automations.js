// Automations panel: real on/off switches that feed the Overview KPIs and the sidebar count.
import { esc } from '../../ui/format.js';
import { activeAutomations } from './store.js';

export function mountAutomations(panel, store) {
  const { automations } = store.state;
  panel.innerHTML = `
    <div class="ph"><div><h3>Automations</h3><p data-au-sum></p></div></div>
    <ul class="au-list">
      ${automations.map((a) => `
        <li class="panel au ${a.on ? '' : 'off'}" data-id="${a.id}">
          <button class="switch" role="switch" aria-checked="${a.on}" aria-label="${esc(a.name)}"></button>
          <div style="min-width:0"><h4>${esc(a.name)}</h4><p>${esc(a.trigger)}</p></div>
          <div class="au-stat"><b>${a.runs.toLocaleString('en-US')}</b>runs · ${esc(a.outcome)}</div>
          <div class="au-steps" aria-label="Steps">${a.steps.map((s) => `<span>${esc(s)}</span>`).join('<em aria-hidden="true">→</em>')}</div>
        </li>`).join('')}
    </ul>`;

  panel.addEventListener('click', (e) => {
    const sw = e.target.closest('.switch');
    if (!sw) return;
    const row = sw.closest('[data-id]');
    const a = automations.find((x) => x.id === row.dataset.id);
    a.on = !a.on;
    sw.setAttribute('aria-checked', String(a.on));
    row.classList.toggle('off', !a.on);
    store.emit();
    if (!a.on) panel.dispatchEvent(new CustomEvent('tried', { detail: 'auto', bubbles: true }));
  });

  store.subscribe((s) => {
    const act = activeAutomations(s);
    panel.querySelector('[data-au-sum]').textContent = `${act.length} of ${s.automations.length} running · paused flows keep their history`;
    document.querySelector('[data-au-count]').textContent = `${act.length}/${s.automations.length}`;
  });
}
