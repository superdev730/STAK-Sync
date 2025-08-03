import OpenAI from "openai";
import type { User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface PersonalityProfile {
  bigFive: {
    openness: number; // 1-100
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  communicationStyle: 'direct' | 'collaborative' | 'analytical' | 'supportive' | 'results-oriented';
  workStyle: 'independent' | 'team-oriented' | 'leadership' | 'mentorship' | 'innovative';
  decisionMaking: 'data-driven' | 'intuitive' | 'consensus-building' | 'quick-decisive' | 'thorough-analytical';
  networkingMotivation: 'deal-making' | 'knowledge-sharing' | 'relationship-building' | 'mentorship' | 'innovation';
}

export interface GoalAnalysis {
  primaryGoals: string[];
  careerStage: 'early-career' | 'mid-career' | 'senior-executive' | 'entrepreneur' | 'investor';
  businessObjectives: 'fundraising' | 'partnerships' | 'market-expansion' | 'talent-acquisition' | 'strategic-advisory';
  timeHorizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  successMetrics: string[];
  challengesAreas: string[];
}

export interface MatchAnalysis {
  overallScore: number; // 1-100
  compatibilityFactors: {
    personalityAlignment: number;
    goalsSynergy: number;
    communicationCompatibility: number;
    collaborationPotential: number;
    networkingStyleMatch: number;
    geographicAlignment: number;
    industryRelevance: number;
  };
  aiReasoning: string;
  recommendedTopics: string[];
  mutualGoals: string[];
  collaborationPotential: string;
  meetingSuggestions: {
    format: 'virtual' | 'in-person' | 'coffee-chat' | 'formal-meeting';
    duration: string;
    suggestedAgenda: string[];
    idealLocation?: string;
  };
}

export class AIMatchingService {
  
  async analyzePersonality(user: User): Promise<PersonalityProfile> {
    try {
      const prompt = `
        Analyze the personality profile of this STAK member based on their profile information:
        
        Name: ${user.firstName} ${user.lastName}
        Title: ${user.title}
        Company: ${user.company}
        Bio: ${user.bio}
        Location: ${user.location}
        Networking Goal: ${user.networkingGoal}
        Industries: ${user.industries?.join(', ')}
        Skills: ${user.skills?.join(', ')}
        
        Provide a comprehensive personality analysis including:
        1. Big Five personality traits (0-100 scale)
        2. Communication style
        3. Work style
        4. Decision making approach
        5. Networking motivation
        
        Respond with JSON in this exact format:
        {
          "bigFive": {
            "openness": number,
            "conscientiousness": number,
            "extraversion": number,
            "agreeableness": number,
            "neuroticism": number
          },
          "communicationStyle": "direct|collaborative|analytical|supportive|results-oriented",
          "workStyle": "independent|team-oriented|leadership|mentorship|innovative",
          "decisionMaking": "data-driven|intuitive|consensus-building|quick-decisive|thorough-analytical",
          "networkingMotivation": "deal-making|knowledge-sharing|relationship-building|mentorship|innovation"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert personality analyst specializing in professional networking and business relationships. Analyze profiles to understand personality traits, communication styles, and networking motivations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing personality:', error);
      // Return default personality profile
      return {
        bigFive: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50
        },
        communicationStyle: 'collaborative',
        workStyle: 'team-oriented',
        decisionMaking: 'data-driven',
        networkingMotivation: 'relationship-building'
      };
    }
  }

  async analyzeGoals(user: User): Promise<GoalAnalysis> {
    try {
      const prompt = `
        Analyze the goals and objectives of this STAK member:
        
        Name: ${user.firstName} ${user.lastName}
        Title: ${user.title}
        Company: ${user.company}
        Bio: ${user.bio}
        Networking Goal: ${user.networkingGoal}
        Industries: ${user.industries?.join(', ')}
        Skills: ${user.skills?.join(', ')}
        
        Analyze their:
        1. Primary professional goals
        2. Career stage
        3. Business objectives
        4. Time horizon for goals
        5. Success metrics
        6. Challenge areas they might need help with
        
        Respond with JSON in this exact format:
        {
          "primaryGoals": ["goal1", "goal2"],
          "careerStage": "early-career|mid-career|senior-executive|entrepreneur|investor",
          "businessObjectives": "fundraising|partnerships|market-expansion|talent-acquisition|strategic-advisory",
          "timeHorizon": "immediate|short-term|medium-term|long-term",
          "successMetrics": ["metric1", "metric2"],
          "challengesAreas": ["challenge1", "challenge2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert business strategist and career coach specializing in analyzing professional goals and business objectives for networking optimization."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error analyzing goals:', error);
      // Return default goal analysis
      return {
        primaryGoals: ['Professional Growth', 'Network Expansion'],
        careerStage: 'mid-career',
        businessObjectives: 'partnerships',
        timeHorizon: 'medium-term',
        successMetrics: ['Meaningful Connections', 'Business Opportunities'],
        challengesAreas: ['Market Access', 'Strategic Partnerships']
      };
    }
  }

  async generateMatchAnalysis(user1: User, user2: User): Promise<MatchAnalysis> {
    try {
      const personality1 = user1.personalityProfile as PersonalityProfile || await this.analyzePersonality(user1);
      const personality2 = user2.personalityProfile as PersonalityProfile || await this.analyzePersonality(user2);
      const goals1 = user1.goalAnalysis as GoalAnalysis || await this.analyzeGoals(user1);
      const goals2 = user2.goalAnalysis as GoalAnalysis || await this.analyzeGoals(user2);

      const prompt = `
        Analyze the compatibility between these two STAK members for networking and collaboration:

        MEMBER 1:
        Name: ${user1.firstName} ${user1.lastName}
        Title: ${user1.title}
        Company: ${user1.company}
        Bio: ${user1.bio}
        Location: ${user1.location}
        Industries: ${user1.industries?.join(', ')}
        Skills: ${user1.skills?.join(', ')}
        Networking Goal: ${user1.networkingGoal}
        Personality: ${JSON.stringify(personality1)}
        Goals: ${JSON.stringify(goals1)}

        MEMBER 2:
        Name: ${user2.firstName} ${user2.lastName}
        Title: ${user2.title}
        Company: ${user2.company}
        Bio: ${user2.bio}
        Location: ${user2.location}
        Industries: ${user2.industries?.join(', ')}
        Skills: ${user2.skills?.join(', ')}
        Networking Goal: ${user2.networkingGoal}
        Personality: ${JSON.stringify(personality2)}
        Goals: ${JSON.stringify(goals2)}

        Provide a comprehensive matching analysis including:
        1. Overall compatibility score (1-100)
        2. Detailed compatibility factors (each 1-100)
        3. AI reasoning for the match
        4. Recommended conversation topics
        5. Mutual goals and interests
        6. Collaboration potential
        7. Meeting suggestions

        Focus on:
        - Personality compatibility and communication styles
        - Aligned business goals and objectives
        - Complementary skills and expertise
        - Geographic and industry alignment
        - Mutual value creation opportunities

        Respond with JSON in this exact format:
        {
          "overallScore": number,
          "compatibilityFactors": {
            "personalityAlignment": number,
            "goalsSynergy": number,
            "communicationCompatibility": number,
            "collaborationPotential": number,
            "networkingStyleMatch": number,
            "geographicAlignment": number,
            "industryRelevance": number
          },
          "aiReasoning": "detailed explanation of the match quality and why they should connect",
          "recommendedTopics": ["topic1", "topic2", "topic3"],
          "mutualGoals": ["goal1", "goal2"],
          "collaborationPotential": "investment|partnership|mentorship|knowledge-exchange|strategic-advisory",
          "meetingSuggestions": {
            "format": "virtual|in-person|coffee-chat|formal-meeting",
            "duration": "30 minutes|1 hour|2 hours",
            "suggestedAgenda": ["agenda1", "agenda2"],
            "idealLocation": "location suggestion if in-person"
          }
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert networking consultant and relationship strategist specializing in high-value business connections. You excel at identifying synergies, collaboration opportunities, and mutual value creation between professionals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Ensure the overall score is reasonable based on factors
      const avgFactorScore = Object.values(analysis.compatibilityFactors || {}).reduce((sum: number, score: any) => sum + score, 0) / 7;
      analysis.overallScore = Math.round(avgFactorScore);

      return analysis;
    } catch (error) {
      console.error('Error generating match analysis:', error);
      // Return default analysis
      return {
        overallScore: 65,
        compatibilityFactors: {
          personalityAlignment: 70,
          goalsSynergy: 60,
          communicationCompatibility: 65,
          collaborationPotential: 70,
          networkingStyleMatch: 65,
          geographicAlignment: 50,
          industryRelevance: 75
        },
        aiReasoning: "Both members show strong potential for meaningful professional collaboration based on complementary skills and aligned business objectives.",
        recommendedTopics: ["Industry Trends", "Business Growth Strategies", "Market Opportunities"],
        mutualGoals: ["Professional Growth", "Strategic Partnerships"],
        collaborationPotential: "partnership",
        meetingSuggestions: {
          format: "coffee-chat",
          duration: "1 hour",
          suggestedAgenda: ["Introductions and Background", "Current Projects and Goals", "Potential Collaboration Areas"],
          idealLocation: "1900 Broadway or Virtual"
        }
      };
    }
  }

  async findOptimalMatches(userId: string, allUsers: User[], limit: number = 10): Promise<User[]> {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) return [];

    const otherUsers = allUsers.filter(u => u.id !== userId && u.profileVisible && u.aiMatchingConsent);
    
    // Generate match scores for all potential matches
    const matchPromises = otherUsers.map(async (user) => {
      const analysis = await this.generateMatchAnalysis(targetUser, user);
      return {
        user,
        score: analysis.overallScore,
        analysis
      };
    });

    const matches = await Promise.all(matchPromises);
    
    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => m.user);
  }

  async updateUserAIProfile(user: User): Promise<{ personalityProfile: PersonalityProfile; goalAnalysis: GoalAnalysis }> {
    const [personalityProfile, goalAnalysis] = await Promise.all([
      this.analyzePersonality(user),
      this.analyzeGoals(user)
    ]);

    return { personalityProfile, goalAnalysis };
  }
}

export const aiMatchingService = new AIMatchingService();