// Sample workspace data for the product simulation. Deterministic so it reads the same every visit.
import { seeded, money } from '../../ui/format.js';

export const CUSTOMERS = [
  { id: 'cust_2214', name: 'Halden Studio', domain: 'halden.io', plan: 'Growth', mrr: 1240, health: 92, last: 'Invoice paid', age: '4m', owner: 'Ana Ruiz', seats: '9 / 10', renewal: 'Nov 2' },
  { id: 'cust_1187', name: 'Kestrel Logistics', domain: 'kestrel.co', plan: 'Enterprise', mrr: 12400, health: 95, last: 'Payment succeeded', age: '11m', owner: 'Leo Park', seats: '212 / 250', renewal: 'Mar 14' },
  { id: 'cust_3302', name: 'Lumen Health', domain: 'lumenhealth.com', plan: 'Scale', mrr: 6150, health: 88, last: 'Added 6 seats', age: '1h', owner: 'Ana Ruiz', seats: '58 / 60', renewal: 'Jan 9' },
  { id: 'cust_0941', name: 'Tidewater Finance', domain: 'tidewater.fi', plan: 'Scale', mrr: 5320, health: 77, last: 'Opened report', age: '2h', owner: 'Jun Okafor', seats: '31 / 40', renewal: 'Dec 1' },
  { id: 'cust_2756', name: 'Northwind Ceramics', domain: 'northwind.shop', plan: 'Scale', mrr: 4800, health: 71, last: 'Support reply', age: '3h', owner: 'Leo Park', seats: '22 / 40', renewal: 'Feb 20' },
  { id: 'cust_4410', name: 'Orbitly', domain: 'orbitly.app', plan: 'Growth', mrr: 1890, health: 63, last: 'Trial extended', age: '5h', owner: 'Jun Okafor', seats: '14 / 20', renewal: 'Oct 11' },
  { id: 'cust_3901', name: 'Juniper & Vale', domain: 'junipervale.com', plan: 'Growth', mrr: 760, health: 68, last: 'Logged in', age: '6h', owner: 'Ana Ruiz', seats: '6 / 10', renewal: 'Dec 18' },
  { id: 'cust_5120', name: 'Mosaic Labs', domain: 'mosaiclabs.dev', plan: 'Launch', mrr: 149, health: 81, last: 'Signed up', age: '8h', owner: 'Maya Reyes', seats: '3 / 5', renewal: 'Nov 7' },
  { id: 'cust_2033', name: 'Brightwell Learning', domain: 'brightwell.edu', plan: 'Growth', mrr: 940, health: 39, last: 'Payment failed', age: '2h', owner: 'Leo Park', seats: '4 / 10', renewal: 'Oct 28' },
  { id: 'cust_4876', name: 'Parcel & Pine', domain: 'parcelpine.com', plan: 'Launch', mrr: 189, health: 44, last: 'Usage dropped', age: '1d', owner: 'Maya Reyes', seats: '1 / 5', renewal: 'Oct 19' },
];

export function timeline(c) {
  if (c.health < 50) return [
    ['Billing', `Payment of ${money(c.mrr)} failed`, 'Card declined · smart retry Oct 10, 10:40', '2h'],
    ['Product', 'Weekly active users down 38%', `${c.seats} seats in use`, '1d'],
    ['Automation', 'Churn-risk alert sent', `To ${c.owner} in #revenue-risk`, '1d'],
    ['Inbox', 'Asked how to export their data', 'Conversation open · no reply yet', '3d'],
    ['CRM', `Renewal on ${c.renewal}`, `Owner ${c.owner}`, '—'],
  ];
  if (c.health < 75) return [
    ['Product', 'Usage flat for 3 weeks', `${c.seats} seats in use`, '6h'],
    ['Billing', `Invoice of ${money(c.mrr)} paid`, 'Visa ending 4417', '9d'],
    ['Inbox', 'Requested a training session', 'Assigned to success team', '12d'],
    ['Automation', 'Entered “Adoption check-in” flow', 'Step 2 of 3', '12d'],
    ['CRM', `Renewal on ${c.renewal}`, `Owner ${c.owner}`, '—'],
  ];
  return [
    ['Billing', `Invoice of ${money(c.mrr)} paid`, 'Card on file · paid on first attempt', c.age],
    ['Product', `${c.seats} seats active this week`, 'Usage up 12% month over month', '1d'],
    ['Automation', 'Entered “Expansion signal” flow', 'Seat usage above 90%', '2d'],
    ['Inbox', 'Asked about SSO setup', 'Resolved in 14 minutes', '5d'],
    ['CRM', `Renewal on ${c.renewal}`, `Owner ${c.owner}`, '—'],
  ];
}

