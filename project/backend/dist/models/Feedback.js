"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const mongoose_1 = require("mongoose");
const feedbackSchema = new mongoose_1.Schema({
    eventId: {
        type: String,
        required: true,
        ref: 'Event'
    },
    userId: {
        type: String,
        ref: 'User'
    },
    registrationId: {
        type: String,
        ref: 'Registration'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral'
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },
    flagged: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, { timestamps: true });
// Map _id to id for frontend
feedbackSchema.virtual('id').get(function () {
    return this._id.toString();
});
feedbackSchema.set('toJSON', { virtuals: true });
exports.Feedback = (0, mongoose_1.model)('Feedback', feedbackSchema);
//# sourceMappingURL=Feedback.js.map