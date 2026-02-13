import { Schema, model } from 'mongoose';

export interface IChatFile {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface IChatMessage {
  userId: string;
  username: string;
  userRole: 'student_admin' | 'super_admin';
  content: string;
  files?: IChatFile[];
  isDeleted: boolean;
  deletedBy?: string; // userId who deleted
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatFileSchema = new Schema<IChatFile>({
  fileName: { type: String, required: true },
  originalFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const chatMessageSchema = new Schema<IChatMessage>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    userRole: { type: String, enum: ['student_admin', 'super_admin'], required: true },
    content: { type: String, required: true },
    files: [chatFileSchema],
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: String },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
