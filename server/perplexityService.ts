import { PERPLEXITY_QUERIES } from "./simplifiedProfileBuilder";

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface PerplexitySearchResult {
  query: string;
  content: string;
  citations: string[];
  relevanceScore: number;
}

export class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ PERPLEXITY_API_KEY not found. Perplexity search will be disabled.');
    }
  }

  /**
   * Gather comprehensive profile data using Perplexity's search capabilities
   */
  async gatherProfileData(firstName: string, lastName: string, domain?: string, company?: string) {
    if (!this.apiKey) {
      console.log('⚠️ Perplexity API key not available, skipping Perplexity search');
      return { searchResults: [], summary: null };
    }

    console.log('🔍 Gathering profile data using Perplexity AI...');
    
    try {
      // Generate intelligent search queries
      const queries = PERPLEXITY_QUERIES(firstName, lastName, domain, company);
      
      // Execute strategic queries (prioritize person-specific queries)
      const priorityQueries = queries.slice(0, 3); // Person + domain, person + company, person + bio
      const searchResults: PerplexitySearchResult[] = [];

      for (const queryObj of priorityQueries) {
        if (queryObj.q.trim()) {
          const result = await this.executeSearch(queryObj.q);
          if (result) {
            searchResults.push(result);
          }
          // Rate limiting: small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Generate summary if we have results
      const summary = searchResults.length > 0 
        ? await this.generateProfileSummary(firstName, lastName, searchResults)
        : null;

      console.log(`✅ Perplexity search completed: ${searchResults.length} results, ${summary ? 'summary generated' : 'no summary'}`);
      
      return {
        searchResults,
        summary,
        queryCount: priorityQueries.length,
        tokensUsed: searchResults.reduce((sum, r) => sum + (r as any).tokensUsed || 0, 0)
      };

    } catch (error) {
      console.error('❌ Perplexity search failed:', error);
      return { searchResults: [], summary: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute a single search query using Perplexity API
   */
  private async executeSearch(query: string): Promise<PerplexitySearchResult | null> {
    try {
      console.log(`🔍 Executing Perplexity query: "${query}"`);

      const response = await fetch(this.baseUrl, {
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
              content: 'You are a professional research assistant. Provide factual, comprehensive information about the search query. Focus on professional background, career achievements, and public information.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          top_p: 0.9,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          stream: false
        })
      });

      if (!response.ok) {
        console.error(`Perplexity API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: PerplexityResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const citations = data.citations || [];
        
        // Simple relevance scoring based on content length and citations
        const relevanceScore = this.calculateRelevanceScore(content, citations, query);
        
        return {
          query,
          content,
          citations,
          relevanceScore,
          ...({ tokensUsed: data.usage?.total_tokens || 0 }) // Add token usage for tracking
        };
      }

      return null;

    } catch (error) {
      console.error(`Error executing Perplexity query "${query}":`, error);
      return null;
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(content: string, citations: string[], query: string): number {
    let score = 0;
    
    // Content length factor (more content generally means more relevant)
    score += Math.min(content.length / 100, 10); // Up to 10 points for content length
    
    // Citations factor (more citations means better sourcing)
    score += Math.min(citations.length * 2, 10); // Up to 10 points for citations
    
    // Query term presence (check if key terms from query appear in content)
    const queryTerms = query.toLowerCase().replace(/['"]/g, '').split(' ').filter(term => term.length > 2);
    const contentLower = content.toLowerCase();
    const termMatches = queryTerms.filter(term => contentLower.includes(term)).length;
    score += (termMatches / queryTerms.length) * 5; // Up to 5 points for term matches
    
    return Math.min(score, 25); // Cap at 25 points
  }

  /**
   * Generate a profile summary from multiple search results
   */
  private async generateProfileSummary(firstName: string, lastName: string, searchResults: PerplexitySearchResult[]) {
    try {
      console.log('📝 Generating profile summary from Perplexity results...');

      // Combine all search results with citations
      const combinedContent = searchResults
        .filter(result => result.relevanceScore > 5) // Only use relevant results
        .map(result => `Query: ${result.query}\nContent: ${result.content}\nSources: ${result.citations.join(', ')}`)
        .join('\n\n---\n\n');

      if (!combinedContent.trim()) {
        return null;
      }

      const response = await fetch(this.baseUrl, {
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
              content: `You are a professional profile summarizer. Based on the provided search results, create a comprehensive profile summary for ${firstName} ${lastName}. Include:
              - Professional background and current role
              - Key achievements and experience
              - Company/organization affiliations
              - Areas of expertise and skills
              - Notable projects or contributions
              
              Focus on factual, verifiable information. If information is limited, be explicit about that.`
            },
            {
              role: 'user',
              content: `Please summarize the professional profile for ${firstName} ${lastName} based on these search results:\n\n${combinedContent}`
            }
          ],
          max_tokens: 800,
          temperature: 0.1,
          top_p: 0.9,
          stream: false
        })
      });

      if (!response.ok) {
        console.error(`Perplexity summary API error: ${response.status}`);
        return null;
      }

      const data: PerplexityResponse = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        const summary = data.choices[0].message.content;
        console.log('✅ Profile summary generated successfully');
        return {
          summary,
          sourceCount: searchResults.length,
          citationCount: searchResults.reduce((sum, r) => sum + r.citations.length, 0),
          tokensUsed: data.usage?.total_tokens || 0
        };
      }

      return null;

    } catch (error) {
      console.error('Error generating profile summary:', error);
      return null;
    }
  }
}