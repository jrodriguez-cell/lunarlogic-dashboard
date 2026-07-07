/**
 * Vercel Serverless Function: AR Insights
 * POST /api/ar-insights
 *
 * Generates a short AI narrative summarizing the last 30 days of AR
 * performance for the Report Card tab, using metrics already computed
 * client-side (no raw QuickBooks data leaves the browser).
 *
 * Cached in Vercel KV for 24h per clientId — the dashboard auto-refreshes
 * every 15 min, but the monthly summary doesn't need to regenerate that
 * often, so this keeps Anthropic API spend proportional to clients, not
 * page views.
 *
 * Requires ANTHROPIC_API_KEY env var.
 */

import { kv } from '@vercel/kv';
import { verifyClient, sendAuthError } from './_lib/clerkAuth.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-haiku-20241022';
const CACHE_TTL_SECONDS = 24 * 60 * 60;

function cacheKey(clientId) {
  const today = new Date().toISOString().split('T')[0];
  return `ar_insight:${clientId}:${today}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  // clientId is bound to the verified session — the cache is keyed by it, so it
  // must not be spoofable via the request body.
  let clientId;
  try {
    ({ clientId } = await verifyClient(req));
  } catch (err) {
    return sendAuthError(res, err);
  }

  const { clientName, metrics } = req.body || {};

  if (!metrics) {
    return res.status(400).json({ error: 'metrics are required' });
  }

  const key = cacheKey(clientId);
  const cached = await kv.get(key);
  if (cached) {
    return res.status(200).json({ insight: cached, cached: true });
  }

  const prompt = `You are writing the opening summary paragraph of a monthly AR (accounts receivable) performance report for "${clientName || 'this client'}", to be shared with their accountant or leadership team.

Here are the last-30-day metrics:
${JSON.stringify(metrics, null, 2)}

Write a concise 3-4 sentence executive summary highlighting the most important trends — DSO movement, collection performance, automation impact, and any risk (e.g. bad debt or overdue concentration) worth flagging. Be specific with the numbers provided. Plain prose, no headers or bullet points, no markdown formatting. Confident, factual tone — this is a client-facing report, not marketing copy.`;

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errText}`);
    }

    const result = await response.json();
    const insight = result.content?.[0]?.text?.trim();

    if (!insight) {
      throw new Error('No insight text returned from Anthropic API');
    }

    await kv.set(key, insight, { ex: CACHE_TTL_SECONDS });

    res.status(200).json({ insight, cached: false });
  } catch (error) {
    console.error('AR insights generation error:', error);
    res.status(500).json({ error: 'Failed to generate AR insights', message: error.message });
  }
}
