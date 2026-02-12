"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRequest = void 0;
// backend/src/models/AdminRequest.ts
const mongoose_1 = require("mongoose");
const adminRequestSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    eventId: { type: String, default: null },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    message: { type: String, required: true },
    eventDescription: { type: String, default: null },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    usedForEventCreation: { type: Boolean, default: false },
}, { timestamps: true });
// Map _id to id for frontend
adminRequestSchema.virtual('id').get(function () {
    return this._id.toString();
});
adminRequestSchema.set('toJSON', { virtuals: true });
exports.AdminRequest = (0, mongoose_1.model)('AdminRequest', adminRequestSchema);
//# sourceMappingURL=AdminRequest.js.map