// backend/src/utils/sendgrid.ts
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
} else {
  console.warn('⚠️  WARNING: SENDGRID_API_KEY is not configured. Email verification will be simulated.');
}

/**
 * Send verification email using SendGrid
 * Sends only the token - user copies and pastes at /verify
 * Wraps SendGrid call in try/catch; logs errors but does not throw
 */
export async function sendVerificationEmail(
  email: string,
  rawToken: string
): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ ERROR: SENDGRID_API_KEY is not configured in .env');
      console.error(`📧 [DEV MODE] Verification token for ${email}: ${rawToken}`);
      return false;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@eventmanagement.edu';

    // Clean, simple HTML email with token only
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .token-box { background: #ffffff; padding: 20px; text-align: center; border: 2px solid #667eea; border-radius: 8px; margin: 20px 0; }
            .token-label { font-size: 12px; color: #666; margin-bottom: 10px; text-transform: uppercase; }
            .token { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #667eea; letter-spacing: 2px; word-break: break-all; }
            .copy-hint { font-size: 12px; color: #999; margin-top: 10px; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .steps { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step { margin: 10px 0; font-size: 14px; }
            .step-number { background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
              <p>Welcome to EventHub!</p>
            </div>
            <div class="content">
              <p>Hi,</p>
              <p>Thank you for registering with EventHub. To complete your registration and start exploring amazing college events, use your verification token below.</p>

              <div class="token-box">
                <div class="token-label">Your Verification Token</div>
                <div class="token">${rawToken}</div>
                <div class="copy-hint">Copy this token to verify your account</div>
              </div>

              <p style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <strong>Token expires in 24 hours</strong><br>
                If your token expires, you can request a new one by trying to log in.
              </p>

              <p style="font-size: 12px; color: #666; margin-top: 20px;">
                If you did not create this account, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2025 EventHub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextContent = `
Email Verification - EventHub

Thank you for registering with EventHub. To complete your registration, use your verification token below.

YOUR VERIFICATION TOKEN:
${rawToken}

Token expires in 24 hours. If it expires, you can request a new one by trying to log in.

If you did not create this account, please ignore this email.

© 2025 EventHub. All rights reserved.
    `.trim();

    const msg = {
      to: email,
      from: fromEmail,
      subject: 'EventHub Email Verification',
      text: plainTextContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}
