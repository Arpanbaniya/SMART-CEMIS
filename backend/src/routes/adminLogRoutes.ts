import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { AdminLog } from '../models/AdminLog';
import { User } from '../models/User';

const router = Router();

// GET /api/admin/logs - Get admin logs with filtering options
router.get('/api/admin/logs', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    // Only super admins can access logs
    if (user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only super admins can access logs' });
    }

    const {
      page = '1',
      limit = '50',
      timeframe,
      entityType,
      action,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter: any = {};

    // Time-based filtering
    if (timeframe) {
      const now = new Date();
      let startDate: Date;

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
          startDate = new Date(0);
      }
      filter.createdAt = { $gte: startDate };
    }

    // Entity type filtering
    if (entityType) {
      filter.entityType = entityType;
    }

    // Action filtering
    if (action) {
      filter.action = action;
    }

    // Search in details
    if (search) {
      filter.details = { $regex: search, $options: 'i' };
    }

    const logs = await AdminLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await AdminLog.countDocuments(filter);

    res.json({
      logs: logs.map(log => log.toJSON()),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Fetch admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
});

// DELETE /api/admin/logs - Delete logs based on criteria
router.delete('/api/admin/logs', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    // Only super admins can delete logs
    if (user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Only super admins can delete logs' });
    }

    const { timeframe, entityType, action, specificIds } = req.body;

    let filter: any = {};

    if (specificIds && Array.isArray(specificIds) && specificIds.length > 0) {
      // Delete specific log entries
      filter._id = { $in: specificIds };
    } else {
      // Time-based filtering
      if (timeframe) {
        const now = new Date();
        let startDate: Date;

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
            return res.status(400).json({ error: 'Invalid timeframe. Use 1h, 24h, 7d, or 30d' });
        }
        filter.createdAt = { $gte: startDate };
      }

      // Entity type filtering
      if (entityType) {
        filter.entityType = entityType;
      }

      // Action filtering
      if (action) {
        filter.action = action;
      }
    }

    const result = await AdminLog.deleteMany(filter);

    res.json({
      message: `Successfully deleted ${result.deletedCount} log entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete admin logs error:', error);
    res.status(500).json({ error: 'Failed to delete admin logs' });
  }
});

// POST /api/admin/logs - Create a new log entry (internal use)
router.post('/api/admin/logs', async (req, res) => {
  try {
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } = req.body;

    if (!userId || !action || !entityType || !entityId || !details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const log = new AdminLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent
    });

    await log.save();
    res.status(201).json(log.toJSON());
  } catch (error) {
    console.error('Create admin log error:', error);
    res.status(500).json({ error: 'Failed to create admin log' });
  }
});

export default router;
