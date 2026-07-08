/**
 * Vercel Serverless Function: Invoice Pay Link
 * POST /api/invoice-paylink
 *
 * Returns the customer-facing QuickBooks payment link for an invoice, for the
 * live sandbox client only. Demo logins never call this (the frontend uses a
 * placeholder link). If the invoice has no online-payment link enabled in
 * QuickBooks, returns { ok:true, link:null } with a reason.
 */

import { getInvoiceLink } from './_lib/quickbooks.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, invoiceId } = body;

  if (!clientId || !LIVE_CLIENTS.has(clientId)) {
    return res.status(403).json({ error: 'Live pay links are only available for live-connected clients.' });
  }
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId (QuickBooks Id) is required.' });

  try {
    const link = await getInvoiceLink(invoiceId, clientId);
    if (!link) {
      return res.status(200).json({ ok: true, link: null, reason: 'No online payment link on this invoice — enable QuickBooks Payments / online payment for it.' });
    }
    return res.status(200).json({ ok: true, link });
  } catch (err) {
    console.error('invoice-paylink error:', err);
    return res.status(502).json({ error: 'Failed to fetch pay link', message: err.message });
  }
}
