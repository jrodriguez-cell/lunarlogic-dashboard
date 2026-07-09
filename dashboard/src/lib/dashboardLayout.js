// Per-client Dashboard widget preferences, persisted in localStorage.
// Stores the set of widget ids the user has chosen to show. When nothing is
// stored, every widget is shown (callers pass the full default list).

const key = cid => `ll_dashwidgets_${cid || 'anon'}`;

export function getEnabledWidgets(cid, allIds) {
  try {
    const raw = localStorage.getItem(key(cid));
    if (!raw) return allIds;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return allIds;
    // Keep only ids that still exist, preserving the canonical order.
    return allIds.filter(id => saved.includes(id));
  } catch {
    return allIds;
  }
}

export function setEnabledWidgets(cid, ids) {
  try {
    localStorage.setItem(key(cid), JSON.stringify(ids));
  } catch {
    /* ignore quota / disabled storage */
  }
}
