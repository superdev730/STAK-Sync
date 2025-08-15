interface ProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  title?: string;
  company?: string;
  position?: string;
  skills?: string[];
  industries?: string[];
  experience?: any[];
  education?: any[];
  networkingGoals?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
}

interface BrandStory {
  elevatorPitch: string;
  professionalSummary: string;
  originStory: string;
  visionStatement: string;
  valueProposition: string;
  keyAchievements: string[];
  personalBrand: string;
  networkingIntro: string;
  linkedInHeadline: string;
  twitterBio: string;
  speakerBio: string;
  investorPitch: string;
}

interface StoryVariations {
  concise: BrandStory;
  detailed: BrandStory;
  technical: BrandStory;
  executive: BrandStory;
}

export class BrandStoryGenerator {
  async generateBrandStories(profileData: ProfileData): Promise<StoryVariations> {
    // For now, generate comprehensive stories without AI to ensure reliability
    // Can be enhanced with AI integration later
    
    const name = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
    const title = profileData.title || profileData.position || 'Professional';
    const company = profileData.company || '';
    const skills = profileData.skills || [];
    const industries = profileData.industries || [];
    
    // Generate base story elements
    const baseElements = this.generateBaseElements(profileData, name, title, company, skills, industries);
    
    return {
      concise: this.generateConciseStory(baseElements, profileData),
      detailed: this.generateDetailedStory(baseElements, profileData),
      technical: this.generateTechnicalStory(baseElements, profileData),
      executive: this.generateExecutiveStory(baseElements, profileData)
    };
  }

  private generateBaseElements(profileData: ProfileData, name: string, title: string, company: string, skills: string[], industries: string[]) {
    const bio = profileData.bio || '';
    const experience = profileData.experience || [];
    const education = profileData.education || [];
    const networkingGoals = profileData.networkingGoals || '';
    
    // Extract key themes from bio and skills
    const keySkills = skills.slice(0, 5);
    const primaryIndustry = industries[0] || 'Technology';
    
    // Generate core value proposition
    const valueThemes = this.extractValueThemes(bio, skills, networkingGoals);
    
    return {
      name,
      title,
      company,
      bio,
      keySkills,
      primaryIndustry,
      valueThemes,
      experience: experience.length,
      hasEducation: education.length > 0,
      networkingGoals
    };
  }

  private extractValueThemes(bio: string, skills: string[], networkingGoals: string): string[] {
    const text = `${bio} ${skills.join(' ')} ${networkingGoals}`.toLowerCase();
    const themes: string[] = [];
    
    // Leadership themes
    if (text.includes('lead') || text.includes('manage') || text.includes('director') || text.includes('founder')) {
      themes.push('leadership');
    }
    
    // Innovation themes
    if (text.includes('innovat') || text.includes('creat') || text.includes('develop') || text.includes('build')) {
      themes.push('innovation');
    }
    
    // Growth themes
    if (text.includes('growth') || text.includes('scale') || text.includes('expand') || text.includes('revenue')) {
      themes.push('growth');
    }
    
    // Strategy themes
    if (text.includes('strategy') || text.includes('planning') || text.includes('vision') || text.includes('transform')) {
      themes.push('strategy');
    }
    
    // Technical themes
    if (text.includes('technical') || text.includes('engineer') || text.includes('develop') || text.includes('software')) {
      themes.push('technology');
    }
    
    return themes.length > 0 ? themes : ['professional', 'results-driven'];
  }

