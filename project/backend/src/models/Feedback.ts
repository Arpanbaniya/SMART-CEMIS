import { Schema, model, Document } from 'mongoose';

export interface IFeedback extends Document {
  eventId: string;
  userId?: string;
  registrationId?: string;
  rating?: number;
  comment?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  flagged?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  userId: {
    type: String,
    ref: 'User'
  },
  registrationId: {
    type: String,
    ref: 'Registration'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  flagged: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, { timestamps: true });

// Map _id to id for frontend
feedbackSchema.virtual('id').get(function () {
  return this._id.toString();
});

feedbackSchema.set('toJSON', { virtuals: true });

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);
