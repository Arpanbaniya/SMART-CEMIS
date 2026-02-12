// backend/src/models/Team.ts
import { Schema, model } from 'mongoose';

export interface ITeam {
  name: string;
  members: string[];
  eventId: string;
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  members: [{ type: String, required: true }],
  eventId: { type: String, required: true, ref: 'Event' },
}, { timestamps: true });

// Map _id to id for frontend
teamSchema.virtual('id').get(function () {
  return this._id.toString();
});

teamSchema.set('toJSON', { virtuals: true });

export const Team = model<ITeam>('Team', teamSchema);