  private generateConciseStory(baseElements: any, profileData: ProfileData): BrandStory {
    const { name, title, company, keySkills, primaryIndustry, valueThemes } = baseElements;
    
    const elevatorPitch = `I'm ${name}, ${title}${company ? ` at ${company}` : ''} with expertise in ${keySkills.slice(0, 3).join(', ')}. I help ${primaryIndustry.toLowerCase()} organizations ${valueThemes.includes('growth') ? 'scale and grow' : 'solve complex challenges'} through ${valueThemes.includes('innovation') ? 'innovative solutions' : 'strategic approaches'}.`;
    
    const professionalSummary = `${title} with proven experience in ${primaryIndustry}. Specialized in ${keySkills.slice(0, 4).join(', ')} with a track record of ${valueThemes.includes('growth') ? 'driving growth and delivering results' : 'solving complex problems and creating value'}. ${baseElements.networkingGoals ? `Currently focused on ${baseElements.networkingGoals.toLowerCase()}.` : 'Passionate about building meaningful professional relationships within the STAK ecosystem.'}`;
    
    const linkedInHeadline = `${title}${company ? ` @ ${company}` : ''} | ${keySkills.slice(0, 2).join(' & ')} | ${valueThemes.includes('innovation') ? 'Innovation' : 'Results'} Driven`;
    
    const networkingIntro = `Hi! I'm ${name}, ${title}${company ? ` at ${company}` : ''}. I'm passionate about ${primaryIndustry.toLowerCase()} and ${valueThemes.includes('innovation') ? 'love exploring innovative solutions' : 'enjoy tackling challenging problems'}. I'm here to connect with fellow STAK members and ${baseElements.networkingGoals ? baseElements.networkingGoals.toLowerCase() : 'build meaningful professional relationships'}.`;
    
    return {
      elevatorPitch,
      professionalSummary,
      originStory: this.generateOriginStory(baseElements, 'concise'),
      visionStatement: this.generateVisionStatement(baseElements, 'concise'),
      valueProposition: this.generateValueProposition(baseElements, 'concise'),
      keyAchievements: this.generateKeyAchievements(baseElements, 'concise'),
      personalBrand: this.generatePersonalBrand(baseElements, 'concise'),
      networkingIntro,
      linkedInHeadline,
      twitterBio: linkedInHeadline.substring(0, 160),
      speakerBio: professionalSummary,
      investorPitch: this.generateInvestorPitch(baseElements, 'concise')
    };
  }

  private generateDetailedStory(baseElements: any, profileData: ProfileData): BrandStory {
    const { name, title, company, keySkills, primaryIndustry, valueThemes, bio } = baseElements;
    
    const elevatorPitch = `I'm ${name}, an experienced ${title}${company ? ` currently leading initiatives at ${company}` : ''} with deep expertise in ${keySkills.join(', ')}. Over my career, I've specialized in ${valueThemes.includes('growth') ? 'driving organizational growth and transformation' : 'delivering innovative solutions and strategic outcomes'} within the ${primaryIndustry.toLowerCase()} sector. I'm particularly passionate about ${valueThemes.includes('innovation') ? 'leveraging cutting-edge approaches to solve complex business challenges' : 'building high-performing teams and sustainable business processes'}.`;
    
    const professionalSummary = `${title} with extensive background in ${primaryIndustry} and comprehensive expertise across ${keySkills.join(', ')}. ${bio ? `${bio} ` : ''}I bring a unique combination of ${valueThemes.includes('leadership') ? 'leadership acumen' : 'technical expertise'} and ${valueThemes.includes('strategy') ? 'strategic thinking' : 'innovative problem-solving'} to drive meaningful business outcomes. My experience spans ${baseElements.experience > 0 ? 'multiple organizations and roles' : 'diverse projects and initiatives'}, consistently delivering value through ${valueThemes.includes('growth') ? 'growth-focused strategies' : 'collaborative approaches and data-driven decisions'}. I'm committed to ${baseElements.networkingGoals || 'fostering innovation and building strategic partnerships within the STAK ecosystem'}.`;
    
    const linkedInHeadline = `Senior ${title} | ${primaryIndustry} Expert | ${keySkills.slice(0, 3).join(', ')} | ${valueThemes.includes('growth') ? 'Growth & Innovation' : 'Strategy & Leadership'} Leader`;
    
    const networkingIntro = `Hello! I'm ${name}, ${title}${company ? ` at ${company}` : ''} with a passion for ${primaryIndustry.toLowerCase()} and ${valueThemes.includes('innovation') ? 'innovative problem-solving' : 'strategic business development'}. Throughout my career, I've focused on ${keySkills.slice(0, 3).join(', ')} and have been fortunate to work on ${valueThemes.includes('growth') ? 'transformative growth initiatives' : 'impactful projects that drive real business value'}. I'm excited to be part of the STAK community and look forward to connecting with fellow professionals who share my enthusiasm for ${baseElements.networkingGoals || 'building meaningful business relationships and exploring new opportunities for collaboration'}.`;
    
    return {
      elevatorPitch,
      professionalSummary,
      originStory: this.generateOriginStory(baseElements, 'detailed'),
      visionStatement: this.generateVisionStatement(baseElements, 'detailed'),
      valueProposition: this.generateValueProposition(baseElements, 'detailed'),
      keyAchievements: this.generateKeyAchievements(baseElements, 'detailed'),
      personalBrand: this.generatePersonalBrand(baseElements, 'detailed'),
      networkingIntro,
      linkedInHeadline,
      twitterBio: `${title} | ${keySkills.slice(0, 2).join(' & ')} | ${valueThemes.includes('innovation') ? 'Innovation' : 'Strategy'} focused | Building the future of ${primaryIndustry.toLowerCase()}`,
      speakerBio: professionalSummary,
      investorPitch: this.generateInvestorPitch(baseElements, 'detailed')
    };
  }

