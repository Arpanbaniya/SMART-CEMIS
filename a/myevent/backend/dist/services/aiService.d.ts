interface AICompletionRequest {
    model: string;
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    maxTokens?: number;
    temperature?: number;
}
declare class AIService {
    private openai;
    constructor();
    /**
     * Generate AI completion for scheduling suggestions
     */
    generateCompletion(request: AICompletionRequest): Promise<string | null>;
    /**
     * Fallback response when AI service is unavailable
     */
    private getFallbackResponse;
    /**
     * Check if AI service is available
     */
    isAvailable(): boolean;
    /**
     * Get service status
     */
    getStatus(): {
        available: boolean;
        model?: string;
        error?: string;
    };
}
export declare const aiService: AIService;
export default aiService;
