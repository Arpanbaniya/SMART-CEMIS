"use strict";
/**
 * RECOMMENDATION SERVICE
 *
 * Main service that:
 * - Manages model caching (in-memory)
 * - Provides recommendation endpoints
 * - Handles model retraining
 * - Serves recommendations to API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendations = getRecommendations;
exports.retrainModels = retrainModels;
exports.getTrainingStatus = getTrainingStatus;
exports.getCacheStats = getCacheStats;
exports.initializeRecommendationService = initializeRecommendationService;
exports.getServiceHealth = getServiceHealth;
const contentBased_1 = require("./contentBased");
const collaborative_1 = require("./collaborative");
const trainer_1 = require("./trainer");
const Event_1 = require("../../models/Event");
const eventStatus_1 = require("../../utils/eventStatus");
// In-memory cache: userId -> cached recommendations
const recommendationCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
// Model training state
let isTraining = false;
let lastTrainingTime = null;
let lastTrainingResult = null;
/**
 * Clear old cache entries
 */
function pruneCache() {
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
async function getRecommendations(userId, limit = 3) {
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
            (0, contentBased_1.getContentBasedRecommendations)(userId, limit * 2),
            (0, collaborative_1.getCollaborativeRecommendations)(userId, limit * 2),
        ]);
        // Merge and deduplicate recommendations
        const mergedMap = new Map();
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
            }
            else {
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
            const event = await Event_1.Event.findById(rec.eventId);
            if (event) {
                const status = (0, eventStatus_1.computeEventStatus)({
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
    }
    catch (error) {
        console.error(`[Recommendation] Error getting recommendations for ${userId}:`, error);
        throw error;
    }
}
/**
 * Trigger model retraining (can be scheduled or on-demand)
 */
async function retrainModels() {
    if (isTraining) {
        console.log('[Recommendation] Training already in progress, skipping...');
        throw new Error('Training already in progress');
    }
    try {
        isTraining = true;
        console.log('[Recommendation] Starting model retraining...');
        const result = await (0, trainer_1.trainRecommendationModels)();
        lastTrainingTime = new Date();
        lastTrainingResult = result;
        // Clear cache after retraining
        recommendationCache.clear();
        console.log('[Recommendation] Cache cleared after retraining');
        return result;
    }
    catch (error) {
        console.error('[Recommendation] Retraining failed:', error);
        throw error;
    }
    finally {
        isTraining = false;
    }
}
/**
 * Get training status and results
 */
function getTrainingStatus() {
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
function getCacheStats() {
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
function initializeRecommendationService() {
    console.log('[Recommendation] Service initialized');
    // TODO: Set up scheduled retraining at 2 AM daily
    // This would typically be done with node-schedule or similar
    console.log('[Recommendation] Scheduled retraining can be set up with node-schedule');
}
/**
 * Get full service health
 */
function getServiceHealth() {
    const cacheSize = recommendationCache.size;
    let status = 'healthy';
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
//# sourceMappingURL=recommendationService.js.map