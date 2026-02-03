"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLog = void 0;
const mongoose_1 = require("mongoose");
const adminLogSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'update', 'delete', 'revoke', 'approve', 'reject']
    },
    entityType: {
        type: String,
        required: true,
        enum: ['event', 'admin_request', 'user_role']
    },
    entityId: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true,
        maxlength: 1000
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });
// Index for efficient queries
adminLogSchema.index({ userId: 1, createdAt: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 });
// Map _id to id for frontend
adminLogSchema.virtual('id').get(function () {
    return this._id.toString();
});
adminLogSchema.set('toJSON', { virtuals: true });
exports.AdminLog = (0, mongoose_1.model)('AdminLog', adminLogSchema);
//# sourceMappingURL=AdminLog.js.map