// backend/src/utils/sendgrid.ts
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@eventmanagement.edu';
  console.log('✅ SendGrid initialized successfully');
  console.log(`   From Email: ${fromEmail}`);
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.warn('   ⚠️  Using default FROM email. Set SENDGRID_FROM_EMAIL in .env to use a verified sender.');
  } else {
    console.warn('   ⚠️  Make sure "' + fromEmail + '" is VERIFIED in your SendGrid account!');
    console.warn('   👉 Visit: https://app.sendgrid.com/settings/sender_auth to verify your sender email');
  }
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
  } catch (error: any) {
    console.error('❌ SendGrid error:');
    console.error('   Message:', error?.message || String(error));
    if (error?.response?.body?.errors) {
      console.error('   Details:', error.response.body.errors);
    }
    if (error?.code) {
      console.error('   HTTP Status:', error.code);
    }
    console.error('   From Email:', process.env.SENDGRID_FROM_EMAIL);
    console.error('   Recipient:', email);
    return false;
  }
}

/**
 * Send email change verification email
 */
export async function sendEmailChangeVerification(
  newEmail: string,
  token: string,
  userName: string
): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ ERROR: SENDGRID_API_KEY is not configured in .env');
      console.error(`📧 [DEV MODE] Email change token for ${newEmail}: ${token}`);
      return false;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@eventmanagement.edu';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const verificationLink = `${clientUrl}/verify-email-change?token=${token}`;

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
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .button:hover { background: #764ba2; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .expiry { color: #e74c3c; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your New Email</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>You requested to change the email address associated with your EventHub account. Click the button below to verify and confirm this change:</p>
              <center>
                <a href="${verificationLink}" class="button">Verify Email Change</a>
              </center>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">
                ${verificationLink}
              </p>
              <div class="warning">
                <strong>⚠️ This link expires in 30 minutes.</strong><br>
                If you didn't request this change, you can safely ignore this email.
              </div>
              <p><strong>Important Security Notes:</strong></p>
              <ul>
                <li>We've also sent a notification to your current email address</li>
                <li>Only click this link if you initiated the email change</li>
                <li>Never share this verification link with anyone</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 EventHub. All rights reserved.</p>
              <p>If you have questions, contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextContent = `
Verify Your New Email

Hi ${userName},

You requested to change the email address associated with your EventHub account. Click the link below to verify and confirm this change:

${verificationLink}

This link expires in 30 minutes.

If you didn't request this change, you can safely ignore this email.

Important Security Notes:
- We've also sent a notification to your current email address
- Only click this link if you initiated the email change
- Never share this verification link with anyone

Best regards,
The EventHub Team
    `;

    const msg = {
      to: newEmail,
      from: fromEmail,
      subject: 'Verify Your New Email Address - EventHub',
      text: plainTextContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Email change verification sent to: ${newEmail}`);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:');
    console.error('   Message:', error?.message || String(error));
    if (error?.response?.body?.errors) {
      console.error('   Details:', error.response.body.errors);
    }
    if (error?.code) {
      console.error('   HTTP Status:', error.code);
    }
    console.error('   From Email:', process.env.SENDGRID_FROM_EMAIL);
    console.error('   Recipient:', newEmail);
    return false;
  }
}

/**
 * Send email change notification email (sent to both old and new email)
 */
export async function sendEmailChangeNotification(
  recipientEmail: string,
  changedFromEmail: string,
  userName: string
): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ ERROR: SENDGRID_API_KEY is not configured in .env');
      return false;
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@eventmanagement.edu';
    const isNewEmail = recipientEmail !== changedFromEmail;

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
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; color: #155724; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isNewEmail ? 'Email Change Confirmed' : 'Account Email Change Notification'}</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              ${isNewEmail ? `
                <div class="success">
                  <strong>✅ Your email address has been successfully changed!</strong><br>
                  Your new email is: <strong>${recipientEmail}</strong>
                </div>
                <p>You can now use this email address to log in to your EventHub account.</p>
              ` : `
                <p>This is a notification that the email address for your EventHub account has been changed.</p>
                <div class="warning">
                  <strong>⚠️ If you did NOT make this change:</strong><br>
                  Your account security may be compromised. <a href="#" style="color: #e74c3c;">Click here to undo this change</a> immediately.
                </div>
                <p><strong>Change Details:</strong></p>
                <ul>
                  <li>Previous email: ${changedFromEmail}</li>
                  <li>New email: Not displayed (check your new email for confirmation)</li>
                  <li>Changed at: ${new Date().toLocaleString()}</li>
                </ul>
              `}
              
              <p><strong>Security Reminder:</strong></p>
              <ul>
                <li>Keep your new email private and secure</li>
                <li>Don't share your account credentials with anyone</li>
                <li>Enable two-factor authentication if available</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 EventHub. All rights reserved.</p>
              <p>If you have questions or concerns, contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextContent = isNewEmail ? `
Email Change Confirmed

Hi ${userName},

Your email address has been successfully changed to: ${recipientEmail}

You can now use this email address to log in to your EventHub account.

Best regards,
The EventHub Team
    ` : `
Account Email Change Notification

Hi ${userName},

This is a notification that the email address for your EventHub account has been changed.

If you did NOT make this change, your account security may be compromised. Contact support immediately.

Best regards,
The EventHub Team
    `;

    const msg = {
      to: recipientEmail,
      from: fromEmail,
      subject: isNewEmail 
        ? 'Email Change Confirmed - EventHub' 
        : 'Account Email Change Notification - EventHub',
      text: plainTextContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`✅ Email change notification sent to: ${recipientEmail}`);
    return true;
  } catch (error: any) {
    console.error('❌ SendGrid error:');
    console.error('   Message:', error?.message || String(error));
    if (error?.response?.body?.errors) {
      console.error('   Details:', error.response.body.errors);
    }
    if (error?.code) {
      console.error('   HTTP Status:', error.code);
    }
    console.error('   From Email:', process.env.SENDGRID_FROM_EMAIL);
    console.error('   Recipient:', recipientEmail);
    return false;
  }
}
