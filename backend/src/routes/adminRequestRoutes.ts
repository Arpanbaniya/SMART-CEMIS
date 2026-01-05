// backend/src/routes/adminRequestRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { AdminRequest } from '../models/AdminRequest';
import { User } from '../models/User';
import { Event } from '../models/Event';

const router = Router();

// Middleware to check if user is super_admin
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'super_admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// POST /api/admin/requests - Create a new admin request (any authenticated user)
router.post('/api/admin/requests', requireAuth, async (req, res) => {
  try {
    const { message, eventDescription } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if user already has a pending request
    const existingRequest = await AdminRequest.findOne({
      userId: req.session.userId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request' });
    }

    // Check if user is already a student_admin or super_admin
    const user = await User.findById(req.session.userId);
    if (user && (user.role === 'student_admin' || user.role === 'super_admin')) {
      return res.status(400).json({ error: 'You already have admin privileges' });
    }

    const newRequest = new AdminRequest({
      userId: req.session.userId,
      message: message.trim(),
      eventDescription: eventDescription?.trim() || null,
      status: 'pending',
    });

    await newRequest.save();
    res.status(201).json(newRequest.toJSON());
  } catch (error) {
    console.error('Create admin request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/admin/requests - Get all admin requests (super_admin only)
router.get('/api/admin/requests', requireSuperAdmin, async (req, res) => {
  try {
    const requests = await AdminRequest.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'email firstName lastName');
    
    res.json(requests.map(req => req.toJSON()));
  } catch (error) {
    console.error('Fetch admin requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/admin/requests/my - Get current user's requests
router.get('/api/admin/requests/my', requireAuth, async (req, res) => {
  try {
    const requests = await AdminRequest.find({ userId: req.session.userId })
      .sort({ createdAt: -1 });
    
    res.json(requests.map(req => req.toJSON()));
  } catch (error) {
    console.error('Fetch my requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// PATCH /api/admin/requests/:id/approve - Approve a request (super_admin only)
router.patch('/api/admin/requests/:id/approve', requireSuperAdmin, async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update user role to student_admin
    await User.findByIdAndUpdate(request.userId, {
      role: 'student_admin',
    });

    // Update request status
    request.status = 'approved';
    request.reviewedBy = req.session.userId;
    request.reviewedAt = new Date();
    await request.save();

    res.json(request.toJSON());
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// PATCH /api/admin/requests/:id/reject - Reject a request (super_admin only)
router.patch('/api/admin/requests/:id/reject', requireSuperAdmin, async (req, res) => {
  try {
    const request = await AdminRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = req.session.userId;
    request.reviewedAt = new Date();
    await request.save();

    res.json(request.toJSON());
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// GET /api/admin/student-admins - Get all student admins with their events (super_admin only)
router.get('/api/admin/student-admins', requireSuperAdmin, async (req, res) => {
  try {
    // Get all approved requests
    const approvedRequests = await AdminRequest.find({ status: 'approved' })
      .sort({ reviewedAt: -1 });
    
    const result = await Promise.all(
      approvedRequests.map(async (request: any) => {
        const user = await User.findById(request.userId);
        const userEvents = await Event.find({ createdById: request.userId });
        
        return {
          requestId: request.id,
          userId: request.userId,
          userEmail: user?.email || request.userId,
          userName: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.email || 'Unknown',
          approvedAt: request.reviewedAt,
          requestMessage: request.message,
          eventDescription: request.eventDescription,
          currentRole: user?.role || 'user',
          events: userEvents.map(e => e.toJSON()),
        };
      })
    );
    
    res.json(result);
  } catch (error) {
    console.error('Fetch student admins error:', error);
    res.status(500).json({ error: 'Failed to fetch student admins' });
  }
});

// PATCH /api/admin/student-admins/:userId/revoke - Revoke student admin privileges (super_admin only)
router.patch('/api/admin/student-admins/:userId/revoke', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Revoke student admin role
    await User.findByIdAndUpdate(userId, {
      role: 'user',
    });
    
    res.json({ message: 'Student admin privileges revoked successfully' });
  } catch (error) {
    console.error('Revoke student admin error:', error);
    res.status(500).json({ error: 'Failed to revoke student admin privileges' });
  }
});

// DELETE /api/admin/student-admins/:userId/events/:eventId - Delete event created by student admin (super_admin only)
router.delete('/api/admin/student-admins/:userId/events/:eventId', requireSuperAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await Event.findByIdAndDelete(eventId);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete student admin event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;

