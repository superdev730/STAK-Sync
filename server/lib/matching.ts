import { SeededProfile, TeaserProfile, User } from "@shared/schema";

// Helper to generate anonymized teaser data
export function anonymizeProfile(profile: any): TeaserProfile["safeFields"] {
  return {
    persona: profile.role || profile.persona?.primary || "Professional",
    industry: profile.industry || profile.industries?.[0] || "Technology",
    experience_level: determineExperienceLevel(profile),
    interests: profile.interests || profile.skills || [],
    seeking: profile.seeking || profile.goals?.objectives || [],
  };
}

// Determine experience level from various profile fields
function determineExperienceLevel(profile: any): string {
  const title = profile.title?.toLowerCase() || "";
  const role = profile.role?.toLowerCase() || "";
  
  if (title.includes("senior") || title.includes("lead") || title.includes("director") || 
      title.includes("vp") || title.includes("chief") || title.includes("head of")) {
    return "Senior";
  }
  if (title.includes("junior") || title.includes("associate") || title.includes("analyst")) {
    return "Junior";
  }
  if (title.includes("manager") || title.includes("specialist")) {
    return "Mid-level";
  }
  if (title.includes("founder") || title.includes("ceo") || title.includes("cto")) {
    return "Executive";
  }
  if (title.includes("student") || title.includes("intern")) {
    return "Entry-level";
  }
  
  return "Professional";
}

// Calculate match score between two profiles (rules-based MVP)
export function calculateMatchScore(profile1: any, profile2: any): number {
  let score = 0;
  
  // Industry match (30 points)
  if (profile1.industry === profile2.industry) {
    score += 30;
  } else if (hasIndustryOverlap(profile1.industries, profile2.industries)) {
    score += 15;
  }
  
  // Role complementarity (25 points)
  const roleScore = calculateRoleComplementarity(profile1.role, profile2.role);
  score += roleScore;
  
  // Goals alignment (25 points)
  const goalsScore = calculateGoalsAlignment(
    profile1.goals?.objectives || profile1.seeking || [],
    profile2.goals?.objectives || profile2.seeking || []
  );
  score += goalsScore;
  
  // Skills overlap (10 points)
  if (hasSkillsOverlap(profile1.skills, profile2.skills)) {
    score += 10;
  }
  
  // Location proximity (10 points)
  if (profile1.city_region === profile2.city_region) {
    score += 10;
  }
  
  return Math.min(100, score); // Cap at 100
}

// Check if industries overlap
function hasIndustryOverlap(industries1?: string[], industries2?: string[]): boolean {
  if (!industries1 || !industries2) return false;
  return industries1.some(ind => industries2.includes(ind));
}

// Calculate role complementarity score
function calculateRoleComplementarity(role1?: string, role2?: string): number {
  if (!role1 || !role2) return 0;
  
  const r1 = role1.toLowerCase();
  const r2 = role2.toLowerCase();
  
  // Perfect complements
  if ((r1.includes("founder") && r2.includes("investor")) ||
      (r1.includes("investor") && r2.includes("founder"))) {
    return 25;
  }
  
  if ((r1.includes("hiring") && r2.includes("talent")) ||
      (r1.includes("talent") && r2.includes("hiring"))) {
    return 25;
  }
  
  if ((r1.includes("mentor") && r2.includes("mentee")) ||
      (r1.includes("advisor") && r2.includes("founder"))) {
    return 20;
  }
  
  // Same role but could collaborate
  if (r1 === r2) {
    return 10;
  }
  
  return 5; // Different roles, some potential
}

// Calculate goals alignment score
function calculateGoalsAlignment(goals1: string[], goals2: string[]): number {
  if (!goals1.length || !goals2.length) return 0;
  
  let alignmentScore = 0;
  const complementaryPairs = [
    ["Raise capital", "Invest capital"],
    ["Hire", "Join a startup"],
    ["Find a cofounder", "Join a startup"],
    ["Find customers", "Partnership BD"],
    ["Get a mentor", "Find advisors"],
    ["Find service providers", "Find customers"],
  ];
  
  // Check for direct matches
  const matchingGoals = goals1.filter(g => goals2.includes(g));
  alignmentScore += matchingGoals.length * 8;
  
  // Check for complementary goals
  for (const [goal1, goal2] of complementaryPairs) {
    if ((goals1.includes(goal1) && goals2.includes(goal2)) ||
        (goals1.includes(goal2) && goals2.includes(goal1))) {
      alignmentScore += 10;
    }
  }
  
  return Math.min(25, alignmentScore);
}

// Check if skills overlap
function hasSkillsOverlap(skills1?: string[], skills2?: string[]): boolean {
  if (!skills1 || !skills2) return false;
  return skills1.some(skill => skills2.includes(skill));
}

// Generate top matches for a seeded profile
export function generateMatches(
  profile: SeededProfile,
  allProfiles: SeededProfile[],
  limit: number = 5
): Array<{ profile: SeededProfile; score: number }> {
  const matches = allProfiles
    .filter(p => p.id !== profile.id) // Don't match with self
    .map(p => ({
      profile: p,
      score: calculateMatchScore(profile.attributes, p.attributes)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return matches;
}

// Check if email is suppressed
export async function isEmailSuppressed(emailHash: string, db: any): Promise<boolean> {
  const suppressed = await db
    .select()
    .from("email_suppression")
    .where("email_hash", emailHash)
    .first();
  
  return !!suppressed;
}

// Hash email with salt for privacy
export function hashEmail(email: string, salt: string = process.env.EMAIL_SALT || "default-salt"): string {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase() + salt)
    .digest("hex");
}