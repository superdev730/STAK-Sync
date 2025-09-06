import fetch from 'node-fetch';

interface SearchResult {
  title: string;
  content: string;
  url: string;
  publishedDate?: string;
}

interface EnhancedProfileData {
  achievements: string[];
  recentNews: string[];
  socialEngagement: string[];
  accolades: string[];
  professionalHighlights: string[];
  sources: string[];
}

export class WebSearchService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
  }

  async searchPersonalAchievements(
    firstName: string, 
    lastName: string, 
    company?: string, 
    title?: string
  ): Promise<EnhancedProfileData> {
    try {
      if (!this.apiKey) {
        throw new Error('Perplexity API key not configured');
      }

      const searchQuery = this.buildSearchQuery(firstName, lastName, company, title);
      const searchResults = await this.performSearch(searchQuery);
      
      return this.extractProfileEnhancements(searchResults, firstName, lastName);
    } catch (error) {
      console.error('Web search failed:', error);
      return this.getFallbackData();
    }
  }

  private buildSearchQuery(firstName: string, lastName: string, company?: string, title?: string): string {
    let query = `"${firstName} ${lastName}"`;
    
    if (company) {
      query += ` "${company}"`;
    }
    
    if (title) {
      query += ` "${title}"`;
    }
    
    // Add search terms for achievements and recognition
    query += ' achievements awards recognition accomplishments news funding leadership speaking';
    
    return query;
  }

  private async performSearch(query: string): Promise<SearchResult[]> {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional research assistant. Find recent achievements, awards, recognition, news coverage, and professional accomplishments for the specified person. Focus on positive stories about their capabilities, skills, and contributions.'
          },
          {
            role: 'user',
            content: `Search for recent achievements, awards, recognition, news coverage, and professional accomplishments for: ${query}. 
            
            Please provide information about:
            - Professional achievements and milestones
            - Awards and recognition received
            - Recent news coverage or mentions
            - Speaking engagements or thought leadership
            - Company achievements they led or contributed to
            - Investment rounds, partnerships, or business successes
            - Industry recognition or rankings
            
            Focus on factual, verifiable information from the last 2-3 years.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9,
        search_recency_filter: 'month',
        return_images: false,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Parse the response into structured data
    return this.parseSearchResponse(content, citations);
  }

  private parseSearchResponse(content: string, citations: string[]): SearchResult[] {
    // Extract meaningful information from the Perplexity response
    const lines = content.split('\n').filter(line => line.trim());
    const results: SearchResult[] = [];
    
    for (const line of lines) {
      if (line.includes('achievement') || line.includes('award') || line.includes('recognition') || 
          line.includes('accomplishment') || line.includes('success') || line.includes('leadership')) {
        results.push({
          title: line.substring(0, 100),
          content: line,
          url: citations[0] || '',
          publishedDate: new Date().toISOString()
        });
      }
    }

    return results;
  }

  private extractProfileEnhancements(searchResults: SearchResult[], firstName: string, lastName: string): EnhancedProfileData {
    const achievements: string[] = [];
    const recentNews: string[] = [];
    const socialEngagement: string[] = [];
    const accolades: string[] = [];
    const professionalHighlights: string[] = [];
    const sources: string[] = [];

    for (const result of searchResults) {
      const content = result.content.toLowerCase();
      
      // Categorize findings
      if (content.includes('award') || content.includes('recognition') || content.includes('honor')) {
        accolades.push(result.content);
      } else if (content.includes('achievement') || content.includes('accomplishment') || content.includes('milestone')) {
        achievements.push(result.content);
      } else if (content.includes('news') || content.includes('coverage') || content.includes('featured')) {
        recentNews.push(result.content);
      } else if (content.includes('speaker') || content.includes('interview') || content.includes('podcast')) {
        socialEngagement.push(result.content);
      } else {
        professionalHighlights.push(result.content);
      }
      
      if (result.url) {
        sources.push(result.url);
      }
    }

    return {
      achievements: achievements.slice(0, 5),
      recentNews: recentNews.slice(0, 3),
      socialEngagement: socialEngagement.slice(0, 3),
      accolades: accolades.slice(0, 3),
      professionalHighlights: professionalHighlights.slice(0, 5),
      sources: [...new Set(sources)].slice(0, 10) // Remove duplicates
    };
  }

  private getFallbackData(): EnhancedProfileData {
    return {
      achievements: [],
      recentNews: [],
      socialEngagement: [],
      accolades: [],
      professionalHighlights: [],
      sources: []
    };
  }

  async searchLinkedInConnections(linkedinUrl: string): Promise<string[]> {
    // This would require LinkedIn API integration or scraping
    // For now, return empty array as this requires special permissions
    return [];
  }

  async detectMutualStakMembers(userId: string, linkedinConnections: string[]): Promise<string[]> {
    // This would cross-reference LinkedIn connections with STAK member database
    // Implementation would require access to LinkedIn API or manual connection data
    return [];
  }
}

export const webSearchService = new WebSearchService();