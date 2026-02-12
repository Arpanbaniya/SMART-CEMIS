/**
 * Send verification email using SendGrid
 * Sends only the token - user copies and pastes at /verify
 * Wraps SendGrid call in try/catch; logs errors but does not throw
 */
export declare function sendVerificationEmail(email: string, rawToken: string): Promise<boolean>;
/**
 * Send email change verification email
 */
export declare function sendEmailChangeVerification(newEmail: string, token: string, userName: string): Promise<boolean>;
/**
 * Send email change notification email (sent to both old and new email)
 */
export declare function sendEmailChangeNotification(recipientEmail: string, changedFromEmail: string, userName: string): Promise<boolean>;
