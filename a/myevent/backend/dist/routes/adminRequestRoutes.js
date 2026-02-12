"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/adminRequestRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const AdminRequest_1 = require("../models/AdminRequest");
const User_1 = require("../models/User");
const Event_1 = require("../models/Event");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Middleware to check if user is super_admin
const requireSuperAdmin = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_1.User.findById(req.session.userId);
        if (user && user.role === 'super_admin') {
            next();
        }
        else {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// GET /my-requests - Get current user's admin requests
router.get('/my-requests', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const requests = await AdminRequest_1.AdminRequest.find({ userId: req.session.userId })
            .sort({ createdAt: -1 });
        res.json(requests.map(r => r.toJSON()));
    }
    catch (error) {
        console.error('Fetch my requests error:', error);
        res.status(500).json({ error: 'Failed to fetch admin requests' });
    }
});
// POST /requests - Create a new admin request (any authenticated user)
router.post('/requests', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { message, eventDescription } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }
        // Check if user already has a pending request
        const existingRequest = await AdminRequest_1.AdminRequest.findOne({
            userId: req.session.userId,
            status: 'pending',
        });
        if (existingRequest) {
            return res.status(400).json({ error: 'You already have a pending request' });
        }
        // Check if user is super_admin (they don't need additional requests)
        const user = await User_1.User.findById(req.session.userId);
        if (user && user.role === 'super_admin') {
            return res.status(400).json({ error: 'Super admins already have full privileges' });
        }
        // For student admins, allow multiple requests for additional events
        // Only check if they have unused approved requests to prevent spamming
        if (user && user.role === 'student_admin') {
            const unusedApprovedRequestsCount = await AdminRequest_1.AdminRequest.countDocuments({
                userId: req.session.userId,
                status: 'approved',
                usedForEventCreation: false
            });
            // Allow new request only if they have NO unused approved requests
            // This means they've used all their existing permissions or need more
            if (unusedApprovedRequestsCount > 0) {
                return res.status(400).json({
                    error: 'You already have unused event creation permissions. Create an event before requesting additional permissions.'
                });
            }
        }
        const newRequest = new AdminRequest_1.AdminRequest({
            userId: req.session.userId,
            message: message.trim(),
            eventDescription: eventDescription?.trim() || null,
            status: 'pending',
        });
        await newRequest.save();
        // Broadcast real-time update to all connected clients
        if (typeof broadcastEventUpdate !== 'undefined') {
            broadcastEventUpdate('admin-requests', {
                type: 'adminRequest',
                request: newRequest.toJSON(),
                message: `New admin request submitted by ${user?.firstName || 'Unknown'} ${user?.lastName || ''}`,
                userName: `${user?.firstName || 'Unknown'} ${user?.lastName || ''}`
            });
        }
        res.status(201).json(newRequest.toJSON());
    }
    catch (error) {
        console.error('Create admin request error:', error);
        res.status(500).json({ error: 'Failed to create request' });
    }
});
// GET /requests - Get all admin requests (super_admin only)
router.get('/requests', requireSuperAdmin, async (req, res) => {
    try {
        const requests = await AdminRequest_1.AdminRequest.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'email firstName lastName');
        res.json(requests.map(req => req.toJSON()));
    }
    catch (error) {
        console.error('Fetch admin requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// GET /requests/my - Get current user's requests
router.get('/requests/my', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const requests = await AdminRequest_1.AdminRequest.find({ userId: req.session.userId })
            .sort({ createdAt: -1 });
        res.json(requests.map(req => req.toJSON()));
    }
    catch (error) {
        console.error('Fetch my requests error:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// PATCH /requests/:id/approve - Approve a request (super_admin only)
router.patch('/requests/:id/approve', requireSuperAdmin, async (req, res) => {
    try {
        const request = await AdminRequest_1.AdminRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request is not pending' });
        }
        // Get user to check current role
        const user = await User_1.User.findById(request.userId);
        // Update user role to student_admin only if they're not already
        if (user && user.role !== 'student_admin') {
            await User_1.User.findByIdAndUpdate(request.userId, {
                role: 'student_admin',
            });
        }
        // Update request status
        request.status = 'approved';
        request.reviewedBy = req.session.userId;
        request.reviewedAt = new Date();
        await request.save();
        // Broadcast real-time update to all connected clients
        if (typeof broadcastEventUpdate !== 'undefined') {
            broadcastEventUpdate('admin-requests', {
                type: 'adminRequestApproved',
                request: request.toJSON(),
                message: `Admin request approved for ${user?.firstName || 'Unknown'} ${user?.lastName || ''}`,
                userName: `${user?.firstName || 'Unknown'} ${user?.lastName || ''}`
            });
        }
        // Broadcast user role update to trigger frontend refresh
        if (typeof broadcastUserUpdate !== 'undefined') {
            broadcastUserUpdate(request.userId, {
                type: 'roleUpdated',
                role: 'student_admin',
                message: 'Your admin request was approved! You can now create events.'
            });
        }
        // Log approval
        await (0, logger_1.logAdminRequestApproval)(req.session.userId, request._id.toString(), user?.email || 'Unknown', (0, logger_1.extractRequestMetadata)(req));
        res.json(request.toJSON());
    }
    catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({ error: 'Failed to approve request' });
    }
});
// PATCH /requests/:id/reject - Reject a request (super_admin only)
router.patch('/requests/:id/reject', requireSuperAdmin, async (req, res) => {
    try {
        const request = await AdminRequest_1.AdminRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request is not pending' });
        }
        // Get user to check current role
        const user = await User_1.User.findById(request.userId);
        const { reason } = req.body;
        // Update request status
        request.status = 'rejected';
        request.reviewedBy = req.session.userId;
        request.reviewedAt = new Date();
        request.rejectionReason = reason;
        await request.save();
        // Broadcast real-time update specifically to the user who was rejected
        if (typeof broadcastUserUpdate !== 'undefined') {
            broadcastUserUpdate(request.userId.toString(), {
                type: 'adminRequestRejected',
                request: request.toJSON(),
                message: `Your admin request has been rejected`,
                rejectionReason: reason || 'No reason provided',
                userName: `${user?.firstName || 'Unknown'} ${user?.lastName || ''}`
            });
        }
        // Also broadcast to admin dashboard for real-time updates
        if (typeof broadcastEventUpdate !== 'undefined') {
            broadcastEventUpdate('admin-requests', {
                type: 'adminRequestRejected',
                request: request.toJSON(),
                message: `Admin request rejected for ${user?.firstName || 'Unknown'} ${user?.lastName || ''}`,
                userName: `${user?.firstName || 'Unknown'} ${user?.lastName || ''}`
            });
        }
        // Log rejection
        await (0, logger_1.logAdminRequestRejection)(req.session.userId, request._id.toString(), user?.email || 'Unknown', reason || 'No reason provided', (0, logger_1.extractRequestMetadata)(req));
        res.json(request.toJSON());
    }
    catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Failed to reject request' });
    }
});
// GET /student-admins - Get all student admins with their events (super_admin only)
router.get('/student-admins', requireSuperAdmin, async (req, res) => {
    try {
        // Get all approved requests
        const approvedRequests = await AdminRequest_1.AdminRequest.find({ status: 'approved' })
            .sort({ reviewedAt: -1 });
        const result = await Promise.all(approvedRequests.map(async (request) => {
            const user = await User_1.User.findById(request.userId);
            const userEvents = await Event_1.Event.find({ createdById: request.userId });
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
        }));
        res.json(result);
    }
    catch (error) {
        console.error('Fetch student admins error:', error);
        res.status(500).json({ error: 'Failed to fetch student admins' });
    }
});
// PATCH /student-admins/:userId/revoke - Revoke student admin privileges (super_admin only)
router.patch('/student-admins/:userId/revoke', requireSuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        // Revoke student admin role
        await User_1.User.findByIdAndUpdate(userId, {
            role: 'user',
        });
        res.json({ message: 'Student admin privileges revoked successfully' });
    }
    catch (error) {
        console.error('Revoke student admin error:', error);
        res.status(500).json({ error: 'Failed to revoke student admin privileges' });
    }
});
// DELETE /student-admins/:userId/events/:eventId - Delete event created by student admin (super_admin only)
router.delete('/student-admins/:userId/events/:eventId', requireSuperAdmin, async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event_1.Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        await Event_1.Event.findByIdAndDelete(eventId);
        res.json({ message: 'Event deleted successfully' });
    }
    catch (error) {
        console.error('Delete student admin event error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
// GET /student-admin/status - Get current user's student admin status
router.get('/student-admin/status', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isStudentAdmin = user.role === 'student_admin';
        // Check if user has an approved request
        const approvedRequest = await AdminRequest_1.AdminRequest.findOne({
            userId: req.session.userId,
            status: 'approved'
        });
        // Count events created by this student admin
        let eventCount = 0;
        if (isStudentAdmin) {
            eventCount = await Event_1.Event.countDocuments({ createdById: req.session.userId });
        }
        // Count approved requests for this user
        const approvedRequestsCount = await AdminRequest_1.AdminRequest.countDocuments({
            userId: req.session.userId,
            status: 'approved'
        });
        res.json({
            isStudentAdmin,
            hasApprovedRequest: !!approvedRequest,
            eventCount,
            approvedRequestsCount,
            maxEvents: approvedRequestsCount, // Can create 1 event per approved request
            canCreateEvent: isStudentAdmin && eventCount < approvedRequestsCount
        });
    }
    catch (error) {
        console.error('Student admin status error:', error);
        res.status(500).json({ error: 'Failed to fetch student admin status' });
    }
});
exports.default = router;
//# sourceMappingURL=adminRequestRoutes.js.map