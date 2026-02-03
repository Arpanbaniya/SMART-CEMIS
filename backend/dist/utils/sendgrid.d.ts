/**
 * Send verification email using SendGrid
 * Sends only the token - user copies and pastes at /verify
 * Wraps SendGrid call in try/catch; logs errors but does not throw
 */
export declare function sendVerificationEmail(email: string, rawToken: string): Promise<boolean>;
