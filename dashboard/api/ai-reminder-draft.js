/**
 * POST /api/ai-reminder-draft
 * Drafts reminder email copy for an invoice via the n8n ai_reminder_draft
 * workflow. Live-clients-only; returns { configured:false } when unset so the
 * frontend uses its local template.
 */
import { triggerWorkflow, isWorkflowConfigured } from './_lib/n8n.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, invoice, tone } = body;
  if (!clientId || !LIVE_CLIENTS.has(clientId)) return res.status(403).json({ error: 'AI reminder drafting is only enabled for live-connected clients.' });
  if (!invoice) return res.status(400).json({ error: 'An invoice is required.' });
  if (!isWorkflowConfigured('ai_reminder_draft')) return res.status(200).json({ configured: false });
  try {
    const r = await triggerWorkflow('ai_reminder_draft', { clientId, invoice, tone, source: 'dashboard' });
    const d = r.data?.draft ?? r.data;
    return res.status(200).json({ ok: true, draft: d });
  } catch (err) {
    console.error('ai-reminder-draft error:', err);
    return res.status(502).json({ error: 'AI reminder draft workflow failed', message: err.message });
  }
}
