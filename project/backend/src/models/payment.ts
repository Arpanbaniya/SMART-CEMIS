// backend/src/models/Payment.ts
import { Schema, model } from 'mongoose';

export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'esewa' | 'other';

export interface IPayment {
  userId: string;
  eventId: string;
  amount: number; // in paisa
  status: PaymentStatus;
  transactionId?: string;
  method: PaymentMethod;
  /**
   * eSewa verification data stored for audit trail
   */
  verificationData?: any;
  /**
   * Registration data to be used after payment is verified
   */
  registrationData?: any;
  emailSent?: boolean;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['initiated', 'pending', 'completed', 'failed'], 
    default: 'initiated' 
  },
  transactionId: { type: String },
  method: { 
    type: String, 
    enum: ['esewa', 'other'], 
    default: 'esewa',
    required: true 
  },
  verificationData: { type: Schema.Types.Mixed },
  registrationData: { type: Schema.Types.Mixed },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

export const Payment = model<IPayment>('Payment', paymentSchema);