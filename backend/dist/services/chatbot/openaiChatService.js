"use strict";
// backend/src/services/chatbot/openaiChatService.ts
/**
 * OpenAI Chat Service
 * Handles general conversational queries using OpenAI API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiChatService = exports.OpenAIChatService = void 0;
const aiService_1 = require("../aiService");
class OpenAIChatService {
    /**
     * Get response from OpenAI for general chat
     */
    async getGeneralChatResponse(userMessage) {
        const systemPrompt = `You are EventHub Assistant, a friendly and helpful chatbot for a college event management system.
Your personality:
- Friendly and encouraging
- Helpful and professional
- Concise but warm responses (2-3 sentences typical)
- Use emojis occasionally for friendliness
- Always be supportive of student participation in events

Context:
- You help students with event-related questions
- You encourage participation in college events
- You provide emotional support for registration anxiety
- You celebrate achievements (like winning certificates)

Important: Keep responses short and conversational. If it's about specific event details, registration steps, or payments, suggest they check the FAQ or contact support.`;
        try {
            const completion = await aiService_1.aiService.generateCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                maxTokens: 200,
                temperature: 0.7
            });
            if (completion) {
                return completion;
            }
        }
        catch (apiError) {
            console.error('OpenAI API error:', apiError.message);
            // Handle specific OpenAI errors gracefully
            if (apiError.status === 401) {
                console.log('OpenAI API key is invalid. OpenAI service unavailable.');
                return null; // Signal to use fallback
            }
            else if (apiError.status === 429) {
                console.log('OpenAI rate limit exceeded. Try again later.');
                return null;
            }
            else if (apiError.code === 'insufficient_quota') {
                console.log('OpenAI quota exceeded. Service unavailable.');
                return null;
            }
            // For unexpected errors, also return null to use fallback
            console.log('OpenAI service unavailable. Using FAQ-only mode.');
            return null;
        }
        // If completion didn't return or is null, return fallback response
        return this.getFallbackResponse(userMessage);
    }
    /**
     * Fallback response when OpenAI is unavailable
     */
    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        // Encouraging responses
        if (lowerMessage.includes('nervous') ||
            lowerMessage.includes('scared') ||
            lowerMessage.includes('worried')) {
            return "Don't worry! Participating in events is a great experience. Everyone feels nervous at first, but you'll have fun! 😊";
        }
        if (lowerMessage.includes('excited') ||
            lowerMessage.includes('awesome') ||
            lowerMessage.includes('great')) {
            return "That's awesome! We love your enthusiasm! 🎉 Make sure to register and mark your calendar!";
        }
        if (lowerMessage.includes('win') || lowerMessage.includes('champion')) {
            return "Congratulations! You're amazing! 🏆 Your certificate has been generated - download it from your profile!";
        }
        if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
            return 'I\'m here to help! Try asking me about registration, payments, events, or any EventHub features.';
        }
        if (lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
            return 'Happy to help! Enjoy your EventHub experience! 😊';
        }
        // Default friendly response
        return 'That sounds interesting! Is there anything specific I can help you with regarding EventHub or event management?';
    }
}
exports.OpenAIChatService = OpenAIChatService;
// Export singleton instance
exports.openaiChatService = new OpenAIChatService();
//# sourceMappingURL=openaiChatService.js.map