"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.EVENT_STATUS = exports.EVENT_CATEGORIES = void 0;
// backend/src/models/Event.ts
const mongoose_1 = require("mongoose");
// Event Categories (moved from shared schema temporarily)
exports.EVENT_CATEGORIES = [
    "sports", "technology", "cultural", "academic", "music",
    "art", "workshop", "competition", "social", "other"
];
exports.EVENT_STATUS = ["draft", "upcoming", "ongoing", "completed", "cancelled"];
const eventSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: exports.EVENT_CATEGORIES, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, required: false },
    capacity: { type: Number, default: 100 },
    participantCount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    isSportsEvent: { type: Boolean, default: false },
    tournamentType: { type: String },
    status: { type: String, enum: exports.EVENT_STATUS, default: 'upcoming' },
    createdById: { type: String, required: true },
    imageUrl: { type: String },
    mapUrl: { type: String },
    isTeamEvent: { type: Boolean, default: false },
    maxTeams: { type: Number },
    maxTeamMembers: { type: Number },
    genderFixed: { type: String, enum: ['Male', 'Female', 'Other'], default: null },
}, { timestamps: true });
// ADD THIS: Map _id to id for frontend
eventSchema.virtual('id').get(function () {
    return this._id.toString();
});
eventSchema.set('toJSON', { virtuals: true });
exports.Event = (0, mongoose_1.model)('Event', eventSchema);
//# sourceMappingURL=Event.js.map