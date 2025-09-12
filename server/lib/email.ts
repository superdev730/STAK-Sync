import sg from "@sendgrid/mail";

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sg.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = process.env.EMAIL_FROM || "STAK Sync <no-reply@staksync.com>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SendGrid API key not configured, skipping email send");
    return;
  }
  
  await sg.send({ 
    to, 
    from: FROM, 
    subject, 
    html 
  });
}

export function inviteEmail(eventName: string, inviteUrl: string) {
  return {
    subject: `Your top matches from ${eventName}`,
    html: `
      <div>
        <p>Your personalized matches from <b>${eventName}</b> are ready.</p>
        <p>Preview anonymized matches, then reveal identities after you activate.</p>
        <p><a href="${inviteUrl}">Preview anonymized matches</a> (link expires soon)</p>
        <p>— STAK Sync</p>
      </div>`
  };
}

export function welcomeEmail(firstName?: string, deepLinkUrl?: string) {
  return {
    subject: "Welcome to STAK Sync",
    html: `
      <div>
        <p>${firstName ? `Hi ${firstName},` : "Welcome,"}</p>
        <p>You're all set. Jump back into the event experience:</p>
        ${deepLinkUrl ? `<p><a href="${deepLinkUrl}">Open Event</a></p>` : ""}
        <p><a href="${process.env.APP_BASE_URL}">Open STAK Sync</a></p>
      </div>`
  };
}

export function verifyEmail(verifyUrl: string) {
  return {
    subject: "Verify your email for STAK Sync",
    html: `<div><p>Click to verify:</p><p><a href="${verifyUrl}">Verify email</a></p></div>`
  };
}

export function optOutConfirmEmail() {
  return {
    subject: "You've opted out of STAK Sync",
    html: `<div><p>Your data has been removed and your email added to our suppression list.</p></div>`
  };
}