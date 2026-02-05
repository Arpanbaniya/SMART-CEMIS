"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/logsRoutes.ts
const express_1 = require("express");
const User_1 = require("../models/User");
const AdminLog_1 = require("../models/AdminLog");
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
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// GET / - Get admin logs with professional filtering
router.get('/', requireSuperAdmin, async (req, res) => {
    try {
        const { timeframe, entityType, action, search, page = '1', limit = '50' } = req.query;
        const query = {};
        if (timeframe && timeframe !== 'all') {
            const now = new Date();
            let startDate;
            switch (timeframe) {
                case '1h':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }
            query.createdAt = { $gte: startDate };
        }
        if (entityType && entityType !== 'all') {
            query.entityType = entityType;
        }
        if (action && action !== 'all') {
            query.action = action;
        }
        if (search) {
            query.details = { $regex: search.toString(), $options: 'i' };
        }
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
        const skip = (pageNum - 1) * limitNum;
        const [logs, total] = await Promise.all([
            AdminLog_1.AdminLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate('userId', 'firstName lastName email'),
            AdminLog_1.AdminLog.countDocuments(query)
        ]);
        const totalPages = Math.max(Math.ceil(total / limitNum), 1);
        res.json({
            logs: logs.map(log => log.toJSON()),
            total,
            pagination: {
                page: pageNum,
                pages: totalPages,
                limit: limitNum
            }
        });
    }
    catch (error) {
        console.error('Fetch logs error:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
// DELETE / - Delete logs based on criteria
router.delete('/', requireSuperAdmin, async (req, res) => {
    try {
        const { timeframe, entityType, action, specificIds } = req.body;
        const query = {};
        if (specificIds?.length) {
            query._id = { $in: specificIds };
        }
        if (timeframe && timeframe !== 'all') {
            const now = new Date();
            let startDate;
            switch (timeframe) {
                case '1h':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }
            query.createdAt = { $gte: startDate };
        }
        if (entityType && entityType !== 'all') {
            query.entityType = entityType;
        }
        if (action && action !== 'all') {
            query.action = action;
        }
        const result = await AdminLog_1.AdminLog.deleteMany(query);
        res.json({
            message: 'Logs deleted successfully',
            deletedCount: result.deletedCount || 0
        });
    }
    catch (error) {
        console.error('Delete logs error:', error);
        res.status(500).json({ error: 'Failed to delete logs' });
    }
});
exports.default = router;
//# sourceMappingURL=logsRoutes.js.map