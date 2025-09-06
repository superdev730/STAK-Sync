import OpenAI from 'openai';
import { webSearchService } from './webSearchService';
import { profileRecommendationService } from './profileRecommendationService';
import { socialMediaCrawler } from './socialMediaCrawler';
import { User } from '@shared/schema';

interface ProfileSource {
  platform: string;
  url: string;
}

interface ProfileData {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  email?: string;
}

interface EnhancedGeneratedProfile {
  bio: string;
  networkingGoal: string;
  networkingGoalSuggestions?: string[];
  skills: string[];
  industries: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
  enhancementSources: {
    webSearch: boolean;
    peerFeedback: boolean;
    socialMedia: boolean;
    sources: string[];
  };
}

export class EnhancedAIProfileBuilder {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async buildEnhancedProfile(
    userId: string,
    socialSources: ProfileSource[],
    additionalContext: string,
    currentProfile: ProfileData
  ): Promise<EnhancedGeneratedProfile> {
    console.log('Building enhanced AI profile with web search and peer feedback');

    // Step 1: Gather data from multiple sources
    const [webSearchData, peerFeedback, socialMediaData] = await Promise.allSettled([
      this.gatherWebSearchData(currentProfile),
      this.gatherPeerFeedback(userId),
      this.gatherSocialMediaData(socialSources)
    ]);

    // Step 2: Combine all data sources
    const enhancedData = this.combineDataSources(
      webSearchData,
      peerFeedback,
      socialMediaData,
      currentProfile,
      additionalContext
    );

    // Step 3: Generate enhanced profile using AI
    const profile = await this.generateProfileWithAI(enhancedData);

    return profile;
  }

  private async gatherWebSearchData(currentProfile: ProfileData) {
    try {
      if (!currentProfile.firstName || !currentProfile.lastName) {
        return { success: false, data: null };
      }

      const searchResults = await webSearchService.searchPersonalAchievements(
        currentProfile.firstName,
        currentProfile.lastName,
        currentProfile.company,
        currentProfile.title
      );

      return { success: true, data: searchResults };
    } catch (error) {
      console.error('Web search failed:', error);
      return { success: false, data: null };
    }
  }

  private async gatherPeerFeedback(userId: string) {
    try {
      const feedback = await profileRecommendationService.getAggregatedFeedback(userId);
      return { success: true, data: feedback };
    } catch (error) {
      console.error('Peer feedback gathering failed:', error);
      return { success: false, data: null };
    }
  }

  private async gatherSocialMediaData(socialSources: ProfileSource[]) {
    try {
      const socialData = [];
      
      for (const source of socialSources) {
        try {
          const profileData = await socialMediaCrawler.analyzeSocialProfile(source.url);
          socialData.push(profileData);
        } catch (error) {
          console.error(`Failed to analyze ${source.platform}:`, error);
        }
      }

      return { success: true, data: socialData };
    } catch (error) {
      console.error('Social media data gathering failed:', error);
      return { success: false, data: [] };
    }
  }

  private combineDataSources(
    webSearchResult: any,
    peerFeedbackResult: any,
    socialMediaResult: any,
    currentProfile: ProfileData,
    additionalContext: string
  ) {
    const combinedData = {
      currentProfile,
      additionalContext,
      webSearchData: webSearchResult.status === 'fulfilled' ? webSearchResult.value.data : null,
      peerFeedback: peerFeedbackResult.status === 'fulfilled' ? peerFeedbackResult.value.data : null,
      socialMediaData: socialMediaResult.status === 'fulfilled' ? socialMediaResult.value.data : [],
      sources: [] as string[]
    };

    // Collect sources
    if (combinedData.webSearchData?.sources) {
      combinedData.sources.push(...combinedData.webSearchData.sources);
    }

    return combinedData;
  }

