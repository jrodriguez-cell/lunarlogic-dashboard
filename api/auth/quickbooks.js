/**
 * Vercel Serverless Function: QuickBooks OAuth Initiation
 * GET /api/auth/quickbooks
 *
 * Redirects the user to Intuit's OAuth 2.0 authorization page.
 * After authorization, Intuit redirects to /api/auth/callback.
 *
 * Visit this URL once to seed the initial OAuth tokens into Google Sheets.
 * After that, /api/dashboard-data auto-refreshes tokens on every request.
 */
export default function handler(req, res) {
  const clientId = process.env.QB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: 'QB_CLIENT_ID environment variable not set' });
  }

  const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lunarlogic-dashboard.vercel.app'}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    state: 'lunarlogic-setup',
  });

  const authUrl = `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;

  res.redirect(302, authUrl);
}
