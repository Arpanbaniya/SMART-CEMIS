// backend/src/models/Event.ts
import { Schema, model } from 'mongoose';
import { EVENT_CATEGORIES, EVENT_STATUS } from '../../../shared/schema';

export interface IEvent {
  title: string;
  description: string;
  category: string;
  date: Date;
  time: string;
  location: string;
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
}

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: EVENT_CATEGORIES, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
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
}, { timestamps: true });

// ✅ ADD THIS: Map _id to id for frontend
eventSchema.virtual('id').get(function () {
  return this._id.toString();
});

eventSchema.set('toJSON', { virtuals: true });

export const Event = model<IEvent>('Event', eventSchema);