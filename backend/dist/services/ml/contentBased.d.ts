/**
 * CONTENT-BASED RECOMMENDATION MODEL
 *
 * Algorithm: Cosine Similarity
 * Matches user preferences to event characteristics
 *
 * Training: Calculate similarity between user vector and all event vectors
 * Prediction: Return top-N events with highest similarity
 *
 * Accuracy Metrics:
 * - Precision@3: Of top 3 recommended, how many did user actually engage with?
 * - Recall@3: Of all events user engaged with, how many are in top 3?
 * - MAP: Mean Average Precision (rank-aware)
 * - RMSE: Root Mean Squared Error of predicted vs actual ratings
 */
export interface ContentBasedScore {
    eventId: string;
    eventTitle: string;
    score: number;
    similarityScore: number;
    confidenceScore: number;
}
export interface ContentBasedMetrics {
    precision3: number;
    recall3: number;
    map: number;
    rmse: number;
    testSetSize: number;
    trainingSize: number;
}
/**
 * Train content-based model on a user
 * Returns top recommendations
 */
export declare function getContentBasedRecommendations(userId: string, limit?: number): Promise<ContentBasedScore[]>;
/**
 * Evaluate content-based model on a test set
 * Uses held-out test data to calculate accuracy metrics
 */
export declare function evaluateContentBasedModel(testUserIds: string[], trainUserIds: string[]): Promise<ContentBasedMetrics>;
