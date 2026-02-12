/**
 * COLLABORATIVE FILTERING RECOMMENDATION MODEL
 *
 * Algorithm: User-User Similarity + Item-Item Similarity (Hybrid)
 * Finds users with similar preferences and recommends their favorite events
 *
 * Training: Build user-event interaction matrix, calculate similarities
 * Prediction: Find similar users, return their top-rated events
 *
 * Accuracy Metrics: Same as content-based (Precision@3, Recall@3, MAP, RMSE)
 */
export interface CollaborativeScore {
    eventId: string;
    eventTitle: string;
    score: number;
    similarityToUser: number;
    predictedRating: number;
}
export interface CollaborativeMetrics {
    precision3: number;
    recall3: number;
    map: number;
    rmse: number;
    testSetSize: number;
    trainingSize: number;
}
/**
 * Get collaborative filtering recommendations
 * Based on what similar users engaged with
 */
export declare function getCollaborativeRecommendations(userId: string, limit?: number): Promise<CollaborativeScore[]>;
/**
 * Evaluate collaborative model on test set
 */
export declare function evaluateCollaborativeModel(testUserIds: string[], trainUserIds: string[]): Promise<CollaborativeMetrics>;