  private generateTechnicalStory(baseElements: any, profileData: ProfileData): BrandStory {
    const { name, title, company, keySkills, primaryIndustry, valueThemes } = baseElements;
    
    const techSkills = keySkills.filter(skill => 
      skill.toLowerCase().includes('python') ||
      skill.toLowerCase().includes('javascript') ||
      skill.toLowerCase().includes('react') ||
      skill.toLowerCase().includes('node') ||
      skill.toLowerCase().includes('aws') ||
      skill.toLowerCase().includes('docker') ||
      skill.toLowerCase().includes('kubernetes') ||
      skill.toLowerCase().includes('api') ||
      skill.toLowerCase().includes('software') ||
      skill.toLowerCase().includes('development') ||
      skill.toLowerCase().includes('engineer') ||
      skill.toLowerCase().includes('architecture')
    );
    
    const relevantSkills = techSkills.length > 0 ? techSkills : keySkills;
    
    const elevatorPitch = `I'm ${name}, ${title}${company ? ` at ${company}` : ''} specializing in ${relevantSkills.slice(0, 3).join(', ')}. I focus on ${valueThemes.includes('innovation') ? 'architecting scalable solutions' : 'building robust systems'} and ${valueThemes.includes('leadership') ? 'leading engineering teams' : 'implementing best practices'} to deliver high-impact technical solutions in ${primaryIndustry.toLowerCase()}.`;
    
    const professionalSummary = `Technical ${title} with expertise in ${relevantSkills.join(', ')}. I specialize in ${valueThemes.includes('innovation') ? 'developing innovative technical solutions' : 'implementing scalable architectures'} and ${valueThemes.includes('leadership') ? 'mentoring engineering teams' : 'optimizing development processes'}. My approach combines deep technical knowledge with ${valueThemes.includes('strategy') ? 'strategic business understanding' : 'practical problem-solving skills'} to drive meaningful outcomes in ${primaryIndustry.toLowerCase()} environments.`;
    
    const linkedInHeadline = `${title} | ${relevantSkills.slice(0, 2).join(' & ')} | ${primaryIndustry} Technology Leader | ${valueThemes.includes('innovation') ? 'Innovation' : 'Architecture'} Focused`;
    
    const networkingIntro = `Hi! I'm ${name}, ${title}${company ? ` at ${company}` : ''} passionate about ${relevantSkills.slice(0, 2).join(' and ')}. I love ${valueThemes.includes('innovation') ? 'exploring cutting-edge technologies and architectural patterns' : 'solving complex technical challenges and building scalable systems'}. I'm excited to connect with fellow technologists in the STAK community and discuss ${baseElements.networkingGoals || 'emerging technologies, best practices, and opportunities for technical collaboration'}.`;
    
    return {
      elevatorPitch,
      professionalSummary,
      originStory: this.generateOriginStory(baseElements, 'technical'),
      visionStatement: this.generateVisionStatement(baseElements, 'technical'),
      valueProposition: this.generateValueProposition(baseElements, 'technical'),
      keyAchievements: this.generateKeyAchievements(baseElements, 'technical'),
      personalBrand: this.generatePersonalBrand(baseElements, 'technical'),
      networkingIntro,
      linkedInHeadline,
      twitterBio: `${title} | ${relevantSkills.slice(0, 2).join(' & ')} | Building scalable solutions in ${primaryIndustry.toLowerCase()}`,
      speakerBio: `${professionalSummary} Regular speaker on technical architecture and ${relevantSkills.includes('AI') || relevantSkills.includes('Machine Learning') ? 'AI/ML implementation' : 'software engineering best practices'}.`,
      investorPitch: this.generateInvestorPitch(baseElements, 'technical')
    };
  }

