/**
 * Vercel Serverless Function: AI Invoice Draft
 * POST /api/ai-draft-invoice
 *
 * Turns a plain-English description into a structured invoice draft by
 * triggering the n8n ai_invoice_draft workflow (WF1B text path — Claude/OpenAI
 * parsing lives in n8n, per the backend architecture). The dashboard only
 * sends the text; n8n returns { draft: { customer, lines, netDays } }.
 *
 * Live-clients-only. When the workflow isn't configured this returns
 * { configured:false } and the frontend falls back to a local demo parse.
 */

import { triggerWorkflow, isWorkflowConfigured } from './_lib/n8n.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, text } = body;

  if (!clientId || !LIVE_CLIENTS.has(clientId)) {
    return res.status(403).json({ error: 'AI drafting is only enabled for live-connected clients.' });
  }
  if (!text || !text.trim()) return res.status(400).json({ error: 'A description is required.' });

  if (!isWorkflowConfigured('ai_invoice_draft')) {
    return res.status(200).json({ configured: false });
  }

  try {
    const r = await triggerWorkflow('ai_invoice_draft', { clientId, text, source: 'dashboard' });
    // Expected n8n response: { draft: { customer, lines:[{description,qty,rate}], netDays } }
    const draft = r.data?.draft ?? r.data;
    return res.status(200).json({ ok: true, draft });
  } catch (err) {
    console.error('ai-draft-invoice error:', err);
    return res.status(502).json({ error: 'AI draft workflow failed', message: err.message });
  }
}
