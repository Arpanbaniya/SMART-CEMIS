"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/descriptionRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const descriptionGeneratorService_1 = require("../services/descriptionGeneratorService");
const router = (0, express_1.Router)();
// POST /api/descriptions/generate - Generate event description
router.post('/generate', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { title, description, action } = req.body;
        // Validation
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ error: 'Event title is required' });
        }
        if (!action ||
            typeof action !== 'string' ||
            !['generate', 'improve', 'shorten', 'expand', 'professional', 'engaging'].includes(action)) {
            return res.status(400).json({
                error: 'Invalid action. Must be: generate, improve, shorten, expand, professional, or engaging',
            });
        }
        // For improve/shorten/expand actions, description is required
        if (['improve', 'shorten', 'expand', 'professional', 'engaging'].includes(action) &&
            (!description || typeof description !== 'string')) {
            return res.status(400).json({
                error: `${action} action requires a current description`,
            });
        }
        const result = await descriptionGeneratorService_1.descriptionGeneratorService.generateDescription({
            title: title.trim(),
            currentDescription: description?.trim(),
            action: action,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Description generation route error:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate description',
        });
    }
});
exports.default = router;
//# sourceMappingURL=descriptionRoutes.js.map