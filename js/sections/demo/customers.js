// Customers panel: search, segment filter, and a unified profile with a cross-tool timeline.
import { CUSTOMERS, timeline } from './data.js';
import { money, esc, healthColor } from '../../ui/format.js';

const SEGMENTS = [
  ['all', 'All'],
  ['risk', 'At risk'],
  ['big', 'Scale and up'],
];
const test = {
  all: () => true,
  risk: (c) => c.health < 50,
  big: (c) => c.plan === 'Scale' || c.plan === 'Enterprise',
};

export function mountCustomers(panel) {
  panel.innerHTML = `
    <div class="ph"><div><h3>Customers</h3><p>${CUSTOMERS.length} accounts · one record each, across every source</p></div></div>
    <div class="cu">
      <div style="min-width:0">
        <div class="cu-tools">
          <label class="search"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <input id="cu-search" type="search" placeholder="Search by name, domain or owner" aria-label="Search customers" autocomplete="off"></label>
          <div class="chips" role="group" aria-label="Segment">
            ${SEGMENTS.map(([k, l]) => `<button type="button" class="chip" data-seg="${k}" aria-pressed="${k === 'all'}">${l}</button>`).join('')}
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <caption class="sr">Customers. Select a row to open the profile.</caption>
            <thead><tr><th scope="col">Customer</th><th scope="col">Plan</th><th scope="col" class="num">MRR</th><th scope="col">Health</th><th scope="col">Last activity</th></tr></thead>
            <tbody></tbody>
          </table>
          <p class="empty" hidden></p>
        </div>
      </div>
      <aside class="panel cu-profile" aria-live="polite" aria-label="Customer profile"></aside>
    </div>`;

  const tbody = panel.querySelector('tbody');
  const empty = panel.querySelector('.empty');
  const profile = panel.querySelector('.cu-profile');
  const input = panel.querySelector('#cu-search');
  let q = '', seg = 'all', sel = CUSTOMERS[0].id;

  function renderRows() {
    const needle = q.toLowerCase();
    const rows = CUSTOMERS.filter((c) => test[seg](c) && (!needle || `${c.name} ${c.domain} ${c.owner}`.toLowerCase().includes(needle)));
    tbody.innerHTML = rows.map((c) => `
      <tr data-id="${c.id}" class="${c.id === sel ? 'sel' : ''}">
        <td><button type="button" class="cu-name" aria-pressed="${c.id === sel}">${esc(c.name)}</button></td>
        <td><span class="plan">${c.plan}</span></td>
        <td class="num">${money(c.mrr)}</td>
        <td><span class="health"><span class="bar"><i style="width:${c.health}%;background:${healthColor(c.health)}"></i></span>${c.health}</span></td>
        <td class="muted">${esc(c.last)} · ${c.age}</td>
      </tr>`).join('');
    empty.hidden = rows.length > 0;
    if (!rows.length) empty.textContent = q ? `No customers match “${q}”. Try a domain or an owner's name.` : 'No customers in this segment.';
  }

  function renderProfile() {
    const c = CUSTOMERS.find((x) => x.id === sel);
    profile.innerHTML = `
      <div class="pf-top"><span class="pf-av" aria-hidden="true">${esc(c.name[0])}</span>
        <div><h4>${esc(c.name)}</h4><p>${c.id} · ${esc(c.domain)}</p></div></div>
      <div class="pf-stats">
        <div><span>MRR</span><b>${money(c.mrr)}</b></div>
        <div><span>Health</span><b style="color:${healthColor(c.health)}">${c.health}</b></div>
        <div><span>Seats</span><b>${c.seats}</b></div>
      </div>
      <div><p class="label" style="margin-bottom:8px">Unified timeline · 5 sources</p>
        <ul class="tl">${timeline(c).map(([src, t, d, a]) => `<li><span class="src">${src}</span><div><p>${esc(t)}</p><small>${esc(d)} · ${a}</small></div></li>`).join('')}</ul>
      </div>`;
  }

  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    sel = tr.dataset.id;
    tbody.querySelectorAll('tr').forEach((r) => {
      const on = r === tr;
      r.classList.toggle('sel', on);
      r.querySelector('.cu-name').setAttribute('aria-pressed', String(on));
    });
    renderProfile();
  });
  input.addEventListener('input', () => { q = input.value.trim(); renderRows(); });
  panel.querySelector('.chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-seg]');
    if (!b) return;
    seg = b.dataset.seg;
    panel.querySelectorAll('[data-seg]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderRows();
    if (seg === 'risk') panel.dispatchEvent(new CustomEvent('tried', { detail: 'risk', bubbles: true }));
  });

  renderRows();
  renderProfile();
}
