/**
 * Vercel Serverless Function: QuickBooks OAuth Callback
 * GET /api/qb-auth-callback?code=...&state=...&realmId=...
 *
 * Exchanges the authorization code for the first access/refresh token
 * pair, then saves it encrypted via tokenStore.js. Run once per client
 * onboarding (visit /api/qb-auth-connect?clientId=<id> to start).
 */

import { saveQBToken } from './_lib/tokenStore.js';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: qbError, realmId } = req.query;

  if (qbError) {
    return res.status(400).json({ error: `QuickBooks authorization denied: ${qbError}` });
  }
  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state from QuickBooks redirect' });
  }

  let clientId;
  try {
    ({ clientId } = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')));
  } catch {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb-auth-callback`;

  try {
    const response = await fetch(QB_TOKEN_URL, {
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const token = await response.json();

    await saveQBToken(clientId, {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      realm_id: realmId,
    });

    res.status(200).send(
      `<html><body style="font-family:sans-serif;padding:2rem">
        <h2>QuickBooks connected</h2>
        <p>Client <strong>${clientId}</strong> is now linked (realm ${realmId}). You can close this tab.</p>
      </body></html>`
    );
  } catch (error) {
    console.error('QB OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete QuickBooks connection', message: error.message });
  }
}
