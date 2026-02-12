// backend/src/routes/descriptionRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { descriptionGeneratorService } from '../services/descriptionGeneratorService';

const router = Router();

// POST /api/descriptions/generate - Generate event description
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { title, description, action } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Event title is required' });
    }

    if (
      !action ||
      typeof action !== 'string' ||
      !['generate', 'improve', 'shorten', 'expand', 'professional', 'engaging'].includes(
        action
      )
    ) {
      return res.status(400).json({
        error: 'Invalid action. Must be: generate, improve, shorten, expand, professional, or engaging',
      });
    }

    // For improve/shorten/expand actions, description is required
    if (
      ['improve', 'shorten', 'expand', 'professional', 'engaging'].includes(
        action
      ) &&
      (!description || typeof description !== 'string')
    ) {
      return res.status(400).json({
        error: `${action} action requires a current description`,
      });
    }

    const result = await descriptionGeneratorService.generateDescription({
      title: title.trim(),
      currentDescription: description?.trim(),
      action: action as any,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Description generation route error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate description',
    });
  }
});

export default router;
