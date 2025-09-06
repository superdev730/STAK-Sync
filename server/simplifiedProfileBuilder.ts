import OpenAI from 'openai';
import { webSearchService } from './webSearchService';
import { socialMediaCrawler } from './socialMediaCrawler';

// New schema-based interfaces
export interface ProfileDataPoint {
  value: any;
  confidence: number; // 0-1 scale
  source_urls: string[];
}

export interface ProfileOutput {
  person: {
    name: ProfileDataPoint;
    email: ProfileDataPoint;
    avatar_url: ProfileDataPoint;
    headline: ProfileDataPoint;
    current_role: {
      title: ProfileDataPoint;
      company: ProfileDataPoint;
    };
    geo: ProfileDataPoint;
    links: {
      website: string | null;
      github: string | null;
      x: string | null;
      linkedin: string | null;
      company: string | null;
    };
    industries: string[];
    skills_keywords: string[];
    interests_topics: string[];
    bio: ProfileDataPoint;
  };
  stak_recos: {
    goal_suggestions: string[];
    mission_pack: string[];
    connection_targets: Array<{
      member_id: string | null;
      reason: string;
      overlap_tags: string[];
    }>;
    sponsor_targets: Array<{
      sponsor_id: string | null;
      reason: string;
      overlap_tags: string[];
    }>;
  };
}

interface BuilderInput {
  email?: string;
  linkedin_url?: string;
  social_urls?: string[];
  manual_context?: string;
  event_context?: {
    event_id: string;
    event_topics: string[];
  };
}

// System field resolver for handling conflicting data
export const SYSTEM_FIELD_RESOLVER = `
You are a profile field resolver. 
Given multiple candidate values for a field, choose ONE best value with a 0–1 confidence and cite up to 3 supporting source_urls.

Rules:
- Prefer first-party/company bios, reputable press, and verified vendor APIs over random directories.
- If signals disagree, explain the short resolution rationale in "explanation".
- Output exactly the JSON schema below and nothing else.
`;

// Enhanced user profile normalizer with structured input
export const USER_PROFILE_NORMALIZER = (payload: {
  email: string,
  first_name: string,
  last_name: string,
  email_domain?: string,
  company_guess?: string,
  company_site?: string | null,
  opengraph?: any,
  gravatar?: { avatar_url?: string | null, name?: string | null } | null,
  search_snippets: Array<{url: string, title?: string, snippet?: string}>,
  vendor_enrichment?: any, // Clearbit / PDL / FullContact (optional)
  event_context: { event_id: string, event_topics: string[] }
}) => `
KNOWN_INPUT:
${JSON.stringify({
  email: payload.email,
  first_name: payload.first_name,
  last_name: payload.last_name
}, null, 2)}

DETERMINISTIC_SIGNALS:
${JSON.stringify({
  email_domain: payload.email_domain || null,
  company_guess: payload.company_guess || null,
  company_site: payload.company_site || null,
  opengraph: payload.opengraph || {},
  gravatar: payload.gravatar || {},
  search_snippets: payload.search_snippets || [],
  vendor_enrichment: payload.vendor_enrichment || {}
}, null, 2)}

EVENT_CONTEXT:
${JSON.stringify(payload.event_context, null, 2)}

OUTPUT_SCHEMA:
{
  "person": {
    "name": {"value": null, "confidence": 0, "source_urls": []},
    "email": {"value": null, "confidence": 1, "source_urls": []},
    "avatar_url": {"value": null, "confidence": 0, "source_urls": []},
    "headline": {"value": null, "confidence": 0, "source_urls": []},
    "current_role": {
      "title": {"value": null, "confidence": 0, "source_urls": []},
      "company": {"value": null, "confidence": 0, "source_urls": []}
    },
    "geo": {"value": null, "confidence": 0, "source_urls": []},
    "links": {
      "website": null, "github": null, "x": null, "linkedin": null, "company": null
    },
    "industries": [],
    "skills_keywords": [],
    "interests_topics": [],
    "bio": {"value": null, "confidence": 0, "source_urls": []}
  },
  "stak_recos": {
    "goal_suggestions": ["", "", ""],
    "mission_pack": ["", "", "", "", ""],
    "connection_targets": [
      {"member_id": null, "reason": "", "overlap_tags": []}
    ],
    "sponsor_targets": [
      {"sponsor_id": null, "reason": "", "overlap_tags": []}
    ]
  }
}
`;

