/**
 * Vercel Serverless Function: AI AR Assistant
 * POST /api/ai-assistant
 *
 * Answers a natural-language question about the client's AR using the n8n
 * ai_assistant workflow (AI lives in n8n). The dashboard sends the question
 * plus a compact, pre-computed metrics context — no raw QuickBooks rows.
 *
 * Live-clients-only. Returns { configured:false } when the workflow isn't set,
 * so the frontend falls back to its local answer engine (also used for demo
 * logins).
 */

import { triggerWorkflow, isWorkflowConfigured } from './_lib/n8n.js';

const LIVE_CLIENTS = new Set(['qbsandbox']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { clientId, question, context } = body;

  if (!clientId || !LIVE_CLIENTS.has(clientId)) {
    return res.status(403).json({ error: 'The AI assistant is only enabled for live-connected clients.' });
  }
  if (!question || !question.trim()) return res.status(400).json({ error: 'A question is required.' });

  if (!isWorkflowConfigured('ai_assistant')) {
    return res.status(200).json({ configured: false });
  }

  try {
    const r = await triggerWorkflow('ai_assistant', { clientId, question, context, source: 'dashboard' });
    const answer = r.data?.answer ?? r.data?.text ?? (typeof r.data === 'string' ? r.data : null);
    return res.status(200).json({ ok: true, answer });
  } catch (err) {
    console.error('ai-assistant error:', err);
    return res.status(502).json({ error: 'AI assistant workflow failed', message: err.message });
  }
}
