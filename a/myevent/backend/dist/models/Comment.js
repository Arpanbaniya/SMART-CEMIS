"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    eventId: {
        type: String,
        required: true,
        ref: 'Event'
    },
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
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
commentSchema.virtual('id').get(function () {
    return this._id.toString();
});
commentSchema.set('toJSON', { virtuals: true });
exports.Comment = (0, mongoose_1.model)('Comment', commentSchema);
//# sourceMappingURL=Comment.js.map