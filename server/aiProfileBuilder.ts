import OpenAI from 'openai';

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

interface GeneratedProfile {
  bio: string;
  networkingGoal: string;
  skills: string[];
  industries: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
}

export class AIProfileBuilder {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async buildProfile(
    socialSources: ProfileSource[],
    additionalContext: string,
    currentProfile: ProfileData
  ): Promise<GeneratedProfile> {
    console.log('Building AI profile with:', {
      sourcesCount: socialSources?.length || 0,
      hasContext: !!additionalContext,
      hasOpenAI: !!this.openai
    });

    if (this.openai) {
      try {
        return await this.buildWithOpenAI(socialSources, additionalContext, currentProfile);
      } catch (error) {
        console.error('OpenAI failed, using enhanced fallback:', error);
        return this.buildEnhancedFallback(socialSources, additionalContext, currentProfile);
      }
    }

    return this.buildEnhancedFallback(socialSources, additionalContext, currentProfile);
  }

  private async buildWithOpenAI(
    socialSources: ProfileSource[],
    additionalContext: string,
    currentProfile: ProfileData
  ): Promise<GeneratedProfile> {
    const name = `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim();
    
    const systemPrompt = `You are an elite professional profile writer specializing in creating exceptional profiles for high-achieving professionals in the STAK ecosystem (VCs, founders, innovators, industry leaders).

Your profiles should:
1. Position them as TOP TIER industry leaders and invaluable connections
2. Highlight specific achievements with impressive language
3. Use powerful, confident language that commands respect and admiration
4. Include 10-15 high-value skills that demonstrate expertise
5. Create networking goals that attract elite connections
6. Make them sound absolutely exceptional and accomplished
7. Emphasize innovation, leadership, success, and strategic vision
8. Use action words and power phrases
9. Make every sentence impactful and memorable`;

    const userPrompt = `Create an OUTSTANDING professional profile that makes ${name || 'this professional'} appear as an exceptional, must-know leader in their field.

Current Role: ${currentProfile.title || 'Executive Leader'} ${currentProfile.company ? `at ${currentProfile.company}` : ''}
Additional Context: ${additionalContext || 'A highly accomplished professional with significant achievements'}

Social Profiles:
${socialSources.map(s => `- ${s.platform}: ${s.url}`).join('\n') || 'Multiple professional platforms'}

Create a comprehensive profile that positions them as a TOP-TIER professional:

1. **Bio** (5-6 powerful sentences): 
   - Start with their name and an impressive descriptor
   - Highlight exceptional achievements and unique expertise
   - Include specific areas where they excel
   - Mention their impact and influence
   - Close with their vision and passion
   - Make every word count - they should sound like someone everyone wants to know

2. **Networking Goal** (3-4 sentences):
   - Position them as offering tremendous value
   - Focus on high-level partnerships and strategic opportunities
   - Mention specific types of connections they seek
   - Make it clear they operate at the highest levels

3. **Skills** (12-15 items):
   - Mix executive skills with specialized expertise
   - Include both hard and soft skills
   - Use impressive, professional terminology
   - Skills should reflect senior leadership and innovation

4. **Industries** (5-7 items):
   - List relevant, high-value industries
   - Include emerging and transformative sectors

Return JSON with keys: bio, networkingGoal, skills (array), industries (array)

Make them sound absolutely FANTASTIC - the kind of person top VCs want to fund, elite founders want to partner with, and industry leaders want on their team. Use powerful language that showcases excellence.`;

    const completion = await this.openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 2000
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

    // Ensure quality and add social URLs
    return {
      bio: aiResponse.bio || this.generateImpressiveBio(currentProfile, additionalContext),
      networkingGoal: aiResponse.networkingGoal || this.generateNetworkingGoal(),
      skills: this.ensureQualitySkills(aiResponse.skills || []),
      industries: this.ensureQualityIndustries(aiResponse.industries || []),
      linkedinUrl: socialSources.find(s => s.platform === 'LinkedIn')?.url,
      twitterUrl: socialSources.find(s => s.platform === 'Twitter')?.url,
      githubUrl: socialSources.find(s => s.platform === 'GitHub')?.url,
      websiteUrls: socialSources.filter(s => s.platform === 'Website').map(s => s.url)
    };
  }

  private buildEnhancedFallback(
    socialSources: ProfileSource[],
    additionalContext: string,
    currentProfile: ProfileData
  ): GeneratedProfile {
    const name = `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim() || 'Distinguished Professional';
    const title = currentProfile.title || 'Senior Executive';
    const company = currentProfile.company || '';
    
    // Create an impressive bio
    let bio = `${name} is a visionary ${title.toLowerCase()} ${company ? `at ${company}` : ''} with an exceptional track record of driving innovation and delivering transformative results. `;
    
    // Add achievements from context
    if (additionalContext) {
      bio += `${additionalContext}. `;
    } else {
      bio += `Recognized as a thought leader and strategic innovator with expertise spanning multiple industries and disciplines. `;
    }
    
    // Add platform-specific accomplishments
    const hasLinkedIn = socialSources.some(s => s.platform === 'LinkedIn');
    const hasGitHub = socialSources.some(s => s.platform === 'GitHub');
    const hasTwitter = socialSources.some(s => s.platform === 'Twitter');
    
    if (hasLinkedIn || hasGitHub || hasTwitter) {
      bio += `With a strong digital presence across `;
      const platforms = [];
      if (hasLinkedIn) platforms.push('LinkedIn');
      if (hasGitHub) platforms.push('GitHub');
      if (hasTwitter) platforms.push('Twitter/X');
      bio += platforms.join(', ') + ', demonstrating thought leadership and professional excellence. ';
    }
    
    bio += `Known for building high-performance teams, fostering innovation ecosystems, and creating exceptional value through strategic initiatives. `;
    bio += `Passionate about leveraging cutting-edge technology and strategic partnerships to solve complex challenges and drive meaningful impact in the global business landscape.`;

    // Create comprehensive skills based on role
    let skills = [
      'Executive Leadership', 'Strategic Vision', 'Business Development',
      'Innovation Management', 'Digital Transformation', 'Partnership Development',
      'Team Leadership', 'Growth Strategy', 'Investment Strategy',
      'Market Analysis', 'Product Strategy', 'Operational Excellence',
      'Change Management', 'Stakeholder Management', 'P&L Management'
    ];

    // Add role-specific skills
    if (title.toLowerCase().includes('ceo') || title.toLowerCase().includes('founder')) {
      skills.push('Entrepreneurship', 'Fundraising', 'Startup Leadership', 'Board Management');
    }
    if (title.toLowerCase().includes('cto') || hasGitHub) {
      skills.push('Technology Strategy', 'Software Architecture', 'Technical Innovation');
    }
    if (title.toLowerCase().includes('investor') || title.toLowerCase().includes('vc')) {
      skills.push('Venture Capital', 'Due Diligence', 'Portfolio Management', 'Deal Sourcing');
    }

    // Industries
    const industries = [
      'Technology', 'Innovation', 'Digital Transformation',
      'Venture Capital', 'Startups', 'Business Strategy',
      'Artificial Intelligence'
    ];

    return {
      bio,
      networkingGoal: `Actively seeking to connect with visionary founders, strategic investors, and industry leaders who share a passion for transformative innovation and exponential growth. Looking to explore high-impact partnerships, investment opportunities, and collaborative ventures that push the boundaries of what's possible. Particularly interested in connecting with fellow members of the STAK ecosystem to share insights on emerging technologies, market opportunities, and strategies for building category-defining companies. Open to advisory roles, board positions, and strategic collaborations that leverage collective expertise to create extraordinary value.`,
      skills: [...new Set(skills)].slice(0, 15),
      industries: [...new Set(industries)].slice(0, 7),
      linkedinUrl: socialSources.find(s => s.platform === 'LinkedIn')?.url,
      twitterUrl: socialSources.find(s => s.platform === 'Twitter')?.url,
      githubUrl: socialSources.find(s => s.platform === 'GitHub')?.url,
      websiteUrls: socialSources.filter(s => s.platform === 'Website').map(s => s.url)
    };
  }