  private generateExecutiveStory(baseElements: any, profileData: ProfileData): BrandStory {
    const { name, title, company, keySkills, primaryIndustry, valueThemes } = baseElements;
    
    const executiveTitle = title.includes('CEO') || title.includes('CTO') || title.includes('Founder') || title.includes('Director') ? 
      title : `Senior ${title}`;
    
    const elevatorPitch = `I'm ${name}, ${executiveTitle}${company ? ` of ${company}` : ''} with a proven track record of ${valueThemes.includes('growth') ? 'driving organizational growth and market expansion' : 'leading strategic initiatives and transformation programs'} in ${primaryIndustry}. I specialize in ${keySkills.slice(0, 3).join(', ')} and have consistently delivered ${valueThemes.includes('innovation') ? 'breakthrough innovations' : 'exceptional business results'} through ${valueThemes.includes('leadership') ? 'visionary leadership' : 'strategic execution'} and data-driven decision making.`;
    
    const professionalSummary = `Accomplished ${executiveTitle} with extensive leadership experience in ${primaryIndustry}. I have successfully ${valueThemes.includes('growth') ? 'scaled organizations, expanded market presence,' : 'led digital transformations, optimized operations,'} and driven sustainable business growth through ${keySkills.slice(0, 4).join(', ')}. My leadership philosophy centers on ${valueThemes.includes('innovation') ? 'fostering innovation, empowering teams,' : 'building high-performance cultures, strategic alignment,'} and delivering measurable value to stakeholders. ${baseElements.networkingGoals ? `Currently focused on ${baseElements.networkingGoals}.` : 'Committed to building strategic partnerships and driving industry-leading initiatives within the STAK ecosystem.'}`;
    
    const linkedInHeadline = `${executiveTitle} | ${primaryIndustry} Leader | ${valueThemes.includes('growth') ? 'Growth & Strategy' : 'Innovation & Transformation'} Expert | ${keySkills[0] || 'Business Development'} Specialist`;
    
    const networkingIntro = `Greetings! I'm ${name}, ${executiveTitle}${company ? ` of ${company}` : ''} with a passion for ${valueThemes.includes('growth') ? 'driving sustainable business growth' : 'leading transformational change'} in ${primaryIndustry.toLowerCase()}. Throughout my executive career, I've had the privilege of ${valueThemes.includes('leadership') ? 'building and leading high-performing teams' : 'architecting strategic initiatives'} that deliver exceptional outcomes. I'm thrilled to be part of the STAK community and look forward to connecting with fellow leaders to explore ${baseElements.networkingGoals || 'strategic partnerships, investment opportunities, and initiatives that can create meaningful impact across our ecosystem'}.`;
    
    return {
      elevatorPitch,
      professionalSummary,
      originStory: this.generateOriginStory(baseElements, 'executive'),
      visionStatement: this.generateVisionStatement(baseElements, 'executive'),
      valueProposition: this.generateValueProposition(baseElements, 'executive'),
      keyAchievements: this.generateKeyAchievements(baseElements, 'executive'),
      personalBrand: this.generatePersonalBrand(baseElements, 'executive'),
      networkingIntro,
      linkedInHeadline,
      twitterBio: `${executiveTitle} | ${primaryIndustry} Thought Leader | ${valueThemes.includes('growth') ? 'Scaling businesses' : 'Driving innovation'} | Building the future`,
      speakerBio: `${professionalSummary} Recognized industry thought leader and frequent keynote speaker on ${valueThemes.includes('growth') ? 'business growth strategies' : 'digital transformation'} and ${primaryIndustry.toLowerCase()} innovation.`,
      investorPitch: this.generateInvestorPitch(baseElements, 'executive')
    };
  }

