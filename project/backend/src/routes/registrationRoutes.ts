// backend/src/routes/registrationRoutes.ts
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { Registration } from '../models/Registration';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Team } from '../models/Team';

// Import broadcast function
declare global {
  var broadcastEventUpdate: (eventId: string, data: any) => void;
}

const router = Router();

// Helper function to broadcast event updates (injected from server)
let broadcastEventUpdate: (eventId: string, data: any) => void;

// Export function to set broadcast reference
export function setBroadcastFunction(fn: (eventId: string, data: any) => void) {
  broadcastEventUpdate = fn;
}

// Add debugging middleware for registrations
router.use((req, res, next) => {
  console.log('Registration route accessed:', req.method, req.url);
  console.log('Session data:', req.session);
  console.log('User ID:', req.session?.userId);
  next();
});

// GET /:userId/registrations - Get user's registrations
router.get('/:userId/registrations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Users can only see their own registrations
    if (req.session.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Can only view your own registrations' });
    }

    const registrations = await Registration.find({ userId })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    res.json(registrations.map(reg => reg.toJSON()));
  } catch (error) {
    console.error('Fetch registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// POST /:eventId/register - Register for an event
router.post('/:eventId/register', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;
    const { studentName, semester, rollNo, programme, email, gender, teamName } = req.body;

    console.log('Registration attempt:', {
      eventId,
      userId,
      studentName,
      semester,
      rollNo,
      programme,
      email,
      gender,
      teamName
    });

    // Get user to check role
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User role:', user.role);

    // Prevent super_admin from registering for events
    if (user.role === 'super_admin') {
      console.log('Super admin registration blocked');
      return res.status(403).json({ error: 'Super admins are not allowed to register for events' });
    }

    // Validate required fields
    if (!studentName || !semester || !rollNo || !programme || !email || !gender) {
      console.log('Missing required fields:', { studentName, semester, rollNo, programme, email, gender });
      return res.status(400).json({ error: 'All registration fields are required' });
    }

    // For team events, validate team name and team capacity
    const event = await Event.findById(eventId);
    if (event.isTeamEvent && !teamName) {
      console.log('Team event missing team name');
      return res.status(400).json({ error: 'Team name is required for team events' });
    }

    // Additional team validations
    if (event.isTeamEvent && teamName) {
      // Check team member limits
      if (event.maxTeamMembers) {
        const currentTeamMembers = await Registration.countDocuments({
          eventId,
          teamName,
          status: 'registered'
        });
        
        if (currentTeamMembers >= event.maxTeamMembers) {
          console.log('Team is full:', { teamName, currentTeamMembers, maxTeamMembers: event.maxTeamMembers });
          return res.status(400).json({ 
            error: `Team "${teamName}" is full. Maximum ${event.maxTeamMembers} members allowed per team.` 
          });
        }
      }

      // Check if user is trying to join multiple teams
      const userExistingTeam = await Registration.findOne({
        userId,
        eventId,
        teamName: { $ne: null },
        status: 'registered'
      });
      
      if (userExistingTeam && userExistingTeam.teamName !== teamName) {
        console.log('User trying to join multiple teams:', { userId, existingTeam: userExistingTeam.teamName, newTeam: teamName });
        return res.status(400).json({ 
          error: `You are already registered for team "${userExistingTeam.teamName}". You cannot join multiple teams for the same event.` 
        });
      }
    }

    // Validate team name format (if provided)
    if (teamName && teamName.length > 50) {
      console.log('Team name too long:', teamName);
      return res.status(400).json({ error: 'Team name must be 50 characters or less' });
    }

    // Validate full name (alphabets and spaces only)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(studentName.trim())) {
      console.log('Invalid name format:', studentName);
      return res.status(400).json({ error: 'Full name can only contain alphabetic characters (A-Z, a-z) and spaces' });
    }

    // Validate roll number (numbers only)
    const rollNoRegex = /^[0-9]+$/;
    if (!rollNoRegex.test(rollNo.trim())) {
      console.log('Invalid roll number format:', rollNo);
      return res.status(400).json({ error: 'Roll number can only contain numeric characters (0-9)' });
    }

    // Validate semester (must be between 1-8)
    const semesterNum = typeof semester === 'string' ? parseInt(semester) : semester;
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      console.log('Invalid semester value:', semester);
      return res.status(400).json({ error: 'Semester must be between 1 and 8' });
    }

    // Check if event exists
    if (!event) {
      console.log('Event not found:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already registered (for individual events) or already in team (for team events)
    let existingRegistration;
    if (event.isTeamEvent && teamName) {
      // For team events, check if user is already registered in any team for this event
      existingRegistration = await Registration.findOne({
        userId,
        eventId,
      });
    } else {
      // For individual events, check direct registration
      existingRegistration = await Registration.findOne({
        userId,
        eventId,
      });
    }

    console.log('Existing registration check:', {
      userId,
      eventId,
      existingRegistration: existingRegistration ? 'FOUND' : 'NOT_FOUND'
    });

    if (existingRegistration) {
      console.log('User already registered, blocking registration');
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Check capacity
    const currentRegistrations = await Registration.countDocuments({ eventId });
    console.log('Current registrations:', currentRegistrations);
    if (currentRegistrations >= event.capacity) {
      console.log('Event is full, blocking registration');
      return res.status(400).json({ error: 'Event is full' });
    }

    // For paid events, ensure a completed payment exists before allowing registration
    if (event.isPaid && event.price && event.price > 0) {
      try {
        const { Payment } = await import('../models/payment');
        const completedPayment = await Payment.findOne({
          userId,
          eventId: event._id.toString(),
          status: 'completed'
        });

        if (!completedPayment) {
          console.log('No completed payment found for paid event, blocking registration', {
            userId,
            eventId
          });
          return res.status(402).json({
            error: 'PAYMENT_REQUIRED',
            message: 'Payment is required before registering for this event.'
          });
        }
      } catch (paymentError) {
        console.error('Error checking payment status for registration:', paymentError);
        return res.status(500).json({
          error: 'Failed to verify payment status for this event'
        });
      }
    }

    // Create registration with detailed student information
    console.log('Creating registration with data:', {
      userId,
      eventId,
      studentName,
      semester,
      rollNo,
      programme,
      email,
      gender,
      teamName,
      registeredAt: new Date(),
      status: 'registered',
    });

    const registrationData: any = {
      userId,
      eventId,
      studentName,
      semester,
      rollNo,
      programme,
      email,
      gender,
      registeredAt: new Date(),
      status: 'registered',
    };

    // Add team information for team events
    if (event.isTeamEvent && teamName) {
      registrationData.teamName = teamName;
      
      // Create or update Team document
      try {
        const existingTeam = await Team.findOne({ eventId, name: teamName });
        if (!existingTeam) {
          const newTeam = new Team({
            eventId,
            name: teamName,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await newTeam.save();
          console.log('Team created successfully:', teamName);
        }
      } catch (teamError) {
        console.error('Error creating team:', teamError);
        // Continue with registration even if team creation fails
      }
    }

    const registration = new Registration(registrationData);

    console.log('Registration object created, attempting to save...');
    try {
      await registration.save();
      console.log('Registration saved successfully:', registration._id);
    } catch (error) {
      console.error('Error saving registration:', error);
      return res.status(500).json({ error: 'Failed to save registration' });
    }

    // Update event participant count
    try {
      const updatedEvent = await Event.findByIdAndUpdate(eventId, {
        $inc: { participantCount: 1 }
      }, { new: true });
      console.log('✅ Event participant count updated. New count:', updatedEvent?.participantCount);
    } catch (error) {
      console.error('Error updating event participant count:', error);
      return res.status(500).json({ error: 'Failed to update event participant count' });
    }

    // Broadcast event update to all subscribed clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      try {
        broadcastEventUpdate(eventId, {
          type: 'registration',
          participantCount: currentRegistrations + 1,
          eventTitle: event.title,
          message: `${studentName} registered for the event`
        });
        console.log('Event update broadcasted successfully');
      } catch (broadcastError) {
        console.error('Error broadcasting event update:', broadcastError);
        // Don't fail the registration if broadcast fails
      }
    } else {
      console.log('broadcastEventUpdate function is not available');
    }

    res.status(201).json(registration.toJSON());
  } catch (error: any) {
    console.error('Register for event error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      keyValue: error.keyValue,
      errors: error.errors
    });
    res.status(500).json({ error: 'Failed to register for event', details: error.message });
  }
});

