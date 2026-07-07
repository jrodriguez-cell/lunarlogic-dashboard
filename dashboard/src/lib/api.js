/**
 * fetch() wrapper that attaches the current Clerk session token to requests
 * against our own /api/* endpoints. Those endpoints derive the caller's
 * clientId from this token server-side, so every authenticated data call must
 * go through here rather than a bare fetch().
 *
 * We read the token off Clerk's global session (set up by ClerkProvider) so
 * callers don't have to thread the useAuth() hook through every component.
 * These calls only ever run after sign-in, when window.Clerk is present.
 */
export async function authedFetch(url, options = {}) {
  let token;
  try {
    token = await window.Clerk?.session?.getToken();
  } catch {
    token = null;
  }
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
