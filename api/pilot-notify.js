/**
 * Vercel Serverless Function: Pilot Notify
 * POST /api/pilot-notify
 *
 * Sends an internal lead notification to support@lunarlogic.ai when someone
 * clicks "Start the Pilot" in the Gualapack payment reminder demo.
 *
 * Follows the LunarLogic website's Resend email integration exactly
 * (Website Email Integration reference): plain fetch to the Resend REST API,
 * no SDK, Authorization: Bearer ${RESEND_API_KEY}, from
 * "LunarLogic Website <onboarding@resend.dev>", to support@lunarlogic.ai.
 * Same contract as Form 1 (Contact) — one internal email per submission.
 *
 * Required env var: RESEND_API_KEY  (the same key the marketing site uses;
 * reusable across apps under the same Resend account). If missing, returns
 * HTTP 500 "Email service not configured".
 *
 * CORS is open so the standalone demo file (served from file:// or any host)
 * can reach it.
 */

export default async function handler(req, res) {
  // CORS — the demo is a standalone file, so allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.RESEND_API_KEY) {
    console.error('pilot-notify: RESEND_API_KEY missing');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const company = (body.company || 'Gualapack North America').toString().slice(0, 120);

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LunarLogic Website <onboarding@resend.dev>',
        to: ['support@lunarlogic.ai'],
        subject: `Pilot Request: ${company}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0F172A;color:#E2E8F0;padding:28px;border-radius:12px;">
            <h1 style="color:#60A5FA;margin:0 0 6px;font-size:20px;">New Pilot Request</h1>
            <p style="color:#94A3B8;margin:0 0 20px;">Submitted via the payment reminder demo</p>
            <table style="width:100%;border-collapse:collapse;background:#1E293B;border-radius:8px;">
              <tr><td style="padding:12px 16px;color:#94A3B8;">Company</td><td style="padding:12px 16px;text-align:right;color:#F7F9FC;font-weight:700;">${company}</td></tr>
              <tr><td style="padding:12px 16px;color:#94A3B8;border-top:1px solid #334155;">Action</td><td style="padding:12px 16px;text-align:right;color:#F7F9FC;border-top:1px solid #334155;">Clicked "Start the Pilot"</td></tr>
            </table>
            <p style="margin:16px 0 0;color:#94A3B8;font-size:13px;">Follow up to schedule the 90 day pilot.</p>
          </div>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('pilot-notify: Resend rejected', r.status, detail);
      return res.status(500).json({ error: 'Email send failed' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('pilot-notify error', err);
    return res.status(500).json({ error: err.message });
  }
}
