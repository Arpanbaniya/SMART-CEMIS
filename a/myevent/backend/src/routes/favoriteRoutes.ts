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

// GET /check/:eventId - Check if event is in user's favorites
router.get('/check/:eventId', requireAuth, checkFavorite);

export default router;
