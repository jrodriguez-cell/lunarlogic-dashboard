/* eslint-env node */
/**
 * n8n workflow trigger helper.
 *
 * The dashboard is the front end; real work (QuickBooks writes, AI parsing,
 * emails) happens in n8n workflows triggered by webhook. This module maps a
 * stable workflow key to a webhook URL supplied via env, so URLs/secrets live
 * in Vercel config, never in the bundle.
 *
 * Env vars (set per workflow in Vercel; leave unset to keep that action in
 * demo/fallback mode):
 *   N8N_WEBHOOK_INVOICE_CREATE   full n8n Production webhook URL
 *   N8N_WEBHOOK_INVOICE_DRAFT    full n8n Production webhook URL
 *   N8N_WEBHOOK_TOKEN            optional shared secret sent as
 *                                Authorization: Bearer <token> (pair with an
 *                                n8n Header Auth credential on the webhook)
 */

const WEBHOOKS = {
  invoice_create:    process.env.N8N_WEBHOOK_INVOICE_CREATE,
  invoice_draft:     process.env.N8N_WEBHOOK_INVOICE_DRAFT,
  ai_invoice_draft:  process.env.N8N_WEBHOOK_AI_INVOICE_DRAFT,
  ai_payment_match:  process.env.N8N_WEBHOOK_AI_PAYMENT_MATCH,
  ai_reminder_draft: process.env.N8N_WEBHOOK_AI_REMINDER_DRAFT,
  ai_assistant:      process.env.N8N_WEBHOOK_AI_ASSISTANT,
};

export function isWorkflowConfigured(key) {
  return Boolean(WEBHOOKS[key]);
}

/**
 * POST a payload to an n8n workflow webhook.
 * Returns { configured:false } if no URL is set for the key (caller decides
 * the fallback), or { configured:true, ok:true, data } on success.
 */
export async function triggerWorkflow(key, payload) {
  const url = WEBHOOKS[key];
  if (!url) return { configured: false };

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.N8N_WEBHOOK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.N8N_WEBHOOK_TOKEN}`;
  }

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const text = await resp.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  if (!resp.ok) {
    throw new Error(`n8n workflow "${key}" failed: ${resp.status} ${text.slice(0, 300)}`);
  }
  return { configured: true, ok: true, data };
}