// DELETE /:eventId/unregister - Unregister from an event
router.delete('/:eventId/unregister', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;

    const registration = await Registration.findOne({
      userId,
      eventId,
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Get event details for broadcasting
    const event = await Event.findById(eventId);
    const currentRegistrations = await Registration.countDocuments({ eventId });

    await Registration.findByIdAndDelete(registration._id);

    // Update event participant count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { participantCount: -1 }
    });

    // Broadcast event update to all subscribed clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      broadcastEventUpdate(eventId, {
        type: 'unregistration',
        participantCount: Math.max(0, currentRegistrations - 1),
        eventTitle: event?.title,
        message: `${registration.studentName} unregistered from the event`
      });
    }

    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

// DELETE /admin/events/:eventId/participants/:userId - Force unregister participant (super admin)
router.delete('/admin/events/:eventId/participants/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const adminUserId = req.session.userId!;

    // Check if requester is super admin
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only super admins can force unregister participants' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if registration exists
    const registration = await Registration.findOne({
      userId,
      eventId,
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Get participant details for broadcasting
    const participant = await User.findById(userId);
    const currentRegistrations = await Registration.countDocuments({ eventId });

    await Registration.findByIdAndDelete(registration._id);

    // Update event participant count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { participantCount: -1 }
    });

    // Broadcast event update to all subscribed clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      broadcastEventUpdate(eventId, {
        type: 'forceUnregistration',
        participantCount: Math.max(0, currentRegistrations - 1),
        eventTitle: event?.title,
        message: `Super admin removed ${participant?.firstName || 'Participant'} from the event`,
        removedBy: 'super_admin'
      });
    }

    res.json({ message: 'Participant forcefully unregistered successfully' });
  } catch (error) {
    console.error('Force unregister participant error:', error);
    res.status(500).json({ error: 'Failed to unregister participant' });
  }
});

