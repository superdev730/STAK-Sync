import OpenAI from 'openai';
import type { User, ProfileFact, InsertProfileFact, ProfileEnrichmentRun } from '@shared/schema';

// Source classification and trust weights
const SOURCE_TRUST_WEIGHTS = {
  'official_filings': 1.0,      // SEC filings, government records
  'reputable_media': 0.9,       // Forbes, WSJ, Bloomberg, etc.
  'press_release': 0.75,        // PRNewswire, BusinessWire
  'first_party': 0.7,           // Company websites, official pages
  '3p_official': 0.7,           // University bios, conference sites
  'social': 0.5,                // Twitter, GitHub (public content only)
  'other': 0.3
};

// Reputable media domains
const REPUTABLE_MEDIA_DOMAINS = new Set([
  'forbes.com', 'wsj.com', 'bloomberg.com', 'ft.com', 'cnbc.com',
  'reuters.com', 'techcrunch.com', 'theverge.com', 'wired.com',
  'business.com', 'entrepreneur.com', 'inc.com', 'fastcompany.com'
]);

// Press release domains
const PRESS_RELEASE_DOMAINS = new Set([
  'prnewswire.com', 'businesswire.com', 'globenewswire.com',
  'marketwatch.com', 'sec.gov'
]);

// Official filing domains
const OFFICIAL_FILING_DOMAINS = new Set([
  'sec.gov', 'edgar.gov', 'europa.eu', 'grants.gov'
]);

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  sourceType: 'first_party' | 'press_release' | 'reputable_media' | 'official_filings' | '3p_official' | 'social' | 'other';
  trustScore: number;
}

interface ExtractedClaim {
  claim_text: string;
  numeric_metrics?: number;
  dates?: string[];
  roles?: string[];
  project_names?: string[];
  organizations?: string[];
  locations?: string[];
  urls: string[];
  snippet: string;
  claim_type: 'role' | 'project' | 'investment' | 'round' | 'metric' | 'award' | 'press' | 'publication' | 'patent' | 'talk' | 'grant' | 'acquisition';
}

interface VerifiedFact {
  fact_type: 'role' | 'project' | 'investment' | 'round' | 'metric' | 'award' | 'press' | 'publication' | 'patent' | 'talk' | 'grant' | 'acquisition';
  title: string;
  description: string;
  org?: string;
  role?: string;
  value_number?: number;
  value_currency?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  source_urls: string[];
  evidence_quote: string;
  confidence: number;
  source_type: 'first_party' | 'press_release' | 'reputable_media' | 'official_filings' | '3p_official' | 'social' | 'other';
}