  private generateOriginStory(baseElements: any, style: string): string {
    const { name, primaryIndustry, valueThemes } = baseElements;
    
    switch (style) {
      case 'concise':
        return `My journey in ${primaryIndustry.toLowerCase()} began with a passion for ${valueThemes.includes('innovation') ? 'innovative problem-solving' : 'creating meaningful impact'}.`;
      
      case 'detailed':
        return `My career journey started with a deep curiosity about ${primaryIndustry.toLowerCase()} and how ${valueThemes.includes('technology') ? 'technology could transform business processes' : 'strategic thinking could drive organizational success'}. This led me through diverse roles where I discovered my passion for ${valueThemes.includes('leadership') ? 'leading teams and driving change' : 'solving complex challenges and delivering results'}.`;
      
      case 'technical':
        return `My technical journey began with fascination for ${valueThemes.includes('innovation') ? 'emerging technologies and their potential' : 'systematic problem-solving and elegant solutions'}. This foundation led me to specialize in ${primaryIndustry.toLowerCase()} where I could combine technical excellence with business impact.`;
      
      case 'executive':
        return `My leadership journey evolved from early experiences in ${primaryIndustry.toLowerCase()} where I recognized the power of ${valueThemes.includes('innovation') ? 'visionary thinking and strategic innovation' : 'collaborative leadership and operational excellence'} to drive transformational change.`;
      
      default:
        return `Passionate about ${primaryIndustry.toLowerCase()} and ${valueThemes.join(', ')}.`;
    }
  }

  private generateVisionStatement(baseElements: any, style: string): string {
    const { primaryIndustry, valueThemes } = baseElements;
    
    const baseVision = `To ${valueThemes.includes('innovation') ? 'drive innovation and transformation' : 'create sustainable value and growth'} in ${primaryIndustry.toLowerCase()}`;
    
    switch (style) {
      case 'executive':
        return `${baseVision} through visionary leadership and strategic partnerships that shape the future of our industry.`;
      case 'detailed':
        return `${baseVision} by leveraging ${valueThemes.includes('technology') ? 'cutting-edge technologies' : 'strategic insights'} and fostering collaborative relationships that create lasting impact.`;
      default:
        return `${baseVision} through ${valueThemes.includes('leadership') ? 'collaborative leadership' : 'innovative solutions'}.`;
    }
  }

  private generateValueProposition(baseElements: any, style: string): string {
    const { keySkills, primaryIndustry, valueThemes } = baseElements;
    
    const coreValue = `Expert in ${keySkills.slice(0, 3).join(', ')} with proven ability to ${valueThemes.includes('growth') ? 'drive growth' : 'deliver results'}`;
    
    switch (style) {
      case 'executive':
        return `${coreValue} in ${primaryIndustry}. I transform organizations through strategic vision, operational excellence, and leadership that inspires exceptional performance.`;
      case 'detailed':
        return `${coreValue} across ${primaryIndustry.toLowerCase()} environments. I combine deep domain expertise with ${valueThemes.includes('innovation') ? 'innovative thinking' : 'strategic planning'} to create sustainable competitive advantages.`;
      case 'technical':
        return `${coreValue} through technical excellence and architectural thinking. I build scalable solutions that bridge technology and business objectives.`;
      default:
        return `${coreValue} in ${primaryIndustry.toLowerCase()} through ${valueThemes.includes('innovation') ? 'innovative approaches' : 'collaborative problem-solving'}.`;
    }
  }

