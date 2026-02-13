/**
 * RECOMMENDATION ROUTES
 * 
 * Endpoints:
 * - GET /api/recommendations/:userId - Get recommendations for user
 * - POST /api/recommendations/admin/train - Admin: Trigger retraining
 * - GET /api/recommendations/admin/status - Admin: Get training status
 * - GET /api/recommendations/admin/health - Admin: Service health
 * - GET /api/recommendations/admin/cache - Admin: Cache statistics
 */

import express, { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';
import {
  getRecommendations,
  retrainModels,
  getTrainingStatus,
  getCacheStats,
  getServiceHealth,
  initializeRecommendationService,
} from '../services/ml/recommendationService';

const router = Router();

/**
 * POST /api/recommendations/admin/train
 * Admin: Manually trigger model retraining
 * IMPORTANT: This must come BEFORE /:userId to avoid catch-all
 */
router.post('/admin/train', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get user from session and check if admin
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'student_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can trigger retraining',
      });
    }

    const result = await retrainModels();

    res.json({
      success: true,
      message: 'Model retraining completed',
      data: {
        trainingTime: result.trainingTime,
        timestamp: result.timestamp,
        dataSize: result.dataSize,
        contentBasedMetrics: {
          precision3: result.contentBasedMetrics.precision3.toFixed(3),
          recall3: result.contentBasedMetrics.recall3.toFixed(3),
          map: result.contentBasedMetrics.map.toFixed(3),
          rmse: result.contentBasedMetrics.rmse.toFixed(3),
        },
        collaborativeMetrics: {
          precision3: result.collaborativeMetrics.precision3.toFixed(3),
          recall3: result.collaborativeMetrics.recall3.toFixed(3),
          map: result.collaborativeMetrics.map.toFixed(3),
          rmse: result.collaborativeMetrics.rmse.toFixed(3),
        },
        bestModel: result.bestModel,
        score: result.score.toFixed(3),
      },
    });
  } catch (error: any) {
    console.error('Error triggering retraining:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to trigger retraining',
    });
  }
});

/**
 * GET /api/recommendations/admin/status
 * Admin: Get current training status and results
 * IMPORTANT: This must come BEFORE /:userId to avoid catch-all
 */
router.get('/admin/status', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get user from session and check if admin
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'student_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view status',
      });
    }

    const status = getTrainingStatus();

    res.json({
      success: true,
      data: {
        isTraining: status.isTraining,
        lastTrainingTime: status.lastTrainingTime,
        cacheSize: status.cacheSize,
        lastTrainingResult: status.lastTrainingResult ? {
          trainingTime: status.lastTrainingResult.trainingTime,
          timestamp: status.lastTrainingResult.timestamp,
          dataSize: status.lastTrainingResult.dataSize,
          contentBasedMetrics: {
            precision3: status.lastTrainingResult.contentBasedMetrics.precision3.toFixed(3),
            recall3: status.lastTrainingResult.contentBasedMetrics.recall3.toFixed(3),
            map: status.lastTrainingResult.contentBasedMetrics.map.toFixed(3),
            rmse: status.lastTrainingResult.contentBasedMetrics.rmse.toFixed(3),
          },
          collaborativeMetrics: {
            precision3: status.lastTrainingResult.collaborativeMetrics.precision3.toFixed(3),
            recall3: status.lastTrainingResult.collaborativeMetrics.recall3.toFixed(3),
            map: status.lastTrainingResult.collaborativeMetrics.map.toFixed(3),
            rmse: status.lastTrainingResult.collaborativeMetrics.rmse.toFixed(3),
          },
          bestModel: status.lastTrainingResult.bestModel,
          score: status.lastTrainingResult.score.toFixed(3),
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching training status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch training status',
    });
  }
});

/**
 * GET /api/recommendations/admin/health
 * Admin: Get service health status
 * IMPORTANT: This must come BEFORE /:userId to avoid catch-all
 */
router.get('/admin/health', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get user from session and check if admin
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'student_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view health',
      });
    }

    const health = getServiceHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    console.error('Error fetching health status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch health status',
    });
  }
});

/**
 * GET /api/recommendations/admin/cache
 * Admin: Get cache statistics
 * IMPORTANT: This must come BEFORE /:userId to avoid catch-all
 */
router.get('/admin/cache', requireAuth, async (req: Request, res: Response) => {
  try {
    // Get user from session and check if admin
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const user = await User.findById(userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'student_admin')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view cache',
      });
    }

    const cacheStats = getCacheStats();

    res.json({
      success: true,
      data: cacheStats,
    });
  } catch (error: any) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cache stats',
    });
  }
});

/**
 * GET /api/recommendations/:userId
 * Get personalized recommendations for a user
 * IMPORTANT: This must come AFTER all /admin/* routes to avoid catch-all
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '5' } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit as string), 1), 10);

    const recommendations = await getRecommendations(userId, limitNum);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recommendations',
    });
  }
});

export default router;
