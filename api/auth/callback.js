/**
 * Vercel Serverless Function: QuickBooks OAuth Callback
 * GET /api/auth/callback
 *
 * Intuit redirects here after the user authorizes the app.
 * Exchanges the authorization code for access + refresh tokens,
 * then saves them to Google Sheets so both this dashboard and n8n share the same token.
 */

import { saveQBTokenToSheets } from '../_lib/googleSheets.js';

export default async function handler(req, res) {
  const { code, realmId, state, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px">
        <h2 style="color:#f87171">Authorization failed</h2>
        <p>${error}</p>
      </body></html>
    `);
  }

  if (!code || !realmId) {
    return res.status(400).send(`
      <html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px">
        <h2 style="color:#f87171">Missing parameters</h2>
        <p>Expected <code>code</code> and <code>realmId</code> from Intuit.</p>
      </body></html>
    `);
  }

  try {
    const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lunarlogic-dashboard.vercel.app'}/api/auth/callback`;

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${err}`);
    }

    const tokens = await tokenResponse.json();

    // Save tokens to Google Sheets (shared with n8n)
    await saveQBTokenToSheets({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });

    // Confirm the company ID matches expected sandbox
    const expectedCompanyId = process.env.QB_COMPANY_ID || '9341456702590433';
    const companyMatch = realmId === expectedCompanyId;

    res.status(200).send(`
      <html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:600px">
        <h2 style="color:#34d399">QuickBooks connected successfully</h2>
        <p>OAuth tokens have been saved to Google Sheets.</p>
        <table style="border-collapse:collapse;width:100%;margin-top:20px">
          <tr><td style="padding:8px;color:#9ca3af">Company ID</td><td style="padding:8px">${realmId} ${companyMatch ? '✓' : '⚠ does not match QB_COMPANY_ID'}</td></tr>
          <tr><td style="padding:8px;color:#9ca3af">Token expires</td><td style="padding:8px">${new Date(Date.now() + tokens.expires_in * 1000).toLocaleString()}</td></tr>
          <tr><td style="padding:8px;color:#9ca3af">Refresh token</td><td style="padding:8px">Saved ✓</td></tr>
        </table>
        <p style="margin-top:30px">
          <a href="/" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
            Open dashboard →
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;margin-top:20px">
          The dashboard will auto-refresh tokens going forward. This setup page only needs to be visited once.
        </p>
      </body></html>
    `);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px">
        <h2 style="color:#f87171">Setup failed</h2>
        <p>${err.message}</p>
        <p style="color:#6b7280;font-size:13px">Check Vercel function logs for details.</p>
      </body></html>
    `);
  }
}
