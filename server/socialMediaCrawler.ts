import * as cheerio from 'cheerio';

export interface SocialMediaProfile {
  platform: string;
  url: string;
  displayName?: string;
  bio?: string;
  followerCount?: string;
  skills?: string[];
  experience?: string[];
  location?: string;
  company?: string;
  jobTitle?: string;
  keywords?: string[];
  profileImage?: string;
  verified?: boolean;
  extractedData: any;
}

export interface ProfileEnhancement {
  enhancedBio: string;
  extractedSkills: string[];
  suggestedIndustries: string[];
  professionalKeywords: string[];
  networkingRecommendations: string[];
  improvements: string[];
}

export class SocialMediaCrawler {
  async analyzeSocialProfile(url: string): Promise<SocialMediaProfile> {
    try {
      const platform = this.detectPlatform(url);
      const validUrl = this.validateUrl(url);
      
      console.log(`Analyzing ${platform} profile: ${validUrl}`);
      
      switch (platform) {
        case 'LinkedIn':
          return await this.scrapeLinkedIn(validUrl);
        case 'Twitter':
          return await this.scrapeTwitter(validUrl);
        case 'GitHub':
          return await this.scrapeGitHub(validUrl);
        case 'Website':
          return await this.scrapeWebsite(validUrl);
        default:
          return await this.scrapeGenericProfile(validUrl, platform);
      }
      
    } catch (error) {
      console.error(`Error analyzing social profile ${url}:`, error);
      throw new Error(`Failed to analyze profile: ${error.message}`);
    }
  }

