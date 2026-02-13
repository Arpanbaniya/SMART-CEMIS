/**
 * Chatbot Orchestrator Service
 * Routes user messages to appropriate handler (FAQ, Event Lookup, or OpenAI)
 */
export interface ChatMessage {
    userMessage: string;
    response: string;
    source: 'faq' | 'event_lookup' | 'openai' | 'fallback';
    confidence: number;
}
export declare class ChatbotOrchestrator {
    /**
     * Process user message and return appropriate response
     */
    processMessage(userMessage: string): Promise<ChatMessage>;
    /**
     * Get fallback response when services are unavailable
     */
    private getFallbackResponse;
    /**
     * Get generic error response
     */
    private getErrorResponse;
    /**
     * Validate message
     */
    isValidMessage(message: string): boolean;
    /**
     * Get intent information (for debugging/analytics)
     */
    detectIntent(userMessage: string): {
        type: 'faq' | 'event_lookup' | 'general';
        details: string;
    };
}
export declare const chatbotOrchestrator: ChatbotOrchestrator;