  private generateKeyAchievements(baseElements: any, style: string): string[] {
    const { primaryIndustry, valueThemes, keySkills } = baseElements;
    
    const baseAchievements = [
      `Led successful ${valueThemes.includes('innovation') ? 'innovation initiatives' : 'strategic projects'} in ${primaryIndustry.toLowerCase()}`,
      `Developed expertise in ${keySkills.slice(0, 2).join(' and ')}`,
      `${valueThemes.includes('growth') ? 'Drove measurable business growth' : 'Delivered impactful solutions'} through ${valueThemes.includes('leadership') ? 'team leadership' : 'collaborative approaches'}`
    ];
    
    switch (style) {
      case 'executive':
        return [
          ...baseAchievements,
          `Built and scaled ${valueThemes.includes('growth') ? 'high-growth organizations' : 'high-performing teams'}`,
          `Established strategic partnerships that ${valueThemes.includes('innovation') ? 'drove industry innovation' : 'created competitive advantages'}`
        ];
      
      case 'detailed':
        return [
          ...baseAchievements,
          `Implemented ${valueThemes.includes('technology') ? 'technology solutions' : 'process improvements'} that enhanced operational efficiency`,
          `Mentored professionals and contributed to ${primaryIndustry.toLowerCase()} community growth`
        ];
      
      case 'technical':
        return [
          `Architected and implemented scalable technical solutions`,
          `Led development of ${valueThemes.includes('innovation') ? 'innovative products' : 'robust systems'} using ${keySkills.slice(0, 2).join(' and ')}`,
          `Established technical best practices and ${valueThemes.includes('leadership') ? 'mentored engineering teams' : 'optimized development processes'}`
        ];
      
      default:
        return baseAchievements;
    }
  }

  private generatePersonalBrand(baseElements: any, style: string): string {
    const { valueThemes, primaryIndustry } = baseElements;
    
    const brandAttributes = [
      valueThemes.includes('innovation') ? 'Innovative' : 'Strategic',
      valueThemes.includes('leadership') ? 'Visionary Leader' : 'Results-Driven Professional',
      valueThemes.includes('growth') ? 'Growth Catalyst' : 'Solution Architect'
    ];
    
    return `${brandAttributes.join(' | ')} in ${primaryIndustry}`;
  }

  private generateInvestorPitch(baseElements: any, style: string): string {
    const { name, title, company, primaryIndustry, valueThemes, keySkills } = baseElements;
    
    const investorFocus = `${name}, ${title}${company ? ` at ${company}` : ''}, brings ${valueThemes.includes('growth') ? 'proven growth leadership' : 'strategic expertise'} to ${primaryIndustry.toLowerCase()}`;
    
    switch (style) {
      case 'executive':
        return `${investorFocus}. Track record of ${valueThemes.includes('growth') ? 'scaling organizations and driving market expansion' : 'leading transformational initiatives and delivering shareholder value'}. Seeking strategic partnerships and investment opportunities that align with vision for ${primaryIndustry.toLowerCase()} innovation.`;
      
      case 'technical':
        return `${investorFocus} with deep technical expertise in ${keySkills.slice(0, 3).join(', ')}. ${valueThemes.includes('innovation') ? 'Proven ability to architect scalable solutions that drive business growth' : 'Strong foundation in building technology that creates competitive advantages'}. Open to technical advisory roles and investment in emerging technology ventures.`;
      
      default:
        return `${investorFocus}. ${valueThemes.includes('growth') ? 'Demonstrated success in driving sustainable growth' : 'Strong track record of delivering measurable results'} through ${keySkills.slice(0, 2).join(' and ')}. Interested in exploring investment and partnership opportunities within the STAK ecosystem.`;
    }
  }
}

export const brandStoryGenerator = new BrandStoryGenerator();