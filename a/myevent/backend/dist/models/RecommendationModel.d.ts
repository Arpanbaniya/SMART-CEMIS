/**
 * RECOMMENDATION MODEL
 *
 * Stores training results, metrics, and model metadata
 * Used for tracking model performance over time
 */
import mongoose, { Document } from 'mongoose';
export interface IRecommendationModel extends Document {
    modelType: 'content-based' | 'collaborative' | 'hybrid';
    version: number;
    trainingDate: Date;
    dataSize: number;
    metrics: {
        contentBased: {
            precision3: number;
            recall3: number;
            map: number;
            rmse: number;
            testSetSize: number;
            trainingSize: number;
        };
        collaborative: {
            precision3: number;
            recall3: number;
            map: number;
            rmse: number;
            testSetSize: number;
            trainingSize: number;
        };
        comparison: {
            bestModel: 'content-based' | 'collaborative';
            score: number;
        };
    };
    isActive: boolean;
    accuracy: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const RecommendationModel: mongoose.Model<IRecommendationModel, {}, {}, {}, mongoose.Document<unknown, {}, IRecommendationModel, {}, mongoose.DefaultSchemaOptions> & IRecommendationModel & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRecommendationModel>;
