/**
 * Vercel Serverless Function: Start QuickBooks OAuth
 * GET /api/qb-auth-connect?clientId=qbsandbox
 *
 * Redirects to Intuit's consent screen. One-time step per client — after
 * the user approves, qb-auth-callback.js exchanges the code for tokens
 * and saves them (encrypted) via tokenStore.js. After that, all refreshes
 * happen automatically in quickbooks.js.
 */

import crypto from 'crypto';

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = req.query.clientId || 'default';
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/qb-auth-callback`;

  // Encode clientId into state so the callback knows which client this token belongs to.
  // A random nonce is included to make state unguessable/unique per request.
  const state = Buffer.from(
    JSON.stringify({ clientId, nonce: crypto.randomBytes(16).toString('hex') })
  ).toString('base64url');

  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: redirectUri,
    state,
  });

  res.redirect(302, `${QB_AUTH_URL}?${params.toString()}`);
}
