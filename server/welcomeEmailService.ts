import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export interface WelcomeEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Send comprehensive welcome email to new STAK Sync users
 */
export async function sendWelcomeEmail(userData: WelcomeEmailData): Promise<boolean> {
  try {
    const { firstName, lastName, email } = userData;
    
    const emailContent = {
      to: email,
      from: {
        email: 'noreply@stak.com',
        name: 'STAK Sync Team'
      },
      subject: `Welcome to STAK Sync, ${firstName}! Get in Sync, Cut the Noise`,
      html: generateWelcomeEmailHTML(firstName, lastName),
      text: generateWelcomeEmailText(firstName, lastName),
    };

    await mailService.send(emailContent);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Generate HTML version of welcome email
 */
function generateWelcomeEmailHTML(firstName: string, lastName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to STAK Sync</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
        .tagline { font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 20px; }
        .intro { font-size: 16px; margin-bottom: 30px; color: #4a4a4a; }
        .section-title { font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 30px 0 15px 0; border-left: 4px solid #CD853F; padding-left: 15px; }
        .feature-list { list-style: none; padding: 0; margin: 0 0 30px 0; }
        .feature-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; }
        .feature-icon { width: 20px; height: 20px; margin-right: 15px; margin-top: 2px; flex-shrink: 0; }
        .feature-text { flex: 1; }
        .feature-title { font-weight: 600; color: #1a1a1a; margin-bottom: 5px; }
        .feature-desc { font-size: 14px; color: #666; }
        .tip-box { background-color: #f8f9fa; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .tip-title { font-weight: 600; color: #1a1a1a; margin-bottom: 10px; }
        .cta-section { background-color: #CD853F; color: #ffffff; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px; }
        .cta-button { display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: 600; margin-top: 15px; }
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
                You've just joined the most exclusive professional networking platform designed specifically for the STAK ecosystem. We're here to help you build meaningful relationships that drive real business value.
            </div>

            <div class="section-title">🚀 What You Can Do in STAK Sync</div>
            <ul class="feature-list">
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">AI-Powered Matching</div>
                        <div class="feature-desc">Get intelligent introductions to VCs, founders, and professionals who align with your goals and interests</div>
                    </div>
                </li>
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">Direct Messaging</div>
                        <div class="feature-desc">Connect directly with fellow STAK members in a trusted, professional environment</div>
                    </div>
                </li>
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">Event Networking</div>
                        <div class="feature-desc">Join exclusive STAK events and meet members in person at 1900 Broadway and other premium venues</div>
                    </div>
                </li>
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">Profile Discovery</div>
                        <div class="feature-desc">Browse and discover other members based on industry, role, location, and networking goals</div>
                    </div>
                </li>
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">Meeting Coordination</div>
                        <div class="feature-desc">Schedule and manage meetings with your connections directly through the platform</div>
                    </div>
                </li>
                <li class="feature-item">
                    <div class="feature-text">
                        <div class="feature-title">AI Profile Building</div>
                        <div class="feature-desc">Let our AI analyze your LinkedIn and other profiles to create compelling networking profiles automatically</div>
                    </div>
                </li>
            </ul>

            <div class="section-title">💡 Pro Tips to Maximize Your STAK Sync Experience</div>
            
            <div class="tip-box">
                <div class="tip-title">Complete Your Profile</div>
                Add your networking goals, industries, skills, and a compelling bio. The more complete your profile, the better our AI can match you with relevant connections.
            </div>
            
            <div class="tip-box">
                <div class="tip-title">Use AI Profile Building</div>
                Upload your LinkedIn URL and let our AI create a professional profile that highlights your strengths and networking objectives.
            </div>
            
            <div class="tip-box">
                <div class="tip-title">Be Specific with Goals</div>
                Whether you're raising capital, seeking partnerships, or looking for talent, clear networking goals help us connect you with the right people.
            </div>
            
            <div class="tip-box">
                <div class="tip-title">Engage Authentically</div>
                When messaging connections, reference shared interests or mutual goals. Personal, thoughtful messages get much better response rates.
            </div>
            
            <div class="tip-box">
                <div class="tip-title">Attend STAK Events</div>
                Nothing beats meeting in person. Join our exclusive events to deepen relationships and make lasting connections.
            </div>

            <div class="cta-section">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">Ready to Start Networking?</div>
                <div>Complete your profile and discover your first connections</div>
                <a href="https://stak-sync.replit.app/profile" class="cta-button">Complete Your Profile →</a>
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
                This email was sent because you created an account with STAK Sync.
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of welcome email
 */
function generateWelcomeEmailText(firstName: string, lastName: string): string {
  return `
Welcome to STAK Sync, ${firstName}!

You've just joined the most exclusive professional networking platform designed specifically for the STAK ecosystem. We're here to help you build meaningful relationships that drive real business value.

WHAT YOU CAN DO IN STAK SYNC:

• AI-Powered Matching
  Get intelligent introductions to VCs, founders, and professionals who align with your goals and interests

• Direct Messaging
  Connect directly with fellow STAK members in a trusted, professional environment

• Event Networking
  Join exclusive STAK events and meet members in person at 1900 Broadway and other premium venues

• Profile Discovery
  Browse and discover other members based on industry, role, location, and networking goals

• Meeting Coordination
  Schedule and manage meetings with your connections directly through the platform

• AI Profile Building
  Let our AI analyze your LinkedIn and other profiles to create compelling networking profiles automatically

PRO TIPS TO MAXIMIZE YOUR STAK SYNC EXPERIENCE:

💡 Complete Your Profile
Add your networking goals, industries, skills, and a compelling bio. The more complete your profile, the better our AI can match you with relevant connections.

💡 Use AI Profile Building
Upload your LinkedIn URL and let our AI create a professional profile that highlights your strengths and networking objectives.

💡 Be Specific with Goals
Whether you're raising capital, seeking partnerships, or looking for talent, clear networking goals help us connect you with the right people.

💡 Engage Authentically
When messaging connections, reference shared interests or mutual goals. Personal, thoughtful messages get much better response rates.

💡 Attend STAK Events
Nothing beats meeting in person. Join our exclusive events to deepen relationships and make lasting connections.

READY TO START NETWORKING?
Complete your profile and discover your first connections: https://stak-sync.replit.app/profile

---
STAK Sync - Professional AI Matchmaking by STAK Ventures
Questions? Reply to this email or contact us at support@stak.com

This email was sent because you created an account with STAK Sync.
  `;
}