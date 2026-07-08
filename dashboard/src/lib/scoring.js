// Payment Health Score — a 0–100 read on how reliably a customer / invoice
// will pay (higher = pays sooner & more reliably). Fulfills the "payment
// prediction scoring" the Mission doc lists for the AR Dashboard module.
// Derived from the payment-behavior signals already in the data (avg days to
// pay, trend, risk level) plus how overdue a given invoice is.

function clamp(n) { return Math.max(2, Math.min(99, Math.round(n))); }

export function customerScore(pb) {
  if (!pb) return null;
  let s = 100 - Math.max(0, pb.avgDays - 12) * 1.15; // ~12d→100, 30d→79, 45d→62, 60d→45, 75d→28
  s -= (pb.trend ?? 0) * 1.6;                          // worsening (positive trend) lowers the score
  if (pb.riskLevel === 'high') s = Math.min(s, 52);
  if (pb.riskLevel === 'low')  s = Math.max(s, 66);
  return clamp(s);
}

export function invoiceScore(inv, pb) {
  let s = customerScore(pb);
  if (s == null) s = 70;
  if (inv.daysOverdue > 0) s -= Math.min(48, inv.daysOverdue * 0.75);
  else if (inv.status === 'Viewed') s += 3; // opened but not yet due = mild positive signal
  return clamp(s);
}

export function scoreBand(s) {
  if (s == null) return { label: 'No history', color: 'var(--muted)' };
  if (s >= 72) return { label: 'Likely on time', color: '#22c55e' };
  if (s >= 48) return { label: 'Watch', color: '#f59e0b' };
  return { label: 'At risk', color: '#ef4444' };
}
