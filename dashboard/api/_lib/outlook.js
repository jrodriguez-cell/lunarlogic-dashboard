/**
 * Microsoft Graph (Outlook) email helper for Vercel Serverless Functions.
 *
 * Uses the OAuth2 client-credentials ("app-only") grant, not the delegated/
 * interactive flow. There's no human to click "consent" during a scheduled
 * send, so client-credentials is the only grant that makes sense here.
 *
 * Required env vars:
 *   MS_TENANT_ID      - Azure AD tenant ID (or "common" is NOT valid for
 *                        client_credentials — must be the real tenant GUID
 *                        or verified domain)
 *   MS_CLIENT_ID      - App registration's Application (client) ID
 *   MS_CLIENT_SECRET  - App registration's client secret value
 *   MS_SENDER_MAILBOX - The mailbox to send from, e.g. ar@gualapack.com
 *
 * App-only Mail.Send has two failure modes that look identical from the
 * token response (token issuance succeeds either way) but fail at send time
 * with a 403/ErrorAccessDenied:
 *
 *   1. The app registration's API permissions need Microsoft Graph ->
 *      Application permissions -> Mail.Send, with tenant admin consent
 *      granted (not just requested) in Azure AD.
 *   2. Exchange Online additionally restricts app-only Mail.Send by
 *      default, regardless of the Graph permission above. An admin must
 *      create an Application Access Policy scoping this app to the sending
 *      mailbox via Exchange Online PowerShell:
 *        New-ApplicationAccessPolicy -AppId <MS_CLIENT_ID> \
 *          -PolicyScopeGroupId <sender-mailbox-or-group> \
 *          -AccessRight RestrictAccess -Description "AR reminders"
 *      This step is invisible in the Azure portal and is the most common
 *      reason app-only Graph mail sends fail after the permission is
 *      already consented.
 */

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getGraphToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const tenantId = process.env.MS_TENANT_ID;
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET env vars');
  }

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph token request failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

/**
 * Send a reminder email via Microsoft Graph from the configured sender
 * mailbox. Throws with the raw Graph error body on failure so the access
 * policy/permission issues above are diagnosable from logs rather than
 * surfacing as an opaque 403.
 */
export async function sendOutlookEmail({ to, subject, htmlBody, cc = [] }) {
  const token = await getGraphToken();
  const senderMailbox = process.env.MS_SENDER_MAILBOX;

  if (!senderMailbox) {
    throw new Error('Missing MS_SENDER_MAILBOX env var');
  }

  const message = {
    subject,
    body: { contentType: 'HTML', content: htmlBody },
    toRecipients: [{ emailAddress: { address: to } }],
    ccRecipients: cc.map((address) => ({ emailAddress: { address } })),
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(senderMailbox)}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph sendMail failed: ${response.status} ${error}`);
  }

  return true;
}
