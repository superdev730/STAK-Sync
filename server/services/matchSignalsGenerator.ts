import { db } from "../db";
import { 
  users, 
  matchSignals,
  type User,
  type InsertMatchSignals
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Build concatenated text suitable for embeddings from user profile
 */
function buildEmbeddingReadyText(user: User): string {
  const parts: string[] = [];
  
  // Basic identity info
  if (user.identity?.display_name) {
    parts.push(user.identity.display_name);
  }
  if (user.identity?.headline) {
    parts.push(user.identity.headline);
  }
  
  // Persona and location
  if (user.persona?.primary && user.identity?.city_region) {
    parts.push(`${user.persona.primary} in ${user.identity.city_region}`);
  } else if (user.persona?.primary) {
    parts.push(user.persona.primary);
  }
  
  // Goals intent
  if (user.goals?.statement) {
    parts.push(user.goals.statement);
  }
  
  // Persona-specific content
  if (user.persona?.primary) {
    const primaryPersona = user.persona.primary.toLowerCase();
    
    // VC-specific content
    if (primaryPersona.includes('vc') || primaryPersona.includes('investor')) {
      if (user.vc_block?.investment_thesis) {
        parts.push(user.vc_block.investment_thesis);
      }
      if (user.vc_block?.investment_sectors?.length) {
        parts.push(user.vc_block.investment_sectors.join(' '));
      }
      if (user.vc_block?.investment_stages?.length) {
        parts.push(user.vc_block.investment_stages.join(' '));
      }
      if (user.vc_block?.notable_wins) {
        parts.push(user.vc_block.notable_wins);
      }
    }
    
    // Founder-specific content
    if (primaryPersona.includes('founder') || primaryPersona.includes('ceo')) {
      if (user.founder_block?.company) {
        parts.push(user.founder_block.company);
      }
      if (user.founder_block?.problem_solving) {
        parts.push(user.founder_block.problem_solving);
      }
      if (user.founder_block?.funding_raised) {
        parts.push(`Raised ${user.founder_block.funding_raised}`);
      }
    }
    
    // Talent/Operator-specific content
    if (primaryPersona.includes('operator') || primaryPersona.includes('talent') || 
        primaryPersona.includes('engineer') || primaryPersona.includes('designer')) {
      if (user.talent_block?.current_role) {
        parts.push(user.talent_block.current_role);
      }
      if (user.talent_block?.current_company) {
        parts.push(user.talent_block.current_company);
      }
      if (user.talent_block?.expertise?.length) {
        parts.push(user.talent_block.expertise.join(' '));
      }
      if (user.talent_block?.ideal_next_role) {
        parts.push(`Looking for ${user.talent_block.ideal_next_role}`);
      }
    }
    
    // Provider-specific content
    if (primaryPersona.includes('advisor') || primaryPersona.includes('consultant')) {
      if (user.provider_block?.services?.length) {
        parts.push(user.provider_block.services.join(' '));
      }
      if (user.provider_block?.client_types?.length) {
        parts.push(`Works with ${user.provider_block.client_types.join(' ')}`);
      }
    }
  }
  
  // Industries and skills
  if (user.persona?.industries?.length) {
    parts.push(`Industries: ${user.persona.industries.join(' ')}`);
  }
  if (user.persona?.skills?.length) {
    parts.push(`Skills: ${user.persona.skills.join(' ')}`);
  }
  
  return parts.filter(Boolean).join(' | ');
}

/**
 * Generate various tags from user profile
 */
function generateTags(user: User): {
  supply_tags: string[];
  demand_tags: string[];
  icp_tags: string[];
  geo_tags: string[];
  stage_tags: string[];
} {
  const supply_tags: string[] = [];
  const demand_tags: string[] = [];
  const icp_tags: string[] = [];
  const geo_tags: string[] = [];
  const stage_tags: string[] = [];
  
  const primaryPersona = user.persona?.primary?.toLowerCase() || '';
  
  // VC tags
  if (primaryPersona.includes('vc') || primaryPersona.includes('investor')) {
    supply_tags.push('funding', 'capital', 'investment');
    
    if (user.vc_block?.investment_thesis) {
      supply_tags.push('strategic_advice', 'mentorship');
    }
    
    demand_tags.push('deal_flow', 'investment_opportunities');
    
    // ICP tags for VCs
    if (user.vc_block?.investment_sectors?.length) {
      icp_tags.push(...user.vc_block.investment_sectors.map(s => s.toLowerCase().replace(/\s+/g, '_')));
    }
    
    // Stage tags for VCs
    if (user.vc_block?.investment_stages?.length) {
      stage_tags.push(...user.vc_block.investment_stages.map(s => s.toLowerCase().replace(/\s+/g, '_')));
    }
  }
  
  // Founder tags
  if (primaryPersona.includes('founder') || primaryPersona.includes('ceo')) {
    demand_tags.push('capital', 'funding', 'advisors', 'mentorship');
    
    if (user.founder_block?.looking_for?.length) {
      demand_tags.push(...user.founder_block.looking_for.map(item => item.toLowerCase().replace(/\s+/g, '_')));
    }
    
    supply_tags.push('startup_opportunity', 'innovation');
    
    // Stage tags for founders
    if (user.founder_block?.stage) {
      const stage = user.founder_block.stage.toLowerCase();
      if (stage.includes('idea')) stage_tags.push('idea_stage');
      if (stage.includes('mvp')) stage_tags.push('mvp');
      if (stage.includes('seed')) stage_tags.push('seed');
      if (stage.includes('series')) stage_tags.push(stage.replace(/\s+/g, '_'));
      if (stage.includes('growth')) stage_tags.push('growth_stage');
    }
  }
  
  // Operator/Talent tags
  if (primaryPersona.includes('operator') || primaryPersona.includes('engineer') || 
      primaryPersona.includes('designer') || primaryPersona.includes('product')) {
    supply_tags.push('technical_expertise', 'execution', 'product_development');
    
    if (user.talent_block?.expertise?.length) {
      supply_tags.push(...user.talent_block.expertise.map(e => e.toLowerCase().replace(/\s+/g, '_')));
    }
    
    if (user.talent_block?.open_to_opportunities) {
      demand_tags.push('job_opportunities', 'career_growth');
    }
  }
  
  // Advisor/Consultant tags
  if (primaryPersona.includes('advisor') || primaryPersona.includes('consultant')) {
    supply_tags.push('advisory', 'consulting', 'expertise');
    
    if (user.provider_block?.services?.length) {
      supply_tags.push(...user.provider_block.services.map(s => s.toLowerCase().replace(/\s+/g, '_')));
    }
    
    demand_tags.push('clients', 'consulting_opportunities');
  }
  
  // Geographic tags
  if (user.identity?.city_region) {
    const location = user.identity.city_region.toLowerCase();
    
    // Parse location into components
    const locationParts = location.split(',').map(part => part.trim());
    geo_tags.push(...locationParts.map(part => part.replace(/\s+/g, '_')));
    
    // Add common region tags
    if (location.includes('san francisco') || location.includes('sf')) {
      geo_tags.push('san_francisco', 'bay_area', 'california', 'usa');
    } else if (location.includes('new york') || location.includes('nyc')) {
      geo_tags.push('new_york', 'nyc', 'east_coast', 'usa');
    } else if (location.includes('los angeles') || location.includes('la')) {
      geo_tags.push('los_angeles', 'socal', 'california', 'usa');
    } else if (location.includes('austin')) {
      geo_tags.push('austin', 'texas', 'usa');
    } else if (location.includes('seattle')) {
      geo_tags.push('seattle', 'washington', 'pacific_northwest', 'usa');
    } else if (location.includes('boston')) {
      geo_tags.push('boston', 'massachusetts', 'east_coast', 'usa');
    }
  }
  
  // Deduplicate tags
  return {
    supply_tags: [...new Set(supply_tags)],
    demand_tags: [...new Set(demand_tags)],
    icp_tags: [...new Set(icp_tags)],
    geo_tags: [...new Set(geo_tags)],
    stage_tags: [...new Set(stage_tags)]
  };
}

/**
 * Extract trust signals from user profile
 */
function extractTrustSignals(user: User): {
  verified_email?: boolean;
  verified_phone?: boolean;
  profile_completion?: number;
  connections_count?: number;
  recommendations_count?: number;
  event_attendance?: number;
  response_rate?: number;
  verified_links?: {
    linkedin?: { url: string; verified_at: string; };
    github?: { url: string; verified_at: string; };
    website?: { url: string; verified_at: string; };
    portfolio?: { url: string; verified_at: string; };
  };
} {
  const trustSignals: any = {};
  
  // Email verification
  trustSignals.verified_email = user.emailVerified || false;
  
  // Phone verification (check if phone exists)
  trustSignals.verified_phone = !!user.identity?.phone;
  
  // Profile completion percentage
  trustSignals.profile_completion = user.audit?.completion_pct || 0;
  
  // Initialize counts (would be calculated from relationships in production)
  trustSignals.connections_count = 0;
  trustSignals.recommendations_count = 0;
  trustSignals.event_attendance = 0;
  trustSignals.response_rate = 0;
  
  // Verified links
  const verifiedLinks: any = {};
  const now = new Date().toISOString();
  
  if (user.links?.linkedin) {
    verifiedLinks.linkedin = {
      url: user.links.linkedin,
      verified_at: now
    };
  }
  
  if (user.links?.github) {
    verifiedLinks.github = {
      url: user.links.github,
      verified_at: now
    };
  }
  
  if (user.links?.website) {
    verifiedLinks.website = {
      url: user.links.website,
      verified_at: now
    };
  }
  
  if (user.links?.portfolio) {
    verifiedLinks.portfolio = {
      url: user.links.portfolio,
      verified_at: now
    };
  }
  
  if (Object.keys(verifiedLinks).length > 0) {
    trustSignals.verified_links = verifiedLinks;
  }
  
  return trustSignals;
}

/**
 * Normalize numeric features from user profile
 */
function normalizeNumericFeatures(user: User): {
  experience_years?: number;
  company_size?: number;
  funding_amount?: number;
  investment_capacity?: number;
  match_score_threshold?: number;
} {
  const numericFeatures: any = {};
  
  const primaryPersona = user.persona?.primary?.toLowerCase() || '';
  
  // VC numeric features
  if (primaryPersona.includes('vc') || primaryPersona.includes('investor')) {
    // Parse AUM to USD
    if (user.vc_block?.aum) {
      const aum = user.vc_block.aum.toLowerCase();
      let aumUsd = 0;
      
      if (aum.includes('b') || aum.includes('billion')) {
        const match = aum.match(/(\d+(?:\.\d+)?)/);
        if (match) aumUsd = parseFloat(match[1]) * 1_000_000_000;
      } else if (aum.includes('m') || aum.includes('million')) {
        const match = aum.match(/(\d+(?:\.\d+)?)/);
        if (match) aumUsd = parseFloat(match[1]) * 1_000_000;
      }
      
      if (aumUsd > 0) {
        numericFeatures.investment_capacity = aumUsd;
      }
    }
    
    // Check sizes
    if (user.vc_block?.check_size_min) {
      numericFeatures.funding_amount = user.vc_block.check_size_min;
    }
  }
  
  // Founder numeric features
  if (primaryPersona.includes('founder') || primaryPersona.includes('ceo')) {
    // Team size
    if (user.founder_block?.team_size) {
      numericFeatures.company_size = user.founder_block.team_size;
    }
    
    // Funding raised
    if (user.founder_block?.funding_raised) {
      const funding = user.founder_block.funding_raised.toLowerCase();
      let fundingUsd = 0;
      
      if (funding.includes('m') || funding.includes('million')) {
        const match = funding.match(/(\d+(?:\.\d+)?)/);
        if (match) fundingUsd = parseFloat(match[1]) * 1_000_000;
      } else if (funding.includes('k') || funding.includes('thousand')) {
        const match = funding.match(/(\d+(?:\.\d+)?)/);
        if (match) fundingUsd = parseFloat(match[1]) * 1_000;
      }
      
      if (fundingUsd > 0) {
        numericFeatures.funding_amount = fundingUsd;
      }
    }
  }
  
  // Talent numeric features
  if (primaryPersona.includes('operator') || primaryPersona.includes('engineer') || 
      primaryPersona.includes('designer') || primaryPersona.includes('product')) {
    if (user.talent_block?.years_experience) {
      numericFeatures.experience_years = user.talent_block.years_experience;
    }
  }
  
  // Default match score threshold
  numericFeatures.match_score_threshold = 70;
  
  return numericFeatures;
}

/**
 * Main function to generate and store match signals for a user
 */
export async function generateMatchSignals(userId: string): Promise<void> {
  try {
    console.log(`🎯 Generating match signals for user ${userId}`);
    
    // Fetch user profile
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userResult.length) {
      console.error(`User ${userId} not found`);
      return;
    }
    
    const user = userResult[0];
    
    // Generate all signal components
    const embeddingReadyText = buildEmbeddingReadyText(user);
    const tags = generateTags(user);
    const trustSignals = extractTrustSignals(user);
    const numericFeatures = normalizeNumericFeatures(user);
    
    // Prepare match signals data
    const matchSignalsData: InsertMatchSignals = {
      userId,
      embeddingReadyText,
      primaryIntent: user.goals?.statement || null,
      supplyTags: tags.supply_tags,
      demandTags: tags.demand_tags,
      icpTags: tags.icp_tags,
      geoTags: tags.geo_tags,
      stageTags: tags.stage_tags,
      trustSignals,
      numericFeatures,
      recencyWeightIso: new Date(),
      optOutIds: []
    };
    
    // Check if match signals already exist for this user
    const existingSignals = await db.select()
      .from(matchSignals)
      .where(eq(matchSignals.userId, userId))
      .limit(1);
    
    if (existingSignals.length > 0) {
      // Update existing match signals
      await db.update(matchSignals)
        .set({
          ...matchSignalsData,
          updatedAt: new Date()
        })
        .where(eq(matchSignals.userId, userId));
      
      console.log(`✅ Updated match signals for user ${userId}`);
    } else {
      // Create new match signals
      await db.insert(matchSignals).values(matchSignalsData);
      console.log(`✅ Created match signals for user ${userId}`);
    }
    
    // Log summary
    console.log(`📊 Match signals summary:
      - Embedding text length: ${embeddingReadyText.length} chars
      - Supply tags: ${tags.supply_tags.length}
      - Demand tags: ${tags.demand_tags.length}
      - ICP tags: ${tags.icp_tags.length}
      - Geo tags: ${tags.geo_tags.length}
      - Stage tags: ${tags.stage_tags.length}
      - Trust signals: ${Object.keys(trustSignals).length}
      - Numeric features: ${Object.keys(numericFeatures).length}
    `);
    
  } catch (error) {
    console.error(`❌ Error generating match signals for user ${userId}:`, error);
    // Don't throw - we want profile completion to succeed even if match signals fail
  }
}