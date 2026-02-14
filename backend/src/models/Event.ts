import { Schema, model } from 'mongoose';

export const EVENT_CATEGORIES = [
  "sports", "technology", "cultural", "academic", "music",
  "art", "workshop", "competition", "social", "other"
] as const;

export const EVENT_STATUS = ["draft", "upcoming", "live", "completed", "archived", "cancelled"] as const;

export interface IEvent {
  title: string;
  description: string;
  category: string;
  date: Date;
  time: string;
  endDate: Date; // End date
  endTime: string; // End time
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
  isCancelled?: boolean; // If event was cancelled
  archivedAt?: Date; // When the event was archived (5 days after completion)
  createdAt?: Date;
  updatedAt?: Date;
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: EVENT_CATEGORIES, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  endDate: { type: Date, required: true },
  endTime: { type: String, required: true },
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
  isCancelled: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
}, { timestamps: true });

eventSchema.virtual('id').get(function () {
  return this._id.toString();
});

eventSchema.set('toJSON', { virtuals: true });

export const Event = model<IEvent>('Event', eventSchema);