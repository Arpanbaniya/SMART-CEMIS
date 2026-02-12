/**
 * RECOMMENDATION MODEL
 * 
 * Stores training results, metrics, and model metadata
 * Used for tracking model performance over time
 */

import mongoose, { Schema, Document } from 'mongoose';

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

const recommendationModelSchema = new Schema<IRecommendationModel>(
  {
    modelType: {
      type: String,
      enum: ['content-based', 'collaborative', 'hybrid'],
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    trainingDate: {
      type: Date,
      required: true,
    },
    dataSize: {
      type: Number,
      required: true,
      description: 'Number of users used in training',
    },
    metrics: {
      contentBased: {
        precision3: Number,
        recall3: Number,
        map: Number,
        rmse: Number,
        testSetSize: Number,
        trainingSize: Number,
      },
      collaborative: {
        precision3: Number,
        recall3: Number,
        map: Number,
        rmse: Number,
        testSetSize: Number,
        trainingSize: Number,
      },
      comparison: {
        bestModel: {
          type: String,
          enum: ['content-based', 'collaborative'],
        },
        score: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
recommendationModelSchema.index({ trainingDate: -1 });
recommendationModelSchema.index({ isActive: 1 });

export const RecommendationModel = mongoose.model<IRecommendationModel>(
  'RecommendationModel',
  recommendationModelSchema
);
