import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface LoginCredentialsEmailParams {
  to: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  loginUrl: string;
}

export async function sendLoginCredentialsEmail(params: LoginCredentialsEmailParams): Promise<boolean> {
  try {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>STAK Signal - Your Login Credentials</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
        .credentials { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #CD853F; }
        .button { display: inline-block; background: #CD853F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .tagline { font-size: 14px; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">STAK Signal</div>
            <div class="tagline">Find Signal, Cut the Noise</div>
        </div>
        <div class="content">
            <h2>Welcome to STAK Signal, ${params.firstName}!</h2>
            
            <p>Your STAK Signal account has been created with owner privileges. As a member of the STAK team, you have full administrative access to the platform.</p>
            
            <div class="credentials">
                <h3>🔐 Your Login Credentials</h3>
                <p><strong>Email:</strong> ${params.to}</p>
                <p><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${params.temporaryPassword}</code></p>
            </div>
            
            <p><strong>Important Security Notice:</strong> Please change your password immediately upon first login for security purposes.</p>
            
            <div style="text-align: center;">
                <a href="${params.loginUrl}" class="button">Login to STAK Signal</a>
            </div>
            
            <h3>Your Owner Privileges Include:</h3>
            <ul>
                <li>Full administrative dashboard access</li>
                <li>User account management</li>
                <li>Platform analytics and reporting</li>
                <li>Event management and creation</li>
                <li>System configuration</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to the STAK team.</p>
        </div>
        <div class="footer">
            <p>This email contains sensitive login information. Please keep it secure.</p>
            <p>© 2025 STAK Ventures. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    await mailService.send({
      to: params.to,
      from: 'noreply@stakventures.com',
      subject: 'STAK Signal - Your Owner Account Credentials',
      html: emailContent,
    });

    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
  try {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to STAK Signal</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #CD853F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
        .tagline { font-size: 14px; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">STAK Signal</div>
            <div class="tagline">Find Signal, Cut the Noise</div>
        </div>
        <div class="content">
            <h2>Welcome to STAK Signal, ${firstName}!</h2>
            
            <p>You've successfully joined the STAK ecosystem's premier networking platform. Connect with venture capitalists, startup founders, and industry leaders through our AI-powered matching system.</p>
            
            <div style="text-align: center;">
                <a href="${process.env.REPL_URL || 'https://stak-signal.repl.co'}" class="button">Get Started</a>
            </div>
            
            <h3>What's Next?</h3>
            <ul>
                <li>Complete your professional profile</li>
                <li>Set your networking goals</li>
                <li>Discover AI-matched connections</li>
                <li>Join STAK events and meetups</li>
            </ul>
        </div>
        <div class="footer">
            <p>© 2025 STAK Ventures. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    await mailService.send({
      to,
      from: 'noreply@stakventures.com',
      subject: 'Welcome to STAK Signal - Your Journey Begins',
      html: emailContent,
    });

    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}