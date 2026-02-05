// backend/src/controllers/favoriteController.ts
import { Request, Response } from 'express';
import { Favorite } from '../models/Favorite';
import { Event } from '../models/Event';

// Import broadcast function
declare global {
  var broadcastEventUpdate: (eventId: string, data: any) => void;
}

// POST /api/favorites - Add event to favorites
export const addToFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.session.userId,
      eventId: eventId
    });

    if (existingFavorite) {
      return res.status(400).json({ error: 'Event already in favorites' });
    }

    // Add to favorites
    const favorite = new Favorite({
      userId: req.session.userId,
      eventId: eventId
    });

    await favorite.save();
    
    // Broadcast real-time update to all connected clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      broadcastEventUpdate(eventId, {
        type: 'favoriteAdded',
        userId: req.session.userId,
        eventId: eventId
      });
    }
    
    res.status(201).json(favorite.toJSON());
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Event already in favorites' });
    }
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: 'Failed to add to favorites' });
  }
};

// DELETE /api/favorites/:eventId - Remove event from favorites
export const removeFromFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.session.userId,
      eventId: eventId
    });
    
    if (!favorite) {
      return res.status(404).json({ error: 'Favorite not found' });
    }
    
    // Broadcast real-time update to all connected clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      broadcastEventUpdate(eventId, {
        type: 'favoriteRemoved',
        userId: req.session.userId,
        eventId: eventId
      });
    }
    
    res.json({ message: 'Event removed from favorites' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
};

// GET /api/favorites - Get user's favorite events
export const getFavoriteEvents = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const favorites = await Favorite.find({ userId: req.session.userId })
      .sort({ createdAt: -1 });

    // Get event details for each favorite
    const eventIds = favorites.map(fav => fav.eventId);
    const events = await Event.find({ _id: { $in: eventIds } });

    res.json(events.map(event => event.toJSON()));
  } catch (error) {
    console.error('Get favorite events error:', error);
    res.status(500).json({ error: 'Failed to get favorite events' });
  }
};

// GET /api/favorites/check/:eventId - Check if event is in user's favorites
export const checkFavorite = async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;

    const favorite = await Favorite.findOne({
      userId: req.session.userId,
      eventId: eventId
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
};
