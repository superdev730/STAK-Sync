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

// Enhanced user field resolver with structured input and specific field types
export const USER_FIELD_RESOLVER = (payload: {
  field: "current_role.title" | "current_role.company" | "headline" | "geo" | "bio" | "links" | "avatar_url",
  candidates: Array<{value: string | null, source_url: string, source_type: "vendor" | "public_web" | "company_site" }>,
  context?: any
}) => `
FIELD: ${payload.field}

CANDIDATES:
${JSON.stringify(payload.candidates, null, 2)}

CONTEXT:
${JSON.stringify(payload.context || {}, null, 2)}

OUTPUT_SCHEMA:
{
  "value": null,
  "confidence": 0,
  "source_urls": [],
  "explanation": ""
}
`;

// System field resolver prompt 
export const SYSTEM_FIELD_RESOLVER = `
You are a profile field resolver. 
Given multiple candidate values for a field, choose ONE best value with a 0–1 confidence and cite up to 3 supporting source_urls.

Rules:
- Prefer first-party/company bios, reputable press, and verified vendor APIs over random directories.
- If signals disagree, explain the short resolution rationale in "explanation".
- Output exactly the JSON schema below and nothing else.
`;

// Enhanced user connection matcher with structured input
export const USER_CONNECTION_MATCHER = (payload: {
  me: any, // normalized profile JSON for the current member
  candidates: Array<{member_id: string, company?: string, headline?: string, industries?: string[], skills_keywords?: string[], interests_topics?: string[]}>
}) => `
ME:
${JSON.stringify(payload.me, null, 2)}

CANDIDATE_MEMBER_INDEX:
${JSON.stringify(payload.candidates, null, 2)}

OUTPUT_SCHEMA:
[
  {"member_id": null, "reason": "", "overlap_tags": []}
]
`;

// System connection matcher for generating targeted connection recommendations
export const SYSTEM_CONNECTION_MATCHER = `
You are a connection matchmaker. 
Given the current member profile and a CANDIDATE_MEMBER_INDEX (array of member mini-profiles with tags), suggest up to 5 connection_targets.

Each target must include:
- member_id
- reason (≤140 chars, concrete overlap or value exchange)
- overlap_tags (shared skills/interests/industries)

Rules:
- Rank by likely mutual value at this event.
- Avoid suggesting teammates from the same company unless complementary roles differ.
- Output EXACT JSON (array of connection_targets).
`;

// System sponsor matcher for relevance-based sponsor recommendations  
export const SYSTEM_SPONSOR_MATCHER = `
You are a sponsor relevance engine.
Given a profile and SPONSOR_INDEX (id, category tags, short value prop), recommend up to 3 sponsor_targets with reason + overlap_tags.

Rules:
- Optimize for likely usefulness (tooling fit, hiring, perks value).
- Output EXACT JSON (array of sponsor_targets).
`;

// User goals and missions generator based on complete profile
export const USER_GOALS_MISSIONS = (profileJson: any) => `
PROFILE_JSON:
${JSON.stringify(profileJson, null, 2)}

OUTPUT_SCHEMA:
{
  "goal_suggestions": ["", "", ""],
  "mission_pack": ["", "", "", "", ""]
}
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
   * Phase 4: Generate STAK-specific recommendations using complete profile context
   */
  private async generateSTAKRecommendations(profile: ProfileOutput) {
    console.log('🎯 Generating STAK recommendations with full profile context...');
    
    try {
      // Use the complete profile for context-aware goal and mission generation
      const profileForGoals = {
        person: profile.person,
        context: {
          industries: profile.person.industries,
          skills: profile.person.skills_keywords,
          interests: profile.person.interests_topics,
          role_title: profile.person.current_role.title.value,
          company: profile.person.current_role.company.value,
          bio: profile.person.bio.value,
          location: profile.person.geo.value
        }
      };

      const systemPrompt = `You are STAK Sync's Goals & Missions Generator.

Generate professional networking goals and mission statements tailored to this person's profile for luxury business networking events.

