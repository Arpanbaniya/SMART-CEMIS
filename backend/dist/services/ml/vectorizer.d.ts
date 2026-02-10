/**
 * ML VECTORIZER
 * Converts user profiles and events into numeric vectors for ML algorithms
 *
 * User Vector: [preference_physical, preference_innovative, interest_sports, interest_tech, ...]
 * Event Vector: [is_sports, is_tech, is_cultural, is_paid, is_team, popularity, ...]
 */
export interface UserVector {
    userId: string;
    vector: number[];
    metadata: {
        preference: string;
        registeredCount: number;
        favoriteCount: number;
        avgFeedbackRating: number;
    };
}
export interface EventVector {
    eventId: string;
    vector: number[];
    metadata: {
        category: string;
        isSportsEvent: boolean;
        isTeamEvent: boolean;
        participantCount: number;
        capacity: number;
    };
}
export interface UserEventInteraction {
    userId: string;
    eventId: string;
    score: number;
    interactionType: 'registration' | 'favorite' | 'rating' | 'comment';
}
/**
 * Create user preference vector (16 dimensions)
 * Dimensions:
 * 0-1: Preference (physical/innovative)
 * 2-11: Category interests (10 categories)
 * 12: Engagement score (0-1)
 * 13: Avg feedback rating (0-1, normalized from 1-5)
 * 14: Event participation rate (registrations/total users)
 * 15: Recency score (newer users = higher)
 */
export declare function createUserVector(userId: string): Promise<UserVector>;
/**
 * Create event vector (16 dimensions to match user vector)
 * Dimensions:
 * 0-1: Event type (sports=physical, tech=innovative)
 * 2-11: Category encoding (one-hot or multi-hot)
 * 12: Popularity score (participantCount / capacity)
 * 13: Price factor (paid=0.5, free=1.0)
 * 14: Team factor (team events=0.7, individual=1.0)
 * 15: Recency score (newer events higher)
 */
export declare function createEventVector(eventId: string): Promise<EventVector>;
/**
 * Get all user-event interactions with scores
 * Score represents: how much user engaged with event
 * Registration: 1.0
 * Favorite: 0.8
 * Rating >= 4: 0.6
 * Comment: 0.4
 */
export declare function getUserEventInteractions(userId: string): Promise<UserEventInteraction[]>;
/**
 * Normalize vectors to 0-1 range (for distance calculations)
 */
export declare function normalizeVector(vector: number[]): number[];
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(vec1: number[], vec2: number[]): number;
