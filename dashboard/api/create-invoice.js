/**
 * Vercel Serverless Function: Create Invoice
 * POST /api/create-invoice
 *
 * Creates a real invoice in QuickBooks for live-connected clients only
 * (currently just the QB sandbox). All other clients are demo-only and must
 * not reach this endpoint — the frontend keeps them local, and this route
 * refuses any clientId that isn't explicitly live as defense in depth.
 */

import { qbApiRequest } from './_lib/quickbooks.js';

// Clients with a real QuickBooks connection. Keep in sync with the frontend
// LIVE_CLIENTS set in src/lib/quickbooks.js.
const LIVE_CLIENTS = new Set(['qbsandbox']);

const MINOR = 'minorversion=73';

function qbEscape(s) {
  return String(s).replace(/'/g, "\\'");
}

/** Find a customer by display name, or create one if it doesn't exist. */
async function resolveCustomer(name, clientId) {
  const q = encodeURIComponent(`SELECT Id, DisplayName FROM Customer WHERE DisplayName = '${qbEscape(name)}'`);
  const found = await qbApiRequest(`/query?query=${q}&${MINOR}`, {}, clientId);
  const existing = found.QueryResponse?.Customer?.[0];
  if (existing) return existing.Id;

  const created = await qbApiRequest(`/customer?${MINOR}`, {
    method: 'POST',
    body: JSON.stringify({ DisplayName: name }),
  }, clientId);
  return created.Customer.Id;
}

/** Pick a Service item to attach line items to (QBO requires an ItemRef). */
async function resolveItemRef(clientId) {
  const q = encodeURIComponent("SELECT Id, Name FROM Item WHERE Type = 'Service' MAXRESULTS 1");
  const res = await qbApiRequest(`/query?query=${q}&${MINOR}`, {}, clientId);
  const item = res.QueryResponse?.Item?.[0];
  if (item) return { value: item.Id, name: item.Name };
  // Fall back to any item
  const anyRes = await qbApiRequest(`/query?query=${encodeURIComponent('SELECT Id, Name FROM Item MAXRESULTS 1')}&${MINOR}`, {}, clientId);
  const anyItem = anyRes.QueryResponse?.Item?.[0];
  if (anyItem) return { value: anyItem.Id, name: anyItem.Name };
  throw new Error('No QuickBooks Item found to attach line items to');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, customer, dueDate, txnDate, docNumber, notes, lines } = body;

  if (!clientId || !LIVE_CLIENTS.has(clientId)) {
    return res.status(403).json({ error: 'Invoice creation is only enabled for live-connected clients.' });
  }
  if (!customer) return res.status(400).json({ error: 'A customer is required.' });
  const cleanLines = (lines || [])
    .map(l => ({ description: l.description || '', qty: Number(l.qty) || 0, rate: Number(l.rate) || 0 }))
    .filter(l => l.qty > 0 && l.rate > 0);
  if (cleanLines.length === 0) return res.status(400).json({ error: 'At least one line item with a quantity and rate is required.' });

  try {
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

    const created = await qbApiRequest(`/invoice?${MINOR}`, {
      method: 'POST',
      body: JSON.stringify(invoiceBody),
    }, clientId);

    const inv = created.Invoice;
    return res.status(200).json({
      ok: true,
      id: inv.Id,
      docNumber: inv.DocNumber ?? null,
      total: inv.TotalAmt ?? null,
      customer,
    });
  } catch (err) {
    console.error('create-invoice error:', err);
    return res.status(500).json({ error: 'Failed to create invoice in QuickBooks', message: err.message });
  }
}
