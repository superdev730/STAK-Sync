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
  networkingGoalSuggestions?: string[];
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

  private generateNetworkingGoalSuggestions(title: string, company: string): string[] {
    const titleLower = title?.toLowerCase() || '';
    const companyLower = company?.toLowerCase() || '';
    
    // Founder-specific goals
    if (titleLower.includes('founder') || titleLower.includes('ceo') || titleLower.includes('co-founder')) {
      return [
        "I'm seeking venture capital funding and strategic investors who understand our vision for transforming the industry",
        "Looking for experienced mentors and advisors who have successfully scaled companies in our space",
        "Searching for exceptional technical talent and co-founders to join our mission",
        "Interested in connecting with other founders to share experiences and build strategic partnerships",
        "Seeking growth capital, strategic advisors, and industry connections to accelerate our expansion"
      ];
    }
    
    // VC/Investor-specific goals
    if (titleLower.includes('vc') || titleLower.includes('venture') || titleLower.includes('investor') || 
        titleLower.includes('partner') || companyLower.includes('capital') || companyLower.includes('ventures')) {
      return [
        "Looking for high-quality deal flow and exceptional founders building category-defining companies",
        "Seeking to connect with institutional LPs and family offices for our next fund",
        "Interested in co-investment opportunities and syndicate partnerships with aligned investors",
        "Looking to support ambitious founders at the intersection of AI and enterprise software",
        "Seeking portfolio companies in fintech, healthtech, and deep tech with strong product-market fit"
      ];
    }
    
    // Executive/Corporate goals
    if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('president') || 
        titleLower.includes('head of') || titleLower.includes('chief')) {
      return [
        "Seeking strategic partnerships and joint venture opportunities to drive innovation",
        "Looking for board opportunities and advisory roles where I can add strategic value",
        "Interested in connecting with innovative startups for potential acquisition or partnership",
        "Seeking to build relationships with industry leaders for knowledge sharing and collaboration",
        "Looking for speaking opportunities and thought leadership platforms in my domain"
      ];
    }
    
    // Engineer/Technical goals
    if (titleLower.includes('engineer') || titleLower.includes('developer') || titleLower.includes('architect') ||
        titleLower.includes('cto') || titleLower.includes('technical')) {
      return [
        "Looking for innovative technical challenges and opportunities to work on cutting-edge projects",
        "Seeking to connect with technical founders and CTOs to exchange architectural insights",
        "Interested in advisory opportunities where I can help startups scale their technical infrastructure",
        "Looking for co-founder opportunities in AI/ML and emerging technology ventures",
        "Seeking to mentor the next generation of engineers while learning from industry pioneers"
      ];
    }
    
    // Default professional goals
    return [
      "Seeking strategic partnerships and collaboration opportunities with innovative leaders",
      "Looking to connect with founders, investors, and executives driving industry transformation",
      "Interested in advisory roles and board positions where I can contribute strategic value",
      "Seeking to expand my network with high-caliber professionals in the STAK ecosystem",
      "Looking for investment opportunities and strategic alliances that create mutual value"
    ];
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

    // Generate networking goal suggestions based on role
    const networkingGoalSuggestions = this.generateNetworkingGoalSuggestions(
      currentProfile.title || '',
      currentProfile.company || ''
    );

    if (this.openai) {
      try {
        const profile = await this.buildWithOpenAI(socialSources, additionalContext, currentProfile);
        return {
          ...profile,
          networkingGoalSuggestions
        };
      } catch (error) {
        console.error('OpenAI failed, using enhanced fallback:', error);
        const profile = this.buildEnhancedFallback(socialSources, additionalContext, currentProfile);
        return {
          ...profile,
          networkingGoalSuggestions
        };
      }
    }

    const profile = this.buildEnhancedFallback(socialSources, additionalContext, currentProfile);
    return {
      ...profile,
      networkingGoalSuggestions
    };
  }

  private async buildWithOpenAI(
    socialSources: ProfileSource[],
    additionalContext: string,
    currentProfile: ProfileData
  ): Promise<GeneratedProfile> {
    const name = `${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim();
    
    const systemPrompt = `You are an elite professional profile writer specializing in creating exceptional profiles for high-achieving professionals in the STAK ecosystem (VCs, founders, innovators, industry leaders).

CRITICAL REQUIREMENTS:
- Use PERFECT spelling and grammar - no errors whatsoever
- Every sentence must be polished and professional
- Double-check all proper nouns and technical terms

Your profiles should:
1. Position them as TOP TIER industry leaders and invaluable connections
2. Highlight specific achievements with impressive, grammatically perfect language
3. Use powerful, confident language that commands respect and admiration
4. Include 10-15 high-value skills that demonstrate expertise
5. Create networking goals that attract elite connections
6. Make them sound absolutely exceptional and accomplished
7. Emphasize innovation, leadership, success, and strategic vision
8. Use action words and power phrases
9. Make every sentence impactful, memorable, and grammatically flawless
10. Ensure all content is spell-checked and error-free`;

    const userPrompt = `Create an OUTSTANDING professional profile for ${name || 'this professional'}.

Current Role: ${currentProfile.title || 'Executive Leader'} ${currentProfile.company ? `at ${currentProfile.company}` : ''}
Additional Context: ${additionalContext || 'A highly accomplished professional with significant achievements'}

Social Profiles:
${socialSources.map(s => `- ${s.platform}: ${s.url}`).join('\n') || 'Multiple professional platforms'}

IMPORTANT: Research and incorporate any publicly available information about this person to make the profile comprehensive and accurate. Ensure PERFECT spelling and grammar throughout.

${currentProfile.title?.toLowerCase().includes('founder') || currentProfile.title?.toLowerCase().includes('ceo') ? 
  'This person is a FOUNDER/CEO - emphasize their entrepreneurial achievements, fundraising success, vision for their company, and leadership qualities.' : ''}
${currentProfile.title?.toLowerCase().includes('vc') || currentProfile.title?.toLowerCase().includes('investor') || currentProfile.company?.toLowerCase().includes('ventures') ? 
  'This person is a VENTURE CAPITALIST - highlight their investment thesis, portfolio successes, value-add to founders, and track record.' : ''}

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
   ${currentProfile.title?.toLowerCase().includes('founder') ? '- Include: seeking funding, mentors, technical talent, strategic advisors' : ''}
   ${currentProfile.title?.toLowerCase().includes('vc') || currentProfile.title?.toLowerCase().includes('investor') ? '- Include: seeking LPs, deal flow, co-investment opportunities' : ''}

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
      networkingGoal: aiResponse.networkingGoal || this.generateNetworkingGoal(currentProfile),
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
      skills: Array.from(new Set(skills)).slice(0, 15),
      industries: Array.from(new Set(industries)).slice(0, 7),
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

  private generateNetworkingGoal(profile: ProfileData): string {
    const titleLower = profile.title?.toLowerCase() || '';
    
    // Role-specific networking goals
    if (titleLower.includes('founder') || titleLower.includes('ceo')) {
      return `Actively seeking venture capital funding and strategic investors who share our vision for transforming the industry. Looking to connect with experienced mentors, advisors, and fellow founders who have successfully scaled companies. Interested in finding exceptional technical talent and potential co-founders to accelerate our growth. Open to strategic partnerships that can help us expand our market reach and impact.`;
    }
    
    if (titleLower.includes('vc') || titleLower.includes('investor') || titleLower.includes('partner')) {
      return `Looking for high-quality deal flow and exceptional founders building category-defining companies. Seeking to connect with institutional LPs and family offices for fund development. Interested in co-investment opportunities and syndicate partnerships with aligned investors. Focused on supporting ambitious entrepreneurs at the intersection of AI, enterprise software, and emerging technologies.`;
    }
    
    // Default for other professionals
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
    
    const combined = Array.from(new Set([...skills, ...premiumSkills]));
    return combined.slice(0, 15);
  }

  private ensureQualityIndustries(industries: string[]): string[] {
    const premiumIndustries = [
      'Technology', 'Artificial Intelligence', 'Venture Capital',
      'Innovation', 'Digital Transformation', 'Startups',
      'Business Strategy'
    ];
    
    const combined = Array.from(new Set([...industries, ...premiumIndustries]));
    return combined.slice(0, 7);
  }
}

export const aiProfileBuilder = new AIProfileBuilder();