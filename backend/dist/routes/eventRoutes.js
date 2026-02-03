"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/eventRoutes.ts - Fixed student admin event creation limits and TypeScript errors
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const Event_1 = require("../models/Event");
const User_1 = require("../models/User");
const eventValidation_1 = require("../validation/eventValidation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Middleware to check if user can modify event (super_admin or student_admin who created it)
const canModifyEvent = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_1.User.findById(req.session.userId);
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
                const event = await Event_1.Event.findById(eventId);
                if (event && event.createdById === req.session.userId) {
                    return next();
                }
                return res.status(403).json({ error: 'You can only modify events you created' });
            }
            // If no eventId, allow creation
            return next();
        }
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// POST / → Create new event (super_admin or student_admin)
router.post('/', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Only super_admin and student_admin can create events
        if (user.role !== 'super_admin' && user.role !== 'student_admin') {
            return res.status(403).json({
                error: 'INSUFFICIENT_PERMISSIONS',
                message: `Event creation failed: Your current role is '${user.role}'. Only super_admin and student_admin users can create events.`,
                details: {
                    currentRole: user.role,
                    requiredRoles: ['super_admin', 'student_admin']
                }
            });
        }
        // For student admins, check if they have unused approved requests (1 event per request rule)
        if (user.role === 'student_admin') {
            const { AdminRequest } = await Promise.resolve().then(() => __importStar(require('../models/AdminRequest')));
            // Find an approved but unused request for this user
            const unusedApprovedRequest = await AdminRequest.findOne({
                userId: req.session.userId,
                status: 'approved',
                usedForEventCreation: false
            }).sort({ reviewedAt: 1 }); // Use the oldest approved request first
            if (!unusedApprovedRequest) {
                // Count existing events for better error message
                const existingEventCount = await Event_1.Event.countDocuments({ createdById: req.session.userId });
                const totalApprovedRequests = await AdminRequest.countDocuments({
                    userId: req.session.userId,
                    status: 'approved'
                });
                return res.status(403).json({
                    error: 'NO_UNUSED_APPROVED_REQUEST',
                    message: `Event creation failed: You have no unused approved admin requests. You have created ${existingEventCount} event(s) with ${totalApprovedRequests} approved request(s). Please submit a new admin request to create additional events.`,
                    details: {
                        currentEvents: existingEventCount,
                        approvedRequests: totalApprovedRequests,
                        remainingPrivileges: 0
                    }
                });
            }
            // Store the request ID to mark it as used after successful event creation
            req.requestToUse = unusedApprovedRequest._id;
        }
        // Validate input first
        const data = eventValidation_1.createEventSchema.parse(req.body);
        const eventDate = new Date(data.date);
        const duplicateEvent = await Event_1.Event.findOne({
            title: data.title,
            description: data.description,
            date: eventDate,
            time: data.time,
            location: data.location
        });
        if (duplicateEvent) {
            return res.status(409).json({
                error: 'DUPLICATE_EVENT',
                message: 'An event with the same title, date, time, description, and location already exists. Please change at least one field.',
                details: {
                    existingEventId: duplicateEvent._id.toString()
                }
            });
        }
        const eventData = {
            ...data,
            date: eventDate, // Convert date string to Date object
            createdById: req.session.userId,
            status: 'upcoming',
            participantCount: 0,
        };
        const newEvent = new Event_1.Event(eventData);
        await newEvent.save();
        // For student admins, mark the approved request as used
        if (user.role === 'student_admin' && req.requestToUse) {
            const { AdminRequest } = await Promise.resolve().then(() => __importStar(require('../models/AdminRequest')));
            await AdminRequest.findByIdAndUpdate(req.requestToUse, {
                usedForEventCreation: true,
                eventId: newEvent._id.toString()
            });
            // Broadcast real-time update to the student admin about their request status change
            try {
                if (typeof global.broadcastUserUpdate !== 'undefined') {
                    global.broadcastUserUpdate(req.session.userId, {
                        type: 'adminRequestUsed',
                        request: {
                            id: req.requestToUse.toString(),
                            usedForEventCreation: true,
                            eventId: newEvent._id.toString()
                        },
                        message: `Your approved admin request has been used to create event "${newEvent.title}"`,
                        userName: `${user.firstName} ${user.lastName || ''}`,
                        eventTitle: newEvent.title
                    });
                }
            }
            catch (error) {
                console.log('Broadcast not available, continuing...');
            }
        }
        // Broadcast real-time update to all connected clients
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(newEvent._id.toString(), {
                    type: 'eventCreated',
                    event: newEvent.toJSON(),
                    message: `New event "${newEvent.title}" created by ${user.firstName} ${user.lastName || ''}`,
                    userName: `${user.firstName} ${user.lastName || ''}`,
                    eventTitle: newEvent.title
                });
            }
        }
        catch (error) {
            console.log('Broadcast not available, continuing...');
        }
        // Broadcast to admin room
        try {
            if (typeof global.broadcastAdminUpdate !== 'undefined') {
                global.broadcastAdminUpdate({
                    type: 'eventCreated',
                    event: newEvent.toJSON(),
                    message: `New event "${newEvent.title}" created by ${user.firstName} ${user.lastName || ''}`,
                    userName: `${user.firstName} ${user.lastName || ''}`,
                    eventTitle: newEvent.title
                });
            }
        }
        catch (error) {
            console.log('Broadcast not available, continuing...');
        }
        // Log the event creation
        await (0, logger_1.logEventCreation)(req.session.userId, newEvent._id.toString(), newEvent.title, (0, logger_1.extractRequestMetadata)(req));
        // Add real-time log entry
        try {
            const logResponse = await fetch('http://localhost:3001/api/admin/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': req.headers.cookie || ''
                },
                body: JSON.stringify({
                    userId: req.session.userId,
                    action: 'event_created',
                    entityType: 'event',
                    entityId: newEvent._id.toString(),
                    details: `Created event: ${newEvent.title}`,
                    ipAddress: req.ip || '::1'
                })
            });
            if (!logResponse.ok) {
                console.error('Failed to log event creation:', await logResponse.text());
            }
        }
        catch (logError) {
            console.error('Error logging event creation:', logError);
        }
        // toJSON() will include the virtual 'id' field
        res.status(201).json(newEvent.toJSON());
    }
    catch (error) {
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
// GET / → Fetch all events
router.get('/', async (req, res) => {
    try {
        const events = await Event_1.Event.find().sort({ date: -1 });
        // Convert all events to JSON with 'id' field
        res.json(events.map(event => event.toJSON()));
    }
    catch (error) {
        console.error('Fetch events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
// GET /:id
router.get('/:id', async (req, res) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Include 'id' field in response
        res.json(event.toJSON());
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
// PATCH /:id - Update event (super_admin or student_admin who created it)
router.patch('/:id', requireAuth_1.requireAuth, canModifyEvent, async (req, res) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const data = eventValidation_1.createEventSchema.partial().parse(req.body);
        // Convert date string to Date object if provided
        const updateData = { ...data };
        if (data.date) {
            updateData.date = new Date(data.date);
        }
        // Track changes for logging
        const changes = [];
        const oldData = { ...event.toObject() };
        Object.assign(event, updateData);
        await event.save();
        // Broadcast real-time update to all connected clients
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(event._id.toString(), {
                    type: 'eventUpdated',
                    event: event.toJSON()
                });
            }
        }
        catch (error) {
            console.log('Broadcast not available, continuing...');
        }
        // Determine what changed
        for (const key in updateData) {
            const oldValue = oldData[key];
            const newValue = updateData[key];
            if (oldValue !== newValue) {
                changes.push(`${key}: ${oldValue} → ${newValue}`);
            }
        }
        // Log the event update
        await (0, logger_1.logEventUpdate)(req.session.userId, event._id.toString(), event.title, changes, (0, logger_1.extractRequestMetadata)(req));
        res.json(event.toJSON());
    }
    catch (error) {
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
// DELETE /:id - Delete event (super_admin or student_admin who created it)
router.delete('/:id', requireAuth_1.requireAuth, canModifyEvent, async (req, res) => {
    try {
        const event = await Event_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        // Store event details for logging before deletion
        const eventTitle = event.title;
        const eventId = event._id.toString();
        await Event_1.Event.findByIdAndDelete(req.params.id);
        // Broadcast real-time update to all connected clients
        try {
            if (typeof global.broadcastEventUpdate !== 'undefined') {
                global.broadcastEventUpdate(eventId, {
                    type: 'eventDeleted',
                    event: { title: eventTitle },
                    eventId: eventId,
                    eventTitle: eventTitle
                });
            }
        }
        catch (error) {
            console.log('Broadcast not available, continuing...');
        }
        // Broadcast to admin room
        try {
            if (typeof global.broadcastAdminUpdate !== 'undefined') {
                global.broadcastAdminUpdate({
                    type: 'eventDeleted',
                    event: { title: eventTitle },
                    eventId: eventId,
                    eventTitle: eventTitle
                });
            }
        }
        catch (error) {
            console.log('Broadcast not available, continuing...');
        }
        // Log the event deletion
        await (0, logger_1.logEventDeletion)(req.session.userId, eventId, eventTitle, (0, logger_1.extractRequestMetadata)(req));
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
exports.default = router;
//# sourceMappingURL=eventRoutes.js.map