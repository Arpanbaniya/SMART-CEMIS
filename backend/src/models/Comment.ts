import { Schema, model, Document } from 'mongoose';

export interface IComment extends Document {
  eventId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editedAt?: Date;
}

const commentSchema = new Schema<IComment>({
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
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
commentSchema.virtual('id').get(function () {
  return this._id.toString();
});

commentSchema.set('toJSON', { virtuals: true });

export const Comment = model<IComment>('Comment', commentSchema);
