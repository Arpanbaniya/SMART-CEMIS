// client/src/services/chatbotService.ts
import { apiRequest } from '@/lib/queryClient';

export interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  source: 'faq' | 'event_lookup' | 'openai' | 'fallback' | 'validation' | 'error';
  confidence: number;
  error?: string;
}

export const chatbotService = {
  /**
   * Send message to chatbot and get response
   */
  async sendMessage(userMessage: string): Promise<ChatResponse> {
    return apiRequest('POST', '/api/chatbot/message', { message: userMessage });
  },

  /**
   * Detect intent of a message (debug endpoint)
   */
  async detectIntent(userMessage: string): Promise<{
    type: 'faq' | 'event_lookup' | 'general';
    details: string;
  }> {
    return apiRequest('POST', '/api/chatbot/detect-intent', { message: userMessage });
  },

  /**
   * Check chatbot health
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    timestamp: string;
  }> {
    return apiRequest('GET', '/api/chatbot/health');
  }
};
