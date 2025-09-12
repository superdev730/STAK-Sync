import OpenAI from "openai";
import { db } from "./db";
import { 
  users, 
  profileMetadata, 
  profileEnrichment, 
  profileVersions,
  enrichmentLogs,
  matchSignals,
  type InsertProfileMetadata,
  type InsertProfileEnrichment
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { tokenUsageService } from "./tokenUsageService";

interface EnrichmentSources {
  emailDomain?: string;
  companyUrl?: string;
  gravatarUrl?: string;
  searchUrls?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
}

interface EnrichedProfileData {
  headline?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  industries?: string[];
  skills?: string[];
  interests?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
  profileImageUrl?: string;
}

interface FieldEnrichment {
  value: any;
  confidence: number;
  sources: string[];
}

interface EnrichmentResult {
  success: boolean;
  enrichedData?: EnrichedProfileData;
  sources?: EnrichmentSources;
  error?: string;
}

export class EnrichmentService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async enrichProfile(userId: string, triggerType: 'initial' | 'refresh' | 'manual' | 'consent_based' = 'initial'): Promise<EnrichmentResult> {
    const startTime = Date.now();
    try {
      console.log(`🔍 Starting profile enrichment for user ${userId} (${triggerType})`);

      // Get current user profile
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!userResult.length) {
        throw new Error('User not found');
      }

      const user = userResult[0];
      
      // Check consent for public source enrichment
      if (triggerType === 'consent_based' || triggerType === 'manual') {
        const consent = user.consent as any;
        if (!consent || consent.enrich_public_sources !== 'yes') {
          console.log('❌ User has not consented to public source enrichment');
          
          // Log the failed attempt
          await this.logEnrichment(userId, 'consent_check', {}, 0, 'failed', 
            triggerType, 'User has not consented to public source enrichment', Date.now() - startTime);
          
          return {
            success: false,
            error: 'User has not consented to public source enrichment'
          };
        }
      }
      
      // Step 1: Gather deterministic signals
      const sources = await this.gatherDeterministicSources(user);
      console.log('📊 Gathered deterministic sources:', sources);

      // Step 2: Perform web search for additional context
      const searchContext = await this.performWebSearch(user, sources);
      console.log('🔍 Web search context gathered');

      // Step 3: Use LLM to normalize and enhance profile data
      const enrichedData = await this.llmNormalizeProfile(user, sources, searchContext);
      console.log('🤖 LLM normalization completed:', Object.keys(enrichedData));

      // Step 4: Store enrichment results
      await this.storeEnrichmentResults(userId, enrichedData, sources, triggerType);

      // Step 5: Update profile metadata for new fields
      await this.updateProfileMetadata(userId, enrichedData, sources);

      // Step 6: Update trust signals in matchSignals with verified links
      await this.updateTrustSignals(userId, sources);

      // Step 7: Log successful enrichment
      await this.logEnrichment(userId, 'multiple_sources', enrichedData, 85, 'success', 
        triggerType, null, Date.now() - startTime);

      return {
        success: true,
        enrichedData,
        sources
      };

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      
      // Store failed enrichment record
      await db.insert(profileEnrichment).values({
        userId,
        payload: { error: (error as Error).message },
        sources: {},
        enrichmentType: triggerType,
        status: 'failed'
      });

      // Log failed enrichment
      await this.logEnrichment(userId, 'error', {}, 0, 'failed', 
        triggerType, (error as Error).message, Date.now() - startTime);

      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  private async logEnrichment(
    userId: string,
    source: string,
    extractedFields: any,
    matchConfidence: number,
    status: 'success' | 'partial' | 'failed',
    enrichmentType: string,
    errorMessage?: string | null,
    processingTimeMs?: number
  ): Promise<void> {
    try {
      await db.insert(enrichmentLogs).values({
        userId,
        source,
        extractedFields,
        matchConfidence: matchConfidence.toString(),
        status,
        enrichmentType,
        errorMessage,
        processingTimeMs
      });
    } catch (error) {
      console.error('Failed to log enrichment:', error);
    }
  }

  private async updateTrustSignals(userId: string, sources: EnrichmentSources): Promise<void> {
    try {
      // Get existing match signals for the user
      const existingSignals = await db.select()
        .from(matchSignals)
        .where(eq(matchSignals.userId, userId))
        .limit(1);

      const verifiedLinks: any = {};
      const verifiedAt = new Date().toISOString();

      // Build verified links object
      if (sources.linkedinUrl) {
        verifiedLinks.linkedin = {
          url: sources.linkedinUrl,
          verified_at: verifiedAt
        };
      }
      if (sources.githubUrl) {
        verifiedLinks.github = {
          url: sources.githubUrl,
          verified_at: verifiedAt
        };
      }
      if (sources.websiteUrls?.length) {
        verifiedLinks.website = {
          url: sources.websiteUrls[0],
          verified_at: verifiedAt
        };
      }

      if (Object.keys(verifiedLinks).length === 0) {
        console.log('No verified links to update');
        return;
      }

      if (existingSignals.length > 0) {
        // Update existing match signals
        const currentTrustSignals = existingSignals[0].trustSignals || {};
        const updatedTrustSignals = {
          ...currentTrustSignals,
          verified_links: verifiedLinks
        };

        await db.update(matchSignals)
          .set({
            trustSignals: updatedTrustSignals,
            updatedAt: new Date()
          })
          .where(eq(matchSignals.userId, userId));
      } else {
        // Create new match signals entry
        await db.insert(matchSignals).values({
          userId,
          trustSignals: {
            verified_links: verifiedLinks
          }
        });
      }

      console.log('✅ Updated trust signals with verified links');
    } catch (error) {
      console.error('Failed to update trust signals:', error);
    }
  }

  private async gatherDeterministicSources(user: any): Promise<EnrichmentSources> {
    const sources: EnrichmentSources = {};

    // Extract email domain
    if (user.email) {
      const domain = user.email.split('@')[1];
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain.toLowerCase())) {
        sources.emailDomain = domain;
        sources.companyUrl = `https://${domain}`;
      }
    }

    // Check for Gravatar
    if (user.email && !user.profileImageUrl) {
      sources.gravatarUrl = `https://gravatar.com/avatar/${this.md5(user.email.toLowerCase())}?d=404&s=200`;
    }

    // Include existing social URLs
    if (user.linkedinUrl) sources.linkedinUrl = user.linkedinUrl;
    if (user.twitterUrl) sources.twitterUrl = user.twitterUrl;
    if (user.githubUrl) sources.githubUrl = user.githubUrl;
    if (user.websiteUrls?.length) sources.websiteUrls = user.websiteUrls;

    return sources;
  }

  private async performWebSearch(user: any, sources: EnrichmentSources): Promise<string> {
    // For now, create a context string from available information
    // In the future, this could use Perplexity or other search APIs
    const searchTerms = [];
    
    if (user.firstName && user.lastName) {
      searchTerms.push(`"${user.firstName} ${user.lastName}"`);
    }
    
    if (user.company) {
      searchTerms.push(`"${user.company}"`);
    }
    
    if (sources.emailDomain) {
      searchTerms.push(sources.emailDomain);
    }

    return `Search context for: ${searchTerms.join(' ')}\n` +
           `Available social profiles: ${Object.keys(sources).filter(k => k.endsWith('Url')).join(', ')}\n` +
           `Current data: ${JSON.stringify({
             name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
             title: user.title,
             company: user.company,
             location: user.location,
             bio: user.bio
           }, null, 2)}`;
  }

  private async llmNormalizeProfile(user: any, sources: EnrichmentSources, searchContext: string): Promise<EnrichedProfileData> {
    const prompt = `You are a professional profile data normalizer. Given the information below, enhance and normalize this person's professional profile.

CURRENT PROFILE DATA:
${JSON.stringify({
  name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
  email: user.email,
  title: user.title,
  company: user.company,
  location: user.location,
  bio: user.bio,
  skills: user.skills,
  industries: user.industries,
  networkingGoal: user.networkingGoal,
  socialUrls: sources
}, null, 2)}

SEARCH CONTEXT:
${searchContext}

INSTRUCTIONS:
1. Only enhance/improve fields that are missing or incomplete
2. Generate professional, accurate content based on available signals
3. Provide confidence scores (0.0 to 1.0) for each enhanced field
4. Include source URLs when possible (max 3 per field)
5. For bio: Write 2-3 professional sentences highlighting expertise and goals
6. For skills: Include 5-8 relevant professional skills
7. For industries: Include 2-4 relevant industry categories
8. For headline: Create a professional title/headline
9. Keep all content professional and conservative

RESPONSE FORMAT (JSON only):
{
  "headline": {
    "value": "Professional headline/title",
    "confidence": 0.8,
    "sources": ["url1", "url2"]
  },
  "title": {
    "value": "Job title if missing/incomplete",
    "confidence": 0.7,
    "sources": ["url1"]
  },
  "company": {
    "value": "Company name if missing",
    "confidence": 0.6,
    "sources": ["url1"]
  },
  "location": {
    "value": "Location if missing",
    "confidence": 0.5,
    "sources": ["url1"]
  },
  "bio": {
    "value": "Professional bio if missing/short",
    "confidence": 0.8,
    "sources": ["url1", "url2"]
  },
  "industries": {
    "value": ["Industry1", "Industry2"],
    "confidence": 0.7,
    "sources": ["url1"]
  },
  "skills": {
    "value": ["Skill1", "Skill2", "Skill3"],
    "confidence": 0.8,
    "sources": ["url1", "url2"]
  },
  "interests": {
    "value": ["Interest1", "Interest2"],
    "confidence": 0.6,
    "sources": ["url1"]
  }
}

Only include fields that you can confidently enhance. Do not include fields that are already complete or that you cannot improve with confidence >= 0.5.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional profile data normalizer. Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      // Track token usage
      if (response.usage) {
        await tokenUsageService.recordTokenUsage({
          userId: user.id,
          feature: 'profile_enrichment',
          model: 'gpt-4o-mini',
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens
        });
      }

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse LLM response
      const parsedResponse = JSON.parse(content);
      console.log('🤖 LLM response parsed:', Object.keys(parsedResponse));

      // Convert to our internal format
      const enrichedData: EnrichedProfileData = {};

      for (const [fieldName, fieldData] of Object.entries(parsedResponse)) {
        const data = fieldData as FieldEnrichment;
        if (data.confidence >= 0.5) {
          (enrichedData as any)[fieldName] = data.value;
        }
      }

      return enrichedData;

    } catch (error) {
      console.error('❌ LLM normalization failed:', error);
      return {}; // Return empty object on failure
    }
  }

  private async storeEnrichmentResults(
    userId: string, 
    enrichedData: EnrichedProfileData, 
    sources: EnrichmentSources, 
    enrichmentType: 'initial' | 'refresh' | 'manual'
  ): Promise<void> {
    const enrichmentPayload = {
      userId,
      payload: enrichedData,
      sources,
      enrichmentType,
      status: 'completed' as const
    };

    await db.insert(profileEnrichment).values(enrichmentPayload);
    console.log('💾 Enrichment results stored');
  }

  private async updateProfileMetadata(
    userId: string, 
    enrichedData: EnrichedProfileData, 
    sources: EnrichmentSources
  ): Promise<void> {
    // Update profile metadata for enriched fields
    for (const [fieldName, value] of Object.entries(enrichedData)) {
      if (value) {
        const metadataPayload: InsertProfileMetadata = {
          userId,
          fieldName,
          provenance: 'enrichment',
          confidence: '0.7', // Default confidence for enriched data
          sources: Object.values(sources).filter(Boolean)
        };

        // Insert or update metadata
        await db.insert(profileMetadata)
          .values(metadataPayload)
          .onConflictDoUpdate({
            target: [profileMetadata.userId, profileMetadata.fieldName],
            set: {
              provenance: metadataPayload.provenance,
              confidence: metadataPayload.confidence,
              sources: metadataPayload.sources,
              updatedAt: new Date()
            }
          });
      }
    }

    console.log('📝 Profile metadata updated for enriched fields');
  }

  private md5(str: string): string {
    // Simple MD5 implementation for Gravatar
    const crypto = require('crypto');
    return crypto.createHash('md5').update(str).digest('hex');
  }

  // Queue enrichment job (for async processing)
  static async queueEnrichment(userId: string, triggerType: 'initial' | 'refresh' | 'manual' = 'initial'): Promise<void> {
    // For now, run enrichment immediately
    // In the future, this could use a job queue like Bull or Agenda
    setTimeout(async () => {
      const enrichmentService = new EnrichmentService();
      await enrichmentService.enrichProfile(userId, triggerType);
    }, 100);
  }
}