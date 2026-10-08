// Reusable accessible controls: roving-tabindex radio groups and tab lists.

/**
 * Turn a [role=radiogroup] of [role=radio] buttons into a keyboard-friendly segmented control.
 * @returns {{set:(btn:HTMLElement)=>void}}
 */
export function radioGroup(group, onChange) {
  const items = [...group.querySelectorAll('[role="radio"]')];
  const set = (btn, focus = false) => {
    items.forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (focus) btn.focus();
    onChange(btn);
  };
  group.addEventListener('click', (e) => {
    const b = e.target.closest('[role="radio"]');
    if (b && b.getAttribute('aria-checked') !== 'true') set(b);
  });
  group.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    set(items[(i + step + items.length) % items.length], true);
  });
  return { set };
}

/** Tabs with arrow / Home / End navigation. */
export function tabs(list, onChange) {
  const items = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab, focus = false) => {
    items.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
    onChange?.(tab);
  };
  list.addEventListener('click', (e) => {
    const t = e.target.closest('[role="tab"]');
    if (t) select(t);
  });
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const map = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    select(items[(map[e.key] + items.length) % items.length], true);
  });
  return { select };
}
