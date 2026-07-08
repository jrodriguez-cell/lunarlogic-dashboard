// Promise-to-Pay store. A promise is a date a customer committed to pay an
// invoice. Kept per-client in localStorage so the dashboard can surface it and
// flag broken promises without a backend read (the CustomerPanel also logs the
// promise to the activity sheet for the record). Matches the collections
// primitive competitors headline ("broken promises to pay").

const key = cid => `ll_promises_${cid || 'demo'}`;

export function getPromises(cid) {
  try { return JSON.parse(localStorage.getItem(key(cid))) || {}; }
  catch { return {}; }
}

export function setPromise(cid, invoiceId, dateISO) {
  const all = getPromises(cid);
  if (dateISO) all[invoiceId] = dateISO; else delete all[invoiceId];
  try { localStorage.setItem(key(cid), JSON.stringify(all)); } catch { /* private mode */ }
  return all;
}

export function promiseDate(cid, invoiceId) {
  return getPromises(cid)[invoiceId] || null;
}

// A promise is "broken" once its date has passed (relative to the dashboard's
// reference date) and the invoice is still open.
export function isBroken(dateISO, todayISO) {
  if (!dateISO) return false;
  return dateISO < (todayISO || new Date().toISOString().split('T')[0]);
}
