export type PaymentStatus = 'initiated' | 'pending' | 'completed' | 'failed';
export type PaymentMethod = 'esewa' | 'other';
export interface IPayment {
    userId: string;
    eventId: string;
    amount: number;
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
export declare const Payment: import("mongoose").Model<IPayment, {}, {}, {}, import("mongoose").Document<unknown, {}, IPayment, {}, import("mongoose").DefaultSchemaOptions> & IPayment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IPayment>;
