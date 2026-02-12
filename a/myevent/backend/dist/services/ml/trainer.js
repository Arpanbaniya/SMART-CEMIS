"use strict";
/**
 * RECOMMENDATION MODEL TRAINER
 *
 * Orchestrates training of both Content-Based and Collaborative Filtering models
 * Handles:
 * - Data preparation (fetch all user-event interactions)
 * - Train/validation/test split (70/15/15)
 * - Training both models independently
 * - Evaluating both models
 * - Storing results and model metadata
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
exports.trainRecommendationModels = trainRecommendationModels;
exports.getTrainingDataSummary = getTrainingDataSummary;
const Event_1 = require("../../models/Event");
const User_1 = require("../../models/User");
const contentBased_1 = require("./contentBased");
const collaborative_1 = require("./collaborative");
/**
 * Prepare training data with proper splits
 */
async function prepareTrainingData() {
    try {
        console.log('[Trainer] Preparing training data...');
        // Get all users who have interactions
        const users = await User_1.User.find();
        const userIds = users.map(u => u._id.toString());
        // Get all events
        const events = await Event_1.Event.find();
        const eventIds = events.map(e => e._id.toString());
        if (userIds.length === 0 || eventIds.length === 0) {
            throw new Error('Insufficient data: no users or events found');
        }
        // Shuffle user IDs for random split
        const shuffledUserIds = [...userIds].sort(() => Math.random() - 0.5);
        // 70/15/15 split
        const trainSize = Math.floor(shuffledUserIds.length * 0.7);
        const valSize = Math.floor(shuffledUserIds.length * 0.15);
        const trainUserIds = shuffledUserIds.slice(0, trainSize);
        const validationUserIds = shuffledUserIds.slice(trainSize, trainSize + valSize);
        const testUserIds = shuffledUserIds.slice(trainSize + valSize);
        const data = {
            userIds,
            eventIds,
            trainUserIds,
            validationUserIds,
            testUserIds,
        };
        console.log(`[Trainer] Data split: Train=${trainUserIds.length}, Val=${validationUserIds.length}, Test=${testUserIds.length}`);
        return data;
    }
    catch (error) {
        console.error('[Trainer] Error preparing data:', error);
        throw error;
    }
}
/**
 * Train content-based model
 */
async function trainContentBasedModel(trainUserIds, validationUserIds) {
    try {
        console.log('[Trainer] Training Content-Based model...');
        // Content-based doesn't require explicit training, just vectorization happens on-demand
        // So we evaluate it on the test set
        const metrics = await (0, contentBased_1.evaluateContentBasedModel)(validationUserIds, trainUserIds);
        return metrics;
    }
    catch (error) {
        console.error('[Trainer] Error training content-based model:', error);
        throw error;
    }
}
/**
 * Train collaborative model
 */
async function trainCollaborativeModel(trainUserIds, validationUserIds) {
    try {
        console.log('[Trainer] Training Collaborative Filtering model...');
        // Collaborative doesn't require explicit training, just similarity calculations
        // Evaluate on test set
        const metrics = await (0, collaborative_1.evaluateCollaborativeModel)(validationUserIds, trainUserIds);
        return metrics;
    }
    catch (error) {
        console.error('[Trainer] Error training collaborative model:', error);
        throw error;
    }
}
/**
 * Compare model performance and return combined score
 */
function compareModels(cbMetrics, cfMetrics) {
    // Simple scoring: average of metrics
    const cbScore = (cbMetrics.precision3 + cbMetrics.recall3 + cbMetrics.map) / 3;
    const cfScore = (cfMetrics.precision3 + cfMetrics.recall3 + cfMetrics.map) / 3;
    console.log(`[Trainer] Content-Based score: ${cbScore.toFixed(3)}`);
    console.log(`[Trainer] Collaborative score: ${cfScore.toFixed(3)}`);
    return {
        bestModel: cbScore > cfScore ? 'content-based' : 'collaborative',
        score: Math.max(cbScore, cfScore),
    };
}
/**
 * MAIN: Train all models and store results
 */
async function trainRecommendationModels() {
    const startTime = Date.now();
    try {
        console.log('\n═══════════════════════════════════════════');
        console.log('  RECOMMENDATION MODEL TRAINING STARTED');
        console.log('═══════════════════════════════════════════\n');
        // 1. Prepare data
        const trainingData = await prepareTrainingData();
        // 2. Train content-based model
        console.log('\n→ Training Content-Based Model...');
        const cbMetrics = await trainContentBasedModel(trainingData.trainUserIds, trainingData.testUserIds);
        // 3. Train collaborative model
        console.log('\n→ Training Collaborative Filtering Model...');
        const cfMetrics = await trainCollaborativeModel(trainingData.trainUserIds, trainingData.testUserIds);
        // 4. Compare and select best model
        console.log('\n→ Comparing models...');
        const comparison = compareModels(cbMetrics, cfMetrics);
        // 5. Prepare result
        const elapsedTime = Date.now() - startTime;
        const result = {
            trainingTime: elapsedTime,
            timestamp: new Date().toISOString(),
            dataSize: trainingData.userIds.length,
            contentBasedMetrics: cbMetrics,
            collaborativeMetrics: cfMetrics,
            bestModel: comparison.bestModel,
            score: comparison.score,
        };
        console.log('\n═══════════════════════════════════════════');
        console.log('  TRAINING COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log('\nContent-Based Results:');
        console.log(`  Precision@3: ${cbMetrics.precision3.toFixed(3)}`);
        console.log(`  Recall@3: ${cbMetrics.recall3.toFixed(3)}`);
        console.log(`  MAP: ${cbMetrics.map.toFixed(3)}`);
        console.log(`  RMSE: ${cbMetrics.rmse.toFixed(3)}`);
        console.log('\nCollaborative Filtering Results:');
        console.log(`  Precision@3: ${cfMetrics.precision3.toFixed(3)}`);
        console.log(`  Recall@3: ${cfMetrics.recall3.toFixed(3)}`);
        console.log(`  MAP: ${cfMetrics.map.toFixed(3)}`);
        console.log(`  RMSE: ${cfMetrics.rmse.toFixed(3)}`);
        console.log(`\nBest Model: ${comparison.bestModel}`);
        console.log(`Training Time: ${elapsedTime}ms`);
        console.log(`Dataset Size: ${trainingData.userIds.length} users, ${trainingData.eventIds.length} events`);
        console.log('═══════════════════════════════════════════\n');
        // 6. Store results in database
        try {
            const { RecommendationModel } = await Promise.resolve().then(() => __importStar(require('../../models/RecommendationModel')));
            await RecommendationModel.create({
                modelType: 'hybrid',
                version: 1,
                trainingDate: new Date(),
                dataSize: trainingData.userIds.length,
                metrics: {
                    contentBased: cbMetrics,
                    collaborative: cfMetrics,
                    comparison,
                },
                isActive: true,
                accuracy: comparison.score,
            });
            console.log('[Trainer] Results stored in database');
        }
        catch (error) {
            console.warn('[Trainer] Could not store in database (model may not exist):', error);
        }
        return result;
    }
    catch (error) {
        console.error('[Trainer] Training failed:', error);
        throw error;
    }
}
/**
 * TEST: Get training data without full training
 */
async function getTrainingDataSummary() {
    return prepareTrainingData();
}
//# sourceMappingURL=trainer.js.map