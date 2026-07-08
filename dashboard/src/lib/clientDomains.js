/**
 * Email-domain -> clientId map for self-service signup.
 *
 * When a client signs up with their work email, a VERIFIED address whose domain
 * appears here is auto-linked to that client so they land straight on their
 * dashboard — no manual step from LunarLogic.
 *
 * IMPORTANT: keep this in sync with api/_lib/clientDomains.js (the two deploy
 * roots can't share a module). The API copy is the security-critical one — this
 * copy only decides which view to render; the server independently re-derives
 * the clientId from the verified session and is the real gate on data access.
 *
 * Domains must be lowercase, no '@'. clientIds must match keys in
 * src/data/mockData.js and the KV token key `qb_token:<clientId>`.
 */
const DOMAIN_TO_CLIENT = {
  // 'gualapack.com': 'gualapack',
  // 'kaptainclean.com': 'kaptain',
  // 'forvismazars.com': 'forvismazars',
  // Add each client's verified email domain here, then set the same entry in
  // api/_lib/clientDomains.js.
};

export function clientIdForEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const at = email.lastIndexOf('@');
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DOMAIN_TO_CLIENT[domain] || null;
}
