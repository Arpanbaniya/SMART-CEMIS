/**
 * RECOMMENDATION SERVICE
 *
 * Main service that:
 * - Manages model caching (in-memory)
 * - Provides recommendation endpoints
 * - Handles model retraining
 * - Serves recommendations to API
 */
import { TrainingResult } from './trainer';
export interface Recommendation {
    eventId: string;
    eventTitle: string;
    score: number;
    source: 'content-based' | 'collaborative' | 'hybrid';
    confidence: number;
}
export interface RecommendationResponse {
    userId: string;
    recommendations: Recommendation[];
    timestamp: string;
    source: 'cache' | 'computed';
}
/**
 * Get recommendations for a user
 * Returns hybrid recommendations (blend of both models)
 */
export declare function getRecommendations(userId: string, limit?: number): Promise<RecommendationResponse>;
/**
 * Trigger model retraining (can be scheduled or on-demand)
 */
export declare function retrainModels(): Promise<TrainingResult>;
/**
 * Get training status and results
 */
export declare function getTrainingStatus(): {
    isTraining: boolean;
    lastTrainingTime: Date | null;
    lastTrainingResult: TrainingResult | null;
    cacheSize: number;
};
/**
 * Get cache statistics
 */
export declare function getCacheStats(): {
    size: number;
    entries: number;
    ttlMs: number;
};
/**
 * Initialize service (set up periodic retraining if needed)
 */
export declare function initializeRecommendationService(): void;
/**
 * Get full service health
 */
export declare function getServiceHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    cacheSize: number;
    isTraining: boolean;
    lastTrainingTime: Date | null;
    message: string;
};
