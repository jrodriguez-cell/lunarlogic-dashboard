/**
 * Vercel Serverless Function: Create / Draft Invoice
 * POST /api/create-invoice
 *
 * For live-connected clients only (currently the QB sandbox). Routing:
 *   mode: 'send'  → n8n invoice_create workflow if configured, else create
 *                    the invoice directly in QuickBooks.
 *   mode: 'draft' → n8n invoice_draft workflow if configured, else no-op
 *                    (QuickBooks has no first-class draft via this API; the
 *                    frontend shows a local confirmation).
 *
 * Demo logins never reach this endpoint — the frontend keeps them local and
 * this route refuses any clientId not in the live allowlist.
 */

import { qbApiRequest } from './_lib/quickbooks.js';
import { triggerWorkflow, isWorkflowConfigured } from './_lib/n8n.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);
const MINOR = 'minorversion=73';

function qbEscape(s) { return String(s).replace(/'/g, "\\'"); }

async function resolveCustomer(name, clientId) {
  const q = encodeURIComponent(`SELECT Id, DisplayName FROM Customer WHERE DisplayName = '${qbEscape(name)}'`);
  const found = await qbApiRequest(`/query?query=${q}&${MINOR}`, {}, clientId);
  const existing = found.QueryResponse?.Customer?.[0];
  if (existing) return existing.Id;
  const created = await qbApiRequest(`/customer?${MINOR}`, {
    method: 'POST', body: JSON.stringify({ DisplayName: name }),
  }, clientId);
  return created.Customer.Id;
}

async function resolveItemRef(clientId) {
  const q = encodeURIComponent("SELECT Id, Name FROM Item WHERE Type = 'Service' MAXRESULTS 1");
  const res = await qbApiRequest(`/query?query=${q}&${MINOR}`, {}, clientId);
  const item = res.QueryResponse?.Item?.[0];
  if (item) return { value: item.Id, name: item.Name };
  const anyRes = await qbApiRequest(`/query?query=${encodeURIComponent('SELECT Id, Name FROM Item MAXRESULTS 1')}&${MINOR}`, {}, clientId);
  const anyItem = anyRes.QueryResponse?.Item?.[0];
  if (anyItem) return { value: anyItem.Id, name: anyItem.Name };
  throw new Error('No QuickBooks Item found to attach line items to');
}

async function createInQuickBooks({ customer, cleanLines, dueDate, txnDate, docNumber, notes, clientId }) {
  const [customerId, itemRef] = await Promise.all([
    resolveCustomer(customer, clientId),
    resolveItemRef(clientId),
  ]);
  const Line = cleanLines.map(l => ({
    DetailType: 'SalesItemLineDetail',
    Amount: Math.round(l.qty * l.rate * 100) / 100,
    Description: l.description,
    SalesItemLineDetail: { ItemRef: itemRef, Qty: l.qty, UnitPrice: l.rate },
  }));
  const invoiceBody = {
    CustomerRef: { value: customerId },
    Line,
    ...(dueDate ? { DueDate: dueDate } : {}),
    ...(txnDate ? { TxnDate: txnDate } : {}),
    ...(docNumber ? { DocNumber: String(docNumber) } : {}),
    ...(notes ? { CustomerMemo: { value: notes } } : {}),
  };
  const created = await qbApiRequest(`/invoice?${MINOR}`, { method: 'POST', body: JSON.stringify(invoiceBody) }, clientId);
  const inv = created.Invoice;
  return { id: inv.Id, docNumber: inv.DocNumber ?? null, total: inv.TotalAmt ?? null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, customer, dueDate, txnDate, docNumber, notes, lines, mode = 'send' } = body;

  if (!clientId || !LIVE_CLIENTS.has(clientId)) {
    return res.status(403).json({ error: 'Invoice creation is only enabled for live-connected clients.' });
  }
  if (!customer) return res.status(400).json({ error: 'A customer is required.' });

  const cleanLines = (lines || [])
    .map(l => ({ description: l.description || '', qty: Number(l.qty) || 0, rate: Number(l.rate) || 0 }))
    .filter(l => l.qty > 0 && l.rate > 0);
  if (cleanLines.length === 0) return res.status(400).json({ error: 'At least one line item with a quantity and rate is required.' });

  const total = cleanLines.reduce((s, l) => s + l.qty * l.rate, 0);
  const payload = { clientId, customer, docNumber, txnDate, dueDate, notes, lines: cleanLines, total, mode, source: 'dashboard' };

  try {
    // Draft: only n8n handles this; no direct QuickBooks equivalent.
    if (mode === 'draft') {
      if (isWorkflowConfigured('invoice_draft')) {
        const r = await triggerWorkflow('invoice_draft', payload);
        return res.status(200).json({ ok: true, via: 'n8n', docNumber: r.data?.docNumber ?? docNumber ?? null });
      }
      return res.status(200).json({ ok: true, via: 'local', docNumber: docNumber ?? null });
    }

    // Send: prefer the n8n workflow (which can run AI + QuickBooks + email),
    // otherwise create directly in QuickBooks.
    if (isWorkflowConfigured('invoice_create')) {
      const r = await triggerWorkflow('invoice_create', payload);
      return res.status(200).json({ ok: true, via: 'n8n', docNumber: r.data?.docNumber ?? docNumber ?? null, total: r.data?.total ?? total });
    }

    const result = await createInQuickBooks({ customer, cleanLines, dueDate, txnDate, docNumber, notes, clientId });
    return res.status(200).json({ ok: true, via: 'quickbooks', ...result, customer });
  } catch (err) {
    console.error('create-invoice error:', err);
    return res.status(500).json({ error: 'Failed to create invoice', message: err.message });
  }
}
