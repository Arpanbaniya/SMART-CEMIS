"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContentBasedRecommendations = getContentBasedRecommendations;
exports.evaluateContentBasedModel = evaluateContentBasedModel;
const Event_1 = require("../../models/Event");
const vectorizer_1 = require("./vectorizer");
/**
 * Train content-based model on a user
 * Returns top recommendations
 */
async function getContentBasedRecommendations(userId, limit = 5) {
    try {
        console.log(`[ContentBased] Training for user ${userId}, limit: ${limit}`);
        // Get user vector
        const userVectorData = await (0, vectorizer_1.createUserVector)(userId);
        const userVector = userVectorData.vector;
        // Get all events user is NOT registered for
        const { Registration } = await Promise.resolve().then(() => __importStar(require('../../models/Registration')));
        const userRegistrations = await Registration.find({ userId });
        const registeredEventIds = new Set(userRegistrations.map((r) => r.eventId.toString()));
        // Get all upcoming/ongoing events
        const allEvents = await Event_1.Event.find({
            status: { $in: ['upcoming', 'ongoing'] },
            date: { $gte: new Date() },
        });
        // Calculate scores
        const scores = [];
        for (const event of allEvents) {
            const eventId = event._id.toString();
            // Skip already registered events
            if (registeredEventIds.has(eventId)) {
                continue;
            }
            try {
                const eventVectorData = await (0, vectorizer_1.createEventVector)(eventId);
                const eventVector = eventVectorData.vector;
                // Calculate similarity
                const similarityScore = (0, vectorizer_1.cosineSimilarity)(userVector, eventVector);
                // Confidence based on event popularity + recency
                const popularityFactor = Math.min(event.participantCount / Math.max(event.capacity, 1), 1);
                const recencyFactor = eventVectorData.vector[15]; // Recency is dimension 15
                const confidenceScore = (popularityFactor * 0.6 + recencyFactor * 0.4);
                // Final score: weighted combination
                const finalScore = (similarityScore * 0.7) + (confidenceScore * 0.3);
                scores.push({
                    eventId,
                    eventTitle: event.title,
                    score: finalScore,
                    similarityScore,
                    confidenceScore,
                });
            }
            catch (error) {
                console.error(`Error scoring event ${eventId}:`, error);
                continue;
            }
        }
        // Sort by score and return top-N
        const topRecommendations = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        console.log(`[ContentBased] Generated ${topRecommendations.length} recommendations for ${userId}`);
        return topRecommendations;
    }
    catch (error) {
        console.error('[ContentBased] Error generating recommendations:', error);
        throw error;
    }
}
/**
 * Evaluate content-based model on a test set
 * Uses held-out test data to calculate accuracy metrics
 */
async function evaluateContentBasedModel(testUserIds, trainUserIds) {
    try {
        console.log(`[ContentBased] Evaluating on ${testUserIds.length} test users`);
        let totalPrecision3 = 0;
        let totalRecall3 = 0;
        let totalAP = 0; // For MAP calculation
        let totalRMSE = 0;
        let validUserCount = 0;
        for (const userId of testUserIds) {
            try {
                // Get user's actual interactions
                const actualInteractions = await (0, vectorizer_1.getUserEventInteractions)(userId);
                if (actualInteractions.length === 0)
                    continue;
                // Get recommendations
                const recommendations = await getContentBasedRecommendations(userId, 10);
                const recommendedEventIds = new Set(recommendations.map(r => r.eventId));
                // Calculate Precision@3
                const top3 = recommendations.slice(0, 3);
                const hits = top3.filter(r => actualInteractions.some(i => i.eventId === r.eventId)).length;
                const precision3 = hits / 3; // Precision@3
                // Calculate Recall@3
                const recall3 = hits / Math.min(actualInteractions.length, 3);
                // Calculate Average Precision
                let ap = 0;
                for (let i = 0; i < Math.min(recommendations.length, 10); i++) {
                    const rec = recommendations[i];
                    if (actualInteractions.some(a => a.eventId === rec.eventId)) {
                        const precAtK = (i + 1) / (i + 1); // Position-based precision
                        ap += precAtK / Math.min(actualInteractions.length, 10);
                    }
                }
                // Calculate RMSE (predicted score vs actual score)
                let squaredError = 0;
                let rmseSampleSize = 0;
                for (const rec of recommendations.slice(0, 5)) {
                    const actualInteraction = actualInteractions.find(i => i.eventId === rec.eventId);
                    if (actualInteraction) {
                        const predictedScore = rec.score;
                        const actualScore = actualInteraction.score;
                        squaredError += Math.pow(predictedScore - actualScore, 2);
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
            }
            catch (error) {
                console.error(`Error evaluating user ${userId}:`, error);
                continue;
            }
        }
        const metrics = {
            precision3: validUserCount > 0 ? totalPrecision3 / validUserCount : 0,
            recall3: validUserCount > 0 ? totalRecall3 / validUserCount : 0,
            map: validUserCount > 0 ? totalAP / validUserCount : 0,
            rmse: validUserCount > 0 ? totalRMSE / validUserCount : 0,
            testSetSize: validUserCount,
            trainingSize: trainUserIds.length,
        };
        console.log('[ContentBased] Evaluation complete:', {
            precision3: metrics.precision3.toFixed(3),
            recall3: metrics.recall3.toFixed(3),
            map: metrics.map.toFixed(3),
            rmse: metrics.rmse.toFixed(3),
            testSize: metrics.testSetSize,
        });
        return metrics;
    }
    catch (error) {
        console.error('[ContentBased] Evaluation error:', error);
        throw error;
    }
}
//# sourceMappingURL=contentBased.js.map