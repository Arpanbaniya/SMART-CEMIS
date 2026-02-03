// backend/src/utils/generateToken.ts
import crypto from 'crypto';

export interface VerificationToken {
  raw: string;
  hashed: string;
}

/**
 * Generate a secure verification token
 * Returns both raw (for email) and hashed (for database storage) versions
 */
export function generateVerificationToken(): VerificationToken {
  // Generate 64-char hex token (32 bytes)
  const raw = crypto.randomBytes(32).toString('hex');
  
  // Hash the raw token with SHA-256
  const hashed = crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
  
  return { raw, hashed };
}

/**
 * Hash a verification token (used when validating)
 */
export function hashToken(token: string): string {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}
