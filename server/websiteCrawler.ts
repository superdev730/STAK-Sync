import * as cheerio from 'cheerio';

export interface WebsiteData {
  title: string;
  description: string;
  headings: string[];
  content: string;
  keywords: string[];
  technologies: string[];
  businessInfo: {
    industry?: string;
    services?: string[];
    location?: string;
    companySize?: string;
  };
}

export class WebsiteCrawler {
  async crawlWebsite(url: string): Promise<WebsiteData> {
    try {
      // Validate URL
      const validUrl = this.validateUrl(url);
      
      // Fetch webpage content
      const response = await fetch(validUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; STAK-Sync/1.0; +https://staksync.com)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract structured data
      const data: WebsiteData = {
        title: this.extractTitle($),
        description: this.extractDescription($),
        headings: this.extractHeadings($),
        content: this.extractMainContent($),
        keywords: this.extractKeywords($),
        technologies: this.detectTechnologies($, html),
        businessInfo: this.extractBusinessInfo($)
      };
      
      return data;
      
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      throw new Error(`Failed to crawl website: ${error.message}`);
    }
  }

  private validateUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      const validUrl = new URL(url);
      
      // Security checks
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }
      
      return validUrl.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return $('title').first().text().trim() || 
           $('h1').first().text().trim() || 
           'No title found';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return $('meta[name="description"]').attr('content') ||
           $('meta[property="og:description"]').attr('content') ||
           $('p').first().text().trim().substring(0, 200) ||
           'No description available';
  }

  private extractHeadings($: cheerio.CheerioAPI): string[] {
    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) {
        headings.push(text);
      }
    });
    return headings.slice(0, 10); // Limit to 10 headings
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove script, style, and navigation elements
    $('script, style, nav, header, footer, .navigation, .menu').remove();
    
    // Extract text from main content areas
    const contentSelectors = [
      'main', 
      '.main-content', 
      '.content', 
      'article', 
      '.post-content',
      '.page-content'
    ];
    
    let content = '';
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }
    
    // Fallback to body content if no main content found
    if (!content) {
      content = $('body').text().trim();
    }
    
    // Clean and limit content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 2000); // Limit to 2000 characters
    
    return content;
  }

  private extractKeywords($: cheerio.CheerioAPI): string[] {
    const keywords: string[] = [];
    
    // Meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      keywords.push(...metaKeywords.split(',').map(k => k.trim()));
    }
    
    // Extract from content (simple frequency analysis)
    const text = $('body').text().toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    
    const wordCount: { [word: string]: number } = {};
    words.forEach(word => {
      if (this.isBusinessKeyword(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Get top keywords
    const topKeywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    return [...new Set([...keywords, ...topKeywords])];
  }

  private detectTechnologies($: cheerio.CheerioAPI, html: string): string[] {
    const technologies: string[] = [];
    
    // Detect common frameworks and technologies
    const techPatterns = {
      'React': /react/i,
      'Vue.js': /vue\.js|vue/i,
      'Angular': /angular/i,
      'WordPress': /wp-content|wordpress/i,
      'Shopify': /shopify/i,
      'Squarespace': /squarespace/i,
      'Wix': /wix\.com/i,
      'Bootstrap': /bootstrap/i,
      'jQuery': /jquery/i,
      'Node.js': /node\.js|nodejs/i,
      'Python': /python|django|flask/i,
      'PHP': /php/i,
      'Ruby': /ruby|rails/i
    };
    
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(html) || pattern.test($('body').text())) {
        technologies.push(tech);
      }
    }
    
    return technologies;
  }

  private extractBusinessInfo($: cheerio.CheerioAPI): WebsiteData['businessInfo'] {
    const businessInfo: WebsiteData['businessInfo'] = {};
    
    // Try to extract industry from content
    const industryKeywords = [
      'consulting', 'technology', 'software', 'marketing', 'design',
      'finance', 'healthcare', 'education', 'retail', 'manufacturing',
      'real estate', 'legal', 'nonprofit', 'media', 'entertainment'
    ];
    
    const content = $('body').text().toLowerCase();
    
    for (const industry of industryKeywords) {
      if (content.includes(industry)) {
        businessInfo.industry = industry;
        break;
      }
    }
    
    // Extract services from headings and content
    const serviceKeywords = [
      'services', 'consulting', 'development', 'design', 'marketing',
      'support', 'solutions', 'products', 'offerings'
    ];
    
    const services: string[] = [];
    serviceKeywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}[^.]*`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        services.push(...matches.slice(0, 3));
      }
    });
    
    if (services.length > 0) {
      businessInfo.services = services;
    }
    
    return businessInfo;
  }

  private isBusinessKeyword(word: string): boolean {
    const businessKeywords = [
      'business', 'company', 'service', 'product', 'solution', 'consulting',
      'technology', 'software', 'development', 'design', 'marketing', 'sales',
      'customer', 'client', 'professional', 'expert', 'team', 'experience',
      'innovative', 'quality', 'reliable', 'trusted', 'leading', 'industry'
    ];
    
    return businessKeywords.includes(word) && word.length > 3;
  }

  async enhanceProfileWithWebsiteData(websiteData: WebsiteData): Promise<{
    bio: string;
    skills: string[];
    industries: string[];
    improvements: string[];
  }> {
    const improvements: string[] = [];
    
    // Generate bio enhancement
    let bio = '';
    if (websiteData.businessInfo.industry) {
      bio += `Professional in ${websiteData.businessInfo.industry}. `;
    }
    
    if (websiteData.businessInfo.services?.length) {
      bio += `Specializing in ${websiteData.businessInfo.services.slice(0, 2).join(' and ')}. `;
    }
    
    bio += `${websiteData.description.substring(0, 100)}...`;
    improvements.push('Enhanced bio with website information');
    
    // Extract skills from technologies and keywords
    const skills = [...websiteData.technologies, ...websiteData.keywords.slice(0, 5)];
    if (skills.length > 0) {
      improvements.push(`Added ${skills.length} skills from website analysis`);
    }
    
    // Determine industries
    const industries = [];
    if (websiteData.businessInfo.industry) {
      industries.push(websiteData.businessInfo.industry);
      improvements.push('Updated industry information');
    }
    
    return {
      bio,
      skills: skills.slice(0, 10), // Limit to 10 skills
      industries,
      improvements
    };
  }
}

export const websiteCrawler = new WebsiteCrawler();