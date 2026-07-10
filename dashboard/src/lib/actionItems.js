/**
 * Single source of truth for the "what needs you today" action items, shared by
 * the nav badge (count), the condensed ActionQueue on each Dashboard, and the
 * full action-items listing. Computing them in one place guarantees the badge
 * always agrees with the list.
 *
 * Each item is grouped (a task), carries the underlying rows for the full list,
 * and a hint for the condensed queue's primary button (a drill for AR, a tab
 * to navigate to for AP).
 */
import { getPromises, isBroken } from './promises';

function fmtM(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
}

const INV_COLS = [
  { key: 'id', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
  { key: 'issued', label: 'Issued' },
  { key: 'due', label: 'Due Date' },
  { key: 'status', label: 'Status' },
  { key: 'daysOverdue', label: 'Days Overdue', render: v => v > 0 ? `${v}d` : '—', csvVal: r => r.daysOverdue > 0 ? r.daysOverdue : '' },
];

function getDisputeSuspects(invoices, paymentBehavior) {
  const pbMap = Object.fromEntries((paymentBehavior ?? []).map(p => [p.customer, p]));
  return invoices.filter(inv => {
    if (inv.status === 'Paid') return false;
    const pb = pbMap[inv.customer];
    if (inv.status === 'Viewed' && inv.daysOverdue > 7) return true;
    if (pb && pb.riskLevel === 'low' && inv.daysOverdue > pb.avgDays * 1.5) return true;
    if (pb && pb.riskLevel === 'medium' && inv.daysOverdue > pb.avgDays * 2) return true;
    return false;
  });
}

const invRow = inv => ({ id: inv.id, label: inv.customer, sub: inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : `due ${inv.due}`, amount: inv.amount });

/**
 * Receivables (AR) action items — grouped tasks, most urgent first.
 */
export function getARActionItems(data, clientId) {
  const invoices = data.invoices ?? [];
  const open = invoices.filter(i => i.status !== 'Paid');
  const payments = data.payments ?? [];
  const paymentDataAvailable = data.isLive ? data.automationStatus?.wf3?.connected === true : true;
  const pending = payments.filter(p => p.status === 'Pending Review');
  const pendingAmt = pending.reduce((s, p) => s + p.amount, 0);

  const reminderDataAvailable = open.some(i => i.reminders !== undefined || i.nextReminder !== undefined);
  const uncoveredInvs = open.filter(i => !((i.reminders?.length > 0) || i.nextReminder));
  const disputeSuspects = getDisputeSuspects(invoices, data.paymentBehavior);
  const disputeSet = new Set(disputeSuspects.map(i => i.id));
  const agingRiskInvs = invoices.filter(i => i.status === 'Overdue' && i.daysOverdue > 45 && !disputeSet.has(i.id));
  const agingSet = new Set(agingRiskInvs.map(i => i.id));
  const overdueUncovered = reminderDataAvailable
    ? uncoveredInvs.filter(i => i.daysOverdue > 0 && !disputeSet.has(i.id) && !agingSet.has(i.id))
    : [];
  const promises = getPromises(clientId);
  const brokenPromiseInvs = open.filter(i => isBroken(promises[i.id]));

  const sum = arr => arr.reduce((s, i) => s + i.amount, 0);
  const items = [];

  if (paymentDataAvailable && pending.length > 0) items.push({
    key: 'pending', tag: 'Confirm', color: '#f59e0b', weight: 100, amount: pendingAmt,
    title: `Confirm ${pending.length} payment${pending.length !== 1 ? 's' : ''}`,
    detail: `${fmtM(pendingAmt)} received but AI match was below 90% — tell LunarLogic which invoice it belongs to.`,
    rows: pending.map(p => ({ id: p.txId, label: p.matchedCustomer || 'Unmatched deposit', sub: `${p.confidence}% match`, amount: p.amount })),
    drill: {
      title: 'Unapplied Payments — Confirmation Needed',
      subtitle: `${pending.length} payment${pending.length !== 1 ? 's' : ''} · ${fmtM(pendingAmt)} held pending review`,
      source: 'LunarLogic auto-applies at ≥90% match confidence. Below that, your confirmation prevents misapplication.',
      filename: 'unapplied_payments',
      columns: [
        { key: 'txId', label: 'Transaction' }, { key: 'matchedCustomer', label: 'Customer' },
        { key: 'amount', label: 'Amount', render: v => `$${v.toLocaleString()}`, csvVal: r => r.amount },
        { key: 'confidence', label: 'Confidence', render: v => `${v}%` }, { key: 'rule', label: 'Why Held' },
      ],
      rows: pending,
    },
  });
  if (brokenPromiseInvs.length > 0) items.push({
    key: 'broken-promises', tag: 'Follow up', color: '#ef4444', weight: 95, amount: sum(brokenPromiseInvs),
    title: `Chase ${brokenPromiseInvs.length} broken promise${brokenPromiseInvs.length !== 1 ? 's' : ''} to pay`,
    detail: `${fmtM(sum(brokenPromiseInvs))} — the promised pay date has passed and the invoice is still open.`,
    rows: brokenPromiseInvs.map(invRow),
    drill: { title: 'Broken Promises to Pay', subtitle: `${fmtM(sum(brokenPromiseInvs))} · ${brokenPromiseInvs.length} invoice${brokenPromiseInvs.length !== 1 ? 's' : ''}`, source: 'Invoice data from QuickBooks Online.', filename: 'broken_promises', columns: INV_COLS, rows: brokenPromiseInvs },
  });
  if (disputeSuspects.length > 0) items.push({
    key: 'disputes', tag: 'Call', color: '#a78bfa', weight: 90, amount: sum(disputeSuspects),
    title: `Call ${disputeSuspects.length} customer${disputeSuspects.length !== 1 ? 's' : ''} about a possible dispute`,
    detail: `${fmtM(sum(disputeSuspects))} overdue off-pattern — a billing question may be stalling payment.`,
    rows: disputeSuspects.map(invRow),
    drill: { title: 'Possible Disputes — Anomalous Behavior', subtitle: `${disputeSuspects.length} flagged · ${fmtM(sum(disputeSuspects))}`, source: 'Invoice data from QuickBooks Online.', filename: 'possible_disputes', columns: INV_COLS, rows: disputeSuspects },
  });
  if (agingRiskInvs.length > 0) items.push({
    key: 'aging', tag: 'Escalate', color: '#f97316', weight: 80, amount: sum(agingRiskInvs),
    title: `Escalate ${agingRiskInvs.length} invoice${agingRiskInvs.length !== 1 ? 's' : ''} 45+ days overdue`,
    detail: `${fmtM(sum(agingRiskInvs))} at recovery risk — direct contact recommended before 90 days.`,
    rows: agingRiskInvs.map(invRow),
    drill: { title: 'Aging Risk — 45+ Days Overdue', subtitle: `${fmtM(sum(agingRiskInvs))} · ${agingRiskInvs.length} invoices`, source: 'Invoice data from QuickBooks Online.', filename: 'aging_risk', columns: INV_COLS, rows: agingRiskInvs },
  });
  if (overdueUncovered.length > 0) items.push({
    key: 'uncovered', tag: 'Follow up', color: '#f59e0b', weight: 70, amount: sum(overdueUncovered),
    title: `Follow up on ${overdueUncovered.length} invoice${overdueUncovered.length !== 1 ? 's' : ''} outside automation`,
    detail: `${fmtM(sum(overdueUncovered))} overdue and not in an automated reminder sequence.`,
    rows: overdueUncovered.map(invRow),
    drill: { title: 'Overdue — Outside Automation', subtitle: `${fmtM(sum(overdueUncovered))} · ${overdueUncovered.length} invoices`, source: 'Invoice data from QuickBooks Online.', filename: 'overdue_outside_automation', columns: INV_COLS, rows: overdueUncovered },
  });

  items.sort((a, b) => b.weight - a.weight);
  return items;
}

/**
 * Payables (AP) action items — grouped tasks, most urgent first.
 */
export function getAPActionItems(ap) {
  const sum = arr => arr.reduce((s, b) => s + b.amount, 0);
  const openBills   = ap.bills.filter(b => b.status !== 'paid');
  const reviewBills = ap.bills.filter(b => b.status === 'review');
  const approvedBills = ap.bills.filter(b => b.status === 'approved');
  const pastDueBills  = openBills.filter(b => b.daysToDue < 0);
  const missingW9   = ap.vendors.filter(v => v.needs1099 && !v.form1099Ready);

  const billRow = b => ({ id: b.id, label: b.vendor, sub: b.daysToDue < 0 ? `${-b.daysToDue}d past due` : `due in ${b.daysToDue}d`, amount: b.amount });
  const items = [];

  if (pastDueBills.length > 0) items.push({
    key: 'pastdue', tag: 'Pay', color: '#ef4444', weight: 100, amount: sum(pastDueBills), navTo: 'ap_payments', actionLabel: 'Go to payments',
    title: `Pay ${pastDueBills.length} bill${pastDueBills.length !== 1 ? 's' : ''} past due`,
    detail: 'Past their due date — release payment now to avoid late fees and protect terms.',
    rows: pastDueBills.map(billRow),
  });
  if (reviewBills.length > 0) items.push({
    key: 'review', tag: 'Review', color: '#f59e0b', weight: 90, amount: sum(reviewBills), navTo: 'ap_bills', actionLabel: 'Open bills',
    title: `Review & approve ${reviewBills.length} bill${reviewBills.length !== 1 ? 's' : ''}`,
    detail: 'Captured and AI-coded — confirm the GL code and route for payment.',
    rows: reviewBills.map(billRow),
  });
  if (ap.discountsAvailable > 0) items.push({
    key: 'discounts', tag: 'Capture', color: '#22c55e', weight: 80, amount: ap.discountsAvailable, navTo: 'ap_payments', actionLabel: 'Schedule',
    title: `Capture ${fmtM(ap.discountsAvailable)} in early-pay discounts`,
    detail: 'Discount windows still open on scheduled bills — pay inside the window to bank the savings.',
    rows: ap.bills.filter(b => b.discountEligible).map(billRow),
  });
  if (approvedBills.length > 0) items.push({
    key: 'schedule', tag: 'Schedule', color: '#818CF8', weight: 70, amount: sum(approvedBills), navTo: 'ap_payments', actionLabel: 'Payments',
    title: `Schedule ${approvedBills.length} approved bill${approvedBills.length !== 1 ? 's' : ''}`,
    detail: 'Approved and ready — batch into the next payment run timed to your target DPO.',
    rows: approvedBills.map(billRow),
  });
  if (missingW9.length > 0) items.push({
    key: 'w9', tag: 'Compliance', color: '#f59e0b', weight: 60, amount: 0, navTo: 'ap_vendors', actionLabel: 'Vendors',
    title: `Request a W-9 from ${missingW9.length} vendor${missingW9.length !== 1 ? 's' : ''}`,
    detail: `Reportable vendor${missingW9.length !== 1 ? 's' : ''} missing a W-9 — collect now to stay 1099-ready.`,
    rows: missingW9.map(v => ({ id: v.vendor, label: v.vendor, sub: 'W-9 needed for 1099', amount: v.openAmount })),
  });

  items.sort((a, b) => b.weight - a.weight);
  return items;
}
