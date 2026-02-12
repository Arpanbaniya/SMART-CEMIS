/**
 * RECOMMENDATION SERVICE
 * 
 * Main service that:
 * - Manages model caching (in-memory)
 * - Provides recommendation endpoints
 * - Handles model retraining
 * - Serves recommendations to API
 */

import { getContentBasedRecommendations, ContentBasedScore } from './contentBased';
import { getCollaborativeRecommendations, CollaborativeScore } from './collaborative';
import { trainRecommendationModels, TrainingResult } from './trainer';
import { Event } from '../../models/Event';
import { computeEventStatus } from '../../utils/eventStatus';

export interface Recommendation {
  eventId: string;
  eventTitle: string;
  score: number; // 0-1, combined score
  source: 'content-based' | 'collaborative' | 'hybrid';
  confidence: number;
}

export interface RecommendationResponse {
  userId: string;
  recommendations: Recommendation[];
  timestamp: string;
  source: 'cache' | 'computed';
}

interface CachedRecommendations {
  data: Recommendation[];
  timestamp: number;
}

// In-memory cache: userId -> cached recommendations
const recommendationCache = new Map<string, CachedRecommendations>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Model training state
let isTraining = false;
let lastTrainingTime: Date | null = null;
let lastTrainingResult: TrainingResult | null = null;

/**
 * Clear old cache entries
 */
function pruneCache(): void {
  const now = Date.now();
  for (const [userId, cached] of recommendationCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL_MS) {
      recommendationCache.delete(userId);
    }
  }
  console.log(`[Recommendation] Cache pruned. Current size: ${recommendationCache.size}`);
}

/**
 * Get recommendations for a user
 * Returns hybrid recommendations (blend of both models)
 */
export async function getRecommendations(
  userId: string,
  limit: number = 3
): Promise<RecommendationResponse> {
  try {
    // Check cache
    const cached = recommendationCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Recommendation] Serving from cache for user ${userId}`);
      return {
        userId,
        recommendations: cached.data.slice(0, limit),
        timestamp: new Date().toISOString(),
        source: 'cache',
      };
    }

    console.log(`[Recommendation] Computing fresh recommendations for user ${userId}`);

    // Get recommendations from both models in parallel
    const [cbRecs, cfRecs] = await Promise.all([
      getContentBasedRecommendations(userId, limit * 2),
      getCollaborativeRecommendations(userId, limit * 2),
    ]);

    // Merge and deduplicate recommendations
    const mergedMap = new Map<string, Recommendation>();

    // Add content-based recommendations
    cbRecs.forEach(rec => {
      if (!mergedMap.has(rec.eventId)) {
        mergedMap.set(rec.eventId, {
          eventId: rec.eventId,
          eventTitle: rec.eventTitle,
          score: rec.score * 0.5, // 50% weight
          source: 'content-based',
          confidence: 0.5,
        });
      }
    });

    // Add collaborative recommendations (blend with existing if present)
    cfRecs.forEach(rec => {
      const existing = mergedMap.get(rec.eventId);
      if (existing) {
        // Blend scores
        existing.score = Math.min((existing.score + rec.score * 0.5) / 2, 1.0);
        existing.source = 'hybrid';
        existing.confidence = Math.min(existing.confidence + 0.2, 1.0);
      } else {
        mergedMap.set(rec.eventId, {
          eventId: rec.eventId,
          eventTitle: rec.eventTitle,
          score: rec.score * 0.5, // 50% weight
          source: 'collaborative',
          confidence: 0.5,
        });
      }
    });

    // Sort by score and limit
    const recommendations = Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Filter out completed/archived events
    const filteredRecommendations = [];
    for (const rec of recommendations) {
      const event = await Event.findById(rec.eventId);
      if (event) {
        const status = computeEventStatus({
          isCancelled: event.isCancelled || false,
          archivedAt: event.archivedAt || null,
          date: new Date(event.date),
          time: event.time,
          endDate: new Date(event.endDate),
          endTime: event.endTime,
        });
        
        // Only include upcoming and live events
        if (['upcoming', 'live', 'draft'].includes(status)) {
          filteredRecommendations.push(rec);
        }
      }
    }

    // Cache the full result
    recommendationCache.set(userId, {
      data: filteredRecommendations,
      timestamp: now,
    });

    return {
      userId,
      recommendations: filteredRecommendations,
      timestamp: new Date().toISOString(),
      source: 'computed',
    };
  } catch (error) {
    console.error(`[Recommendation] Error getting recommendations for ${userId}:`, error);
    throw error;
  }
}

/**
 * Trigger model retraining (can be scheduled or on-demand)
 */
export async function retrainModels(): Promise<TrainingResult> {
  if (isTraining) {
    console.log('[Recommendation] Training already in progress, skipping...');
    throw new Error('Training already in progress');
  }

  try {
    isTraining = true;
    console.log('[Recommendation] Starting model retraining...');

    const result = await trainRecommendationModels();

    lastTrainingTime = new Date();
    lastTrainingResult = result;

    // Clear cache after retraining
    recommendationCache.clear();
    console.log('[Recommendation] Cache cleared after retraining');

    return result;
  } catch (error) {
    console.error('[Recommendation] Retraining failed:', error);
    throw error;
  } finally {
    isTraining = false;
  }
}

/**
 * Get training status and results
 */
export function getTrainingStatus(): {
  isTraining: boolean;
  lastTrainingTime: Date | null;
  lastTrainingResult: TrainingResult | null;
  cacheSize: number;
} {
  return {
    isTraining,
    lastTrainingTime,
    lastTrainingResult,
    cacheSize: recommendationCache.size,
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: number;
  ttlMs: number;
} {
  pruneCache();
  return {
    size: recommendationCache.size,
    entries: recommendationCache.size,
    ttlMs: CACHE_TTL_MS,
  };
}

/**
 * Initialize service (set up periodic retraining if needed)
 */
export function initializeRecommendationService(): void {
  console.log('[Recommendation] Service initialized');
  
  // TODO: Set up scheduled retraining at 2 AM daily
  // This would typically be done with node-schedule or similar
  console.log('[Recommendation] Scheduled retraining can be set up with node-schedule');
}

/**
 * Get full service health
 */
export function getServiceHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  cacheSize: number;
  isTraining: boolean;
  lastTrainingTime: Date | null;
  message: string;
} {
  const cacheSize = recommendationCache.size;
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'All systems operational';

  if (isTraining) {
    status = 'degraded';
    message = 'Model training in progress';
  }

  if (!lastTrainingTime) {
    status = 'degraded';
    message = 'Models not yet trained';
  }

  return {
    status,
    cacheSize,
    isTraining,
    lastTrainingTime,
    message,
  };
}
