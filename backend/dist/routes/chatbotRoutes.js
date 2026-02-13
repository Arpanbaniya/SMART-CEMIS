"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/chatbotRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const chatbotOrchestrator_1 = require("../services/chatbot/chatbotOrchestrator");
const router = (0, express_1.Router)();
/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post('/message', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { message } = req.body;
        // Validate input
        if (!chatbotOrchestrator_1.chatbotOrchestrator.isValidMessage(message)) {
            return res.status(400).json({
                success: false,
                reply: 'Please enter a valid message (1-1000 characters).',
                source: 'validation',
                confidence: 0,
                error: 'Invalid message format'
            });
        }
        // Process message through orchestrator
        const result = await chatbotOrchestrator_1.chatbotOrchestrator.processMessage(message);
        // Return response
        res.json({
            success: true,
            reply: result.response,
            source: result.source,
            confidence: result.confidence
        });
    }
    catch (error) {
        console.error('Chatbot route error:', error);
        res.status(500).json({
            success: false,
            reply: 'An error occurred while processing your message. Please try again.',
            source: 'error',
            confidence: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/chatbot/health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'chatbot',
        timestamp: new Date().toISOString()
    });
});
/**
 * POST /api/chatbot/detect-intent
 * Debug endpoint to detect message intent (optional)
 */
router.post('/detect-intent', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!chatbotOrchestrator_1.chatbotOrchestrator.isValidMessage(message)) {
            return res.status(400).json({
                error: 'Invalid message format'
            });
        }
        const intent = chatbotOrchestrator_1.chatbotOrchestrator.detectIntent(message);
        res.json(intent);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to detect intent'
        });
    }
});
exports.default = router;
//# sourceMappingURL=chatbotRoutes.js.map