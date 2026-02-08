<<<<<<< HEAD
// backend/src/routes/favoriteRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
  addToFavorites,
  removeFromFavorites,
  getFavoriteEvents,
  checkFavorite
} from '../controllers/favoriteController';

const router = Router();

// POST / - Add event to favorites
router.post('/', requireAuth, addToFavorites);

// DELETE /:eventId - Remove event from favorites
router.delete('/:eventId', requireAuth, removeFromFavorites);

// GET / - Get user's favorite events
router.get('/', requireAuth, getFavoriteEvents);

=======
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                      FAVORITE EVENTS API ROUTES                             ║
 * ║                       Used in Frontend & Backend                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ This file handles event favoriting operations:                             ║
 * ║  1. POST /api/favorites - Add event to favorites                           ║
 * ║  2. DELETE /api/favorites/:eventId - Remove event from favorites          ║
 * ║  3. GET /api/favorites - Get user's favorite events                        ║
 * ║  4. GET /api/favorites/check/:eventId - Check if event is favorited       ║
 * ║                                                                            ║
 * ║ FRONTEND USAGE: client/src/pages/event-detail.tsx                         ║
 * ║   - Add to favorites (line 341)                                           ║
 * ║   - Remove from favorites (line 392)                                      ║
 * ║   - Check if favorited (line 165)                                         ║
 * ║   - Get all favorites (line 34 in favorites.tsx)                          ║
 * ║                                                                            ║
 * ║ WEBSOCKET UPDATES: use-websocket.ts (real-time favorite updates)          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
// backend/src/routes/favoriteRoutes.ts
import { Router } from 'express';
import {
    addToFavorites,
    checkFavorite,
    getFavoriteEvents,
    removeFromFavorites
} from '../controllers/favoriteController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

/**
 * POST /api/favorites
 * 
 * FRONTEND USAGE: client/src/pages/event-detail.tsx (line 341)
 * Adds an event to user's favorite list
 * 
 * REQUEST BODY:
 *   - eventId: string (MongoDB ObjectId)
 * 
 * RESPONSE (201 or 200):
 *   - Success message with favorite data
 * 
 * RESPONSE (400):
 *   - error: 'Event already in favorites'
 */
// POST / - Add event to favorites
router.post('/', requireAuth, addToFavorites);

/**
 * DELETE /api/favorites/:eventId
 * 
 * FRONTEND USAGE: client/src/pages/event-detail.tsx (line 392)
 * Removes an event from user's favorite list
 * 
 * PARAMETERS:
 *   - eventId: string (path param)
 * 
 * RESPONSE (200 OK):
 *   - Success message
 * 
 * RESPONSE (404):
 *   - error: 'Event not found in favorites'
 */
// DELETE /:eventId - Remove event from favorites
router.delete('/:eventId', requireAuth, removeFromFavorites);

/**
 * GET /api/favorites
 * 
 * FRONTEND USAGE: client/src/pages/favorites.tsx (line 34)
 * Returns all events in user's favorites list
 * 
 * RESPONSE (200 OK):
 *   - Array of favorite event objects
 */
// GET / - Get user's favorite events
router.get('/', requireAuth, getFavoriteEvents);

/**
 * GET /api/favorites/check/:eventId
 * 
 * FRONTEND USAGE: client/src/pages/event-detail.tsx (line 165)
 * Checks if a specific event is in user's favorites
 * 
 * PARAMETERS:
 *   - eventId: string (path param)
 * 
 * RESPONSE (200 OK):
 *   - { isFavorite: boolean }
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
// GET /check/:eventId - Check if event is in user's favorites
router.get('/check/:eventId', requireAuth, checkFavorite);

export default router;
