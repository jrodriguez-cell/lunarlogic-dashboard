/**
 * Shared invoice enrichment for cash flow forecasting.
 *
 * Expected receipt date is assigned by AR AGING BUCKET — not behavior adjustment.
 * This keeps the forecast mathematically consistent with the AR Aging table:
 *
 *   Current  (daysOverdue ≤ 0)  →  actual due date
 *   1–30d overdue               →  TODAY + 0–29 days  (active collection)
 *   31–60d overdue              →  TODAY + 30–59 days
 *   61–90d overdue              →  TODAY + 60–89 days
 *   90+d overdue                →  TODAY + 90–119 days (at-risk)
 *
 * Jitter within each window is deterministic (based on invoice ID) to
 * spread bars evenly in the chart without randomness.
 *
 * Summary tiles therefore agree with AR Aging:
 *   Next 30 Days  =  Current bucket only (daysOverdue ≤ 0)
 *   Next 60 Days  =  Current + 1–30d overdue
 *   Next 90 Days  =  Current + 1–30d + 31–60d overdue
 *   At-Risk       =  61–90d + 90+ overdue
 */

export const FORECAST_TODAY = new Date('2026-05-19');

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function idJitter(id, range) {
  const sum = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return sum % range;
}

export function enrichInvoices(invoices, paymentBehavior = []) {
  const open = invoices.filter(i => i.status !== 'Paid');
  return open.map(inv => {
    const beh      = paymentBehavior.find(b => b.customer === inv.customer);
    const riskLevel = beh?.riskLevel ?? 'low';
    const avgDays  = beh?.avgDays ?? 30;
    const isOverdue = inv.daysOverdue > 0;
    const dueDate  = new Date(inv.due + 'T00:00:00');

    let expectedDate;
    if (!isOverdue) {
      expectedDate = dueDate;
    } else if (inv.daysOverdue <= 30) {
      expectedDate = addDays(FORECAST_TODAY, idJitter(inv.id, 30));
    } else if (inv.daysOverdue <= 60) {
      expectedDate = addDays(FORECAST_TODAY, 30 + idJitter(inv.id, 30));
    } else if (inv.daysOverdue <= 90) {
      expectedDate = addDays(FORECAST_TODAY, 60 + idJitter(inv.id, 30));
    } else {
      expectedDate = addDays(FORECAST_TODAY, 90 + idJitter(inv.id, 30));
    }

    return {
      ...inv,
      riskLevel,
      avgDays,
      isOverdue,
      expectedDate,
      expectedDateStr: expectedDate.toISOString().split('T')[0],
    };
  });
}

/**
 * Returns invoices expected within `days` days — keyed off daysOverdue bucket
 * thresholds to match the AR Aging table exactly:
 *
 *   days=30  → daysOverdue ≤ 0   (Current bucket)
 *   days=60  → daysOverdue ≤ 30  (Current + 1-30d)
 *   days=90  → daysOverdue ≤ 60  (Current + 1-30d + 31-60d)
 */
export function forecastWithin(enriched, days) {
  if (days <= 30)  return enriched.filter(i => i.daysOverdue <= 0);
  if (days <= 60)  return enriched.filter(i => i.daysOverdue <= 30);
  return enriched.filter(i => i.daysOverdue <= 60);
}
