"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Favorite = void 0;
// backend/src/models/Favorite.ts
const mongoose_1 = require("mongoose");
const favoriteSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
}, { timestamps: true });
// Create a compound index to ensure a user can only favorite an event once
favoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });
// Map _id to id for frontend
favoriteSchema.virtual('id').get(function () {
    return this._id.toString();
});
favoriteSchema.set('toJSON', { virtuals: true });
exports.Favorite = (0, mongoose_1.model)('Favorite', favoriteSchema);
//# sourceMappingURL=Favorite.js.map