export const AUTOMATIONS = [
  { id: 'recovery', name: 'Failed payment recovery', trigger: 'When an invoice payment fails', runs: 1284, outcome: '$18,420 recovered', on: true, steps: ['Payment fails', 'Smart retry', 'Card update email', 'Owner alert'] },
  { id: 'trial', name: 'Trial-to-paid nudge', trigger: '3 days before a trial ends', runs: 212, outcome: '31% converted', on: true, steps: ['Trial ending', 'Score usage', 'Plan offer', 'CRM task'] },
  { id: 'churn', name: 'Churn-risk alert', trigger: 'When health drops below 50', runs: 46, outcome: '38 accounts saved', on: true, steps: ['Health < 50', 'Slack alert', 'Owner task'] },
  { id: 'onboard', name: 'Onboarding sequence', trigger: 'When a customer signs up', runs: 318, outcome: '64% activated', on: true, steps: ['Sign up', 'Welcome email', 'Day 3 tips', 'Day 7 check-in'] },
  { id: 'expand', name: 'Expansion signal to CRM', trigger: 'Seat usage above 90% for 7 days', runs: 27, outcome: '$6,140 expansion', on: false, steps: ['Seats > 90%', 'Score account', 'CRM opportunity'] },
  { id: 'digest', name: 'Weekly revenue digest', trigger: 'Mondays at 09:00', runs: 4, outcome: 'Posted to #revenue', on: false, steps: ['Monday 09:00', 'Build summary', 'Post to Slack'] },
];

export const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe', cat: 'Billing', status: 'on', rate: 1840, records: 48210 },
  { id: 'hubspot', name: 'HubSpot', cat: 'CRM', status: 'on', rate: 320, records: 12930 },
  { id: 'segment', name: 'Segment', cat: 'Product events', status: 'on', rate: 1610, records: 2104000 },
  { id: 'postgres', name: 'Postgres', cat: 'App database', status: 'on', rate: 260, records: 91400 },
  { id: 'slack', name: 'Slack', cat: 'Alerts', status: 'on', rate: 40, records: 0 },
  { id: 'intercom', name: 'Intercom', cat: 'Support inbox', status: 'off', rate: 180, records: 18240 },
  { id: 'salesforce', name: 'Salesforce', cat: 'CRM', status: 'off', rate: 290, records: 62400 },
  { id: 'snowflake', name: 'Snowflake', cat: 'Warehouse', status: 'off', rate: 120, records: 1200000 },
];

/** 180 days of daily net revenue ending Oct 7, 2026. */
export const REVENUE = (() => {
  const rnd = seeded(42);
  const end = new Date(2026, 9, 7);
  const season = [0.93, 1.01, 1.03, 1.03, 1.02, 1.0, 0.95];
  const out = [];
  for (let i = 0; i < 180; i++) {
    const d = new Date(end);
    d.setDate(end.getDate() - (179 - i));
    const trend = 11600 + i * 25 + Math.sin(i / 11) * 260;
    out.push({ d, v: trend * season[d.getDay()] * (1 + (rnd() - 0.5) * 0.05) });
  }
  return out;
})();

// Live events. `kind` + `amt` make the Overview numbers move by exactly what each event is worth.
export const EVENTS = [
  { type: 'payment.succeeded', text: 'Kestrel Logistics · $1,240', c: 'var(--good)', kind: 'paid', amt: 1240 },
  { type: 'automation.completed', text: 'Win-back · Orbitly', c: 'var(--violet-2)' },
  { type: 'user.signed_up', text: 'Mosaic Labs · 3 seats', c: 'var(--cyan)' },
  { type: 'invoice.payment_failed', text: 'Juniper & Vale · $760', c: 'var(--bad)', kind: 'failed', amt: 760 },
  { type: 'seats.updated', text: 'Lumen Health · 52 → 58 · +$108', c: 'var(--cyan)', kind: 'paid', amt: 108 },
  { type: 'payment.recovered', text: 'Juniper & Vale · $760 on retry 2', c: 'var(--good)', kind: 'recovered', amt: 760 },
  { type: 'health.changed', text: 'Northwind Ceramics · 78 → 71', c: 'var(--warn)' },
  { type: 'message.replied', text: 'Halden Studio · “Thanks, that worked”', c: 'var(--violet-2)' },
  { type: 'trial.started', text: 'Copperline Media · Growth plan', c: 'var(--cyan)' },
  { type: 'payment.succeeded', text: 'Tidewater Finance · $532', c: 'var(--good)', kind: 'paid', amt: 532 },
  { type: 'automation.completed', text: 'Onboarding · Mosaic Labs, step 2', c: 'var(--violet-2)' },
  { type: 'crm.deal_updated', text: 'Lumen Health · expansion $1,800', c: 'var(--cyan)' },
];
