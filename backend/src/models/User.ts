// backend/src/models/User.ts
import { Schema, model } from 'mongoose';

export interface IUser {
  email: string;
  password?: string;
  firstName: string | null;
  lastName: string | null;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'student_admin' | 'super_admin';
  preference: 'physical' | 'innovative';
  phone?: string;
  bio?: string;
  profileImageUrl?: string | null;
  lastLogin?: Date;
  // Email verification fields
  isVerified: boolean; // default: false
  verificationToken?: string; // hashed token
  verificationExpires?: Date; // expires 1 hour after creation
  lastVerificationSentAt?: Date; // for resend cooldown
  // Email change fields
  pendingEmail?: string; // New email waiting for verification
  pendingEmailToken?: string; // Hashed token for verification
  pendingEmailExpiresAt?: Date; // Expiry time for token
  lastEmailChangeRequest?: Date; // For rate limiting
  // Student details for event registration
  semester?: number;
  rollNo?: string;
  programme?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional for OAuth later
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    default: null
  },
  role: { 
    type: String, 
    enum: ['user', 'student_admin', 'super_admin'], 
    default: 'user' 
  },
  preference: { 
    type: String, 
    enum: ['physical', 'innovative'],
    default: 'physical'
  },
  phone: { type: String, default: undefined },
  bio: { type: String, default: undefined },
  profileImageUrl: { type: String, default: null },
  lastLogin: { type: Date },
  // Email verification fields
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: undefined },
  verificationExpires: { type: Date, default: undefined },
  lastVerificationSentAt: { type: Date, default: undefined },
  // Email change fields
  pendingEmail: { type: String, default: undefined },
  pendingEmailToken: { type: String, default: undefined },
  pendingEmailExpiresAt: { type: Date, default: undefined },
  lastEmailChangeRequest: { type: Date, default: undefined },
  // Student details for event registration
  semester: { type: Number, min: 1, max: 8 },
  rollNo: { type: String },
  programme: { 
    type: String, 
    enum: ['Bachelor of Computer Engineering', 'Bachelor of Software Engineering', 'Bachelor of Civil Engineering', 'Bachelor of Electrical Engineering', 'Bachelor of Mechanical Engineering', 'Bachelor of Chemical Engineering', 'Other']
  }
}, { timestamps: true });

// Map _id to id for frontend
userSchema.virtual('id').get(function () {
  return this._id.toString();
});

userSchema.set('toJSON', { virtuals: true });

export const User = model<IUser>('User', userSchema);