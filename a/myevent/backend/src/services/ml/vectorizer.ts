/**
 * ML VECTORIZER
 * Converts user profiles and events into numeric vectors for ML algorithms
 * 
 * User Vector: [preference_physical, preference_innovative, interest_sports, interest_tech, ...]
 * Event Vector: [is_sports, is_tech, is_cultural, is_paid, is_team, popularity, ...]
 */

import { User } from '../../models/User';
import { Event } from '../../models/Event';

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
  score: number; // 0-1 scale
  interactionType: 'registration' | 'favorite' | 'rating' | 'comment';
}

// Category to vector position mapping
const CATEGORY_MAP: Record<string, number> = {
  'sports': 0,
  'technology': 1,
  'cultural': 2,
  'academic': 3,
  'music': 4,
  'art': 5,
  'workshop': 6,
  'competition': 7,
  'social': 8,
  'other': 9,
};

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
export async function createUserVector(userId: string): Promise<UserVector> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const vector = new Array(16).fill(0);

    // 0-1: User preference (physical vs innovative)
    if (user.preference === 'physical') {
      vector[0] = 1.0;
      vector[1] = 0.0;
    } else if (user.preference === 'innovative') {
      vector[0] = 0.0;
      vector[1] = 1.0;
    } else {
      vector[0] = 0.5;
      vector[1] = 0.5;
    }

    // 2-11: Category interests (inferred from user's registrations & favorites)
    const { Registration } = await import('../../models/Registration');
    const { Favorite } = await import('../../models/Favorite');

    const registrations = await Registration.find({ userId }).populate('eventId');
    const favorites = await Favorite.find({ userId }).populate('eventId');

    const categoryCounts = new Array(10).fill(0);
    let totalInteractions = 0;

    registrations.forEach((reg: any) => {
      if (reg.eventId?.category && CATEGORY_MAP[reg.eventId.category] !== undefined) {
        categoryCounts[CATEGORY_MAP[reg.eventId.category]] += 2; // Registrations weighted more
        totalInteractions += 2;
      }
    });

    favorites.forEach((fav: any) => {
      if (fav.eventId?.category && CATEGORY_MAP[fav.eventId.category] !== undefined) {
        categoryCounts[CATEGORY_MAP[fav.eventId.category]] += 1;
        totalInteractions += 1;
      }
    });

    // Normalize category interests
    if (totalInteractions > 0) {
      for (let i = 0; i < 10; i++) {
        vector[2 + i] = categoryCounts[i] / totalInteractions;
      }
    }

    // 12: Engagement score (registration ratio)
    const totalEvents = await Event.countDocuments();
    const engagementScore = totalEvents > 0 ? registrations.length / totalEvents : 0;
    vector[12] = Math.min(engagementScore, 1.0);

    // 13: Average feedback rating (normalized to 0-1)
    const { Feedback } = await import('../../models/Feedback');
    const feedbacks = await Feedback.find({ userId });
    if (feedbacks.length > 0) {
      const avgRating = feedbacks.reduce((sum: number, f: any) => sum + (f.rating || 3), 0) / feedbacks.length;
      vector[13] = (avgRating - 1) / 4; // Normalize 1-5 to 0-1
    }

    // 14: Participation rate
    vector[14] = Math.min(registrations.length / Math.max(totalEvents, 1), 1.0);

    // 15: Recency score (newer users get higher)
    const userAgeMs = Date.now() - new Date(user.createdAt).getTime();
    const userAgeWeeks = userAgeMs / (1000 * 60 * 60 * 24 * 7);
    vector[15] = Math.max(1 - userAgeWeeks / 52, 0); // Decay over 1 year

    return {
      userId: userId,
      vector,
      metadata: {
        preference: user.preference || 'both',
        registeredCount: registrations.length,
        favoriteCount: favorites.length,
        avgFeedbackRating: feedbacks.length > 0 
          ? feedbacks.reduce((sum: number, f: any) => sum + (f.rating || 3), 0) / feedbacks.length 
          : 3.0,
      },
    };
  } catch (error) {
    console.error(`Error creating user vector for ${userId}:`, error);
    throw error;
  }
}

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
export async function createEventVector(eventId: string): Promise<EventVector> {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const vector = new Array(16).fill(0);

    // 0-1: Event type mapping to user preferences
    if (event.isSportsEvent) {
      vector[0] = 1.0; // Physical
      vector[1] = 0.2;
    } else if (event.category === 'technology' || event.category === 'academic' || event.category === 'workshop') {
      vector[0] = 0.2;
      vector[1] = 1.0; // Innovative
    } else {
      vector[0] = 0.5;
      vector[1] = 0.5;
    }

    // 2-11: Category encoding (one-hot)
    const categoryIndex = CATEGORY_MAP[event.category] || 9;
    vector[2 + categoryIndex] = 1.0;

    // 12: Popularity score (0-1)
    const popularityScore = Math.min(event.participantCount / Math.max(event.capacity, 1), 1.0);
    vector[12] = popularityScore;

    // 13: Price factor (free events more popular = 1.0, paid = 0.5)
    vector[13] = event.isPaid ? 0.5 : 1.0;

    // 14: Team factor
    vector[14] = event.isTeamEvent ? 0.7 : 1.0;

    // 15: Recency score
    const eventAgeMs = Date.now() - new Date(event.createdAt!).getTime();
    const eventAgeWeeks = eventAgeMs / (1000 * 60 * 60 * 24 * 7);
    vector[15] = Math.max(1 - eventAgeWeeks / 8, 0); // Decay over 8 weeks

    return {
      eventId: eventId,
      vector,
      metadata: {
        category: event.category,
        isSportsEvent: event.isSportsEvent,
        isTeamEvent: event.isTeamEvent,
        participantCount: event.participantCount,
        capacity: event.capacity,
      },
    };
  } catch (error) {
    console.error(`Error creating event vector for ${eventId}:`, error);
    throw error;
  }
}

