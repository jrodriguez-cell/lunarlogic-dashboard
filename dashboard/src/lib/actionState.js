/**
 * Local persistence for the action queue: which action items the user has
 * cleared ("done"), and who each task is assigned to. Demo-grade — stored in
 * localStorage per client, keyed by suite so Receivables and Payables don't
 * collide. In production these would be a shared task store so assignments are
 * visible to the whole team.
 */

// Demo team roster available to assign action items to.
export const TEAM = ['You', 'Alex Chen', 'Jordan Rivera', 'Sam Patel', 'Morgan Lee'];
export const UNASSIGNED = 'Unassigned';

function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore quota / private mode */ }
}

// ── Cleared ("done") action items ───────────────────────────────────────
function clearedKey(clientId, suite) { return `ll_cleared_${clientId}_${suite}`; }

export function getCleared(clientId, suite) {
  return new Set(readJSON(clearedKey(clientId, suite), []));
}
export function saveCleared(clientId, suite, set) {
  writeJSON(clearedKey(clientId, suite), [...set]);
}

// ── Task assignments ────────────────────────────────────────────────────
function assignKey(clientId) { return `ll_assign_${clientId}`; }

export function getAssignments(clientId) {
  return readJSON(assignKey(clientId), {});
}
export function setAssignment(clientId, suite, itemKey, assignee) {
  const all = getAssignments(clientId);
  const k = `${suite}:${itemKey}`;
  if (!assignee || assignee === UNASSIGNED) delete all[k];
  else all[k] = assignee;
  writeJSON(assignKey(clientId), all);
  return all;
}
export function assignmentFor(assignments, suite, itemKey) {
  return assignments[`${suite}:${itemKey}`] || UNASSIGNED;
}