export class SimplifiedProfileBuilder {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Main profile building orchestrator
   * Phase 1: Public resources (web search, social scraping)
   * Phase 2: Authorized APIs (LinkedIn API, etc.)
   * Phase 3: AI synthesis and STAK recommendations
   */
  async buildProfile(input: BuilderInput): Promise<ProfileOutput> {
    console.log('🚀 Starting simplified profile build');
    
    // Initialize empty profile with schema structure
    const profile = this.initializeProfile();

    try {
      // Phase 1: Public Resource Gathering
      const publicData = await this.gatherPublicData(input);
      this.mergePublicData(profile, publicData);

      // Phase 2: Authorized API Enhancement (if available)
      if (input.linkedin_url) {
        const authorizedData = await this.gatherAuthorizedData(input);
        this.mergeAuthorizedData(profile, authorizedData);
      }

      // Phase 3: AI Synthesis and STAK Recommendations
      await this.generateAIEnhancements(profile, input);
      await this.generateSTAKRecommendations(profile);

      console.log('✅ Profile build complete');
      return profile;

    } catch (error) {
      console.error('❌ Profile build failed:', error);
      // Return best-effort profile with error tracking
      return this.handleBuildError(profile, error);
    }
  }

  private initializeProfile(): ProfileOutput {
    return {
      person: {
        name: { value: null, confidence: 0, source_urls: [] },
        email: { value: null, confidence: 1, source_urls: [] },
        avatar_url: { value: null, confidence: 0, source_urls: [] },
        headline: { value: null, confidence: 0, source_urls: [] },
        current_role: {
          title: { value: null, confidence: 0, source_urls: [] },
          company: { value: null, confidence: 0, source_urls: [] }
        },
        geo: { value: null, confidence: 0, source_urls: [] },
        links: {
          website: null,
          github: null,
          x: null,
          linkedin: null,
          company: null
        },
        industries: [],
        skills_keywords: [],
        interests_topics: [],
        bio: { value: null, confidence: 0, source_urls: [] }
      },
      stak_recos: {
        goal_suggestions: [],
        mission_pack: [],
        connection_targets: [],
        sponsor_targets: []
      }
    };
  }

  /**
   * Phase 1: Gather data from public sources (ToS-compliant only)
   */
  private async gatherPublicData(input: BuilderInput) {
    console.log('📊 Gathering public data (ToS-compliant)...');
    
    const sources = {
      social: [] as any[],
      webSearch: null as any,
      emailDomain: null as any
    };

    // Only analyze public, ToS-compliant sources
    if (input.social_urls?.length) {
      for (const url of input.social_urls) {
        try {
          // Skip LinkedIn HTML scraping - violates ToS
          if (url.toLowerCase().includes('linkedin.com')) {
            console.warn('Skipping LinkedIn HTML scraping - use LinkedIn API instead');
            continue;
          }
          
          // Only analyze truly public sources
          const platform = this.detectPlatformFromUrl(url);
          if (['github', 'website'].includes(platform)) {
            const socialData = await socialMediaCrawler.analyzeSocialProfile(url);
            sources.social.push({ ...socialData, source_url: url });
          } else {
            console.warn(`Skipping ${platform} - requires API access for ToS compliance`);
          }
        } catch (error) {
          console.warn(`Failed to analyze ${url}:`, error);
        }
      }
    }

    // Web search based on available info (using public search engines)
    if (input.email) {
      const emailDomain = input.email.split('@')[1];
      sources.emailDomain = { domain: emailDomain, email: input.email };
      
      // Use web search for publicly available information only
      try {
        sources.webSearch = await this.searchWebForPerson(input);
      } catch (error) {
        console.warn('Web search failed:', error);
      }
    }

    return sources;
  }

  /**
   * Phase 2: Gather data from authorized APIs (LinkedIn, etc.)
   */
  private async gatherAuthorizedData(input: BuilderInput) {
    console.log('🔐 Gathering authorized API data...');
    
    // Placeholder for LinkedIn API integration
    // This would use LinkedIn's official API with proper OAuth
    return {
      linkedin: null // TODO: Implement LinkedIn API integration
    };
  }

