import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Feedback } from '../models/Feedback';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { User } from '../models/User';
import { analyzeSentiment } from '../services/sentimentService';
import { broadcastEventUpdate } from '../server';

const router = Router();

const requireSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'super_admin') {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /feedback/:eventId - Get all feedback for an event
router.get('/feedback/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const feedback = await Feedback.find({ eventId })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(feedback.map(f => f.toJSON()));
  } catch (error) {
    console.error('Fetch event feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch event feedback' });
  }
});

// GET /:eventId/sentiment - Get sentiment analysis for a specific event
router.get('/:eventId/sentiment', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all feedback for this event
    const feedback = await Feedback.find({ eventId });
    
    // Calculate sentiment analysis
    const total = feedback.length;
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let totalRating = 0;
    let ratingCount = 0;
    let flaggedCount = 0;

    feedback.forEach(item => {
      // Count sentiment
      if (item.sentiment === 'positive') positive++;
      else if (item.sentiment === 'neutral') neutral++;
      else if (item.sentiment === 'negative') negative++;
      else {
        // If no sentiment analysis, infer from rating
        if (item.rating && item.rating >= 4) positive++;
        else if (item.rating && item.rating >= 3) neutral++;
        else if (item.rating && item.rating < 3) negative++;
      }

      // Calculate average rating
      if (item.rating) {
        totalRating += item.rating;
        ratingCount++;
      }

      // Count flagged content (you might have a flagged field in your schema)
      if ((item as any).isFlagged) flaggedCount++;
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    const sentimentData = {
      positive,
      neutral,
      negative,
      total,
      averageRating: parseFloat(averageRating.toFixed(2)),
      flaggedCount
    };

    res.json(sentimentData);
  } catch (error) {
    console.error('Fetch event sentiment error:', error);
    res.status(500).json({ error: 'Failed to fetch event sentiment' });
  }
});

// POST /feedback/:eventId - Submit feedback for an event
router.post('/feedback/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;
    const { rating, comment } = req.body;

    const hasRating = typeof rating === 'number' && !Number.isNaN(rating);
    const hasComment = typeof comment === 'string' && comment.trim().length > 0;

    if (!hasRating && !hasComment) {
      return res.status(400).json({ error: 'Please provide a rating or a review comment.' });
    }

    if (hasRating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (hasComment && comment.trim().length > 1000) {
      return res.status(400).json({ error: 'Comment must be less than 1000 characters.' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is registered for this event
    const registration = await Registration.findOne({ userId, eventId });
    if (!registration) {
      return res.status(403).json({ error: 'You must be registered for this event to leave feedback.' });
    }

    // Check if user already left feedback
    const existingFeedback = await Feedback.findOne({ userId, eventId });
    if (existingFeedback) {
      return res.status(400).json({ error: 'You have already left feedback for this event.' });
    }

    const feedback = new Feedback({
      userId,
      eventId,
      rating: hasRating ? rating : undefined,
      comment: hasComment ? comment.trim() : undefined,
      createdAt: new Date(),
    });

    await feedback.save();

    // Broadcast feedback update
    try {
      broadcastEventUpdate(eventId, {
        type: 'feedback',
        feedbackCount: 1,
        eventTitle: event.title,
        message: `New feedback received`
      });
    } catch (error) {
      console.error('Error broadcasting feedback update:', error);
    }

    res.status(201).json(feedback.toJSON());
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// PUT /feedback/:feedbackId - Update feedback (owner or super_admin)
router.put('/feedback/:feedbackId', requireAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.session.userId!;
    const { rating, comment } = req.body;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check if user owns the feedback or is super admin
    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isOwner = feedback.userId?.toString() === userId;

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'You can only update your own feedback' });
    }

    // Update feedback fields
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      feedback.rating = rating;
    }

    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return res.status(400).json({ error: 'Comment cannot be empty' });
      }
      if (comment.trim().length > 1000) {
        return res.status(400).json({ error: 'Comment must be less than 1000 characters' });
      }
      feedback.comment = comment.trim();
    }

    // Mark as edited
    feedback.isEdited = true;
    feedback.editedAt = new Date();

    await feedback.save();

    // Get event for broadcasting
    const event = await Event.findById(feedback.eventId);
    
    // Broadcast feedback update for real-time sentiment analysis
    try {
      broadcastEventUpdate(feedback.eventId.toString(), {
        type: 'feedback_updated',
        feedbackId: feedback._id.toString(),
        eventTitle: event?.title,
        message: `Feedback updated - sentiment analysis will refresh`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting feedback update:', error);
    }

    res.json(feedback.toJSON());
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// DELETE /feedback/:feedbackId - Delete feedback (owner or super_admin)
router.delete('/feedback/:feedbackId', requireAuth, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.session.userId!;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check if user owns the feedback or is super admin
    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isOwner = feedback.userId?.toString() === userId;

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'You can only delete your own feedback' });
    }

    // Get event for broadcasting before deletion
    const event = await Event.findById(feedback.eventId);

    await Feedback.findByIdAndDelete(feedbackId);

    // Broadcast feedback deletion for real-time sentiment analysis
    try {
      broadcastEventUpdate(feedback.eventId.toString(), {
        type: 'feedback_deleted',
        feedbackId: feedback._id.toString(),
        eventTitle: event?.title,
        message: `Feedback deleted - sentiment analysis will refresh`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting feedback deletion:', error);
    }

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

export default router;
