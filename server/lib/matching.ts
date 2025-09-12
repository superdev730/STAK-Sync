import * as crypto from 'crypto';

type ProspectLike = { 
  id: string; 
  email: string; 
  title?: string | null; 
  company?: string | null; 
  tags: string[]; 
};

function overlap(a: string[], b: string[]) {
  const A = new Set(a.map(s => s.toLowerCase()));
  let c = 0; 
  for (const x of b) if (A.has(x.toLowerCase())) c++;
  return c;
}

export function scorePair(a: ProspectLike, b: ProspectLike) {
  const skillsScore = Math.min(40, overlap(a.tags, b.tags) * 10);
  const roleScore = a.title && b.title && a.title.split(" ")[0] === b.title.split(" ")[0] ? 20 : 0;
  const serendipity = a.title && b.title && a.title !== b.title ? 10 : 0;
  const score = Math.min(100, 30 + skillsScore + roleScore + serendipity);
  const reasons: string[] = [];
  if (skillsScore >= 20) reasons.push("Shared interests or skills");
  if (roleScore > 0) reasons.push("Similar roles/seniority");
  if (serendipity > 0) reasons.push("Complementary backgrounds");
  if (reasons.length === 0) reasons.push("Overlapping event context");
  return { score, reasons };
}

export function anonymize(title?: string | null, company?: string | null) {
  const role = title ? title.split(",")[0] : "Professional";
  const companyHint = company ? (company.length > 12 ? company.slice(0, 10) + "…" : company) : undefined;
  return { handle: companyHint ? `${role} @ ${companyHint}` : role, location: "SF Bay Area" };
}

// Check if email is suppressed
export async function isEmailSuppressed(emailHash: string, db: any): Promise<boolean> {
  const { emailSuppression } = await import("@shared/schema");
  const { eq } = await import("drizzle-orm");
  
  const suppressed = await db
    .select()
    .from(emailSuppression)
    .where(eq(emailSuppression.emailHash, emailHash))
    .limit(1);
  
  return suppressed.length > 0;
}

// Hash email with salt for privacy
export function hashEmail(email: string, salt: string = process.env.EMAIL_SALT || "default-salt"): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase() + salt)
    .digest("hex");
}