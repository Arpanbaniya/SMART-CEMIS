import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { aiService } from '../services/aiService';

const router = Router();

// POST /event-analysis - Analyze event for insights
router.post('/event-analysis', requireAuth, async (req, res) => {
  try {
    const { eventDescription, eventType, targetAudience } = req.body;

    if (!eventDescription) {
      return res.status(400).json({ error: 'Event description is required' });
    }

    const analysisPrompt = `Analyze this college event and provide insights:

Event Description: "${eventDescription}"
Event Type: ${eventType || 'Not specified'}
Target Audience: ${targetAudience || 'Not specified'}

Provide analysis in JSON format:
{
  "eventType": "workshop|seminar|social|sports|cultural|academic",
  "optimalDuration": 120,
  "bestTimeSlots": ["10:00 AM", "2:00 PM", "6:00 PM"],
  "potentialConflicts": ["exam_period", "holidays", "regular_classes"],
  "attendancePrediction": {
    "expected": 85,
    "factors": ["interest_level", "timing", "weather"]
  },
  "recommendations": [
    "Consider weekday timing for academic events",
    "Add buffer time between sessions"
  ]
}

Focus on college event planning best practices.`;

    const completion = await aiService.generateCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert college event planner. Provide practical, data-driven insights.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      maxTokens: 400,
      temperature: 0.2
    });

    if (!completion) {
      return res.status(500).json({ error: 'Failed to analyze event' });
    }

    let analysis;
    try {
      const jsonMatch = completion.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = {
          eventType: 'general',
          optimalDuration: 120,
          bestTimeSlots: ['10:00 AM', '2:00 PM'],
          potentialConflicts: [],
          attendancePrediction: { expected: 75, factors: [] },
          recommendations: ['Consider promoting through multiple channels']
        };
      }
    } catch (parseError) {
      console.error('Event analysis parsing error:', parseError);
      analysis = {
        eventType: 'general',
        optimalDuration: 120,
        bestTimeSlots: ['10:00 AM'],
        potentialConflicts: [],
        attendancePrediction: { expected: 70, factors: [] },
        recommendations: ['Review event details for better planning']
      };
    }

    res.json({ analysis });
  } catch (error) {
    console.error('Event analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze event' });
  }
});

export default router;
