import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromEmail = 'noreply@staksignal.com'; // Update with your verified sender

  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      const msg = {
        to: template.to,
        from: this.fromEmail,
        subject: template.subject,
        html: template.html,
        text: template.text || template.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${template.to}`);
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to STAK Signal - Your Elite Networking Journey Begins',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #FAFAFA; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #CD853F; font-size: 32px; margin: 0;">STAK Signal</h1>
            <p style="color: #CD853F; font-size: 16px; margin: 0;">Find Signal, Cut the Noise</p>
          </div>
          
          <h2 style="color: #FAFAFA; font-size: 24px;">Welcome to the STAK Ecosystem, ${userName}</h2>
          
          <p style="color: #FAFAFA; font-size: 16px; line-height: 1.6;">
            You've joined an exclusive community of venture capitalists, startup founders, and industry leaders 
            who understand that ecosystems are more valuable than products.
          </p>
          
          <div style="background-color: #1F1F1F; padding: 20px; border-left: 4px solid #CD853F; margin: 20px 0;">
            <h3 style="color: #CD853F; margin-top: 0;">What's Next?</h3>
            <ul style="color: #FAFAFA; line-height: 1.8;">
              <li>Complete your profile to enhance AI matching</li>
              <li>Take the networking questionnaire</li>
              <li>Discover meaningful connections in your field</li>
              <li>Join exclusive STAK events and meetups</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://staksignal.com/profile" 
               style="background-color: #CD853F; color: #141414; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Complete Your Profile
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-top: 40px;">
            STAK Signal - Connecting the STAK ecosystem<br>
            1900 Broadway, Denver, CO
          </p>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendAccountSuspensionEmail(userEmail: string, userName: string, reason: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'STAK Signal Account Status Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #FAFAFA; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #CD853F; font-size: 32px; margin: 0;">STAK Signal</h1>
          </div>
          
          <h2 style="color: #FAFAFA; font-size: 24px;">Account Status Update</h2>
          
          <p style="color: #FAFAFA; font-size: 16px; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #FAFAFA; font-size: 16px; line-height: 1.6;">
            Your STAK Signal account has been temporarily suspended. Reason: ${reason}
          </p>
          
          <div style="background-color: #1F1F1F; padding: 20px; border-left: 4px solid #CD853F; margin: 20px 0;">
            <p style="color: #FAFAFA; margin: 0;">
              If you believe this is an error or would like to discuss your account status, 
              please contact our support team.
            </p>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-top: 40px;">
            STAK Signal Support Team
          </p>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendAccountReactivationEmail(userEmail: string, userName: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome Back to STAK Signal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #FAFAFA; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #CD853F; font-size: 32px; margin: 0;">STAK Signal</h1>
            <p style="color: #CD853F; font-size: 16px; margin: 0;">Find Signal, Cut the Noise</p>
          </div>
          
          <h2 style="color: #FAFAFA; font-size: 24px;">Welcome Back, ${userName}</h2>
          
          <p style="color: #FAFAFA; font-size: 16px; line-height: 1.6;">
            Your STAK Signal account has been reactivated. You can now access all platform features 
            and continue building meaningful connections within the STAK ecosystem.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://staksignal.com/discover" 
               style="background-color: #CD853F; color: #141414; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Start Networking
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; text-align: center; margin-top: 40px;">
            STAK Signal - Connecting the STAK ecosystem
          </p>
        </div>
      `
    };

    return this.sendEmail(template);
  }

  static async sendAdminNotificationEmail(adminEmail: string, action: string, details: string): Promise<boolean> {
    const template: EmailTemplate = {
      to: adminEmail,
      subject: `STAK Signal Admin Alert: ${action}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #141414; color: #FAFAFA; padding: 40px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #CD853F; font-size: 32px; margin: 0;">STAK Signal Admin</h1>
          </div>
          
          <h2 style="color: #FAFAFA; font-size: 24px;">Admin Action Alert</h2>
          
          <div style="background-color: #1F1F1F; padding: 20px; border-left: 4px solid #CD853F; margin: 20px 0;">
            <h3 style="color: #CD853F; margin-top: 0;">Action: ${action}</h3>
            <p style="color: #FAFAFA; margin: 0;">${details}</p>
          </div>
          
          <p style="color: #FAFAFA; font-size: 16px; line-height: 1.6;">
            Timestamp: ${new Date().toLocaleString()}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://staksignal.com/admin" 
               style="background-color: #CD853F; color: #141414; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Admin Dashboard
            </a>
          </div>
        </div>
      `
    };

    return this.sendEmail(template);
  }
}