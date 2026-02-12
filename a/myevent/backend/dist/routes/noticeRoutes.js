"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/noticeRoutes.ts
const express_1 = require("express");
const requireAuth_1 = require("../middleware/requireAuth");
const Notice_1 = require("../models/Notice");
const User_1 = require("../models/User");
const emailNotificationService_1 = require("../services/emailNotificationService");
const router = (0, express_1.Router)();
// Middleware to check if user is superadmin
async function requireSuperAdmin(req, res, next) {
    try {
        const user = await User_1.User.findById(req.session.userId);
        if (!user || user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Only superadmins can perform this action' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}
// GET /api/notices - Get all notices (everyone can view)
router.get('/', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const notices = await Notice_1.Notice.find()
            .populate('createdBy', 'firstName lastName email')
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(5);
        res.json(notices);
    }
    catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ error: 'Failed to fetch notices' });
    }
});
// POST /api/notices - Create notice (superadmin only)
router.post('/', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        // Validation
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        if (title.length > 200) {
            return res.status(400).json({ error: 'Title must be 200 characters or less' });
        }
        if (content.length > 2000) {
            return res.status(400).json({ error: 'Content must be 2000 characters or less' });
        }
        // Check if at limit (5 notices) - if so, they need to delete first
        const existingCount = await Notice_1.Notice.countDocuments();
        if (existingCount >= 5) {
            return res.status(400).json({
                error: 'Maximum 5 notices allowed. Please delete an existing notice to create a new one.',
                current: existingCount,
                max: 5
            });
        }
        const notice = new Notice_1.Notice({
            title,
            content,
            createdBy: req.session.userId,
            isPinned: false,
            emailNotificationSent: false
        });
        await notice.save();
        await notice.populate('createdBy', 'firstName lastName email');
        res.status(201).json({
            success: true,
            notice,
            message: 'Notice created successfully'
        });
    }
    catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ error: 'Failed to create notice' });
    }
});
// PATCH /api/notices/:id - Update notice (superadmin only)
router.patch('/:id', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, isPinned } = req.body;
        const notice = await Notice_1.Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        // Update allowed fields
        if (title !== undefined) {
            if (title.length > 200) {
                return res.status(400).json({ error: 'Title must be 200 characters or less' });
            }
            notice.title = title;
        }
        if (content !== undefined) {
            if (content.length > 2000) {
                return res.status(400).json({ error: 'Content must be 2000 characters or less' });
            }
            notice.content = content;
        }
        if (isPinned !== undefined) {
            notice.isPinned = isPinned;
        }
        await notice.save();
        await notice.populate('createdBy', 'firstName lastName email');
        res.json({
            success: true,
            notice,
            message: 'Notice updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ error: 'Failed to update notice' });
    }
});
// DELETE /api/notices/:id - Delete notice (superadmin only)
router.delete('/:id', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const notice = await Notice_1.Notice.findByIdAndDelete(id);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json({
            success: true,
            message: 'Notice deleted successfully',
            deletedId: id
        });
    }
    catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ error: 'Failed to delete notice' });
    }
});
// POST /api/notices/:id/send-email - Send notice to all users (superadmin only)
router.post('/:id/send-email', requireAuth_1.requireAuth, requireSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const notice = await Notice_1.Notice.findById(id);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        // Get all users
        const users = await User_1.User.find({ email: { $exists: true, $ne: null } }, 'email firstName');
        if (users.length === 0) {
            return res.status(400).json({ error: 'No users found to notify' });
        }
        try {
            // Send notice email to all users
            const result = await (0, emailNotificationService_1.sendNoticeEmailToAllUsers)(notice.title, notice.content, users);
            // Update notice to mark as sent
            notice.emailNotificationSent = true;
            notice.emailSentAt = new Date();
            await notice.save();
            res.json({
                success: true,
                message: `Successfully notified ${result.sentCount} users`,
                sentCount: result.sentCount,
                failedCount: result.failedCount
            });
        }
        catch (error) {
            console.error('Error sending notice emails:', error);
            res.status(500).json({
                error: 'Failed to send notification emails',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Error in send-email route:', error);
        res.status(500).json({ error: 'Failed to process send-email request' });
    }
});
exports.default = router;
//# sourceMappingURL=noticeRoutes.js.map