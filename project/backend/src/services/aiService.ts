// backend/src/services/aiService.ts
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Ensure dotenv is loaded
dotenv.config();

interface AICompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
}

interface AICompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI service initialized successfully');
    } else {
      console.warn('⚠️ OpenAI API key not found. AI features will use fallback logic.');
    }
  }

  /**
   * Generate AI completion for scheduling suggestions
   */
  async generateCompletion(request: AICompletionRequest): Promise<string | null> {
    try {
      if (!this.openai) {
        console.warn('OpenAI not available, using fallback response');
        return this.getFallbackResponse(request);
      }

      const completion = await this.openai.chat.completions.create({
        model: request.model || 'gpt-3.5-turbo',
        messages: request.messages,
        max_tokens: request.maxTokens || 300,
        temperature: request.temperature || 0.3,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(request);
    }
  }

  /**
   * Fallback response when AI service is unavailable
   */
  private getFallbackResponse(request: AICompletionRequest): string {
    const userMessage = request.messages[request.messages.length - 1]?.content || '';
    
    // Extract basic information for scheduling fallback
    if (userMessage.includes('schedule') || userMessage.includes('time')) {
      return JSON.stringify({
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00 AM',
        confidence: 0.6,
        reasoning: 'Fallback suggestion due to AI service unavailability',
        alternatives: [
          {
            date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '2:00 PM',
            reasoning: 'Alternative afternoon slot'
          }
        ]
      });
    }

    if (userMessage.includes('analyze') || userMessage.includes('analysis')) {
      return JSON.stringify({
        eventType: 'general',
        optimalDuration: 120,
        bestTimeSlots: ['10:00 AM', '2:00 PM'],
        potentialConflicts: [],
        attendancePrediction: { expected: 75, factors: ['interest_level'] },
        recommendations: ['Consider promoting through multiple channels']
      });
    }

    return 'AI service temporarily unavailable. Please try again later.';
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Get service status
   */
  getStatus(): {
    available: boolean;
    model?: string;
    error?: string;
  } {
    return {
      available: this.isAvailable(),
      model: this.openai ? 'gpt-3.5-turbo' : undefined,
      error: this.openai ? undefined : 'OpenAI API key not configured'
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;