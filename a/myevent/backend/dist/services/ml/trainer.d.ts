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
import { ContentBasedMetrics } from './contentBased';
import { CollaborativeMetrics } from './collaborative';
export interface TrainingData {
    userIds: string[];
    eventIds: string[];
    trainUserIds: string[];
    validationUserIds: string[];
    testUserIds: string[];
}
export interface TrainingResult {
    trainingTime: number;
    timestamp: string;
    dataSize: number;
    contentBasedMetrics: ContentBasedMetrics;
    collaborativeMetrics: CollaborativeMetrics;
    bestModel: 'content-based' | 'collaborative';
    score: number;
}
export interface ModelMetadata {
    _id?: string;
    modelType: 'content-based' | 'collaborative' | 'hybrid';
    version: number;
    trainingDate: Date;
    dataSize: number;
    metrics: ContentBasedMetrics | CollaborativeMetrics;
    isActive: boolean;
    accuracy: number;
}
/**
 * MAIN: Train all models and store results
 */
export declare function trainRecommendationModels(): Promise<TrainingResult>;
/**
 * TEST: Get training data without full training
 */
export declare function getTrainingDataSummary(): Promise<TrainingData>;
