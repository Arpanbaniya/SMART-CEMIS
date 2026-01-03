// backend/src/models/User.ts
import { Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  password?: string;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'student_admin' | 'super_admin';
  preference: 'physical' | 'innovative' | 'both';
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional for OAuth later
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  role: { 
    type: String, 
    enum: ['user', 'student_admin', 'super_admin'], 
    default: 'user' 
  },
  preference: { 
    type: String, 
    enum: ['physical', 'innovative', 'both'],
    default: 'both'
  },
  profileImageUrl: { type: String, default: null }
}, { timestamps: true });

// Map _id to id for frontend
userSchema.virtual('id').get(function () {
  return this._id.toString();
});

userSchema.set('toJSON', { virtuals: true });

export const User = model<IUser>('User', userSchema);