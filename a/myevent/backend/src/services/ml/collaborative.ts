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

import { Event } from '../../models/Event';
import { 
  getUserEventInteractions,
  cosineSimilarity,
  UserEventInteraction
} from './vectorizer';

export interface CollaborativeScore {
  eventId: string;
  eventTitle: string;
  score: number; // 0-1
  similarityToUser: number;
  predictedRating: number; // 1-5
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
 * Build user similarity matrix
 * Compares interaction patterns between users
 */
async function getUserSimilarity(userId: string, otherUserIds: string[]): Promise<Map<string, number>> {
  const userInteractions = await getUserEventInteractions(userId);
  const userInteractionMap = new Map(userInteractions.map(i => [i.eventId, i.score]));

  const similarities = new Map<string, number>();

  for (const otherUserId of otherUserIds) {
    try {
      const otherInteractions = await getUserEventInteractions(otherUserId);
      const otherInteractionMap = new Map(otherInteractions.map(i => [i.eventId, i.score]));

      // Find common events
      const commonEvents = Array.from(userInteractionMap.keys()).filter(
        eventId => otherInteractionMap.has(eventId)
      );

      if (commonEvents.length === 0) {
        similarities.set(otherUserId, 0);
        continue;
      }

      // Calculate cosine similarity on interaction vectors
      const userVector = commonEvents.map(e => userInteractionMap.get(e)!);
      const otherVector = commonEvents.map(e => otherInteractionMap.get(e)!);

      const similarity = cosineSimilarity(userVector, otherVector);
      similarities.set(otherUserId, similarity);
    } catch (error) {
      console.error(`Error calculating similarity with ${otherUserId}:`, error);
      similarities.set(otherUserId, 0);
    }
  }

  return similarities;
}

/**
 * Get collaborative filtering recommendations
 * Based on what similar users engaged with
 */
export async function getCollaborativeRecommendations(
  userId: string,
  limit: number = 3
): Promise<CollaborativeScore[]> {
  try {
    console.log(`[Collaborative] Generating recommendations for ${userId}`);

    const { Registration } = await import('../../models/Registration');

    // Get user's registered events
    const userRegistrations = await Registration.find({ userId });
    const registeredEventIds = new Set(userRegistrations.map((r: any) => r.eventId.toString()));

    // Get all active users
    const { User } = await import('../../models/User');
    const allUsers = await User.find();
    const otherUserIds = allUsers
      .map(u => u._id.toString())
      .filter(uid => uid !== userId);

    // Calculate similarity to other users
    const userSimilarities = await getUserSimilarity(userId, otherUserIds);

    // Find top-K similar users (K=5)
    const topSimilarUsers = Array.from(userSimilarities.entries())
      .filter(([_, sim]) => sim > 0.1) // Filter out very dissimilar users
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid]) => uid);

    console.log(`[Collaborative] Found ${topSimilarUsers.length} similar users`);

    // Get events liked by similar users
    const eventScores = new Map<string, { score: number; count: number; predictedRating: number }>();

    for (const similarUserId of topSimilarUsers) {
      const similarUserInteractions = await getUserEventInteractions(similarUserId);
      const userSimilarity = userSimilarities.get(similarUserId) || 0;

      for (const interaction of similarUserInteractions) {
        // Skip already registered events
        if (registeredEventIds.has(interaction.eventId)) {
          continue;
        }

        const current = eventScores.get(interaction.eventId) || { score: 0, count: 0, predictedRating: 0 };

        // Weight by user similarity
        const weightedScore = interaction.score * userSimilarity;
        current.score += weightedScore;
        current.count += 1;
        current.predictedRating += interaction.score;

        eventScores.set(interaction.eventId, current);
      }
    }

    // Aggregate and create final scores
    const scores: CollaborativeScore[] = [];

    for (const [eventId, { score, count, predictedRating }] of eventScores.entries()) {
      try {
        const event = await Event.findById(eventId);
        if (!event) continue;

        const avgScore = count > 0 ? score / count : 0;
        const avgPredictedRating = count > 0 ? predictedRating / count : 3;

        scores.push({
          eventId,
          eventTitle: event.title,
          score: Math.min(avgScore, 1.0),
          similarityToUser: topSimilarUsers.length > 0 ? avgScore : 0,
          predictedRating: Math.min(avgPredictedRating, 5),
        });
      } catch (error) {
        console.error(`Error fetching event ${eventId}:`, error);
        continue;
      }
    }

    // Sort by score
    const topRecommendations = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`[Collaborative] Generated ${topRecommendations.length} recommendations`);

    return topRecommendations;
  } catch (error) {
    console.error('[Collaborative] Error generating recommendations:', error);
    throw error;
  }
}

