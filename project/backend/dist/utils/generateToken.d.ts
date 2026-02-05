export interface VerificationToken {
    raw: string;
    hashed: string;
}
/**
 * Generate a secure verification token
 * Returns both raw (for email) and hashed (for database storage) versions
 */
export declare function generateVerificationToken(): VerificationToken;
/**
 * Hash a verification token (used when validating)
 */
export declare function hashToken(token: string): string;