export class FactHarvester {
  private openai: OpenAI;
  private minimumFactConfidence: number;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    this.minimumFactConfidence = parseFloat(process.env.MINIMUM_FACT_CONFIDENCE || '0.6');
  }

  /**
   * Main entry point: harvest facts for a user's profile
   */
  async harvestFacts(user: User): Promise<VerifiedFact[]> {
    console.log(`Starting fact harvest for user: ${user.firstName} ${user.lastName}`);
    
    try {
      // Step 1: Generate search queries
      const searchQueries = this.generateSearchQueries(user);
      
      // Step 2: Get candidate URLs from search
      const candidateUrls = await this.searchForCandidateUrls(searchQueries);
      
      // Step 3: Classify and score sources
      const classifiedSources = this.classifyAndScoreSources(candidateUrls);
      
      // Step 4: Extract raw claims from content
      const rawClaims = await this.extractRawClaims(classifiedSources, user);
      
      // Step 5: Normalize claims
      const normalizedClaims = this.normalizeClaims(rawClaims);
      
      // Step 6: LLM fact extraction
      const extractedFacts = await this.llmFactExtraction(normalizedClaims, user);
      
      // Step 7: LLM fact verification
      const verifiedFacts = await this.llmFactVerification(extractedFacts);
      
      // Step 8: Filter by confidence threshold
      const highConfidenceFacts = verifiedFacts.filter(fact => 
        fact.confidence >= this.minimumFactConfidence && 
        fact.source_urls.length > 0
      );
      
      console.log(`Harvested ${highConfidenceFacts.length} high-confidence facts`);
      return highConfidenceFacts;
      
    } catch (error) {
      console.error('Fact harvest failed:', error);
      throw error;
    }
  }

  /**
   * Generate search queries for finding information about the user
   */
  private generateSearchQueries(user: User): string[] {
    const name = `${user.firstName} ${user.lastName}`;
    const company = user.company || '';
    
    const queries = [
      `"${name}"`,
      `"${name}" bio`,
      `"${name}" interview OR keynote`,
      `"${name}" ${company}`.trim(),
    ];
    
    if (company) {
      queries.push(
        `"${company}" press release`,
        `"${company}" funding round`,
        `"${company}" investment`
      );
    }
    
    return queries.filter(q => q.length > 3); // Remove empty queries
  }

  /**
   * Search for candidate URLs using search API (mock for now)
   * In production, this would use Perplexity or another search API
   */
  private async searchForCandidateUrls(queries: string[]): Promise<SearchResult[]> {
    // Mock implementation - in production, integrate with Perplexity API
    console.log('Searching for candidate URLs with queries:', queries);
    
    // For now, return empty array - this would be replaced with actual search API calls
    return [];
  }

  /**
   * Classify sources by domain and assign trust scores
   */
  private classifyAndScoreSources(results: SearchResult[]): SearchResult[] {
    return results.map(result => {
      const domain = new URL(result.url).hostname.toLowerCase();
      let sourceType: SearchResult['sourceType'] = 'other';
      
      if (OFFICIAL_FILING_DOMAINS.has(domain)) {
        sourceType = 'official_filings';
      } else if (REPUTABLE_MEDIA_DOMAINS.has(domain)) {
        sourceType = 'reputable_media';
      } else if (PRESS_RELEASE_DOMAINS.has(domain)) {
        sourceType = 'press_release';
      } else if (domain.includes('github.com')) {
        sourceType = 'social';
      } else if (domain.includes('.edu') || domain.includes('.org')) {
        sourceType = '3p_official';
      } else {
        sourceType = 'first_party';
      }
      
      return {
        ...result,
        sourceType,
        trustScore: SOURCE_TRUST_WEIGHTS[sourceType],
        domain
      };
    });
  }

  /**
   * Extract raw claims from web content (mock implementation)
   */
  private async extractRawClaims(sources: SearchResult[], user: User): Promise<ExtractedClaim[]> {
    // Mock implementation - would fetch and parse web content
    console.log(`Extracting claims from ${sources.length} sources`);
    return [];
  }

  /**
   * Normalize claims: standardize dates, currencies, collapse duplicates
   */
  private normalizeClaims(claims: ExtractedClaim[]): ExtractedClaim[] {
    // Normalize dates to ISO format, standardize currencies, etc.
    return claims.map(claim => ({
      ...claim,
      dates: claim.dates?.map(date => this.normalizeDate(date)),
    }));
  }

  /**
   * LLM-based fact extraction
   */
  private async llmFactExtraction(claims: ExtractedClaim[], user: User): Promise<VerifiedFact[]> {
    if (claims.length === 0) return [];

    const prompt = this.buildFactExtractionPrompt(claims, user);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are STAK Sync's Fact Extractor. Output ONLY objective, verifiable facts about a person's professional work. Prefer third-party and official sources. NO adjectives, NO unverifiable claims, NO speculation.

For every fact:
- Provide 1–3 source_urls to authoritative pages
- Include a short evidence_quote copied verbatim (≤200 chars)
- Assign confidence (0–1) reflecting source quality and agreement
- Normalize dates to YYYY-MM-DD; use value_number/value_currency for amounts and counts
- Categorize fact_type correctly

If a potential claim lacks a credible source, DO NOT include it.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for factual accuracy
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"facts": []}');
      return result.facts || [];
      
    } catch (error) {
      console.error('LLM fact extraction failed:', error);
      return [];
    }
  }

  /**
   * LLM-based fact verification
   */
  private async llmFactVerification(facts: VerifiedFact[]): Promise<VerifiedFact[]> {
    if (facts.length === 0) return [];

    const prompt = this.buildFactVerificationPrompt(facts);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a fact verifier. Given candidate facts, remove any that:
- lack source_urls
- rely on low-credibility domains
- have internal conflicts (dates/amounts disagree) without clear resolution
- are descriptors without measurable content

Re-score confidence based on source mix:
official_filings > reputable_media > press_release > first_party > 3p_official > social`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"verified_facts": []}');
      return result.verified_facts || [];
      
    } catch (error) {
      console.error('LLM fact verification failed:', error);
      return facts; // Return original facts if verification fails
    }
  }

  /**
   * Build fact extraction prompt
   */
  private buildFactExtractionPrompt(claims: ExtractedClaim[], user: User): string {
    const userInfo = `${user.firstName} ${user.lastName}${user.company ? ` at ${user.company}` : ''}`;
    
    return `PERSON: ${userInfo}
CANDIDATE_CLAIMS: ${JSON.stringify(claims, null, 2)}

OUTPUT_SCHEMA (array of facts):
{
  "facts": [{
    "fact_type": "project|investment|round|metric|award|press|publication|patent|role|talk|grant|acquisition",
    "title": "",
    "description": "",
    "org": "",
    "role": "",
    "value_number": null,
    "value_currency": null,
    "start_date": null,
    "end_date": null,
    "location": null,
    "source_urls": [],
    "evidence_quote": "",
    "confidence": 0.0,
    "source_type": ""
  }]
}`;
  }

  /**
   * Build fact verification prompt
   */
  private buildFactVerificationPrompt(facts: VerifiedFact[]): string {
    return `CANDIDATE_FACTS: ${JSON.stringify(facts, null, 2)}

Review and verify these facts. Remove or downgrade any that lack proper sources or have conflicts.
Return only facts with confidence >= 0.5 and proper evidence.

OUTPUT_SCHEMA:
{
  "verified_facts": [/* array of verified fact objects */]
}`;
  }

  /**
   * Normalize date to ISO format
   */
  private normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return dateStr; // Return original if parsing fails
    }
  }
}

export const factHarvester = new FactHarvester();