/**
 * Evaluate collaborative model on test set
 */
export async function evaluateCollaborativeModel(
  testUserIds: string[],
  trainUserIds: string[]
): Promise<CollaborativeMetrics> {
  try {
    console.log(`[Collaborative] Evaluating on ${testUserIds.length} test users`);

    let totalPrecision3 = 0;
    let totalRecall3 = 0;
    let totalAP = 0;
    let totalRMSE = 0;
    let validUserCount = 0;

    for (const userId of testUserIds) {
      try {
        // Get user's actual interactions
        const actualInteractions = await getUserEventInteractions(userId);
        if (actualInteractions.length === 0) continue;

        // Get recommendations
        const recommendations = await getCollaborativeRecommendations(userId, 10);
        if (recommendations.length === 0) continue;

        // Calculate Precision@3
        const top3 = recommendations.slice(0, 3);
        const hits = top3.filter(r => 
          actualInteractions.some(i => i.eventId === r.eventId)
        ).length;
        const precision3 = hits / 3;

        // Calculate Recall@3
        const recall3 = hits / Math.min(actualInteractions.length, 3);

        // Calculate Average Precision
        let ap = 0;
        for (let i = 0; i < Math.min(recommendations.length, 10); i++) {
          const rec = recommendations[i];
          if (actualInteractions.some(a => a.eventId === rec.eventId)) {
            const precAtK = (i + 1) / (i + 1);
            ap += precAtK / Math.min(actualInteractions.length, 10);
          }
        }

        // Calculate RMSE
        let squaredError = 0;
        let rmseSampleSize = 0;

        for (const rec of recommendations.slice(0, 5)) {
          const actualInteraction = actualInteractions.find(i => i.eventId === rec.eventId);
          if (actualInteraction) {
            const predictedRating = rec.predictedRating;
            const actualScore = actualInteraction.score * 5; // Scale 0-1 to 1-5
            squaredError += Math.pow(predictedRating - actualScore, 2);
            rmseSampleSize++;
          }
        }

        if (rmseSampleSize > 0) {
          totalRMSE += Math.sqrt(squaredError / rmseSampleSize);
        }

        totalPrecision3 += precision3;
        totalRecall3 += recall3;
        totalAP += ap;
        validUserCount++;
      } catch (error) {
        console.error(`Error evaluating user ${userId}:`, error);
        continue;
      }
    }

    const metrics: CollaborativeMetrics = {
      precision3: validUserCount > 0 ? totalPrecision3 / validUserCount : 0,
      recall3: validUserCount > 0 ? totalRecall3 / validUserCount : 0,
      map: validUserCount > 0 ? totalAP / validUserCount : 0,
      rmse: validUserCount > 0 ? totalRMSE / validUserCount : 0,
      testSetSize: validUserCount,
      trainingSize: trainUserIds.length,
    };

    console.log('[Collaborative] Evaluation complete:', {
      precision3: metrics.precision3.toFixed(3),
      recall3: metrics.recall3.toFixed(3),
      map: metrics.map.toFixed(3),
      rmse: metrics.rmse.toFixed(3),
      testSize: metrics.testSetSize,
    });

    return metrics;
  } catch (error) {
    console.error('[Collaborative] Evaluation error:', error);
    throw error;
  }
}
