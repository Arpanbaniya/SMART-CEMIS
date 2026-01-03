// backend/src/routes/eventRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Event } from '../models/Event';
import { createEventSchema } from '../validation/eventValidation'; // ✅ Now this works

const router = Router();

// POST /api/events → Create new event
router.post('/api/events', requireAuth, async (req, res) => {
  try {
    // ✅ Validate input first
    const data = createEventSchema.parse(req.body);

    const eventData = {
      ...data,
      createdById: req.session.userId,
      status: 'upcoming',
      participantCount: 0,
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    
    // ✅ toJSON() will include the virtual 'id' field
    res.status(201).json(newEvent.toJSON());
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// GET /api/events → Fetch all events
router.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    // ✅ Convert all events to JSON with 'id' field
    res.json(events.map(event => event.toJSON()));
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id
router.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    // ✅ Include 'id' field in response
    res.json(event.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

export default router;