// DELETE /student-admin/events/:eventId/participants/:userId - Force unregister participant (student admin for own events)
router.delete('/student-admin/events/:eventId/participants/:userId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;
    const adminUserId = req.session.userId!;

    // Check if requester is student admin and created the event
    const adminUser = await User.findById(adminUserId);
    if (!adminUser || adminUser.role !== 'student_admin') {
      return res.status(403).json({ error: 'Forbidden: Only student admins can remove participants from their own events' });
    }

    // Check if event exists and was created by this student admin
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.createdById !== adminUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only remove participants from your own events' });
    }

    // Check if registration exists
    const registration = await Registration.findOne({
      userId,
      eventId,
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Get participant details for broadcasting
    const participant = await User.findById(userId);
    const currentRegistrations = await Registration.countDocuments({ eventId });

    await Registration.findByIdAndDelete(registration._id);

    // Update event participant count
    await Event.findByIdAndUpdate(eventId, {
      $inc: { participantCount: -1 }
    });

    // Broadcast event update to all subscribed clients
    if (typeof broadcastEventUpdate !== 'undefined') {
      broadcastEventUpdate(eventId, {
        type: 'forceUnregistration',
        participantCount: Math.max(0, currentRegistrations - 1),
        eventTitle: event?.title,
        message: `Event admin removed ${participant?.firstName || 'Participant'} from the event`,
        removedBy: 'student_admin'
      });
    }

    res.json({ message: 'Participant forcefully unregistered successfully' });
  } catch (error) {
    console.error('Force unregister participant error:', error);
    res.status(500).json({ error: 'Failed to unregister participant' });
  }
});

// GET /:eventId/check-registration - Check if user is registered for an event
router.get('/:eventId/check-registration', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;

    const registration = await Registration.findOne({
      userId,
      eventId,
    });

    res.json({ isRegistered: !!registration });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({ error: 'Failed to check registration status' });
  }
});

// GET /:eventId/registrations - Get event registrations (super admins and event creators)
router.get('/:eventId/registrations', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.userId!;

    console.log('🔍 DEBUG - Registration access attempt:', {
      eventId,
      userId,
      hasSession: !!req.session,
      sessionUserId: req.session.userId
    });

    // Check if user created the event or is super admin
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const user = await User.findById(userId);
    const isSuperAdmin = user?.role === 'super_admin';
    const isEventCreator = event.createdById === userId;
    
    console.log('🔍 DEBUG - User permissions:', {
      userRole: user?.role,
      isSuperAdmin,
      isEventCreator,
      eventCreatorId: event.createdById
    });
    
    // Super admins and event creators can view registrations
    if (!isSuperAdmin && !isEventCreator) {
      console.log('🚫 DEBUG - Access denied');
      return res.status(403).json({ error: 'Forbidden: Only event creators and super admins can view registrations' });
    }

    console.log('✅ DEBUG - Access granted, fetching registrations');
    const registrations = await Registration.find({ eventId })
      .populate('userId', 'email firstName lastName')
      .sort({ registeredAt: -1 });

    res.json(registrations.map(reg => reg.toJSON()));
  } catch (error) {
    console.error('Fetch event registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch event registrations' });
  }
});

// GET /:eventId/registrations-public - Get event registrations (public view with limited data)
router.get('/:eventId/registrations-public', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Return public registration data with limited fields
    const registrations = await Registration.find({ eventId, status: 'registered' })
      .select('studentName email rollNo programme semester gender registeredAt')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Fetch public event registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch event registrations' });
  }
});

// GET /:eventId/participants - Get event participants (public for tournament display)
router.get('/:eventId/participants', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get only registered participants for tournament
    const registrations = await Registration.find({ eventId, status: 'registered' })
      .populate('userId', 'email firstName lastName')
      .sort({ registeredAt: -1 });

    if (event.isTeamEvent) {
      // For team events, group by team name for tournament bracket
      const teamGroups = registrations.reduce((acc: any, reg) => {
        const teamName = reg.teamName || 'Individual';
        if (!acc[teamName]) {
          acc[teamName] = {
            name: teamName,
            type: 'team',
            members: [],
            participantId: teamName
          };
        }
        acc[teamName].members.push({
          id: reg._id,
          name: reg.studentName,
          email: reg.email,
          rollNo: reg.rollNo,
          programme: reg.programme,
          semester: reg.semester,
          gender: reg.gender
        });
        return acc;
      }, {});

      const participants = Object.values(teamGroups);
      res.json(participants);
    } else {
      // For individual events, return structured format for tournament bracket
      const participants = registrations.map(reg => ({
        id: reg._id,
        name: reg.studentName,
        email: reg.email,
        rollNo: reg.rollNo,
        programme: reg.programme,
        semester: reg.semester,
        gender: reg.gender,
        type: 'individual',
        participantId: reg.userId
      }));
      res.json(participants);
    }
  } catch (error) {
    console.error('Fetch event participants error:', error);
    res.status(500).json({ error: 'Failed to fetch event participants' });
  }
});

export default router;