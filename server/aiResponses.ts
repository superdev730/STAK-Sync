import OpenAI from "openai";
import type { Message, User } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QuickResponse {
  id: string;
  text: string;
  type: 'professional' | 'friendly' | 'question' | 'scheduling';
}

export async function generateQuickResponses(
  messages: Message[],
  currentUser: User,
  otherUser: User
): Promise<QuickResponse[]> {
  try {
    // Get the last few messages for context
    const recentMessages = messages.slice(-5);
    const lastMessage = messages[messages.length - 1];
    
    // Don't generate responses if the last message is from the current user
    if (lastMessage?.senderId === currentUser.id) {
      return [];
    }

    const conversationContext = recentMessages
      .map(msg => `${msg.senderId === currentUser.id ? 'You' : otherUser.firstName}: ${msg.content}`)
      .join('\n');

    const prompt = `You are helping generate quick response suggestions for a professional networking conversation on STAK Signal between venture capitalists, startup founders, and industry leaders.

Current user: ${currentUser.firstName} ${currentUser.lastName} (${currentUser.title || 'Professional'})
Other person: ${otherUser.firstName} ${otherUser.lastName} (${otherUser.title || 'Professional'})

Recent conversation:
${conversationContext}

Generate 3-4 quick response options that would be appropriate for this professional networking context. Responses should be:
- Professional yet personable
- Contextually relevant to the last message
- Brief (under 15 words each)
- Varied in tone (mix of confirmatory, questioning, scheduling, or next-step oriented)

Return as JSON with this format:
{
  "responses": [
    {"id": "1", "text": "Response text here", "type": "professional"},
    {"id": "2", "text": "Response text here", "type": "friendly"},
    {"id": "3", "text": "Response text here", "type": "question"},
    {"id": "4", "text": "Response text here", "type": "scheduling"}
  ]
}

Types should be: professional, friendly, question, or scheduling`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"responses": []}');
    return result.responses || [];
  } catch (error) {
    console.error("Error generating quick responses:", error);
    
    // Return fallback responses if AI fails
    return [
      { id: "1", text: "Thanks for sharing that!", type: "professional" },
      { id: "2", text: "That sounds interesting. Tell me more?", type: "question" },
      { id: "3", text: "I'd love to connect on this.", type: "friendly" },
      { id: "4", text: "Should we schedule a call to discuss?", type: "scheduling" }
    ];
  }
}