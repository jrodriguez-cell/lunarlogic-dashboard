/**
 * Vercel Serverless Function: Automation Status
 * GET /api/automation-status
 *
 * Derives real WF1/WF2/WF3 status from the Google Sheets logs each n8n
 * workflow already writes to (Demo Data spreadsheet). No data is invented —
 * `connected: false` means the dashboard genuinely has no telemetry to show.
 */

import { getWF1ExecutionLog, getWF2ReminderLog, getWF3PaymentTracking } from './_lib/googleSheets.js';

const STALE_AFTER_MS = 36 * 60 * 60 * 1000; // 36h — WF2 only runs weekdays at 9am, so a Fri->Mon gap is normal

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [wf1Rows, wf2Rows, wf3Rows] = await Promise.all([
      getWF1ExecutionLog().catch((err) => {
        console.error('WF1 log read failed:', err.message);
        return null;
      }),
      getWF2ReminderLog().catch((err) => {
        console.error('WF2 log read failed:', err.message);
        return null;
      }),
      getWF3PaymentTracking().catch((err) => {
        console.error('WF3 log read failed:', err.message);
        return null;
      }),
    ]);

    res.status(200).json({
      wf1: summarizeWF1(wf1Rows),
      wf2: summarizeWF2(wf2Rows),
      wf3: summarizeWF3(wf3Rows),
    });
  } catch (error) {
    console.error('Automation status error:', error);
    res.status(500).json({ error: 'Failed to fetch automation status', message: error.message });
  }
}

function isStale(timestamp) {
  if (!timestamp) return true;
  const t = new Date(timestamp).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t > STALE_AFTER_MS;
}

function summarizeWF1(rows) {
  if (rows === null) {
    return { connected: false, reason: 'Could not read Execution_Log sheet' };
  }
  if (rows.length === 0) {
    return { connected: false, reason: 'No invoices logged yet' };
  }

  const last = rows[rows.length - 1];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7Days = rows.filter((r) => new Date(r.timestamp).getTime() >= sevenDaysAgo);

  return {
    connected: true,
    stale: isStale(last.timestamp),
    lastRun: last.timestamp,
    invoicesCreated7d: last7Days.length,
  };
}

function summarizeWF2(rows) {
  if (rows === null) {
    return { connected: false, reason: 'Could not read AR_Reminder_Log sheet' };
  }
  if (rows.length === 0) {
    return { connected: false, reason: 'No reminder activity logged yet' };
  }

  const last = rows[rows.length - 1];
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7Days = rows.filter((r) => new Date(r.eventTimestamp).getTime() >= sevenDaysAgo);
  const sentLast7Days = last7Days.filter((r) => r.skipReason === '' || r.skipReason == null);

  const byInvoice = {};
  for (const r of rows) {
    if (!r.invoiceNumber) continue;
    if (!byInvoice[r.invoiceNumber]) byInvoice[r.invoiceNumber] = [];
    byInvoice[r.invoiceNumber].push(r);
  }

  return {
    connected: true,
    stale: isStale(last.eventTimestamp),
    lastRun: last.eventTimestamp,
    remindersSent7d: sentLast7Days.length,
    // Per-invoice reminder history, keyed by invoice number, for matching
    // into ClientActionPlan/ClientCashForecast invoice rows.
    byInvoice,
  };
}

function summarizeWF3(rows) {
  if (rows === null) {
    return { connected: false, reason: 'Could not read Payment Tracking sheet' };
  }
  if (rows.length === 0) {
    return { connected: false, reason: 'No payment links sent yet' };
  }

  const last = rows[rows.length - 1];
  const applied = rows.filter((r) => r.qbPaymentApplied);
  const pending = rows.filter((r) => !r.qbPaymentApplied);

  return {
    connected: true,
    stale: isStale(last.timestamp),
    lastRun: last.timestamp,
    linksSent: rows.length,
    paymentsApplied: applied.length,
    pending: pending.length,
    // WF3 (QB native payment links) has no fuzzy-match/pending-review step —
    // QuickBooks reconciles the payment itself, so every applied row here
    // is a confirmed payment, not a guess.
    appliedPayments: applied.map((r) => ({
      txId: `wf3-${r.invoiceId}`,
      matchedCustomer: r.customerName,
      amount: r.amount,
      received: r.paidAt || r.timestamp,
      matchedInvoice: r.invoiceNumber,
      confidence: 100,
      status: 'Auto-Applied',
      rule: 'QuickBooks native payment link — reconciled automatically by QuickBooks',
    })),
  };
}
