/**
 * Shared cash-flow enrichment — single source of truth used by both
 * DashboardPage summary stats and CashFlowForecast chart/tiles.
 *
 * Expected receipt date logic:
 *   - Current invoices: due date + max(0, avgDays - 30)  (customer late-pay offset)
 *   - Overdue invoices: TODAY + deterministic jitter 7–21d (best-estimate collection)
 */

export const FORECAST_TODAY = new Date('2026-05-19');

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/**
 * Enriches open invoices with behavior-adjusted expected receipt dates.
 * Returns array with same shape as input plus:
 *   riskLevel, avgDays, isOverdue, expectedDate (Date), expectedDateStr (ISO string)
 */
export function enrichInvoices(invoices, paymentBehavior = []) {
  const open = invoices.filter(i => i.status !== 'Paid');
  return open.map(inv => {
    const beh      = paymentBehavior.find(b => b.customer === inv.customer);
    const avgDays  = beh?.avgDays ?? 30;
    const riskLevel = beh?.riskLevel ?? 'low';
    const dueDate  = new Date(inv.due + 'T00:00:00');
    const isOverdue = inv.daysOverdue > 0;

    const lateOffset    = Math.max(0, avgDays - 30);
    const overdueJitter = (inv.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % 15) + 7;
    const expectedDate  = isOverdue
      ? addDays(FORECAST_TODAY, overdueJitter)
      : addDays(dueDate, lateOffset);

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
 * Returns the subset of enriched invoices expected within `days` days of TODAY.
 */
export function forecastWithin(enriched, days) {
  const cutoff = addDays(FORECAST_TODAY, days);
  return enriched.filter(i => i.expectedDate <= cutoff);
}
