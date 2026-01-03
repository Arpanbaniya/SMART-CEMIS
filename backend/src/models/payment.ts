// backend/src/models/Payment.ts
import { Schema, model } from 'mongoose';

export interface IPayment {
  userId: string;
  eventId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  method: string;
  emailSent?: boolean;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  transactionId: { type: String },
  method: { type: String, required: true },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

export const Payment = model<IPayment>('Payment', paymentSchema);