  /**
   * Phase 3: Enhanced AI Profile Normalization using structured input
   */
  private async generateAIEnhancements(profile: ProfileOutput, input: BuilderInput) {
    console.log('🧠 Normalizing profile with enhanced STAK AI system...');
    
    const normalizerPayload = await this.buildNormalizerPayload(profile, input);
    
    const systemPrompt = `You are STAK Sync's Profile Normalizer.

Goal: Turn noisy public signals into a clean, minimal, high-confidence profile for event networking and recommendations.

Hard rules:
- Output EXACTLY the JSON in OUTPUT_SCHEMA. No extra text.
- Do not invent facts. If unsure, set value to null and confidence to 0.
- Provide up to 3 source_urls per field that support that field.
- Keep "headline" ≤ 80 chars; "bio" ≤ 280 chars; tags are lowercase snake_case.
- Prefer deterministic/vendor signals over inferred web snippets.
- If conflicting facts appear, pick the one with the strongest source and explain briefly in the "reason" of stak_recos items where relevant.
- Never scrape or rely on non-public or ToS-violating sources (e.g., LinkedIn HTML). Use vendor APIs or public pages only.`;

    const userPrompt = USER_PROFILE_NORMALIZER(normalizerPayload);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent normalization
        max_tokens: 2000
      });

      const normalizedProfile = JSON.parse(response.choices[0].message.content || '{}');
      
      // Replace the current profile with the normalized version
      if (normalizedProfile.person) {
        Object.assign(profile.person, normalizedProfile.person);
      }
      
      if (normalizedProfile.stak_recos) {
        Object.assign(profile.stak_recos, normalizedProfile.stak_recos);
      }

      console.log('✅ Profile normalized successfully');

    } catch (error) {
      console.error('❌ AI normalization failed:', error);
      // Fallback to basic enhancement
      this.applyBasicEnhancements(profile, input);
    }
  }

  /**
   * Fallback enhancement if AI normalization fails
   */
  private applyBasicEnhancements(profile: ProfileOutput, input: BuilderInput) {
    console.log('🔧 Applying basic fallback enhancements...');
    
    // Basic bio if none exists
    if (!profile.person.bio.value && (profile.person.name.value || profile.person.current_role.title.value)) {
      const name = profile.person.name.value || 'Professional';
      const title = profile.person.current_role.title.value || 'Leader';
      const company = profile.person.current_role.company.value;
      
      let bio = `${name} is a ${title}`;
      if (company) bio += ` at ${company}`;
      bio += ' focused on driving innovation and building strategic partnerships.';
      
      profile.person.bio = {
        value: bio.slice(0, 280), // Respect character limit
        confidence: 0.5,
        source_urls: ['fallback_generated']
      };
    }

    // Basic networking goals based on role
    if (profile.stak_recos.goal_suggestions.length === 0) {
      profile.stak_recos.goal_suggestions = this.generateNetworkingGoals(
        profile.person.current_role.title.value || '',
        profile.person.current_role.company.value || ''
      );
    }
  }

  /**
   * Phase 4: Generate STAK-specific recommendations
   */
  private async generateSTAKRecommendations(profile: ProfileOutput) {
    console.log('🎯 Generating STAK recommendations...');
    
    const role = profile.person.current_role.title.value;
    const company = profile.person.current_role.company.value;
    const industries = profile.person.industries;

    // Generate role-based networking goals
    profile.stak_recos.goal_suggestions = this.generateNetworkingGoals(role, company);
    
    // Generate mission pack (key value propositions)
    profile.stak_recos.mission_pack = this.generateMissionPack(role, industries);
    
    // Note: Connection and sponsor targets would require access to STAK member database
    // This would be implemented once we have that data available
  }

  private generateNetworkingGoals(role: string, company: string): string[] {
    const roleKeywords = role?.toLowerCase() || '';
    const companyKeywords = company?.toLowerCase() || '';
    
    if (roleKeywords.includes('founder') || roleKeywords.includes('ceo')) {
      return [
        "Seeking strategic investors and venture capital partners",
        "Looking for experienced mentors and industry advisors",
        "Connecting with exceptional technical talent and co-founders"
      ];
    } else if (roleKeywords.includes('investor') || companyKeywords.includes('capital')) {
      return [
        "Sourcing high-quality deal flow and innovative startups",
        "Building relationships with institutional LPs",
        "Connecting with co-investment partners"
      ];
    } else {
      return [
        "Building strategic partnerships and collaborations",
        "Exploring board and advisory opportunities",
        "Connecting with industry leaders and innovators"
      ];
    }
  }

  private generateMissionPack(role: string, industries: string[]): string[] {
    return [
      "Strategic leadership in transformative industries",
      "Building category-defining companies and partnerships",
      "Driving innovation through collaborative ecosystems",
      "Creating sustainable value for all stakeholders",
      "Leveraging technology to solve complex challenges"
    ];
  }

  private mergePublicData(profile: ProfileOutput, sources: any) {
    console.log('🔄 Merging public data sources with conflict resolution...');
    
    // Collect all candidate values for each field
    const fieldCandidates = {
      name: [] as Array<{value: string, confidence: number, source_url: string, source_type: string}>,
      bio: [] as Array<{value: string, confidence: number, source_url: string, source_type: string}>,
      title: [] as Array<{value: string, confidence: number, source_url: string, source_type: string}>,
      company: [] as Array<{value: string, confidence: number, source_url: string, source_type: string}>
    };

    // Process social media data and collect candidates
    sources.social.forEach((social: any) => {
      const baseConfidence = this.calculateSocialConfidence(social);
      const sourceType = this.getSourceType(social.source_url);
      
      if (social.displayName) {
        fieldCandidates.name.push({
          value: social.displayName,
          confidence: baseConfidence,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.bio) {
        fieldCandidates.bio.push({
          value: social.bio,
          confidence: baseConfidence,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.title) {
        fieldCandidates.title.push({
          value: social.title,
          confidence: baseConfidence,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.company) {
        fieldCandidates.company.push({
          value: social.company,
          confidence: baseConfidence,
          source_url: social.source_url,
          source_type: sourceType
        });
      }

      // Update links (no conflicts here, just direct assignment)
      if (social.platform === 'LinkedIn') {
        profile.person.links.linkedin = social.source_url;
      } else if (social.platform === 'Twitter') {
        profile.person.links.x = social.source_url;
      } else if (social.platform === 'GitHub') {
        profile.person.links.github = social.source_url;
      } else {
        profile.person.links.website = social.source_url;
      }
    });

    // Process email domain data (highest confidence)
    if (sources.emailDomain) {
      profile.person.email = {
        value: sources.emailDomain.email,
        confidence: 1.0,
        source_urls: ['user_provided']
      };
    }

    // Resolve conflicts for each field
    this.resolveFieldConflicts(profile, fieldCandidates);
  }

  /**
   * Resolve conflicts between multiple candidate values for profile fields
   */
  private async resolveFieldConflicts(profile: ProfileOutput, fieldCandidates: any) {
    // Resolve name conflicts
    if (fieldCandidates.name.length > 1) {
      const resolved = await this.resolveFieldWithAI('name', fieldCandidates.name);
      if (resolved) {
        profile.person.name = resolved;
      }
    } else if (fieldCandidates.name.length === 1) {
      const candidate = fieldCandidates.name[0];
      profile.person.name = {
        value: candidate.value,
        confidence: candidate.confidence,
        source_urls: [candidate.source_url]
      };
    }

    // Resolve bio conflicts
    if (fieldCandidates.bio.length > 1) {
      const resolved = await this.resolveFieldWithAI('bio', fieldCandidates.bio);
      if (resolved) {
        profile.person.bio = resolved;
      }
    } else if (fieldCandidates.bio.length === 1) {
      const candidate = fieldCandidates.bio[0];
      profile.person.bio = {
        value: candidate.value,
        confidence: candidate.confidence,
        source_urls: [candidate.source_url]
      };
    }

    // Resolve title conflicts
    if (fieldCandidates.title.length > 1) {
      const resolved = await this.resolveFieldWithAI('title', fieldCandidates.title);
      if (resolved) {
        profile.person.current_role.title = resolved;
      }
    } else if (fieldCandidates.title.length === 1) {
      const candidate = fieldCandidates.title[0];
      profile.person.current_role.title = {
        value: candidate.value,
        confidence: candidate.confidence,
        source_urls: [candidate.source_url]
      };
    }

    // Resolve company conflicts
    if (fieldCandidates.company.length > 1) {
      const resolved = await this.resolveFieldWithAI('company', fieldCandidates.company);
      if (resolved) {
        profile.person.current_role.company = resolved;
      }
    } else if (fieldCandidates.company.length === 1) {
      const candidate = fieldCandidates.company[0];
      profile.person.current_role.company = {
        value: candidate.value,
        confidence: candidate.confidence,
        source_urls: [candidate.source_url]
      };
    }
  }

  /**
   * Use AI to resolve field conflicts intelligently
   */
  private async resolveFieldWithAI(fieldName: string, candidates: any[]): Promise<ProfileDataPoint | null> {
    try {
      const prompt = `Field: ${fieldName}

Candidates:
${JSON.stringify(candidates, null, 2)}

Output schema:
{
  "value": "chosen value",
  "confidence": 0.85,
  "source_urls": ["url1", "url2"],
  "explanation": "Brief rationale for choice"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: SYSTEM_FIELD_RESOLVER },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2, // Low temperature for consistent resolution
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      console.log(`🔧 Resolved ${fieldName} conflict:`, result.explanation);
      
      return {
        value: result.value,
        confidence: result.confidence || 0.5,
        source_urls: result.source_urls || []
      };

    } catch (error) {
      console.error(`Failed to resolve ${fieldName} conflict:`, error);
      // Fallback to highest confidence candidate
      const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
      return {
        value: best.value,
        confidence: best.confidence,
        source_urls: [best.source_url]
      };
    }
  }

  /**
   * Determine source type for confidence weighting
   */
  private getSourceType(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) return 'professional_network';
    if (lower.includes('github.com')) return 'code_repository';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'social_media';
    if (lower.includes('.edu')) return 'educational';
    if (lower.includes('.gov')) return 'government';
    if (lower.includes('.org')) return 'organization';
    return 'website';
  }

  private mergeAuthorizedData(profile: ProfileOutput, sources: any) {
    console.log('🔐 Merging authorized API data...');
    // TODO: Implement LinkedIn API data merging
  }

  private calculateSocialConfidence(social: any): number {
    let confidence = 0.6; // Base confidence for social media
    
    if (social.followerCount > 100) confidence += 0.1;
    if (social.followerCount > 1000) confidence += 0.1;
    if (social.isVerified) confidence += 0.2;
    if (social.platform === 'LinkedIn') confidence += 0.1; // LinkedIn is more professional
    
    return Math.min(confidence, 1.0);
  }

  private async searchWebForPerson(input: BuilderInput) {
    if (!input.email) return null;
    
    const domain = input.email.split('@')[1];
    const searchQuery = `site:${domain} OR "${input.email}"`;
    
    try {
      // Use existing web search service
      return await webSearchService.searchPersonalAchievements('', '', domain, '');
    } catch (error) {
      console.warn('Web search failed:', error);
      return null;
    }
  }

  /**
   * Build enhanced payload for the USER_PROFILE_NORMALIZER
   */
  private async buildNormalizerPayload(profile: ProfileOutput, input: BuilderInput) {
    // Extract name from profile or input
    const extractName = (profile: ProfileOutput, input: BuilderInput) => {
      if (profile.person.name.value) {
        const parts = profile.person.name.value.split(' ');
        return {
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || ''
        };
      }
      // Try to extract from email
      if (input.email) {
        const emailUser = input.email.split('@')[0];
        const parts = emailUser.split(/[._-]/);
        return {
          first_name: parts[0] || '',
          last_name: parts[1] || ''
        };
      }
      return { first_name: '', last_name: '' };
    };

    const names = extractName(profile, input);
    const emailDomain = input.email?.split('@')[1];

    // Build search snippets from gathered data
    const searchSnippets: Array<{url: string, title?: string, snippet?: string}> = [];
    
    // Add social media data as search snippets
    input.social_urls?.forEach(url => {
      const platform = this.detectPlatformFromUrl(url);
      searchSnippets.push({
        url,
        title: `${platform} Profile`,
        snippet: `Profile found on ${platform}`
      });
    });

    // Simulate gravatar check (basic implementation)
    const gravatar = await this.checkGravatar(input.email);

    const payload = {
      email: input.email || '',
      first_name: names.first_name,
      last_name: names.last_name,
      email_domain: emailDomain,
      company_guess: profile.person.current_role.company.value,
      company_site: profile.person.links.website,
      opengraph: {}, // Would be populated with actual OpenGraph data
      gravatar,
      search_snippets: searchSnippets,
      vendor_enrichment: {}, // Placeholder for Clearbit/PDL/FullContact data
      event_context: input.event_context || {
        event_id: 'default_event',
        event_topics: ['networking', 'business']
      }
    };

    return payload;
  }

  /**
   * Simple gravatar check implementation
   */
  private async checkGravatar(email?: string): Promise<{avatar_url?: string | null, name?: string | null} | null> {
    if (!email) return null;
    
    try {
      // Basic implementation - in production you'd use actual Gravatar API
      const crypto = await import('crypto');
      const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
      
      // Check if gravatar exists (simplified)
      return {
        avatar_url: gravatarUrl,
        name: null
      };
    } catch (error) {
      return null;
    }
  }

  private detectPlatformFromUrl(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) return 'linkedin';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('github.com')) return 'github';
    return 'website';
  }

  private handleBuildError(profile: ProfileOutput, error: any): ProfileOutput {
    console.error('Handling build error:', error);
    
    // Add error information to profile for debugging
    profile.person.bio = {
      value: 'Profile building encountered an error. Please try again or contact support.',
      confidence: 0.1,
      source_urls: ['error_fallback']
    };
    
    return profile;
  }
}

export const simplifiedProfileBuilder = new SimplifiedProfileBuilder();