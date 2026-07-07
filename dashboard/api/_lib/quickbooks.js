/**
 * QuickBooks API Helper for Vercel Serverless Functions
 * Handles OAuth token management and QB API calls
 */

import { getQBToken, saveQBToken } from './tokenStore.js';

const QB_BASE_URL =
  process.env.QB_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

// Fallback company id for the shared sandbox only. Real clients resolve their
// own realm_id from the stored token (see getQBAuth) so that one client's
// access token is never pointed at another client's QuickBooks company.
const QB_COMPANY_ID = process.env.QB_COMPANY_ID || '9341456702590433';

/**
 * Get a valid QuickBooks access token AND the company (realm) id for a client.
 * Automatically refreshes an expired access token. Returns { accessToken, realmId }.
 */
export async function getQBAuth(clientId = 'default') {
  const token = await getQBToken(clientId);
  if (!token) {
    throw new Error(`No QB token stored for client "${clientId}" — connect this client via OAuth first`);
  }

  const realmId = token.realm_id || QB_COMPANY_ID;

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes

  if (now + buffer < expiresAt) {
    // Token still valid
    console.log('Using existing QB token');
    return { accessToken: token.access_token, realmId };
  }

  // Token expired or about to expire - refresh it
  console.log('QB token expired, refreshing...');
  const newToken = await refreshQBToken(token.refresh_token);

  // Save new token back, encrypted, for this client. Preserve realm_id — Intuit
  // does not return it on a refresh, and losing it would break company scoping.
  await saveQBToken(clientId, {
    access_token: newToken.access_token,
    refresh_token: newToken.refresh_token,
    expires_at: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
    realm_id: realmId,
  });

  return { accessToken: newToken.access_token, realmId };
}

/**
 * Get valid QuickBooks access token for a given client.
 * Automatically refreshes if expired.
 */
export async function getQBAccessToken(clientId = 'default') {
  const { accessToken } = await getQBAuth(clientId);
  return accessToken;
}

/**
 * Refresh QuickBooks OAuth token
 */
async function refreshQBToken(refreshToken) {
  const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`QB token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Make a QuickBooks API request
 * Automatically handles OAuth token and company ID
 */
export async function qbApiRequest(endpoint, options = {}, clientId = 'default') {
  const { accessToken, realmId } = await getQBAuth(clientId);

  // Build full URL — scope to THIS client's company (realm), not a global id.
  const url = endpoint.startsWith('/v3/')
    ? `${QB_BASE_URL}${endpoint}`
    : `${QB_BASE_URL}/v3/company/${realmId}${endpoint}`;

  console.log('QB API Request:', url);

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('QB API error:', error);
    throw new Error(`QB API request failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Send invoice email via QuickBooks
 * Used by the "Send Reminder" button
 */
export async function sendInvoiceEmail(invoiceId, email, clientId = 'default') {
  // QBO's /send endpoint expects no JSON body — declaring
  // Content-Type: application/json on an empty body throws a generic
  // SystemFailureError/NullPointerException. n8n's WF2 sends this same
  // request with Content-Type: application/octet-stream, which QBO accepts.
  return qbApiRequest(`/invoice/${invoiceId}/send?sendTo=${encodeURIComponent(email)}&minorversion=73`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
  }, clientId);
}

/**
 * Get single invoice details
 */
export async function getInvoice(invoiceId, clientId = 'default') {
  return qbApiRequest(`/invoice/${invoiceId}?minorversion=73`, {}, clientId);
}

/**
 * Query unpaid invoices
 */
export async function getUnpaidInvoices(clientId = 'default') {
  const query = encodeURIComponent("SELECT * FROM Invoice WHERE Balance > '0'");
  const response = await qbApiRequest(`/query?query=${query}`, {}, clientId);
  return response.QueryResponse?.Invoice || [];
}
