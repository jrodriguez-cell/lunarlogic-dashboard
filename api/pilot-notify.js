/**
 * Vercel Serverless Function: Pilot Notify
 * POST /api/pilot-notify
 *
 * Sends an email notification to support@lunarlogic.ai when someone clicks
 * "Start the Pilot" in the Gualapack payment reminder demo. Mirrors the Resend
 * configuration used elsewhere in the project (onboarding/src/lib/email.ts):
 * server-side send with RESEND_API_KEY, from "LunarLogic <onboarding@resend.dev>".
 *
 * Calls the Resend REST API directly via global fetch (Node 20) so no extra
 * npm dependency is needed. CORS is open so the standalone demo file (served
 * from file:// or any host) can reach it.
 *
 * Required env var: RESEND_API_KEY  (same key the rest of the site uses)
 * Optional env var: NOTIFY_EMAIL    (defaults to support@lunarlogic.ai)
 */

export default async function handler(req, res) {
  // CORS — the demo is a standalone file, so allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const company = (body.company || 'Gualapack North America').toString().slice(0, 120);
    const to = process.env.NOTIFY_EMAIL || 'support@lunarlogic.ai';

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'LunarLogic <onboarding@resend.dev>',
        to,
        subject: `Pilot request: ${company}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F172A;color:#E2E8F0;padding:28px;border-radius:12px;">
            <h1 style="color:#60A5FA;margin:0 0 6px;font-size:20px;">New Pilot Request</h1>
            <p style="color:#94A3B8;margin:0 0 20px;">From the payment reminder demo</p>
            <div style="background:#1E293B;border-radius:8px;padding:16px;">
              <p style="margin:0;"><strong>${company}</strong> clicked <strong>Start the Pilot</strong>.</p>
              <p style="margin:10px 0 0;color:#94A3B8;font-size:13px;">Follow up to schedule the 90 day pilot.</p>
            </div>
          </div>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Resend send failed', detail });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
