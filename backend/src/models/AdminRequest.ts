// backend/src/models/AdminRequest.ts
import { Schema, model } from 'mongoose';

export interface IAdminRequest {
  userId: string;
  eventId?: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  eventDescription?: string; // Description of the event they want to create
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminRequestSchema = new Schema<IAdminRequest>({
  userId: { type: String, required: true },
  eventId: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  message: { type: String, required: true },
  eventDescription: { type: String, default: null },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

// Map _id to id for frontend
adminRequestSchema.virtual('id').get(function () {
  return this._id.toString();
});

adminRequestSchema.set('toJSON', { virtuals: true });

export const AdminRequest = model<IAdminRequest>('AdminRequest', adminRequestSchema);

