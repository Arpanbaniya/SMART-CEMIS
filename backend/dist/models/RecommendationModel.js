"use strict";
/**
 * RECOMMENDATION MODEL
 *
 * Stores training results, metrics, and model metadata
 * Used for tracking model performance over time
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
exports.RecommendationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const recommendationModelSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
// Index for quick lookups
recommendationModelSchema.index({ trainingDate: -1 });
recommendationModelSchema.index({ isActive: 1 });
exports.RecommendationModel = mongoose_1.default.model('RecommendationModel', recommendationModelSchema);
//# sourceMappingURL=RecommendationModel.js.map