  private async generateProfileWithAI(enhancedData: any): Promise<EnhancedGeneratedProfile> {
    try {
      const prompt = this.buildEnhancedPrompt(enhancedData);

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an elite professional profile writer for STAK Sync, a luxury networking platform for venture capitalists, startup founders, and industry leaders. 

Your task is to create compelling, authentic profiles that help users stand out in this exclusive network. Use data from web search, peer feedback, and social media to craft profiles that showcase achievements, capabilities, and networking value.

Key guidelines:
- Write in a confident, professional tone that conveys authority and success
- Highlight unique achievements and recent accomplishments  
- Focus on value proposition for networking and collaboration
- Use specific details from the provided data sources
- Avoid generic phrases - make each profile unique and memorable
- Emphasize leadership, innovation, and industry impact`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        bio: result.bio || this.generateFallbackBio(enhancedData.currentProfile),
        networkingGoal: result.networkingGoal || this.generateFallbackNetworkingGoal(enhancedData.currentProfile),
        networkingGoalSuggestions: result.networkingGoalSuggestions || [],
        skills: result.skills || [],
        industries: result.industries || [],
        linkedinUrl: result.linkedinUrl,
        twitterUrl: result.twitterUrl,
        githubUrl: result.githubUrl,
        websiteUrls: result.websiteUrls || [],
        enhancementSources: {
          webSearch: !!enhancedData.webSearchData,
          peerFeedback: !!enhancedData.peerFeedback,
          socialMedia: enhancedData.socialMediaData?.length > 0,
          sources: enhancedData.sources
        }
      };
    } catch (error) {
      console.error('AI profile generation failed:', error);
      return this.generateFallbackProfile(enhancedData);
    }
  }

  private buildEnhancedPrompt(data: any): string {
    let prompt = `Create a professional profile for ${data.currentProfile.firstName} ${data.currentProfile.lastName}`;
    
    if (data.currentProfile.title && data.currentProfile.company) {
      prompt += `, ${data.currentProfile.title} at ${data.currentProfile.company}`;
    }
    
    prompt += `.\n\nAvailable data sources:\n`;

    // Add web search achievements
    if (data.webSearchData) {
      prompt += `\n**Recent Achievements & Recognition:**\n`;
      if (data.webSearchData.achievements?.length > 0) {
        prompt += `Achievements: ${data.webSearchData.achievements.join('; ')}\n`;
      }
      if (data.webSearchData.accolades?.length > 0) {
        prompt += `Awards/Recognition: ${data.webSearchData.accolades.join('; ')}\n`;
      }
      if (data.webSearchData.recentNews?.length > 0) {
        prompt += `Recent News: ${data.webSearchData.recentNews.join('; ')}\n`;
      }
      if (data.webSearchData.socialEngagement?.length > 0) {
        prompt += `Speaking/Thought Leadership: ${data.webSearchData.socialEngagement.join('; ')}\n`;
      }
    }

    // Add peer feedback
    if (data.peerFeedback) {
      prompt += `\n**Colleague Feedback:**\n`;
      if (data.peerFeedback.topQualities?.length > 0) {
        prompt += `Top Qualities: ${data.peerFeedback.topQualities.join('; ')}\n`;
      }
      if (data.peerFeedback.topSkills?.length > 0) {
        prompt += `Key Skills: ${data.peerFeedback.topSkills.join('; ')}\n`;
      }
      if (data.peerFeedback.accomplishments?.length > 0) {
        prompt += `Notable Accomplishments: ${data.peerFeedback.accomplishments.join('; ')}\n`;
      }
      if (data.peerFeedback.personalFeedback?.length > 0) {
        prompt += `Collaboration Style: ${data.peerFeedback.personalFeedback.join('; ')}\n`;
      }
    }

    // Add social media data
    if (data.socialMediaData?.length > 0) {
      prompt += `\n**Social Media Insights:**\n`;
      data.socialMediaData.forEach((social: any) => {
        if (social.bio) prompt += `${social.platform} Bio: ${social.bio}\n`;
        if (social.skills?.length > 0) prompt += `${social.platform} Skills: ${social.skills.join(', ')}\n`;
      });
    }

    // Add additional context
    if (data.additionalContext) {
      prompt += `\n**Additional Context:** ${data.additionalContext}\n`;
    }

    prompt += `\n**Task:** Create a comprehensive professional profile with:

1. **Bio** (150-200 words): A compelling professional biography that showcases achievements, leadership, and unique value proposition. Use specific accomplishments from the data above.

2. **Networking Goal** (100-150 words): A strategic networking objective that clearly articulates what they're seeking and what value they offer to connections.

3. **Skills** (10-15 items): Key professional skills and expertise areas

4. **Industries** (3-5 items): Relevant industry sectors

5. **Networking Goal Suggestions** (5 options): Alternative networking goals they could choose from

Return as JSON with keys: bio, networkingGoal, skills, industries, networkingGoalSuggestions`;

    return prompt;
  }

  private generateFallbackBio(profile: ProfileData): string {
    return `${profile.firstName} ${profile.lastName} is an accomplished ${profile.title || 'professional'} ${profile.company ? `at ${profile.company}` : ''} with a proven track record of driving results and building meaningful professional relationships.`;
  }

  private generateFallbackNetworkingGoal(profile: ProfileData): string {
    return `Seeking to connect with innovative leaders and explore opportunities for strategic collaboration and mutual growth within the STAK ecosystem.`;
  }

  private generateFallbackProfile(data: any): EnhancedGeneratedProfile {
    return {
      bio: this.generateFallbackBio(data.currentProfile),
      networkingGoal: this.generateFallbackNetworkingGoal(data.currentProfile),
      skills: [],
      industries: [],
      networkingGoalSuggestions: [],
      enhancementSources: {
        webSearch: false,
        peerFeedback: false,
        socialMedia: false,
        sources: []
      }
    };
  }
}

export const enhancedAIProfileBuilder = new EnhancedAIProfileBuilder();