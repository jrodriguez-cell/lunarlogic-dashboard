/**
 * Vercel Serverless Function: Pilot / Contact Notification
 * POST /api/contact
 *
 * Receives a pilot CTA submission from the demo HTML files and forwards
 * it to support@lunarlogic.ai via Resend.
 *
 * Required env var: RESEND_API_KEY
 */

export default async function handler(req, res) {
  // CORS — allow requests from any origin (demo files may run from file:// or any domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  let body = req.body;
  // body may arrive as a string if Content-Type header was omitted (CORS simple request)
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { name = 'Unknown', company = '', email = '', message = '', pilot } = body;

  const subject = pilot
    ? `🚀 Pilot CTA clicked — ${company || name}`
    : `Contact form submission — ${name}`;

  const html = `
    <h2>${subject}</h2>
    <table>
      <tr><td><b>Name</b></td><td>${name}</td></tr>
      <tr><td><b>Company</b></td><td>${company}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Message</b></td><td>${message}</td></tr>
    </table>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LunarLogic Notifications <notifications@lunarlogic.ai>',
        to: ['support@lunarlogic.ai'],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
