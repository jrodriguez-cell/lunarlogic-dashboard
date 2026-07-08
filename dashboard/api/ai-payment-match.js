/**
 * POST /api/ai-payment-match
 * Suggests which invoice a below-threshold payment belongs to, via the n8n
 * ai_payment_match workflow. Live-clients-only; returns { configured:false }
 * when the workflow isn't set so the frontend uses its local heuristic.
 */
import { triggerWorkflow, isWorkflowConfigured } from './_lib/n8n.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, payment } = body;
  if (!clientId || !LIVE_CLIENTS.has(clientId)) return res.status(403).json({ error: 'AI matching is only enabled for live-connected clients.' });
  if (!payment) return res.status(400).json({ error: 'A payment is required.' });
  if (!isWorkflowConfigured('ai_payment_match')) return res.status(200).json({ configured: false });
  try {
    const r = await triggerWorkflow('ai_payment_match', { clientId, payment, source: 'dashboard' });
    const s = r.data?.suggestion ?? r.data;
    return res.status(200).json({ ok: true, suggestion: s });
  } catch (err) {
    console.error('ai-payment-match error:', err);
    return res.status(502).json({ error: 'AI match workflow failed', message: err.message });
  }
}
