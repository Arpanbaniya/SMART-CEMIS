<<<<<<< HEAD
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
=======
/**
 * Payment Model - Manages payment records and transactions
 * 
 * This model stores all payment transactions for event registrations.
 * It tracks payment status, transaction details, and stores both verification
 * and registration data for post-payment processing.
 * 
 * Workflow:
 *   1. User initiates payment for an event
 *   2. Payment record created with 'initiated' status
 *   3. User completes payment via eSewa gateway
 *   4. eSewa callback verifies payment and updates status to 'completed'
 *   5. Event registration is automatically created after verification
 */

// backend/src/models/Payment.ts
import { Schema, model } from 'mongoose';

/** Payment status at different stages of the transaction */
export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed';

/** Supported payment methods (currently only eSewa) */
export type PaymentMethod = 'esewa' | 'other';

/**
 * IPayment Interface - Defines the structure of a payment document
 */
export interface IPayment {
  /** Reference to the User who made the payment */
  userId: string;
  
  /** Reference to the Event being registered for */
  eventId: string;
  
  /** Amount in paisa (1 rupee = 100 paisa). Always store amounts in paisa to avoid floating-point errors */
  amount: number;
  
  /** Current status of the payment transaction */
  status: PaymentStatus;
  
  /** Unique transaction identifier from eSewa (ref_id). Set after successful payment verification */
  transactionId?: string;
  
  /** Payment method used (currently only 'esewa' is supported) */
  method: PaymentMethod;
  
  /**
   * eSewa API verification response stored for audit trail and debugging.
   * Contains status, ref_id, and other eSewa-returned data
   */
  verificationData?: any;
  
  /**
   * Registration data (studentName, email, etc.) stored temporarily.
   * After payment is verified, this data is used to create the Event Registration.
   * This prevents losing registration details if payment callback fails.
   */
  registrationData?: any;
  
  /** Flag indicating whether payment confirmation email has been sent to user */
  emailSent?: boolean;
  
  /** Timestamp when payment record was created (auto-managed by MongoDB 'timestamps' option) */
  createdAt: Date;
}

/**
 * Payment Schema - Database schema for MongoDB
 * - Validates enum values for status and method
 * - Auto-generates createdAt and updatedAt timestamps
 * - Stores flexible JSON data using Schema.Types.Mixed for API responses
 */
const paymentSchema = new Schema<IPayment>({
  /** User who initiated the payment */
  userId: { type: String, required: true },
  
  /** Event for which payment is being made */
  eventId: { type: String, required: true },
  
  /** Amount in paisa (e.g., 50000 = NPR 500) */
  amount: { type: Number, required: true },
  
  /** Payment transaction status - starts as 'initiated', becomes 'completed' after eSewa verification */
>>>>>>> 6fc2a7b (google maps, google calender added)
  status: { 
    type: String, 
    enum: ['initiated', 'pending', 'completed', 'failed'], 
    default: 'initiated' 
  },
<<<<<<< HEAD
  transactionId: { type: String },
=======
  
  /** eSewa reference ID (ref_id) - unique identifier from eSewa gateway */
  transactionId: { type: String },
  
  /** Payment method - currently defaults to 'esewa' */
>>>>>>> 6fc2a7b (google maps, google calender added)
  method: { 
    type: String, 
    enum: ['esewa', 'other'], 
    default: 'esewa',
    required: true 
  },
<<<<<<< HEAD
  verificationData: { type: Schema.Types.Mixed },
  registrationData: { type: Schema.Types.Mixed },
=======
  
  /** Stores the full eSewa API verification response for auditing */
  verificationData: { type: Schema.Types.Mixed },
  
  /** Stores registration form data (name, email, etc.) to create registration after payment */
  registrationData: { type: Schema.Types.Mixed },
  
  /** Tracks if confirmation email has been sent to prevent duplicate emails */
>>>>>>> 6fc2a7b (google maps, google calender added)
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

export const Payment = model<IPayment>('Payment', paymentSchema);