import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  userId: string;
  eventId: string;
  registeredAt: Date;
  status: 'registered' | 'cancelled' | 'completed';
  teamName?: string;
  teamMembers?: string[];
  // Student details at time of registration
  studentName: string;
  semester: number;
  rollNo: string;
  programme: string;
  email: string;
  gender: 'male' | 'female' | 'other';
}

const RegistrationSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'completed'],
    default: 'registered'
  },
  teamName: {
    type: String,
  },
  teamMembers: [{
    type: String
  }],
  // Student details at time of registration
  studentName: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  rollNo: {
    type: String,
    required: true
  },
  programme: {
    type: String,
    required: true,
    enum: ['Bachelor of Computer Engineering', 'Bachelor of Software Engineering', 'Bachelor of Civil Engineering', 'Bachelor of Electrical Engineering', 'Bachelor of Mechanical Engineering', 'Bachelor of Chemical Engineering', 'Other']
  },
  email: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  }
});

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);