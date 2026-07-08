/**
 * Email-domain -> clientId map for self-service signup (SERVER copy).
 *
 * This is the security-critical source of truth: the API auto-links a signed-up
 * user to a client only when their VERIFIED primary email's domain appears here.
 * A spoofed or unverified email never matches, so it can't grant access to
 * another client's data.
 *
 * IMPORTANT: keep this in sync with src/lib/clientDomains.js (the two deploy
 * roots can't share a module).
 *
 * Domains must be lowercase, no '@'. clientIds must match the KV token key
 * `qb_token:<clientId>`.
 */
const DOMAIN_TO_CLIENT = {
  // 'gualapack.com': 'gualapack',
  // 'kaptainclean.com': 'kaptain',
  // 'forvismazars.com': 'forvismazars',
  // Add each client's verified email domain here, then set the same entry in
  // src/lib/clientDomains.js.
};

export function clientIdForEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DOMAIN_TO_CLIENT[domain] || null;
}
