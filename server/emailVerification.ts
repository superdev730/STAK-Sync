import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface VerificationEmailData {
  firstName: string;
  lastName: string;
  email: string;
  verificationToken: string;
}

/**
 * Send email verification link to new users
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
  try {
    const { firstName, lastName, email, verificationToken } = data;
    
    // Use current domain (will work in both development and production)
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://stak-sync.replit.app' 
      : 'http://localhost:5000';
    
    const verificationUrl = `${baseUrl}/api/verify-email/${verificationToken}`;
    
    const emailContent = {
      to: email,
      from: {
        email: 'noreply@stak.com',
        name: 'STAK Sync Team'
      },
      subject: `Verify your STAK Sync account, ${firstName}`,
      html: generateVerificationEmailHTML(firstName, lastName, verificationUrl),
      text: generateVerificationEmailText(firstName, lastName, verificationUrl),
    };

    await mailService.send(emailContent);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
}

/**
 * Generate HTML version of verification email
 */
function generateVerificationEmailHTML(firstName: string, lastName: string, verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your STAK Sync Account</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
        .intro { font-size: 16px; margin-bottom: 30px; color: #4a4a4a; }
        .verification-section { background-color: #f8f9fa; border: 2px solid #CD853F; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
        .verify-button { display: inline-block; background-color: #CD853F; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; font-size: 16px; }
        .verify-button:hover { background-color: #b8753a; }
        .security-note { font-size: 14px; color: #666; margin-top: 30px; padding: 20px; background-color: #f0f8ff; border-radius: 6px; }
        .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">STAK Sync</div>
            <div class="tagline">Get in Sync, Cut the Noise</div>
        </div>
        
        <div class="content">
            <div class="greeting">Welcome to STAK Sync, ${firstName}!</div>
            
            <div class="intro">
                Thank you for creating your STAK Sync account. To complete your registration and start networking with the STAK ecosystem, please verify your email address.
            </div>

            <div class="verification-section">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #1a1a1a;">
                    Verify Your Email Address
                </div>
                <div style="margin-bottom: 20px; color: #666;">
                    Click the button below to confirm your email and activate your account:
                </div>
                <a href="${verificationUrl}" class="verify-button">Verify My Account</a>
                <div style="font-size: 12px; color: #999; margin-top: 15px;">
                    This link will expire in 24 hours
                </div>
            </div>

            <div class="security-note">
                <strong>🔒 Security Note:</strong> If you didn't create a STAK Sync account, you can safely ignore this email. Your email will not be added to our system without verification.
            </div>
        </div>

        <div class="footer">
            <div style="margin-bottom: 15px;">
                <strong>STAK Sync</strong> - Professional AI Matchmaking by STAK Ventures
            </div>
            <div>
                Questions? Reply to this email or contact us at support@stak.com
            </div>
            <div style="margin-top: 15px; font-size: 12px; opacity: 0.7;">
                This verification email was sent because someone signed up for STAK Sync with this email address.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of verification email
 */
function generateVerificationEmailText(firstName: string, lastName: string, verificationUrl: string): string {
  return `
Welcome to STAK Sync, ${firstName}!

Thank you for creating your STAK Sync account. To complete your registration and start networking with the STAK ecosystem, please verify your email address.

VERIFY YOUR EMAIL ADDRESS:
Click this link to confirm your email and activate your account:
${verificationUrl}

This link will expire in 24 hours.

SECURITY NOTE:
If you didn't create a STAK Sync account, you can safely ignore this email. Your email will not be added to our system without verification.

---
STAK Sync - Professional AI Matchmaking by STAK Ventures
Questions? Reply to this email or contact us at support@stak.com

This verification email was sent because someone signed up for STAK Sync with this email address.
  `;
}