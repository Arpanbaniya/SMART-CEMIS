"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/favoriteRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const favoriteController_1 = require("../controllers/favoriteController");
const router = (0, express_1.Router)();
// POST / - Add event to favorites
router.post('/', requireAuth_1.requireAuth, favoriteController_1.addToFavorites);
// DELETE /:eventId - Remove event from favorites
router.delete('/:eventId', requireAuth_1.requireAuth, favoriteController_1.removeFromFavorites);
// GET / - Get user's favorite events
router.get('/', requireAuth_1.requireAuth, favoriteController_1.getFavoriteEvents);
// GET /check/:eventId - Check if event is in user's favorites
router.get('/check/:eventId', requireAuth_1.requireAuth, favoriteController_1.checkFavorite);
exports.default = router;
//# sourceMappingURL=favoriteRoutes.js.map