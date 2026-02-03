import { Router } from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/requireAuth';
import { getSentimentAnalysis, getSentimentTrend } from '../services/sentimentService';
import { Event } from '../models/Event';
import { Payment } from '../models/payment';
import { User } from '../models/User';
import { Registration } from '../models/Registration';

const router = Router();

// GET /api/analytics/overview - Get overview stats
router.get('/overview', requireSuperAdmin, async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Events stats
    const totalEvents = await Event.countDocuments();
    const lastMonthEvents = await Event.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    const previousMonthEvents = await Event.countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth }
    });
    const eventsChange = previousMonthEvents > 0 
      ? ((lastMonthEvents - previousMonthEvents) / previousMonthEvents * 100).toFixed(1)
      : '0';

    // Participants stats
    const totalParticipants = await Registration.countDocuments();
    const lastMonthParticipants = await Registration.countDocuments({
      createdAt: { $gte: lastMonth }
    });
    const previousMonthParticipants = await Registration.countDocuments({
      createdAt: { $gte: twoMonthsAgo, $lt: lastMonth }
    });
    const participantsChange = previousMonthParticipants > 0
      ? ((lastMonthParticipants - previousMonthParticipants) / previousMonthParticipants * 100).toFixed(1)
      : '0';

    // Revenue stats (completed payments in NPR)
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const lastMonthRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: lastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    const previousMonthRevenueResult = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: twoMonthsAgo, $lt: lastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const previousMonthRevenue = previousMonthRevenueResult[0]?.total || 0;

    const revenueChange = previousMonthRevenue > 0
      ? ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : '0';

    // Pending requests
    const AdminRequest = (await import('../models/AdminRequest')).AdminRequest;
    const pendingRequests = await AdminRequest.countDocuments({ status: 'pending' });

    res.json({
      totalEvents,
      eventsChange: parseFloat(eventsChange),
      totalParticipants,
      participantsChange: parseFloat(participantsChange),
      totalRevenue,
      revenueChange: parseFloat(revenueChange),
      pendingRequests
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /api/analytics/sentiment - Get sentiment analysis
router.get('/sentiment', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { eventId } = req.query;
    const sentimentData = await getSentimentAnalysis(eventId as string);
    
    // Get flagged feedback count for additional context
    const Feedback = (await import('../models/Feedback')).Feedback;
    const flaggedQuery: any = { flagged: true };
    if (eventId) {
      flaggedQuery.eventId = eventId;
    }
    const flaggedCount = await Feedback.countDocuments(flaggedQuery);
    
    res.json({
      ...sentimentData,
      flaggedCount
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment analysis' });
  }
});

// GET /api/analytics/sentiment-events - Get sentiment analysis for all events
router.get('/sentiment-events', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const Feedback = (await import('../models/Feedback')).Feedback;
    
    // Get sentiment summary per event
    const eventSentiments = await Feedback.aggregate([
      {
        $group: {
          _id: '$eventId',
          positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ['$sentiment', 'neutral'] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } },
          flagged: { $sum: { $cond: ['$flagged', 1, 0] } },
          totalFeedback: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      {
        $unwind: '$event'
      },
      {
        $project: {
          eventId: '$_id',
          eventName: '$event.title',
          positive: 1,
          neutral: 1,
          negative: 1,
          flagged: 1,
          totalFeedback: 1,
          avgConfidence: { $round: ['$avgConfidence', 2] },
          _id: 0
        }
      }
    ]);

    res.json(eventSentiments);

  } catch (error) {
    console.error('Event sentiments error:', error);
    res.status(500).json({ error: 'Failed to fetch event sentiments' });
  }
});

// GET /api/analytics/sentiment-trend - Get sentiment trend
router.get('/sentiment-trend', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { days = 30 } = req.query;
    const trendData = await getSentimentTrend(Number(days));
    
    res.json(trendData);

  } catch (error) {
    console.error('Sentiment trend error:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment trend' });
  }
});

// GET /api/analytics/categories - Get events by category
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const categoryData = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    res.json(categoryData);

  } catch (error) {
    console.error('Categories analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

// GET /api/analytics/engagement - Get engagement metrics
router.get('/engagement', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const Feedback = (await import('../models/Feedback')).Feedback;
    const totalFeedback = await Feedback.countDocuments();
    const feedbackResponseRate = totalUsers > 0 ? (totalFeedback / totalUsers * 100).toFixed(1) : '0';

    const totalRegistrations = await Registration.countDocuments();
    const avgRegistrationsPerEvent = await Event.countDocuments() > 0 
      ? (totalRegistrations / await Event.countDocuments()).toFixed(1)
      : '0';

    res.json({
      totalUsers,
      activeUsers,
      totalFeedback,
      feedbackResponseRate: parseFloat(feedbackResponseRate),
      totalRegistrations,
      avgRegistrationsPerEvent: parseFloat(avgRegistrationsPerEvent)
    });

  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

export default router;
