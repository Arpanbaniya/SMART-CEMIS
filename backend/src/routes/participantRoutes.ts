import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { createAdminLog, extractRequestMetadata } from '../utils/logger';
import mongoose from 'mongoose';

const router = Router();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware to check if user is super_admin or student_admin
const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role === 'super_admin' || user.role === 'student_admin') {
      req.user = user.toJSON();
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/admin/participants - Get all participants (Super Admin) or own event participants (Student Admin)
router.get('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, eventId } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query: any = {};
    
    // If super admin, get all participants
    if (user.role === 'super_admin') {
      if (eventId && typeof eventId === 'string') {
        query.eventId = new mongoose.Types.ObjectId(eventId);
      }
    } 
    // If student admin, only get participants for their own events
    else if (user.role === 'student_admin') {
      // First get events created by this student admin
      const userEvents = await Event.find({ createdById: user._id });
      const eventIds = userEvents.map(event => event._id);
      
      query.eventId = { $in: eventIds };
      
      // If specific event filter is applied, make sure it's their event
      if (eventId && typeof eventId === 'string') {
        if (!eventIds.some(id => id.toString() === eventId)) {
          return res.status(403).json({ error: 'Forbidden: You can only view participants for your own events' });
        }
        query.eventId = new mongoose.Types.ObjectId(eventId);
      }
    }

    // Search functionality
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'studentName': searchRegex },
        { 'userId.email': searchRegex },
        { 'rollNo': searchRegex },
        { 'programme': searchRegex },
        { 'eventId.title': searchRegex }
      ];
    }

    const registrations = await Registration.find(query)
      .populate('userId', 'firstName lastName email role')
      .populate('eventId', 'title date location category createdById')
      .sort({ registeredAt: -1 });

    // Log the access
    await createAdminLog({
      userId: req.session.userId,
      action: 'VIEW_PARTICIPANTS' as any,
      details: {
        search,
        eventId,
        resultCount: registrations.length,
        role: user.role
      },
      requestMetadata: extractRequestMetadata(req)
    } as any);

    res.json(registrations.map(reg => reg.toJSON()));
  } catch (error) {
    console.error('Fetch participants error:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// DELETE /api/admin/participants - Remove participants (Super Admin can remove any, Student Admin only from their events)
router.delete('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { participantIds } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Participant IDs are required' });
    }

    // Find registrations to be removed
    const registrationsToRemove = await Registration.find({ _id: { $in: participantIds } })
      .populate('eventId', 'title createdById');

    // Check permissions for each registration
    for (const registration of registrationsToRemove) {
      const event = registration.eventId as any;
      
      if (user.role === 'student_admin') {
        // Student admin can only remove participants from their own events
        if (event.createdById.toString() !== user._id.toString()) {
          return res.status(403).json({ 
            error: 'Forbidden: You can only remove participants from your own events' 
          });
        }
      }
      // Super admin can remove from any event
    }

    // Remove the registrations
    const result = await Registration.deleteMany({ 
      _id: { $in: participantIds } 
    });

    // Update participant counts for affected events
    const affectedEventIds = registrationsToRemove.map(reg => (reg.eventId as any)._id);
    await Event.updateMany(
      { _id: { $in: affectedEventIds } },
      { $inc: { participantCount: -result.deletedCount } }
    );

    // Log the action
    await createAdminLog({
      userId: req.session.userId,
      action: 'REMOVE_PARTICIPANTS' as any,
      details: {
        participantIds,
        removedCount: result.deletedCount,
        affectedEvents: affectedEventIds,
        role: user.role
      },
      requestMetadata: extractRequestMetadata(req)
    } as any);

    res.json({ 
      message: 'Participants removed successfully',
      removedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Remove participants error:', error);
    res.status(500).json({ error: 'Failed to remove participants' });
  }
});

export default router;
