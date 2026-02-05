// backend/src/models/Event.ts
import { Schema, model } from 'mongoose';

// Event Categories (moved from shared schema temporarily)
export const EVENT_CATEGORIES = [
  "sports", "technology", "cultural", "academic", "music",
  "art", "workshop", "competition", "social", "other"
] as const;

export const EVENT_STATUS = ["draft", "upcoming", "ongoing", "completed", "cancelled"] as const;

export interface IEvent {
  title: string;
  description: string;
  category: string;
  date: Date;
  time: string;
  location?: string;
  capacity: number;
  participantCount: number;
  isPaid: boolean;
  price: number;
  isSportsEvent: boolean;
  tournamentType?: string;
  status: string;
  createdById: string;
  imageUrl?: string;
  mapUrl?: string;
  isTeamEvent?: boolean;
  maxTeams?: number;
  maxTeamMembers?: number;
  genderFixed?: 'Male' | 'Female' | 'Other' | null;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: EVENT_CATEGORIES, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: false },
  capacity: { type: Number, default: 100 },
  participantCount: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  isSportsEvent: { type: Boolean, default: false },
  tournamentType: { type: String },
  status: { type: String, enum: EVENT_STATUS, default: 'upcoming' },
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

export const Event = model<IEvent>('Event', eventSchema);