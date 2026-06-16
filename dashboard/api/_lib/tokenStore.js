/**
 * Per-client QuickBooks OAuth token storage.
 * Tokens are AES-256-GCM encrypted at rest in Vercel KV, keyed by clientId.
 * Replaces the Google Sheets plaintext token storage for new client onboarding.
 *
 * Required env vars:
 *   KV_REST_API_URL, KV_REST_API_TOKEN   (auto-set by the Vercel KV integration)
 *   QB_TOKEN_ENCRYPTION_KEY              (32-byte key, base64 — generate with:
 *                                          node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
 */
import { kv } from '@vercel/kv';
import crypto from 'crypto';

function getEncryptionKey() {
  const keyB64 = process.env.QB_TOKEN_ENCRYPTION_KEY;
  if (!keyB64) throw new Error('QB_TOKEN_ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyB64, 'base64');
  if (key.length !== 32) throw new Error('QB_TOKEN_ENCRYPTION_KEY must decode to 32 bytes');
  return key;
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

function decrypt(payload) {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, ciphertextB64] = payload.split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

function kvKey(clientId) {
  return `qb_token:${clientId}`;
}

/**
 * Get a client's QB OAuth token (decrypted).
 * Returns { access_token, refresh_token, expires_at } or null if none stored.
 */
export async function getQBToken(clientId) {
  const encrypted = await kv.get(kvKey(clientId));
  if (!encrypted) return null;
  return JSON.parse(decrypt(encrypted));
}

/**
 * Save (or rotate) a client's QB OAuth token, encrypted at rest.
 */
export async function saveQBToken(clientId, token) {
  const encrypted = encrypt(JSON.stringify(token));
  await kv.set(kvKey(clientId), encrypted);
}
