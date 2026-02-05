// backend/src/models/Favorite.ts
import { Schema, model } from 'mongoose';

export interface IFavorite {
  userId: string;
  eventId: string;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>({
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

export const Favorite = model<IFavorite>('Favorite', favoriteSchema);
