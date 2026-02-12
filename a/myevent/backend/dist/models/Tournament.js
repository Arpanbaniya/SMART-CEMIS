"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tournament = void 0;
// backend/src/models/Tournament.ts
const mongoose_1 = require("mongoose");
const matchSchema = new mongoose_1.Schema({
    participant1: { type: String, default: null },
    participant2: { type: String, default: null },
    winner: { type: String, default: null },
    score1: { type: Number },
    score2: { type: Number },
    isBye: { type: Boolean, default: false },
}, { _id: true });
const tournamentRoundSchema = new mongoose_1.Schema({
    roundNumber: { type: Number, required: true },
    matches: [matchSchema],
}, { _id: false });
const tournamentSchema = new mongoose_1.Schema({
    eventId: { type: String, required: true, ref: 'Event' },
    currentRound: { type: Number, default: 1 },
    isComplete: { type: Boolean, default: false },
    rounds: [tournamentRoundSchema],
}, { timestamps: true });
// Map _id to id for frontend
tournamentSchema.virtual('id').get(function () {
    return this._id.toString();
});
tournamentSchema.set('toJSON', { virtuals: true });
exports.Tournament = (0, mongoose_1.model)('Tournament', tournamentSchema);
//# sourceMappingURL=Tournament.js.map