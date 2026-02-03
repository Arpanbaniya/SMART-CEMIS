"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
// backend/src/models/Team.ts
const mongoose_1 = require("mongoose");
const teamSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    members: [{ type: String, required: true }],
    eventId: { type: String, required: true, ref: 'Event' },
}, { timestamps: true });
// Map _id to id for frontend
teamSchema.virtual('id').get(function () {
    return this._id.toString();
});
teamSchema.set('toJSON', { virtuals: true });
exports.Team = (0, mongoose_1.model)('Team', teamSchema);
//# sourceMappingURL=Team.js.map