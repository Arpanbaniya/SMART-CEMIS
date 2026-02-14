/*
 Routes user messages to appropriate handler (FAQ, Event Lookup, or OpenAI)
 */

import { faqDatabase } from './faqDatabase';
import { eventLookupService } from './eventLookupService';
import { openaiChatService } from './openaiChatService';

export interface ChatMessage {
  userMessage: string;
  response: string;
  source: 'faq' | 'event_lookup' | 'openai' | 'fallback';
  confidence: number;
}

export class ChatbotOrchestrator {
  /**
   * Process user message and return appropriate response
   */
  public async processMessage(userMessage: string): Promise<ChatMessage> {
    try {
      // Step 1: Try FAQ Database (fastest, highest confidence)
      const faqResult = faqDatabase.findResponse(userMessage);
      if (faqResult) {
        console.log(`[Chatbot] FAQ Match - Category: ${faqResult.category}`);
        return {
          userMessage,
          response: faqResult.response,
          source: 'faq',
          confidence: 0.95
        };
      }

      // Step 2: Try Event Lookup (if message has event-related keywords)
      if (eventLookupService.hasEventQuery(userMessage)) {
        console.log('[Chatbot] Event Query Detected - Querying Database');
        const eventResponse = await eventLookupService.getEventResponse(userMessage);
        if (eventResponse) {
          return {
            userMessage,
            response: eventResponse,
            source: 'event_lookup',
            confidence: 0.90
          };
        }
      }

      // Step 3: Fallback to OpenAI for general conversation
      console.log('[Chatbot] No FAQ/Event Match - Using OpenAI');
      const openaiResponse = await openaiChatService.getGeneralChatResponse(userMessage);
      
      // If OpenAI is unavailable, use fallback response
      if (!openaiResponse) {
        console.log('[Chatbot] OpenAI service unavailable - Using fallback response');
        return {
          userMessage,
          response: this.getFallbackResponse(),
          source: 'fallback',
          confidence: 0.50
        };
      }
      
      return {
        userMessage,
        response: openaiResponse,
        source: 'openai',
        confidence: 0.70
      };
    } catch (error) {
      console.error('[Chatbot] Orchestrator error:', error);
      return {
        userMessage,
        response: this.getErrorResponse(),
        source: 'fallback',
        confidence: 0.50
      };
    }
  }

  /**
   * Get fallback response when services are unavailable
   */
  private getFallbackResponse(): string {
    const responses = [
      "I'm having trouble with my AI brain right now 🧠 But I know a lot about events! Ask me about registration, payments, certificates, or browse our events list.",
      "My advanced brain is offline, but I still know the basics! Ask me about: How do I register? How do payments work? What are upcoming events?",
      'Something went wrong connecting to my AI. No worries though! I can still help with FAQ questions. What would you like to know?',
      'I\'m temporarily in "smart mode" only! 🎯 I can still answer common questions about EventHub. Try asking about registration or event details!'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get generic error response
   */
  private getErrorResponse(): string {
    const responses = [
      "I'm having trouble processing that right now. Please try rephrasing your question!",
      "Hmm, that stumped me! 😅 Try asking about registration, payments, or events.",
      'Something went wrong on my end. Could you try again or contact support@eventhub.edu?',
      'I didn\'t quite understand. Could you provide more details about what you\'re looking for?'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Validate message
   */
  public isValidMessage(message: string): boolean {
    if (!message || typeof message !== 'string') {
      return false;
    }

    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > 1000) {
      return false;
    }

    return true;
  }

  /**
   * Get intent information (for debugging/analytics)
   */
  public detectIntent(userMessage: string): {
    type: 'faq' | 'event_lookup' | 'general';
    details: string;
  } {
    const faqResult = faqDatabase.findResponse(userMessage);
    if (faqResult) {
      return { type: 'faq', details: faqResult.category };
    }

    if (eventLookupService.hasEventQuery(userMessage)) {
      return { type: 'event_lookup', details: 'Event information query' };
    }

    return { type: 'general', details: 'General conversation' };
  }
}

// Export singleton instance
export const chatbotOrchestrator = new ChatbotOrchestrator();
