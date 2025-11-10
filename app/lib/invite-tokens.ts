/**
 * Invite Token Utilities
 *
 * Provides cryptographically secure token generation and hashing
 * for the alignment invitation system.
 *
 * Security model:
 * - Tokens are 32 bytes (256 bits) of random data
 * - Tokens are base64url encoded (64 characters, URL-safe)
 * - Only SHA-256 hashes are stored in database
 * - Raw tokens are only exposed once at generation time
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token
 *
 * @returns 64-character base64url-encoded token (256 bits of entropy)
 *
 * @example
 * const token = generateToken();
 * // => "rJ8Kv2Qh9wXpLmN3Yz6Tb5Ac1Df4Eg7Hj0Wk8Rs2Ux9Vy6Tz3Sw1Qo5Pk8Nl7Mi4Lh3"
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hashes a token using SHA-256
 *
 * @param token - Raw invite token to hash
 * @returns 64-character hexadecimal hash
 *
 * @example
 * const token = generateToken();
 * const hash = hashToken(token);
 * // Store hash in database, send token to user
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Validates token format (64 characters, base64url)
 *
 * @param token - Token to validate
 * @returns true if token has valid format
 *
 * @example
 * isValidTokenFormat("abc") // => false
 * isValidTokenFormat(generateToken()) // => true
 */
export function isValidTokenFormat(token: string): boolean {
  // Must be exactly 64 characters and contain only base64url characters
  return /^[A-Za-z0-9_-]{64}$/.test(token);
}

/**
 * Generates a new invite with token and hash
 *
 * @returns Object with raw token (to send to user) and hash (to store in DB)
 *
 * @example
 * const invite = generateInvite();
 * // Store invite.hash in database
 * // Send invite.token to user (only time it's exposed)
 */
export function generateInvite(): {
  token: string;
  hash: string;
} {
  const token = generateToken();
  const hash = hashToken(token);
  return { token, hash };
}
