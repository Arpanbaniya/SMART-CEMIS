import { Event, type IEvent } from '../models/Event';
import { computeEventStatus } from '../utils/eventStatus';

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

// Categories that are boosted
const BOOSTED_CATEGORIES = ['technology', 'competition', 'workshop', 'academic'];

/**
 * Calculate trending score for a single event
 */
function calculateTrendingScore(event: any): number {
  
  // Higher participation rate = higher velocity
  const capacityRatio = Math.min(event.participantCount / Math.max(event.capacity, 1), 1);
  const velocityScore = capacityRatio;

  // Recency Score: Events created more recently score higher
 
  const now = new Date();
  const createdAt = event.createdAt || new Date();
  const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Score decreases after 30 days
  const recencyScore = Math.max(1 - ageInDays / 30, 0);

  // Category Boost: Preferred categories get 20% boost
  const categoryBoost = BOOSTED_CATEGORIES.includes(event.category) ? 1.2 : 1.0;

  // Combined score
  const score = (velocityScore * 0.4) + (recencyScore * 0.35) + (categoryBoost * 0.25);

  return score;
}

export async function getTrendingEvents(limit: number = 5): Promise<IEvent[]> {
  try {
    // Get all non-cancelled, non-archived events
   
    const now = new Date();
    const events = await Event.find({
      isCancelled: { $ne: true },
      archivedAt: { $eq: null },
      endDate: { $gte: now } // Event end date hasn't passed yet
    });

    // Filter to only upcoming and live events (exclude completed)
    const trendingEvents = events.filter((event) => {
      const status = computeEventStatus({
        isCancelled: event.isCancelled || false,
        archivedAt: event.archivedAt || null,
        date: new Date(event.date),
        time: event.time,
        endDate: new Date(event.endDate),
        endTime: event.endTime,
      });
      
      return status === 'upcoming' || status === 'live';
    });

    // Calculate trending score for each event
    const scoredEvents = trendingEvents.map((event) => ({
      event,
      score: calculateTrendingScore(event)
    }));

    // Sort by score descending
    const sorted = scoredEvents.sort((a, b) => b.score - a.score);

    // Return top events
    const result = sorted.slice(0, limit).map((item) => item.event);

    console.log(`[Trending] Calculated trending events: ${result.length} events returned`);

    return result;
  } catch (error) {
    console.error('[Trending] Error calculating trending events:', error);
    // Fallback: return events by participant count  
    const now = new Date();
    return Event.find({
      isCancelled: { $ne: true },
      archivedAt: { $eq: null },
      endDate: { $gte: now }
    })
      .sort({ participantCount: -1 })
      .limit(limit);
  }
}


export async function getTrendingEventsWithScores(limit: number = 10): Promise<TrendingScore[]> {
  try {
    const now = new Date();
    const events = await Event.find({
      isCancelled: { $ne: true },
      archivedAt: { $eq: null },
      endDate: { $gte: now }
    });

    // Filter to only upcoming and live events
    const trendingEvents = events.filter((event) => {
      const status = computeEventStatus({
        isCancelled: event.isCancelled || false,
        archivedAt: event.archivedAt || null,
        date: new Date(event.date),
        time: event.time,
        endDate: new Date(event.endDate),
        endTime: event.endTime,
      });
      
      return status === 'upcoming' || status === 'live';
    });

    const scoredEvents = trendingEvents.map((event) => {
      const capacityRatio = Math.min(event.participantCount / Math.max(event.capacity, 1), 1);
      const velocityScore = capacityRatio;

      const now = new Date();
      const createdAt = event.createdAt || new Date();
      const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(1 - ageInDays / 30, 0);

      const categoryBoost = BOOSTED_CATEGORIES.includes(event.category) ? 1.2 : 1.0;

      const finalScore = (velocityScore * 0.4) + (recencyScore * 0.35) + (categoryBoost * 0.25);

      return {
        eventId: event._id.toString(),
        title: event.title,
        score: finalScore,
        velocityScore,
        recencyScore,
        categoryBoost,
        participantCount: event.participantCount
      };
    });

    return scoredEvents
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('[Trending] Error calculating trending events with scores:', error);
    throw error;
  }
}
