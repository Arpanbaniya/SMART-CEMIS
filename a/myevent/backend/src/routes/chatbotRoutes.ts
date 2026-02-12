// backend/src/routes/chatbotRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { chatbotOrchestrator } from '../services/chatbot/chatbotOrchestrator';

const router = Router();

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
  source: string;
  confidence: number;
  error?: string;
}

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body as ChatRequest;

    // Validate input
    if (!chatbotOrchestrator.isValidMessage(message)) {
      return res.status(400).json({
        success: false,
        reply: 'Please enter a valid message (1-1000 characters).',
        source: 'validation',
        confidence: 0,
        error: 'Invalid message format'
      } as ChatResponse);
    }

    // Process message through orchestrator
    const result = await chatbotOrchestrator.processMessage(message);

    // Return response
    res.json({
      success: true,
      reply: result.response,
      source: result.source,
      confidence: result.confidence
    } as ChatResponse);
  } catch (error) {
    console.error('Chatbot route error:', error);
    res.status(500).json({
      success: false,
      reply: 'An error occurred while processing your message. Please try again.',
      source: 'error',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ChatResponse);
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
router.post('/detect-intent', requireAuth, async (req, res) => {
  try {
    const { message } = req.body as ChatRequest;

    if (!chatbotOrchestrator.isValidMessage(message)) {
      return res.status(400).json({
        error: 'Invalid message format'
      });
    }

    const intent = chatbotOrchestrator.detectIntent(message);
    res.json(intent);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to detect intent'
    });
  }
});

export default router;
