// Minimal shared state for the simulated workspace, so panels stay consistent with each other.
import { AUTOMATIONS, INTEGRATIONS } from './data.js';

export function createStore() {
  const state = {
    automations: AUTOMATIONS.map((a) => ({ ...a })),
    integrations: INTEGRATIONS.map((i) => ({ ...i })),
  };
  const subs = new Set();
  return {
    state,
    emit() { subs.forEach((fn) => fn(state)); },
    subscribe(fn) { subs.add(fn); fn(state); return () => subs.delete(fn); },
  };
}

export const activeAutomations = (s) => s.automations.filter((a) => a.on);
export const liveSources = (s) => s.integrations.filter((i) => i.status === 'on' || i.status === 'confirm');