/**
 * Get all user-event interactions with scores
 * Score represents: how much user engaged with event
 * Registration: 1.0
 * Favorite: 0.8
 * Rating >= 4: 0.6
 * Comment: 0.4
 */
export async function getUserEventInteractions(userId: string): Promise<UserEventInteraction[]> {
  const { Registration } = await import('../../models/Registration');
  const { Favorite } = await import('../../models/Favorite');
  const { Feedback } = await import('../../models/Feedback');
  const { Comment } = await import('../../models/Comment');

  const interactions: Map<string, UserEventInteraction> = new Map();

  // Registrations: strongest signal
  const registrations = await Registration.find({ userId });
  registrations.forEach((reg: any) => {
    const eventId = reg.eventId.toString();
    interactions.set(eventId, {
      userId,
      eventId,
      score: 1.0,
      interactionType: 'registration',
    });
  });

  // Favorites: second strongest
  const favorites = await Favorite.find({ userId });
  favorites.forEach((fav: any) => {
    const eventId = fav.eventId.toString();
    if (!interactions.has(eventId)) {
      interactions.set(eventId, {
        userId,
        eventId,
        score: 0.8,
        interactionType: 'favorite',
      });
    }
  });

  // High ratings
  const feedbacks = await Feedback.find({ userId, rating: { $gte: 4 } });
  feedbacks.forEach((fb: any) => {
    const eventId = fb.eventId.toString();
    if (!interactions.has(eventId)) {
      interactions.set(eventId, {
        userId,
        eventId,
        score: 0.6,
        interactionType: 'rating',
      });
    }
  });

  // Comments
  const comments = await Comment.find({ userId });
  comments.forEach((comment: any) => {
    const eventId = comment.eventId.toString();
    if (!interactions.has(eventId)) {
      interactions.set(eventId, {
        userId,
        eventId,
        score: 0.4,
        interactionType: 'comment',
      });
    }
  });

  return Array.from(interactions.values());
}

/**
 * Normalize vectors to 0-1 range (for distance calculations)
 */
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  if (norm1 === 0 || norm2 === 0) return 0;
  return dotProduct / (norm1 * norm2);
}
