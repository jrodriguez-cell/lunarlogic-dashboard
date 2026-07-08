/**
 * Server-side auth for the client dashboard API.
 *
 * Every data endpoint must derive the caller's clientId from a VERIFIED Clerk
 * session token — never from a query string or request body. Trusting a
 * caller-supplied clientId is how one client ends up able to read another
 * client's AR data by editing a URL.
 *
 * Flow:
 *   1. Frontend calls `getToken()` (Clerk) and sends it as `Authorization: Bearer <jwt>`.
 *   2. verifyClient() checks the JWT signature against Clerk's JWKS.
 *   3. The user's clientId + role come from Clerk publicMetadata, set when you
 *      invite/provision the user — not from anything the browser can forge.
 *
 * Required env var: CLERK_SECRET_KEY
 */
import { verifyToken, createClerkClient } from '@clerk/backend';
import { clientIdForEmail } from './clientDomains.js';

const secretKey = process.env.CLERK_SECRET_KEY;

let _clerk;
function clerk() {
  if (!_clerk) _clerk = createClerkClient({ secretKey });
  return _clerk;
}

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

function bearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

// Returns the user's primary email only if it is verified — an unverified
// address must never be trusted for domain-based auto-linking.
function verifiedPrimaryEmail(user) {
  const primary = user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId);
  if (primary && primary.verification?.status === 'verified') {
    return primary.emailAddress;
  }
  return null;
}

/**
 * Verify the Clerk session and resolve the caller's scope.
 * Returns { userId, clientId, role }. Throws AuthError on any failure.
 */
export async function verifyClient(req) {
  if (!secretKey) {
    throw new AuthError(500, 'Server auth is not configured (CLERK_SECRET_KEY missing)');
  }

  const token = bearerToken(req);
  if (!token) {
    throw new AuthError(401, 'Missing session token');
  }

  let claims;
  try {
    claims = await verifyToken(token, { secretKey });
  } catch {
    throw new AuthError(401, 'Invalid or expired session');
  }

  const user = await clerk().users.getUser(claims.sub);
  const role = user.publicMetadata?.role || 'client';
  let clientId = user.publicMetadata?.clientId;

  // Not explicitly provisioned (invite / manual) — try to auto-link by the
  // verified email domain (self-service signup). The domain map is the gate,
  // and only a verified address can match it.
  if (!clientId) {
    const email = verifiedPrimaryEmail(user);
    const derived = email ? clientIdForEmail(email) : null;
    if (derived) {
      clientId = derived;
      // Persist so it shows up in the Clerk dashboard and later requests skip
      // this lookup. Best-effort — a write failure must not deny an otherwise
      // valid request, since clientId is already resolved for this call.
      try {
        await clerk().users.updateUserMetadata(claims.sub, {
          publicMetadata: { ...user.publicMetadata, clientId: derived, role },
        });
      } catch (err) {
        console.error('Failed to persist auto-linked clientId:', err.message);
      }
    }
  }

  // Authenticated but not linked to any client — deny rather than falling back
  // to a shared default.
  if (!clientId) {
    throw new AuthError(403, 'Your account is not linked to a client yet');
  }

  return { userId: claims.sub, clientId, role };
}

/** Same as verifyClient but also requires role === 'admin'. */
export async function requireAdmin(req) {
  const auth = await verifyClient(req);
  if (auth.role !== 'admin') {
    throw new AuthError(403, 'Admin access required');
  }
  return auth;
}

/** Send a JSON error response for an auth failure (or 500 for anything else). */
export function sendAuthError(res, err) {
  const status = err instanceof AuthError ? err.status : 500;
  return res.status(status).json({ error: err.message || 'Unauthorized' });
}
