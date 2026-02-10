import { type IEvent } from '../models/Event';
/**
 * TRENDING ALGORITHM
 *
 * Calculates trending score based on:
 * 1. Velocity Score (40%): How fast registrations are coming in
 * 2. Recency Score (35%): How recently the event was created
 * 3. Category Boost (25%): Preferred categories get slight boost
 *
 * Formula:
 * trendingScore = (velocityScore × 0.4) + (recencyScore × 0.35) + (categoryBoost × 0.25)
 */
interface TrendingScore {
    eventId: string;
    title: string;
    score: number;
    velocityScore: number;
    recencyScore: number;
    categoryBoost: number;
    participantCount: number;
}
/**
 * Get trending events (global, same for all users)
 *
 * @param limit - Number of events to return (default: 10)
 * @returns Array of trending events sorted by score
 */
export declare function getTrendingEvents(limit?: number): Promise<IEvent[]>;
/**
 * Get trending events with detailed scoring info (for debugging/admin)
 *
 * @param limit - Number of events to return (default: 10)
 * @returns Array of events with scoring breakdown
 */
export declare function getTrendingEventsWithScores(limit?: number): Promise<TrendingScore[]>;
export {};
