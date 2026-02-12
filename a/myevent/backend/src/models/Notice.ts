// backend/src/models/Notice.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  isPinned: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  emailNotificationSent: boolean;
  emailSentAt?: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emailNotificationSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for sorting by creation date and pinned status
NoticeSchema.index({ isPinned: -1, createdAt: -1 });

export const Notice = mongoose.model<INotice>('Notice', NoticeSchema);