  private detectPlatform(url: string): string {
    const lowercaseUrl = url.toLowerCase();
    
    if (lowercaseUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'Twitter';
    if (lowercaseUrl.includes('github.com')) return 'GitHub';
    if (lowercaseUrl.includes('instagram.com')) return 'Instagram';
    if (lowercaseUrl.includes('facebook.com')) return 'Facebook';
    
    return 'Website';
  }

  private validateUrl(url: string): string {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const validUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }
      
      return validUrl.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private async scrapeLinkedIn(url: string): Promise<SocialMediaProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync-Bot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract LinkedIn profile data
      const profile: SocialMediaProfile = {
        platform: 'LinkedIn',
        url,
        displayName: this.extractLinkedInName($),
        bio: this.extractLinkedInBio($),
        company: this.extractLinkedInCompany($),
        jobTitle: this.extractLinkedInJobTitle($),
        location: this.extractLinkedInLocation($),
        skills: this.extractLinkedInSkills($),
        experience: this.extractLinkedInExperience($),
        keywords: this.extractLinkedInKeywords($),
        extractedData: {
          connections: this.extractLinkedInConnections($),
          education: this.extractLinkedInEducation($),
          certifications: this.extractLinkedInCertifications($),
          recommendations: this.extractLinkedInRecommendations($)
        }
      };

      return profile;
      
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      
      // Return basic profile with URL analysis if scraping fails
      return {
        platform: 'LinkedIn',
        url,
        bio: 'Professional LinkedIn profile - direct access limited',
        keywords: this.extractKeywordsFromUrl(url),
        extractedData: { note: 'LinkedIn often restricts automated access. Consider manual data entry for best results.' }
      };
    }
  }

  private async scrapeTwitter(url: string): Promise<SocialMediaProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync-Bot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      return {
        platform: 'Twitter',
        url,
        displayName: this.extractTwitterName($),
        bio: this.extractTwitterBio($),
        followerCount: this.extractTwitterFollowers($),
        location: this.extractTwitterLocation($),
        keywords: this.extractTwitterKeywords($),
        verified: this.extractTwitterVerification($),
        extractedData: {
          tweetCount: this.extractTwitterTweetCount($),
          following: this.extractTwitterFollowing($),
          joinDate: this.extractTwitterJoinDate($)
        }
      };
      
    } catch (error) {
      console.error('Twitter scraping error:', error);
      
      return {
        platform: 'Twitter',
        url,
        bio: 'Twitter/X profile - content analysis limited',
        keywords: this.extractKeywordsFromUrl(url),
        extractedData: { note: 'Twitter access limited. Username and basic info extracted from URL.' }
      };
    }
  }

  private async scrapeGitHub(url: string): Promise<SocialMediaProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync-Bot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      return {
        platform: 'GitHub',
        url,
        displayName: this.extractGitHubName($),
        bio: this.extractGitHubBio($),
        location: this.extractGitHubLocation($),
        company: this.extractGitHubCompany($),
        skills: this.extractGitHubLanguages($),
        keywords: this.extractGitHubKeywords($),
        extractedData: {
          repositories: this.extractGitHubRepoCount($),
          followers: this.extractGitHubFollowers($),
          contributions: this.extractGitHubContributions($),
          topLanguages: this.extractGitHubTopLanguages($),
          projects: this.extractGitHubProjects($)
        }
      };
      
    } catch (error) {
      console.error('GitHub scraping error:', error);
      
      return {
        platform: 'GitHub',
        url,
        bio: 'Software developer with GitHub presence',
        skills: ['Software Development', 'Version Control', 'Open Source'],
        keywords: this.extractKeywordsFromUrl(url),
        extractedData: { note: 'GitHub username extracted. Full profile analysis may be limited.' }
      };
    }
  }

  private async scrapeWebsite(url: string): Promise<SocialMediaProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync-Bot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      return {
        platform: 'Website',
        url,
        displayName: this.extractWebsiteName($),
        bio: this.extractWebsiteDescription($),
        company: this.extractWebsiteCompany($),
        skills: this.extractWebsiteSkills($),
        keywords: this.extractWebsiteKeywords($),
        extractedData: {
          title: $('title').text().trim(),
          headings: this.extractWebsiteHeadings($),
          technologies: this.extractWebsiteTechnologies($, html),
          businessInfo: this.extractWebsiteBusinessInfo($),
          services: this.extractWebsiteServices($)
        }
      };
      
    } catch (error) {
      console.error('Website scraping error:', error);
      throw error;
    }
  }

  private async scrapeGenericProfile(url: string, platform: string): Promise<SocialMediaProfile> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync-Bot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      return {
        platform,
        url,
        displayName: $('title').text().trim(),
        bio: $('meta[name="description"]').attr('content') || '',
        keywords: this.extractGenericKeywords($),
        extractedData: {
          title: $('title').text(),
          description: $('meta[name="description"]').attr('content'),
          content: $('body').text().slice(0, 500)
        }
      };
      
    } catch (error) {
      console.error('Generic profile scraping error:', error);
      throw error;
    }
  }

  // LinkedIn extraction methods
  private extractLinkedInName($: cheerio.CheerioAPI): string {
    return $('h1').first().text().trim() || 
           $('.pv-text-details__name').text().trim() ||
           $('meta[property="og:title"]').attr('content') || '';
  }

  private extractLinkedInBio($: cheerio.CheerioAPI): string {
    return $('.pv-text-details__headline').text().trim() ||
           $('meta[name="description"]').attr('content') || '';
  }

  private extractLinkedInCompany($: cheerio.CheerioAPI): string {
    return $('.pv-text-details__company').text().trim() || '';
  }

  private extractLinkedInJobTitle($: cheerio.CheerioAPI): string {
    return $('.pv-text-details__title').text().trim() || '';
  }

  private extractLinkedInLocation($: cheerio.CheerioAPI): string {
    return $('.pv-text-details__location').text().trim() || '';
  }

  private extractLinkedInSkills($: cheerio.CheerioAPI): string[] {
    const skills: string[] = [];
    $('.pv-skill-category-entity__name-text').each((_, el) => {
      const skill = $(el).text().trim();
      if (skill) skills.push(skill);
    });
    return skills;
  }

  private extractLinkedInExperience($: cheerio.CheerioAPI): string[] {
    const experience: string[] = [];
    $('.pv-entity__summary-info h3').each((_, el) => {
      const exp = $(el).text().trim();
      if (exp) experience.push(exp);
    });
    return experience;
  }

  private extractLinkedInKeywords($: cheerio.CheerioAPI): string[] {
    const text = $('body').text().toLowerCase();
    return this.extractBusinessKeywords(text);
  }

  private extractLinkedInConnections($: cheerio.CheerioAPI): string {
    return $('.pv-top-card--list-bullet li').first().text().trim() || '';
  }

  private extractLinkedInEducation($: cheerio.CheerioAPI): string[] {
    const education: string[] = [];
    $('.pv-education-entity h3').each((_, el) => {
      const edu = $(el).text().trim();
      if (edu) education.push(edu);
    });
    return education;
  }

  private extractLinkedInCertifications($: cheerio.CheerioAPI): string[] {
    const certs: string[] = [];
    $('.pv-certifications-entity h3').each((_, el) => {
      const cert = $(el).text().trim();
      if (cert) certs.push(cert);
    });
    return certs;
  }

  private extractLinkedInRecommendations($: cheerio.CheerioAPI): string[] {
    const recommendations: string[] = [];
    $('.pv-recommendation-entity__text').each((_, el) => {
      const rec = $(el).text().trim();
      if (rec) recommendations.push(rec);
    });
    return recommendations;
  }

  // Twitter extraction methods
  private extractTwitterName($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserName"]').first().text().trim() ||
           $('h1').first().text().trim() || '';
  }

  private extractTwitterBio($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserDescription"]').text().trim() ||
           $('meta[name="description"]').attr('content') || '';
  }

  private extractTwitterFollowers($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserFollowers"]').text().trim() || '';
  }

  private extractTwitterLocation($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserLocation"]').text().trim() || '';
  }

  private extractTwitterKeywords($: cheerio.CheerioAPI): string[] {
    const bio = this.extractTwitterBio($);
    return this.extractBusinessKeywords(bio.toLowerCase());
  }

  private extractTwitterVerification($: cheerio.CheerioAPI): boolean {
    return $('[data-testid="verificationBadge"]').length > 0;
  }

  private extractTwitterTweetCount($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserTweets"]').text().trim() || '';
  }

  private extractTwitterFollowing($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserFollowing"]').text().trim() || '';
  }

  private extractTwitterJoinDate($: cheerio.CheerioAPI): string {
    return $('[data-testid="UserJoinDate"]').text().trim() || '';
  }

  // GitHub extraction methods
  private extractGitHubName($: cheerio.CheerioAPI): string {
    return $('.p-name').text().trim() ||
           $('h1.vcard-names').text().trim() || '';
  }

  private extractGitHubBio($: cheerio.CheerioAPI): string {
    return $('.p-note').text().trim() ||
           $('.user-profile-bio').text().trim() || '';
  }

  private extractGitHubLocation($: cheerio.CheerioAPI): string {
    return $('.p-label').text().trim() || '';
  }

  private extractGitHubCompany($: cheerio.CheerioAPI): string {
    return $('.p-org').text().trim() || '';
  }

  private extractGitHubLanguages($: cheerio.CheerioAPI): string[] {
    const languages: string[] = [];
    $('.BorderGrid-cell .color-fg-default').each((_, el) => {
      const lang = $(el).text().trim();
      if (lang && !languages.includes(lang)) {
        languages.push(lang);
      }
    });
    return languages;
  }

  private extractGitHubKeywords($: cheerio.CheerioAPI): string[] {
    const bio = this.extractGitHubBio($);
    const repoText = $('.repository-lang-stats').text();
    return this.extractBusinessKeywords((bio + ' ' + repoText).toLowerCase());
  }

  private extractGitHubRepoCount($: cheerio.CheerioAPI): string {
    return $('[data-tab-item="repositories"] .Counter').text().trim() || '';
  }

  private extractGitHubFollowers($: cheerio.CheerioAPI): string {
    return $('[href$="/followers"] .text-bold').text().trim() || '';
  }

  private extractGitHubContributions($: cheerio.CheerioAPI): string {
    return $('.js-yearly-contributions h2').text().trim() || '';
  }

  private extractGitHubTopLanguages($: cheerio.CheerioAPI): string[] {
    const languages: string[] = [];
    $('.repository-lang-stats-graph .language-color').each((_, el) => {
      const lang = $(el).parent().text().trim();
      if (lang) languages.push(lang);
    });
    return languages.slice(0, 5);
  }

  private extractGitHubProjects($: cheerio.CheerioAPI): string[] {
    const projects: string[] = [];
    $('.pinned-item-list-item h3 a').each((_, el) => {
      const project = $(el).text().trim();
      if (project) projects.push(project);
    });
    return projects;
  }

  // Website extraction methods
  private extractWebsiteName($: cheerio.CheerioAPI): string {
    return $('title').text().trim() ||
           $('h1').first().text().trim() || '';
  }

  private extractWebsiteDescription($: cheerio.CheerioAPI): string {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="og:description"]').attr('content') ||
           $('p').first().text().trim().substring(0, 200) || '';
  }

  private extractWebsiteCompany($: cheerio.CheerioAPI): string {
    const title = $('title').text();
    const h1 = $('h1').first().text();
    
    // Look for company indicators
    if (title.includes('|')) {
      return title.split('|')[1].trim();
    }
    if (title.includes('-')) {
      return title.split('-')[1].trim();
    }
    
    return h1 || '';
  }

  private extractWebsiteSkills($: cheerio.CheerioAPI): string[] {
    const skills: string[] = [];
    const content = $('body').text().toLowerCase();
    
    const skillKeywords = [
      'javascript', 'python', 'react', 'nodejs', 'angular', 'vue',
      'marketing', 'sales', 'consulting', 'strategy', 'management',
      'design', 'development', 'analytics', 'finance', 'accounting'
    ];
    
    skillKeywords.forEach(skill => {
      if (content.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });
    
    return skills;
  }

  private extractWebsiteKeywords($: cheerio.CheerioAPI): string[] {
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      return metaKeywords.split(',').map(k => k.trim());
    }
    
    const content = $('body').text();
    return this.extractBusinessKeywords(content.toLowerCase());
  }

  private extractWebsiteHeadings($: cheerio.CheerioAPI): string[] {
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) {
        headings.push(text);
      }
    });
    return headings.slice(0, 10);
  }

  private extractWebsiteTechnologies($: cheerio.CheerioAPI, html: string): string[] {
    const technologies: string[] = [];
    
    const techPatterns = {
      'React': /react/i,
      'Vue.js': /vue\.js|vue/i,
      'Angular': /angular/i,
      'WordPress': /wp-content|wordpress/i,
      'Shopify': /shopify/i,
      'Bootstrap': /bootstrap/i,
      'jQuery': /jquery/i
    };
    
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(html) || pattern.test($('body').text())) {
        technologies.push(tech);
      }
    }
    
    return technologies;
  }

  private extractWebsiteBusinessInfo($: cheerio.CheerioAPI): any {
    const content = $('body').text().toLowerCase();
    const businessInfo: any = {};
    
    const industryKeywords = [
      'consulting', 'technology', 'software', 'marketing', 'design',
      'finance', 'healthcare', 'education', 'retail', 'manufacturing'
    ];
    
    for (const industry of industryKeywords) {
      if (content.includes(industry)) {
        businessInfo.industry = industry;
        break;
      }
    }
    
    return businessInfo;
  }

  private extractWebsiteServices($: cheerio.CheerioAPI): string[] {
    const services: string[] = [];
    const content = $('body').text().toLowerCase();
    
    const serviceKeywords = [
      'consulting', 'development', 'design', 'marketing',
      'support', 'solutions', 'training', 'coaching'
    ];
    
    serviceKeywords.forEach(service => {
      if (content.includes(service)) {
        services.push(service.charAt(0).toUpperCase() + service.slice(1));
      }
    });
    
    return services.slice(0, 5);
  }

  // Generic extraction methods
  private extractGenericKeywords($: cheerio.CheerioAPI): string[] {
    const content = $('body').text().toLowerCase();
    return this.extractBusinessKeywords(content);
  }

  // Utility methods
  private extractKeywordsFromUrl(url: string): string[] {
    const username = this.extractUsernameFromUrl(url);
    return username ? [username, 'professional', 'networking'] : ['professional', 'networking'];
  }

  private extractUsernameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part);
      return pathParts[0] || '';
    } catch {
      return '';
    }
  }

  private extractBusinessKeywords(text: string): string[] {
    const businessKeywords = [
      'entrepreneur', 'founder', 'ceo', 'cto', 'manager', 'director',
      'consultant', 'advisor', 'investor', 'startup', 'business',
      'technology', 'innovation', 'strategy', 'growth', 'leadership',
      'development', 'marketing', 'sales', 'finance', 'operations'
    ];
    
    const foundKeywords: string[] = [];
    
    businessKeywords.forEach(keyword => {
      if (text.includes(keyword) && !foundKeywords.includes(keyword)) {
        foundKeywords.push(keyword);
      }
    });
    
    return foundKeywords.slice(0, 10);
  }

  // Profile enhancement methods
  async enhanceProfileFromSocialData(profiles: SocialMediaProfile[]): Promise<ProfileEnhancement> {
    const allSkills = new Set<string>();
    const allKeywords = new Set<string>();
    const allIndustries = new Set<string>();
    const improvements: string[] = [];
    
    let enhancedBio = '';
    let networkingRecommendations: string[] = [];
    
    for (const profile of profiles) {
      // Aggregate skills
      if (profile.skills) {
        profile.skills.forEach(skill => allSkills.add(skill));
      }
      
      // Aggregate keywords
      if (profile.keywords) {
        profile.keywords.forEach(keyword => allKeywords.add(keyword));
      }
      
      // Build enhanced bio
      if (profile.bio && profile.bio.length > enhancedBio.length) {
        enhancedBio = profile.bio;
      }
      
      // Add platform-specific improvements
      improvements.push(`Analyzed ${profile.platform} profile for professional insights`);
      
      // Generate networking recommendations
      if (profile.platform === 'LinkedIn') {
        networkingRecommendations.push('Leverage LinkedIn connections for STAK ecosystem networking');
      }
      if (profile.platform === 'GitHub') {
        networkingRecommendations.push('Connect with developers and technical founders in STAK');
      }
      if (profile.platform === 'Twitter') {
        networkingRecommendations.push('Engage with industry leaders and thought leaders on Twitter');
      }
    }
    
    // Enhance bio with aggregated information
    if (allKeywords.size > 0) {
      const topKeywords = Array.from(allKeywords).slice(0, 5);
      enhancedBio += ` Professional focused on ${topKeywords.join(', ')}.`;
    }
    
    return {
      enhancedBio,
      extractedSkills: Array.from(allSkills).slice(0, 15),
      suggestedIndustries: Array.from(allIndustries),
      professionalKeywords: Array.from(allKeywords).slice(0, 10),
      networkingRecommendations,
      improvements
    };
  }
}

export const socialMediaCrawler = new SocialMediaCrawler();