import { Schema, model, Document } from 'mongoose';

export interface IAdminLog extends Document {
  userId: string;
  action: 'create' | 'update' | 'delete' | 'revoke' | 'approve' | 'reject';
  entityType: 'event' | 'admin_request' | 'user_role';
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const adminLogSchema = new Schema<IAdminLog>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'revoke', 'approve', 'reject']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['event', 'admin_request', 'user_role']
  },
  entityId: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true,
    maxlength: 1000
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, { timestamps: true });

// Index for efficient queries
adminLogSchema.index({ userId: 1, createdAt: -1 });
adminLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
adminLogSchema.index({ createdAt: -1 });

// Map _id to id for frontend
adminLogSchema.virtual('id').get(function () {
  return this._id.toString();
});

adminLogSchema.set('toJSON', { virtuals: true });

export const AdminLog = model<IAdminLog>('AdminLog', adminLogSchema);
