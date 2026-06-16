/**
 * QuickBooks API Helper for Vercel Serverless Functions
 * Handles OAuth token management and QB API calls
 */

import { getQBTokenFromSheets, saveQBTokenToSheets } from './googleSheets.js';

const QB_BASE_URL =
  process.env.QB_ENVIRONMENT === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

const QB_COMPANY_ID = process.env.QB_COMPANY_ID || '9341456702590433';

/**
 * Get valid QuickBooks access token
 * Automatically refreshes if expired
 */
export async function getQBAccessToken() {
  // Get current token from Google Sheets
  const token = await getQBTokenFromSheets();

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(token.expires_at).getTime();
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes

  if (now + buffer < expiresAt) {
    // Token still valid
    console.log('Using existing QB token');
    return token.access_token;
  }

  // Token expired or about to expire - refresh it
  console.log('QB token expired, refreshing...');
  const newToken = await refreshQBToken(token.refresh_token);

  // Save new token back to Google Sheets
  await saveQBTokenToSheets({
    access_token: newToken.access_token,
    refresh_token: newToken.refresh_token,
    expires_at: new Date(Date.now() + newToken.expires_in * 1000).toISOString(),
  });

  return newToken.access_token;
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
export async function qbApiRequest(endpoint, options = {}) {
  const accessToken = await getQBAccessToken();

  // Build full URL
  const url = endpoint.startsWith('/v3/')
    ? `${QB_BASE_URL}${endpoint}`
    : `${QB_BASE_URL}/v3/company/${QB_COMPANY_ID}${endpoint}`;

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
export async function sendInvoiceEmail(invoiceId, email) {
  return qbApiRequest(`/invoice/${invoiceId}/send?sendTo=${email}`, {
    method: 'POST',
  });
}

/**
 * Get single invoice details
 */
export async function getInvoice(invoiceId) {
  return qbApiRequest(`/invoice/${invoiceId}?minorversion=73`);
}

/**
 * Query unpaid invoices
 */
export async function getUnpaidInvoices() {
  const query = encodeURIComponent("SELECT * FROM Invoice WHERE Balance > '0'");
  const response = await qbApiRequest(`/query?query=${query}`);
  return response.QueryResponse?.Invoice || [];
}