Rules:
- goal_suggestions: 3 specific, actionable networking objectives (what they're seeking)
- mission_pack: 5 value propositions (what unique value they bring)
- Focus on high-value connections, strategic partnerships, and premium opportunities
- Use professional language appropriate for executive networking
- Consider their role, industry, skills, and background
- Output EXACTLY the JSON schema provided. No extra text.`;

      const userPrompt = USER_GOALS_MISSIONS(profileForGoals);

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4, // Balanced creativity for personalized goals
        max_tokens: 800
      });

      const goalsAndMissions = JSON.parse(response.choices[0].message.content || '{}');
      
      if (goalsAndMissions.goal_suggestions && goalsAndMissions.mission_pack) {
        profile.stak_recos.goal_suggestions = goalsAndMissions.goal_suggestions;
        profile.stak_recos.mission_pack = goalsAndMissions.mission_pack;
        
        console.log('✅ Generated personalized STAK goals and missions');
      } else {
        // Fallback to basic generation
        console.warn('⚠️ AI goals generation incomplete, using fallback');
        this.generateBasicSTAKRecommendations(profile);
      }

    } catch (error) {
      console.error('❌ STAK recommendations generation failed:', error);
      // Fallback to basic generation
      this.generateBasicSTAKRecommendations(profile);
    }

    // Generate connection and sponsor targets
    await this.generateConnectionTargets(profile, input);
    await this.generateSponsorTargets(profile, input);
  }

  /**
   * Fallback method for basic STAK recommendations
   */
  private generateBasicSTAKRecommendations(profile: ProfileOutput) {
    const role = profile.person.current_role.title.value;
    const company = profile.person.current_role.company.value;
    const industries = profile.person.industries;

    // Generate role-based networking goals (fallback)
    profile.stak_recos.goal_suggestions = this.generateNetworkingGoals(role, company);
    
    // Generate mission pack (fallback)
    profile.stak_recos.mission_pack = this.generateMissionPack(role, industries);
  }

  private generateNetworkingGoals(role?: string, company?: string): string[] {
    const roleKeywords = role?.toLowerCase() || '';
    const companyKeywords = company?.toLowerCase() || '';
    
    if (roleKeywords.includes('founder') || roleKeywords.includes('ceo')) {
      return [
        "Seeking strategic investors and venture capital partners for growth acceleration",
        "Looking for experienced mentors and industry advisors to guide strategic decisions",
        "Connecting with exceptional technical talent and potential co-founders"
      ];
    } else if (roleKeywords.includes('investor') || companyKeywords.includes('capital')) {
      return [
        "Sourcing high-quality deal flow and innovative startups in emerging sectors",
        "Building relationships with institutional LPs and family offices for fund development",
        "Connecting with co-investment partners for syndicated opportunities"
      ];
    } else {
      return [
        "Building strategic partnerships and collaborations to drive innovation",
        "Exploring board and advisory opportunities in growth-stage companies",
        "Connecting with industry leaders and innovators for knowledge sharing"
      ];
    }
  }

  private generateMissionPack(role?: string, industries?: string[]): string[] {
    const industryContext = industries?.length ? industries.slice(0, 2).join(' and ') : 'technology';
    const roleContext = role?.toLowerCase() || 'professional';
    
    if (roleContext.includes('founder') || roleContext.includes('ceo')) {
      return [
        `Strategic leadership in ${industryContext} transformation`,
        "Building category-defining companies that reshape markets",
        "Driving innovation through collaborative entrepreneurial ecosystems",
        "Creating sustainable value and meaningful impact for all stakeholders",
        "Leveraging cutting-edge technology to solve complex global challenges"
      ];
    } else if (roleContext.includes('investor') || roleContext.includes('partner')) {
      return [
        `Identifying breakthrough opportunities in ${industryContext} innovation`,
        "Building portfolios of exceptional founders and transformative companies",
        "Providing strategic capital and guidance for sustainable growth",
        "Creating value through deep industry expertise and network effects",
        "Supporting visionary entrepreneurs who are changing the world"
      ];
    } else {
      return [
        `Excellence and thought leadership in ${industryContext}`,
        "Building strategic partnerships that drive meaningful innovation",
        "Contributing expertise to collaborative growth initiatives", 
        "Creating sustainable value through strategic decision-making",
        "Leveraging technology and insights to solve industry challenges"
      ];
    }
  }

  /**
   * Generate connection targets using enhanced AI-powered matching
   */
  private async generateConnectionTargets(profile: ProfileOutput, input: BuilderInput) {
    console.log('🔗 Generating connection targets with enhanced matcher...');
    
    try {
      // Get candidate members from STAK database (mock for now)
      const rawCandidates = await this.getCandidateMembersForMatching(profile, input);
      
      if (rawCandidates.length === 0) {
        console.log('No candidate members found for connection matching');
        return;
      }

      // Transform candidates to match the expected structure
      const structuredCandidates = rawCandidates.map(candidate => ({
        member_id: candidate.member_id,
        company: candidate.company,
        headline: `${candidate.title} at ${candidate.company}`,
        industries: candidate.industries,
        skills_keywords: candidate.skills,
        interests_topics: candidate.interests
      }));

      const systemPrompt = SYSTEM_CONNECTION_MATCHER;
      const userPrompt = USER_CONNECTION_MATCHER({
        me: {
          person: profile.person,
          industries: profile.person.industries,
          skills_keywords: profile.person.skills_keywords,
          interests_topics: profile.person.interests_topics,
          goals: profile.stak_recos.goal_suggestions,
          mission: profile.stak_recos.mission_pack
        },
        candidates: structuredCandidates
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for consistent matching
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (Array.isArray(result)) {
        // Handle direct array response
        profile.stak_recos.connection_targets = result.slice(0, 5); // Limit to 5 as per spec
        console.log(`✅ Generated ${result.length} connection targets`);
      } else if (result.connection_targets && Array.isArray(result.connection_targets)) {
        profile.stak_recos.connection_targets = result.connection_targets.slice(0, 5);
        console.log(`✅ Generated ${result.connection_targets.length} connection targets`);
      } else {
        console.warn('⚠️ AI connection matching returned unexpected format, trying to parse...');
        // Try to extract from various possible structures
        const targets = result.targets || result.matches || [];
        if (Array.isArray(targets)) {
          profile.stak_recos.connection_targets = targets.slice(0, 5);
          console.log(`✅ Generated ${targets.length} connection targets (parsed)`);
        }
      }

    } catch (error) {
      console.error('❌ Connection targets generation failed:', error);
      // Keep empty array as fallback
      profile.stak_recos.connection_targets = [];
    }
  }

  /**
   * Generate sponsor targets focused on relevance (tooling, hiring, perks)
   */
  private async generateSponsorTargets(profile: ProfileOutput, input: BuilderInput) {
    console.log('💼 Generating sponsor targets with relevance engine...');
    
    try {
      // Get potential sponsors from STAK database (mock for now)
      const potentialSponsors = await this.getPotentialSponsorsForMatching(profile, input);
      
      if (potentialSponsors.length === 0) {
        console.log('No potential sponsors found for matching');
        return;
      }

      const systemPrompt = SYSTEM_SPONSOR_MATCHER;
      
      const userPrompt = `MEMBER_PROFILE:
${JSON.stringify({
  person: profile.person,
  industries: profile.person.industries,
  skills_keywords: profile.person.skills_keywords,
  interests_topics: profile.person.interests_topics,
  current_role: profile.person.current_role,
  goals: profile.stak_recos.goal_suggestions
}, null, 2)}

SPONSOR_INDEX:
${JSON.stringify(potentialSponsors, null, 2)}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (Array.isArray(result)) {
        // Handle direct array response
        profile.stak_recos.sponsor_targets = result.slice(0, 3); // Limit to 3 as per spec
        console.log(`✅ Generated ${result.length} sponsor targets`);
      } else if (result.sponsor_targets && Array.isArray(result.sponsor_targets)) {
        profile.stak_recos.sponsor_targets = result.sponsor_targets.slice(0, 3);
        console.log(`✅ Generated ${result.sponsor_targets.length} sponsor targets`);
      } else {
        console.warn('⚠️ AI sponsor matching returned unexpected format, trying to parse...');
        const targets = result.targets || result.matches || result.sponsors || [];
        if (Array.isArray(targets)) {
          profile.stak_recos.sponsor_targets = targets.slice(0, 3);
          console.log(`✅ Generated ${targets.length} sponsor targets (parsed)`);
        }
      }

    } catch (error) {
      console.error('❌ Sponsor targets generation failed:', error);
      // Keep empty array as fallback
      profile.stak_recos.sponsor_targets = [];
    }
  }

  /**
   * Get candidate STAK members for connection matching
   * TODO: Replace with actual STAK member database query
   */
  private async getCandidateMembersForMatching(profile: ProfileOutput, input: BuilderInput) {
    // Enhanced mock candidate members with more diversity for better matching
    const mockCandidates = [
      {
        member_id: "member_001",
        name: "Alex Thompson",
        title: "VP of Engineering",
        company: "TechCorp",
        industries: ["technology", "artificial_intelligence"],
        skills: ["machine_learning", "team_leadership", "product_development"],
        interests: ["startup_scaling", "technical_mentorship"],
        location: "San Francisco",
        networking_goals: ["Looking for technical co-founders", "Seeking AI startup investments"]
      },
      {
        member_id: "member_002", 
        name: "Maria Rodriguez",
        title: "Managing Partner",
        company: "Venture Dynamics",
        industries: ["venture_capital", "fintech"],
        skills: ["due_diligence", "portfolio_management", "strategic_partnerships"],
        interests: ["fintech_innovation", "diverse_founding_teams"],
        location: "New York",
        networking_goals: ["Sourcing Series A opportunities", "Building LP relationships"]
      },
      {
        member_id: "member_003",
        name: "David Kim",
        title: "Chief Marketing Officer", 
        company: "Growth Labs",
        industries: ["marketing", "e_commerce"],
        skills: ["digital_marketing", "brand_strategy", "growth_hacking"],
        interests: ["consumer_behavior", "marketing_automation"],
        location: "Los Angeles",
        networking_goals: ["Seeking board positions", "Looking for marketing partnerships"]
      },
      {
        member_id: "member_004",
        name: "Sarah Chen",
        title: "Founder & CEO",
        company: "HealthTech Innovations",
        industries: ["healthcare", "artificial_intelligence"],
        skills: ["healthcare_regulation", "ai_development", "fundraising"],
        interests: ["digital_health", "regulatory_compliance"],
        location: "Boston",
        networking_goals: ["Seeking Series B funding", "Looking for healthcare industry partnerships"]
      },
      {
        member_id: "member_005",
        name: "Michael Johnson",
        title: "CTO",
        company: "CloudScale Systems",
        industries: ["cloud_computing", "enterprise_software"],
        skills: ["cloud_architecture", "scalable_systems", "team_building"],
        interests: ["distributed_systems", "engineering_leadership"],
        location: "Seattle",
        networking_goals: ["Exploring CTO advisory roles", "Seeking technical partnerships"]
      }
    ];

    // Enhanced filtering with better scoring
    const scoredCandidates = mockCandidates.map(candidate => {
      let score = 0;
      
      // Industry overlap (highest priority)
      const industryOverlap = candidate.industries.filter(industry => 
        profile.person.industries.includes(industry)
      ).length;
      score += industryOverlap * 3;
      
      // Skills overlap 
      const skillsOverlap = candidate.skills.filter(skill =>
        profile.person.skills_keywords.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      ).length;
      score += skillsOverlap * 2;
      
      // Interests overlap
      const interestsOverlap = candidate.interests.filter(interest =>
        profile.person.interests_topics.some(userInterest =>
          userInterest.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(userInterest.toLowerCase())
        )
      ).length;
      score += interestsOverlap * 1;
      
      // Penalize same company (but don't exclude completely)
      if (candidate.company === profile.person.current_role.company.value) {
        score -= 5;
      }
      
      return { ...candidate, match_score: score };
    });

    // Sort by score and return top candidates
    const sortedCandidates = scoredCandidates
      .filter(candidate => candidate.match_score > 0 || mockCandidates.length <= 3) // Keep some even with low scores if we don't have many
      .sort((a, b) => b.match_score - a.match_score);

    return sortedCandidates.slice(0, 8); // Return top 8 candidates for matching
  }

  /**
   * Get potential sponsors for relevance-based matching
   * TODO: Replace with actual sponsor database query
   */
  private async getPotentialSponsorsForMatching(profile: ProfileOutput, input: BuilderInput) {
    // Enhanced mock sponsors focused on tooling, hiring, and perks
    const mockSponsors = [
      {
        sponsor_id: "sponsor_001",
        name: "DevTools Pro",
        category_tags: ["development_tools", "productivity", "cloud_infrastructure"],
        short_value_prop: "Advanced development platform with AI-powered code analysis and deployment automation",
        target_audience: ["engineers", "ctos", "developers"],
        offerings: ["free_pro_accounts", "technical_workshops", "priority_support"]
      },
      {
        sponsor_id: "sponsor_002", 
        name: "TalentBridge Recruiting",
        category_tags: ["hiring", "recruitment", "talent_acquisition"],
        short_value_prop: "Executive search and technical recruiting for high-growth startups",
        target_audience: ["founders", "ceos", "hr_leaders"],
        offerings: ["free_candidate_sourcing", "hiring_strategy_consultation", "network_introductions"]
      },
      {
        sponsor_id: "sponsor_003",
        name: "CloudScale Solutions", 
        category_tags: ["cloud_infrastructure", "scalability", "enterprise_software"],
        short_value_prop: "Scalable cloud infrastructure with automatic optimization for growing companies",
        target_audience: ["ctos", "engineers", "operations"],
        offerings: ["startup_credits", "architecture_review", "24_7_support"]
      },
      {
        sponsor_id: "sponsor_004",
        name: "Executive Wellness Co",
        category_tags: ["wellness", "executive_benefits", "work_life_balance"],
        short_value_prop: "Premium wellness and mental health services designed for busy executives",
        target_audience: ["executives", "founders", "senior_leaders"],
        offerings: ["complimentary_sessions", "team_wellness_programs", "executive_coaching"]
      },
      {
        sponsor_id: "sponsor_005",
        name: "Legal Partners Group",
        category_tags: ["legal_services", "startup_law", "compliance"],
        short_value_prop: "Specialized legal services for startups, from incorporation to Series A and beyond",
        target_audience: ["founders", "ceos", "legal_teams"],
        offerings: ["free_startup_consultation", "discounted_incorporation", "regulatory_guidance"]
      },
      {
        sponsor_id: "sponsor_006",
        name: "DataSecure Analytics",
        category_tags: ["data_analytics", "security", "business_intelligence"],
        short_value_prop: "Enterprise-grade data analytics with built-in security and compliance features",
        target_audience: ["data_scientists", "analysts", "security_teams"],
        offerings: ["free_security_audit", "analytics_training", "custom_dashboard_setup"]
      }
    ];

    // Enhanced relevance filtering based on role, skills, and interests
    const scoredSponsors = mockSponsors.map(sponsor => {
      let relevanceScore = 0;
      
      // Role-based relevance
      const userRole = profile.person.current_role.title.value?.toLowerCase() || '';
      const roleMatches = sponsor.target_audience.filter(audience =>
        userRole.includes(audience.replace('_', ' ')) || 
        audience.replace('_', ' ').includes(userRole)
      ).length;
      relevanceScore += roleMatches * 3;
      
      // Skills-based relevance
      const skillMatches = sponsor.category_tags.filter(tag =>
        profile.person.skills_keywords.some(skill =>
          skill.toLowerCase().includes(tag.replace('_', ' ')) ||
          tag.replace('_', ' ').includes(skill.toLowerCase())
        )
      ).length;
      relevanceScore += skillMatches * 2;
      
      // Industry/interest relevance
      const interestMatches = sponsor.category_tags.filter(tag =>
        profile.person.interests_topics.some(interest =>
          interest.toLowerCase().includes(tag.replace('_', ' ')) ||
          tag.replace('_', ' ').includes(interest.toLowerCase())
        ) ||
        profile.person.industries.some(industry =>
          industry.toLowerCase().includes(tag.replace('_', ' ')) ||
          tag.replace('_', ' ').includes(industry.toLowerCase())
        )
      ).length;
      relevanceScore += interestMatches * 1;
      
      return { ...sponsor, relevance_score: relevanceScore };
    });

    // Sort by relevance and return top sponsors
    const sortedSponsors = scoredSponsors
      .filter(sponsor => sponsor.relevance_score > 0 || mockSponsors.length <= 4) // Keep some even with low scores if limited options
      .sort((a, b) => b.relevance_score - a.relevance_score);

    return sortedSponsors.slice(0, 6); // Return top 6 sponsors for matching
  }

  private mergePublicData(profile: ProfileOutput, sources: any) {
    console.log('🔄 Merging public data sources with conflict resolution...');
    
    // Collect all candidate values for each field with enhanced typing
    const fieldCandidates = {
      name: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      bio: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      title: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      company: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      headline: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      geo: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>,
      avatar_url: [] as Array<{value: string, source_url: string, source_type: "vendor" | "public_web" | "company_site"}>
    };

    // Process social media data and collect candidates with enhanced source typing
    sources.social.forEach((social: any) => {
      const sourceType = this.mapToResolverSourceType(social.source_url);
      
      if (social.displayName) {
        fieldCandidates.name.push({
          value: social.displayName,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.bio) {
        fieldCandidates.bio.push({
          value: social.bio,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.title) {
        fieldCandidates.title.push({
          value: social.title,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.company) {
        fieldCandidates.company.push({
          value: social.company,
          source_url: social.source_url,
          source_type: sourceType
        });
      }

      // Additional fields for enhanced resolver
      if (social.headline) {
        fieldCandidates.headline.push({
          value: social.headline,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.location) {
        fieldCandidates.geo.push({
          value: social.location,
          source_url: social.source_url,
          source_type: sourceType
        });
      }
      
      if (social.avatarUrl) {
        fieldCandidates.avatar_url.push({
          value: social.avatarUrl,
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
        confidence: this.getConfidenceBySourceType(candidate.source_type),
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
        confidence: this.getConfidenceBySourceType(candidate.source_type),
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
        confidence: this.getConfidenceBySourceType(candidate.source_type),
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
        confidence: this.getConfidenceBySourceType(candidate.source_type),
        source_urls: [candidate.source_url]
      };
    }

    // Handle additional fields with enhanced resolver
    await this.resolveAdditionalFields(profile, fieldCandidates);
  }

  /**
   * Resolve additional fields (headline, geo, avatar_url) introduced in enhanced resolver
   */
  private async resolveAdditionalFields(profile: ProfileOutput, fieldCandidates: any) {
    // Resolve headline conflicts
    if (fieldCandidates.headline.length > 1) {
      const resolved = await this.resolveFieldWithAI('headline', fieldCandidates.headline);
      if (resolved) {
        profile.person.headline = resolved;
      }
    } else if (fieldCandidates.headline.length === 1) {
      const candidate = fieldCandidates.headline[0];
      profile.person.headline = {
        value: candidate.value,
        confidence: this.getConfidenceBySourceType(candidate.source_type),
        source_urls: [candidate.source_url]
      };
    }

    // Resolve geo conflicts
    if (fieldCandidates.geo.length > 1) {
      const resolved = await this.resolveFieldWithAI('geo', fieldCandidates.geo);
      if (resolved) {
        profile.person.geo = resolved;
      }
    } else if (fieldCandidates.geo.length === 1) {
      const candidate = fieldCandidates.geo[0];
      profile.person.geo = {
        value: candidate.value,
        confidence: this.getConfidenceBySourceType(candidate.source_type),
        source_urls: [candidate.source_url]
      };
    }

    // Resolve avatar_url conflicts
    if (fieldCandidates.avatar_url.length > 1) {
      const resolved = await this.resolveFieldWithAI('avatar_url', fieldCandidates.avatar_url);
      if (resolved) {
        profile.person.avatar_url = resolved;
      }
    } else if (fieldCandidates.avatar_url.length === 1) {
      const candidate = fieldCandidates.avatar_url[0];
      profile.person.avatar_url = {
        value: candidate.value,
        confidence: this.getConfidenceBySourceType(candidate.source_type),
        source_urls: [candidate.source_url]
      };
    }
  }

  /**
   * Get confidence score based on source type
   */
  private getConfidenceBySourceType(sourceType: "vendor" | "public_web" | "company_site"): number {
    switch (sourceType) {
      case 'vendor': return 0.9;
      case 'company_site': return 0.8;
      case 'public_web': return 0.6;
      default: return 0.5;
    }
  }

  /**
   * Use enhanced AI field resolver with structured input
   */
  private async resolveFieldWithAI(
    fieldName: "name" | "bio" | "title" | "company" | "headline" | "geo" | "avatar_url", 
    candidates: any[], 
    context?: any
  ): Promise<ProfileDataPoint | null> {
    try {
      // Map field names to resolver field types
      const fieldTypeMap = {
        name: "headline", // Use headline for name resolution
        bio: "bio",
        title: "current_role.title",
        company: "current_role.company", 
        headline: "headline",
        geo: "geo",
        avatar_url: "avatar_url"
      };

      const resolverField = fieldTypeMap[fieldName] as any;
      
      const userPrompt = USER_FIELD_RESOLVER({
        field: resolverField,
        candidates: candidates,
        context: context || {
          field_name: fieldName,
          resolution_timestamp: new Date().toISOString()
        }
      });

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: SYSTEM_FIELD_RESOLVER },
          { role: "user", content: userPrompt }
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
      // Enhanced fallback with source type preference
      const sortedCandidates = candidates.sort((a, b) => {
        const sourceRank = { vendor: 3, company_site: 2, public_web: 1 };
        return (sourceRank[b.source_type] || 0) - (sourceRank[a.source_type] || 0);
      });
      
      const best = sortedCandidates[0];
      return {
        value: best.value,
        confidence: best.source_type === 'vendor' ? 0.8 : best.source_type === 'company_site' ? 0.7 : 0.6,
        source_urls: [best.source_url]
      };
    }
  }

  /**
   * Map URLs to resolver source types (vendor | public_web | company_site)
   */
  private mapToResolverSourceType(url: string): "vendor" | "public_web" | "company_site" {
    const lower = url.toLowerCase();
    
    // Vendor APIs and verified sources
    if (lower.includes('api.') || lower.includes('clearbit.') || lower.includes('peopledatalabs.') || 
        lower.includes('fullcontact.') || lower.includes('linkedin.com/in/')) {
      return 'vendor';
    }
    
    // Company sites and official domains
    if (lower.includes('.com') && !lower.includes('social') && !lower.includes('github') && 
        !lower.includes('twitter') && !lower.includes('facebook')) {
      // Try to detect if it's a company domain vs social platform
      const domain = new URL(url).hostname;
      const socialDomains = ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'tiktok.com'];
      if (!socialDomains.some(social => domain.includes(social))) {
        return 'company_site';
      }
    }
    
    // Everything else is public web
    return 'public_web';
  }

  /**
   * Determine source type for confidence weighting (legacy method)
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