  private generateImpressiveBio(profile: ProfileData, context: string): string {
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Accomplished Leader';
    const title = profile.title || 'Executive';
    const company = profile.company || '';
    
    let bio = `${name} is an exceptional ${title} ${company ? `at ${company}` : ''} with a proven track record of driving transformative growth and innovation. `;
    
    if (context) {
      bio += `${context}. `;
    }
    
    bio += `Recognized for visionary leadership, strategic excellence, and the ability to build and scale high-performance organizations. `;
    bio += `A sought-after thought leader who combines deep industry expertise with an entrepreneurial mindset to create extraordinary value. `;
    bio += `Passionate about leveraging technology and strategic partnerships to solve complex challenges and shape the future of business.`;
    
    return bio;
  }

  private generateNetworkingGoal(): string {
    return `Seeking to connect with exceptional founders, forward-thinking investors, and transformative leaders who are shaping the future of technology and business. Looking to explore strategic partnerships, investment opportunities, and high-impact collaborations that drive exponential growth and innovation. Particularly interested in connecting with members of the STAK ecosystem to share insights, explore synergies, and build ventures that redefine industries. Open to advisory positions, board opportunities, and strategic initiatives that leverage collective expertise to create category-defining companies.`;
  }

  private ensureQualitySkills(skills: string[]): string[] {
    const premiumSkills = [
      'Executive Leadership', 'Strategic Vision', 'Business Development',
      'Innovation Strategy', 'Digital Transformation', 'Venture Capital',
      'Product Strategy', 'Market Expansion', 'Team Building',
      'Partnership Development', 'Growth Strategy', 'Operational Excellence',
      'Change Management', 'P&L Management', 'Board Leadership'
    ];
    
    const combined = [...new Set([...skills, ...premiumSkills])];
    return combined.slice(0, 15);
  }

  private ensureQualityIndustries(industries: string[]): string[] {
    const premiumIndustries = [
      'Technology', 'Artificial Intelligence', 'Venture Capital',
      'Innovation', 'Digital Transformation', 'Startups',
      'Business Strategy'
    ];
    
    const combined = [...new Set([...industries, ...premiumIndustries])];
    return combined.slice(0, 7);
  }
}

export const aiProfileBuilder = new AIProfileBuilder();