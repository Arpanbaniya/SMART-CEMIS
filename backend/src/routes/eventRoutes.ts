// backend/src/routes/eventRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Event } from '../models/Event';
<<<<<<< HEAD
import { createEventSchema } from '../validation/eventValidation'; // ✅ Now this works

const router = Router();

// POST /api/events → Create new event
router.post('/api/events', requireAuth, async (req, res) => {
  try {
=======
import { User } from '../models/User';
import { createEventSchema } from '../validation/eventValidation';

const router = Router();

// Middleware to check if user can modify event (super_admin or student_admin who created it)
const canModifyEvent = async (req: any, res: any, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Super admin can modify any event
    if (user.role === 'super_admin') {
      return next();
    }

    // Student admin can only modify their own events
    if (user.role === 'student_admin') {
      const eventId = req.params.id;
      if (eventId) {
        const event = await Event.findById(eventId);
        if (event && event.createdById === req.session.userId) {
          return next();
        }
        return res.status(403).json({ error: 'You can only modify events you created' });
      }
      // If no eventId, allow creation
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// POST /api/events → Create new event (super_admin or student_admin)
router.post('/api/events', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only super_admin and student_admin can create events
    if (user.role !== 'super_admin' && user.role !== 'student_admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required to create events' });
    }

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
    // ✅ Validate input first
    const data = createEventSchema.parse(req.body);

    const eventData = {
      ...data,
<<<<<<< HEAD
=======
      date: new Date(data.date), // Convert date string to Date object
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
      createdById: req.session.userId,
      status: 'upcoming',
      participantCount: 0,
    };

    const newEvent = new Event(eventData);
    await newEvent.save();
    
<<<<<<< HEAD
=======
    // If user is student_admin, revoke their admin privileges after creating one event
    if (user.role === 'student_admin') {
      await User.findByIdAndUpdate(req.session.userId, {
        role: 'user',
      });
    }
    
>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
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

<<<<<<< HEAD
=======
// PATCH /api/events/:id - Update event (super_admin or student_admin who created it)
router.patch('/api/events/:id', requireAuth, canModifyEvent, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const data = createEventSchema.partial().parse(req.body);
    
    // Convert date string to Date object if provided
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    Object.assign(event, updateData);
    await event.save();

    res.json(event.toJSON());
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event (super_admin or student_admin who created it)
router.delete('/api/events/:id', requireAuth, canModifyEvent, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

>>>>>>> 21fa3bf (added admin access,student admin privilege and CRUD operations)
export default router;