import OpenAI from "openai";
import { SYSTEM_CONNECTION_SUMMARY } from "./simplifiedProfileBuilder";

// Types for interaction logs
interface SyncSession {
  member_id: string;
  session_duration: number;
  topics_discussed: string[];
  interaction_quality: number; // 1-5 scale
}

interface QRScan {
  member_id: string;
  scan_timestamp: string;
  location?: string;
}

interface ChatSnippet {
  member_id: string;
  message_preview: string;
  timestamp: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface InteractionLogs {
  sync_sessions?: SyncSession[];
  qr_scans?: QRScan[];
  chat_snippets?: ChatSnippet[];
}

interface PersonMet {
  member_id: string;
  summary_note: string;
  suggested_followup: string;
}

interface ConnectionSummary {
  people_met: PersonMet[];
  highlights: string[];
  next_steps: string[];
  event_id: string;
  user_id: string;
  generated_at: string;
}

export class ConnectionSummarizer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate post-event connection summary from interaction logs
   */
  async generateSummary(
    userId: string, 
    eventId: string, 
    interactionLogs: InteractionLogs
  ): Promise<ConnectionSummary> {
    console.log('📝 Processing interaction logs for post-event summary...');
    
    try {
      // Validate input data
      if (!this.hasValidInteractionData(interactionLogs)) {
        return this.generateEmptySummary(userId, eventId);
      }

      // Prepare structured interaction data for AI analysis
      const structuredData = this.structureInteractionData(interactionLogs);
      
      // Generate summary using AI
      const aiSummary = await this.generateAISummary(structuredData);
      
      return {
        ...aiSummary,
        event_id: eventId,
        user_id: userId,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Connection summary generation failed:', error);
      // Return empty summary as fallback
      return this.generateEmptySummary(userId, eventId);
    }
  }

  /**
   * Check if interaction logs contain valid data
   */
  private hasValidInteractionData(logs: InteractionLogs): boolean {
    const hasSyncSessions = Boolean(logs.sync_sessions && logs.sync_sessions.length > 0);
    const hasQRScans = Boolean(logs.qr_scans && logs.qr_scans.length > 0);
    const hasChatSnippets = Boolean(logs.chat_snippets && logs.chat_snippets.length > 0);
    
    return hasSyncSessions || hasQRScans || hasChatSnippets;
  }

  /**
   * Structure interaction data for AI processing
   */
  private structureInteractionData(logs: InteractionLogs) {
    const syncSessions = logs.sync_sessions || [];
    const qrScans = logs.qr_scans || [];
    const chatSnippets = logs.chat_snippets || [];

    // Consolidate interactions by member_id
    const memberInteractions = new Map();

    // Process sync sessions (highest quality interactions)
    syncSessions.forEach(session => {
      if (!memberInteractions.has(session.member_id)) {
        memberInteractions.set(session.member_id, {
          member_id: session.member_id,
          interaction_types: [],
          quality_score: 0,
          context: []
        });
      }
      
      const member = memberInteractions.get(session.member_id);
      member.interaction_types.push('sync_session');
      member.quality_score = Math.max(member.quality_score, session.interaction_quality);
      member.context.push(`Discussed: ${session.topics_discussed.join(', ')}`);
      member.context.push(`Session duration: ${session.session_duration}min`);
    });

    // Process QR scans (contact exchanges)
    qrScans.forEach(scan => {
      if (!memberInteractions.has(scan.member_id)) {
        memberInteractions.set(scan.member_id, {
          member_id: scan.member_id,
          interaction_types: [],
          quality_score: 2, // Default quality for QR scans
          context: []
        });
      }
      
      const member = memberInteractions.get(scan.member_id);
      member.interaction_types.push('qr_scan');
      member.context.push(`Contact exchanged at ${scan.location || 'event'}`);
    });

    // Process chat snippets (ongoing conversations)
    chatSnippets.forEach(snippet => {
      if (!memberInteractions.has(snippet.member_id)) {
        memberInteractions.set(snippet.member_id, {
          member_id: snippet.member_id,
          interaction_types: [],
          quality_score: snippet.sentiment === 'positive' ? 3 : 2,
          context: []
        });
      }
      
      const member = memberInteractions.get(snippet.member_id);
      member.interaction_types.push('chat');
      member.context.push(`Message: "${snippet.message_preview}"`);
      member.context.push(`Sentiment: ${snippet.sentiment}`);
    });

    return Array.from(memberInteractions.values());
  }

  /**
   * Generate AI-powered summary from structured interaction data
   */
  private async generateAISummary(interactionData: any[]): Promise<Omit<ConnectionSummary, 'event_id' | 'user_id' | 'generated_at'>> {
    console.log('🤖 Generating AI summary from interaction data...');

    const systemPrompt = SYSTEM_CONNECTION_SUMMARY;
    
    const userPrompt = `EVENT_INTERACTION_LOGS:
${JSON.stringify({
  sync_sessions: interactionData.filter(i => i.interaction_types.includes('sync_session')),
  qr_scans: interactionData.filter(i => i.interaction_types.includes('qr_scan')),
  chat_snippets: interactionData.filter(i => i.interaction_types.includes('chat'))
}, null, 2)}

MEMBER_INTERACTIONS_SUMMARY:
${JSON.stringify(interactionData, null, 2)}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for consistent, factual summaries
      max_tokens: 1500
    });

    const aiResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and structure the AI response
    const peopleMet = (aiResult.people_met || []).slice(0, 10).map((person: any) => ({
      member_id: person.member_id || 'unknown',
      summary_note: (person.summary_note || '').slice(0, 140),
      suggested_followup: (person.suggested_followup || '').slice(0, 100)
    }));

    const highlights = (aiResult.highlights || []).slice(0, 5).map((h: string) => h.slice(0, 90));
    const nextSteps = (aiResult.next_steps || []).slice(0, 3).map((s: string) => s.slice(0, 80));

    console.log(`✅ Generated summary with ${peopleMet.length} connections, ${highlights.length} highlights, ${nextSteps.length} next steps`);

    return {
      people_met: peopleMet,
      highlights,
      next_steps: nextSteps
    };
  }

  /**
   * Generate empty summary for cases with no interaction data
   */
  private generateEmptySummary(userId: string, eventId: string): ConnectionSummary {
    return {
      people_met: [],
      highlights: [
        "Event attendance recorded",
        "Ready for future networking opportunities"
      ],
      next_steps: [
        "Follow up on any business cards collected",
        "Connect with attendees on professional networks",
        "Schedule follow-up meetings for next week"
      ],
      event_id: eventId,
      user_id: userId,
      generated_at: new Date().toISOString()
    };
  }
}