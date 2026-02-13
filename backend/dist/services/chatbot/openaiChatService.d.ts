/**
 * OpenAI Chat Service
 * Handles general conversational queries using OpenAI API
 */
export declare class OpenAIChatService {
    /**
     * Get response from OpenAI for general chat
     */
    getGeneralChatResponse(userMessage: string): Promise<string | null>;
    /**
     * Fallback response when OpenAI is unavailable
     */
    private getFallbackResponse;
}
export declare const openaiChatService: OpenAIChatService;
