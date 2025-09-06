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
}

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
   * Phase 1: Gather data from public sources
   */
  private async gatherPublicData(input: BuilderInput) {
    console.log('📊 Gathering public data...');
    
    const sources = {
      social: [] as any[],
      webSearch: null as any,
      emailDomain: null as any
    };

    // Social media analysis from provided URLs
    if (input.social_urls?.length) {
      for (const url of input.social_urls) {
        try {
          const socialData = await socialMediaCrawler.analyzeSocialProfile(url);
          sources.social.push({ ...socialData, source_url: url });
        } catch (error) {
          console.warn(`Failed to analyze ${url}:`, error);
        }
      }
    }

    // Web search based on available info
    if (input.email) {
      const emailDomain = input.email.split('@')[1];
      sources.emailDomain = { domain: emailDomain, email: input.email };
      
      // Use web search to find information about this person
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
   * Phase 3: Generate AI enhancements
   */
  private async generateAIEnhancements(profile: ProfileOutput, input: BuilderInput) {
    console.log('🧠 Generating AI enhancements...');
    
    const context = this.buildContextForAI(profile, input);
    
    const prompt = `Based on the following data sources, enhance this professional profile:

${context}

Generate enhancements for:
1. Professional bio (2-3 compelling sentences)
2. Industry keywords (relevant sectors)
3. Skills keywords (technical and soft skills)
4. Interest topics (professional interests)

Return as JSON with keys: bio, industries, skills, interests
Each should be concise and professional.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: "You are a professional profile writer for STAK Sync, a luxury networking platform." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiEnhancements = JSON.parse(response.choices[0].message.content || '{}');
      
      // Apply AI enhancements with confidence scores
      if (aiEnhancements.bio && !profile.person.bio.value) {
        profile.person.bio = {
          value: aiEnhancements.bio,
          confidence: 0.8,
          source_urls: ['ai_generated']
        };
      }

      if (aiEnhancements.industries) {
        profile.person.industries = aiEnhancements.industries;
      }

      if (aiEnhancements.skills) {
        profile.person.skills_keywords = aiEnhancements.skills;
      }

      if (aiEnhancements.interests) {
        profile.person.interests_topics = aiEnhancements.interests;
      }

    } catch (error) {
      console.error('AI enhancement failed:', error);
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
    console.log('🔄 Merging public data sources...');
    
    // Process social media data
    sources.social.forEach((social: any) => {
      const confidence = this.calculateSocialConfidence(social);
      
      if (social.displayName && !profile.person.name.value) {
        profile.person.name = {
          value: social.displayName,
          confidence,
          source_urls: [social.source_url]
        };
      }
      
      if (social.bio && !profile.person.bio.value) {
        profile.person.bio = {
          value: social.bio,
          confidence,
          source_urls: [social.source_url]
        };
      }
      
      if (social.title && !profile.person.current_role.title.value) {
        profile.person.current_role.title = {
          value: social.title,
          confidence,
          source_urls: [social.source_url]
        };
      }
      
      if (social.company && !profile.person.current_role.company.value) {
        profile.person.current_role.company = {
          value: social.company,
          confidence,
          source_urls: [social.source_url]
        };
      }

      // Update links
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

    // Process email domain data
    if (sources.emailDomain) {
      profile.person.email = {
        value: sources.emailDomain.email,
        confidence: 1.0,
        source_urls: ['user_provided']
      };
    }
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

  private buildContextForAI(profile: ProfileOutput, input: BuilderInput): string {
    const parts = [];
    
    if (profile.person.name.value) {
      parts.push(`Name: ${profile.person.name.value}`);
    }
    
    if (profile.person.current_role.title.value) {
      parts.push(`Title: ${profile.person.current_role.title.value}`);
    }
    
    if (profile.person.current_role.company.value) {
      parts.push(`Company: ${profile.person.current_role.company.value}`);
    }
    
    if (input.manual_context) {
      parts.push(`Additional Context: ${input.manual_context}`);
    }
    
    return parts.join('\n');
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