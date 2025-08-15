import fetch from 'node-fetch';

interface LinkedInProfile {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration?: string;
    description?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
  }>;
  skills?: string[];
  connections?: string;
}

export class LinkedInScraper {
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  ];

  private static getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private static sanitizeLinkedInUrl(url: string): string {
    // Clean up LinkedIn URL to get the profile path
    let cleanUrl = url.trim();
    
    // Handle various LinkedIn URL formats
    if (cleanUrl.includes('linkedin.com/in/')) {
      const match = cleanUrl.match(/linkedin\.com\/in\/([^/?]+)/);
      if (match) {
        return `https://www.linkedin.com/in/${match[1]}`;
      }
    }
    
    // If it's already a clean LinkedIn URL, return as is
    if (cleanUrl.startsWith('https://www.linkedin.com/in/')) {
      return cleanUrl.split('?')[0]; // Remove any query parameters
    }
    
    throw new Error('Invalid LinkedIn URL format');
  }

  static async scrapeProfile(linkedInUrl: string): Promise<LinkedInProfile> {
    try {
      const cleanUrl = this.sanitizeLinkedInUrl(linkedInUrl);
      
      const response = await fetch(cleanUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Parse the HTML content
      return this.parseLinkedInHTML(html);
      
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      throw new Error(`Failed to scrape LinkedIn profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parseLinkedInHTML(html: string): LinkedInProfile {
    const profile: LinkedInProfile = {};

    // Extract name from title tag or structured data
    const nameMatch = html.match(/<title>([^|]+)(\s*\|\s*LinkedIn)?<\/title>/i);
    if (nameMatch) {
      profile.name = nameMatch[1].trim();
    }

    // Extract from JSON-LD structured data if available
    const jsonLdMatch = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    if (jsonLdMatch) {
      for (const jsonScript of jsonLdMatch) {
        try {
          const jsonContent = jsonScript.replace(/<script[^>]*>|<\/script>/g, '');
          const data = JSON.parse(jsonContent);
          
          if (data['@type'] === 'Person') {
            if (data.name) profile.name = data.name;
            if (data.jobTitle) profile.headline = data.jobTitle;
            if (data.description) profile.about = data.description;
            if (data.address?.addressLocality) profile.location = data.address.addressLocality;
          }
        } catch (e) {
          // Continue if JSON parsing fails
        }
      }
    }

    // Extract meta tags
    const metaMatches = html.matchAll(/<meta[^>]+property="([^"]+)"[^>]+content="([^"]*)"[^>]*>/gi);
    for (const match of metaMatches) {
      const property = match[1];
      const content = match[2];
      
      if (property === 'og:title' && !profile.name) {
        profile.name = content.replace(/\s*\|\s*LinkedIn.*$/, '').trim();
      } else if (property === 'og:description' && !profile.headline) {
        profile.headline = content;
      }
    }

    // Extract headline from various patterns
    if (!profile.headline) {
      const headlinePatterns = [
        /<h2[^>]*class="[^"]*text-heading[^"]*"[^>]*>([^<]+)/i,
        /<div[^>]*class="[^"]*text-body[^"]*"[^>]*>([^<]+)/i
      ];
      
      for (const pattern of headlinePatterns) {
        const match = html.match(pattern);
        if (match) {
          profile.headline = match[1].trim();
          break;
        }
      }
    }

    // If we couldn't get much data from the public view, provide helpful message
    if (!profile.name && !profile.headline) {
      throw new Error('Unable to access profile information. This LinkedIn profile may be private or require authentication.');
    }

    return profile;
  }

  static async extractSkillsFromProfile(profile: LinkedInProfile): Promise<string[]> {
    const skills: Set<string> = new Set();

    // Extract skills from headline
    if (profile.headline) {
      const skillKeywords = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'PHP',
        'Leadership', 'Management', 'Strategy', 'Product Management', 'Marketing',
        'Sales', 'Business Development', 'Finance', 'Accounting', 'Engineering',
        'Design', 'UX', 'UI', 'Data Science', 'Machine Learning', 'AI', 'DevOps',
        'Cloud Computing', 'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker'
      ];

      for (const skill of skillKeywords) {
        if (profile.headline.toLowerCase().includes(skill.toLowerCase())) {
          skills.add(skill);
        }
      }
    }

    // Extract skills from experience descriptions
    if (profile.experience) {
      for (const exp of profile.experience) {
        if (exp.description) {
          for (const skill of ['Leadership', 'Team Management', 'Strategy', 'Product Development']) {
            if (exp.description.toLowerCase().includes(skill.toLowerCase())) {
              skills.add(skill);
            }
          }
        }
      }
    }

    return Array.from(skills);
  }

  static async generateBioFromProfile(profile: LinkedInProfile): Promise<string> {
    const parts: string[] = [];

    if (profile.name) {
      let bio = `${profile.name}`;
      
      if (profile.headline) {
        bio += ` is ${profile.headline.toLowerCase().startsWith('a ') ? '' : 'a '}${profile.headline}`;
      }
      
      if (profile.location) {
        bio += ` based in ${profile.location}`;
      }
      
      bio += '.';
      parts.push(bio);
    }

    if (profile.about) {
      // Take first sentence or two from about section
      const sentences = profile.about.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 0) {
        parts.push(sentences.slice(0, 2).join('. ').trim() + '.');
      }
    }

    if (profile.experience && profile.experience.length > 0) {
      const currentRole = profile.experience[0];
      if (currentRole.title && currentRole.company) {
        parts.push(`Currently ${currentRole.title} at ${currentRole.company}.`);
      }
    }

    return parts.join(' ');
  }
}