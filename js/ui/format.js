// Number and date formatting shared by the product simulation and other sections.
export const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
export const moneyK = (n) => (n >= 1000 ? '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : money(n));
export const pct = (n, d = 1) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) + '%';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const shortDate = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Small deterministic PRNG so sample data is identical on every load. */
export function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const healthColor = (h) => (h >= 75 ? 'var(--good)' : h >= 50 ? 'var(--warn)' : 'var(--bad)');
