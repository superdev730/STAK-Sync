import { storage } from './storage';
import OpenAI from 'openai';
import { User, ProfileRecommendation, InsertProfileRecommendation, InsertProfileAssistanceRequest } from '@shared/schema';

interface RecommendationRequest {
  fieldType: 'top_quality' | 'top_skill' | 'accomplishment' | 'what_you_like';
  personalizedMessage: string;
}

interface FeedbackQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice';
  options?: string[];
}

export class ProfileRecommendationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // Generate questions to ask about a user
  generateQuestions(targetUser: User): FeedbackQuestion[] {
    const questions: FeedbackQuestion[] = [
      {
        id: 'top_quality',
        question: `What is ${targetUser.firstName}'s top professional quality?`,
        type: 'text'
      },
      {
        id: 'top_skill',
        question: `What is ${targetUser.firstName}'s strongest skill or expertise?`,
        type: 'text'
      },
      {
        id: 'accomplishment',
        question: `What's a notable accomplishment or achievement by ${targetUser.firstName}?`,
        type: 'text'
      },
      {
        id: 'what_you_like',
        question: `What do you like most about working or collaborating with ${targetUser.firstName}?`,
        type: 'text'
      }
    ];

    return questions;
  }

  // Send recommendation requests to LinkedIn connections who are also STAK members
  async requestProfileFeedback(
    userId: string,
    targetUserIds: string[],
    customMessage?: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    for (const requestedUserId of targetUserIds) {
      try {
        await storage.createProfileAssistanceRequest({
          userId,
          requestedUserId,
          fieldType: 'general_feedback',
          requestMessage: customMessage || this.generateDefaultRequestMessage(targetUser),
          specificAsk: 'Help enhance my profile with your perspective on my top qualities, skills, and accomplishments'
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send request to ${requestedUserId}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  private generateDefaultRequestMessage(user: User): string {
    return `Hi! I'm enhancing my STAK Sync profile to better connect with our network. Would you mind sharing a quick thought about my top professional quality, skill, or a accomplishment you've observed? Your input would really help me showcase my strengths better. Thanks!`;
  }

  // Submit feedback for a user
  async submitFeedback(
    recommenderId: string,
    userId: string,
    responses: Record<string, string>
  ): Promise<void> {
    for (const [fieldType, response] of Object.entries(responses)) {
      if (response.trim()) {
        await storage.createProfileRecommendation({
          userId,
          recommenderId,
          fieldType,
          recommendation: response.trim(),
          context: `Feedback provided through STAK Sync profile enhancement`
        });
      }
    }

    // Mark assistance request as completed
    await storage.completeProfileAssistanceRequest(recommenderId, userId);
  }

  // Get aggregated feedback for a user
  async getAggregatedFeedback(userId: string): Promise<{
    topQualities: string[];
    topSkills: string[];
    accomplishments: string[];
    personalFeedback: string[];
    summary: string;
  }> {
    const recommendations = await storage.getProfileRecommendationsForUser(userId);
    
    const topQualities = recommendations
      .filter((r: ProfileRecommendation) => r.fieldType === 'top_quality' && r.isApproved)
      .map((r: ProfileRecommendation) => r.recommendation);
    
    const topSkills = recommendations
      .filter((r: ProfileRecommendation) => r.fieldType === 'top_skill' && r.isApproved)
      .map((r: ProfileRecommendation) => r.recommendation);
    
    const accomplishments = recommendations
      .filter((r: ProfileRecommendation) => r.fieldType === 'accomplishment' && r.isApproved)
      .map((r: ProfileRecommendation) => r.recommendation);
    
    const personalFeedback = recommendations
      .filter((r: ProfileRecommendation) => r.fieldType === 'what_you_like' && r.isApproved)
      .map((r: ProfileRecommendation) => r.recommendation);

    // Generate AI summary of all feedback
    const summary = await this.generateFeedbackSummary({
      topQualities,
      topSkills,
      accomplishments,
      personalFeedback
    });

    return {
      topQualities,
      topSkills,
      accomplishments,
      personalFeedback,
      summary
    };
  }

  private async generateFeedbackSummary(feedback: {
    topQualities: string[];
    topSkills: string[];
    accomplishments: string[];
    personalFeedback: string[];
  }): Promise<string> {
    if (!this.openai) {
      return "Your colleagues recognize you as a skilled professional with notable achievements.";
    }

    try {
      const prompt = `Based on the following feedback from professional colleagues, create a concise, positive summary that could be used in a professional profile:

Top Qualities: ${feedback.topQualities.join('; ')}
Top Skills: ${feedback.topSkills.join('; ')}
Accomplishments: ${feedback.accomplishments.join('; ')}
Personal Feedback: ${feedback.personalFeedback.join('; ')}

Create a 2-3 sentence professional summary that highlights the key themes and strengths mentioned by colleagues. Focus on the most frequently mentioned qualities and make it sound authentic and professional.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional profile writer who creates compelling summaries based on peer feedback."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.choices[0].message.content || "Your colleagues recognize you as a skilled professional with notable achievements.";
    } catch (error) {
      console.error('Error generating feedback summary:', error);
      return "Your colleagues recognize you as a skilled professional with notable achievements.";
    }
  }

  // Detect potential LinkedIn connections who are STAK members
  async findPotentialRecommenders(userId: string): Promise<User[]> {
    // This would integrate with LinkedIn API to find mutual connections
    // For now, return users with similar industries or companies
    const user = await storage.getUser(userId);
    if (!user) return [];

    const allUsers = await storage.getAllUsers();
    const potentialRecommenders = allUsers.filter((u: User) => 
      u.id !== userId && 
      u.profileVisible &&
      (
        u.company === user.company ||
        u.industries?.some((industry: string) => user.industries?.includes(industry))
      )
    );

    return potentialRecommenders.slice(0, 10);
  }

  // Check if users are connected on LinkedIn (placeholder for future integration)
  async checkLinkedInConnection(userId: string, otherUserId: string): Promise<boolean> {
    // This would require LinkedIn API integration
    // For now, return false as placeholder
    return false;
  }
}

export const profileRecommendationService = new ProfileRecommendationService();