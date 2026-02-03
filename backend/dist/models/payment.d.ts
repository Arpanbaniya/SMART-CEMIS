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
export declare const Payment: import("mongoose").Model<IPayment, {}, {}, {}, import("mongoose").Document<unknown, {}, IPayment, {}, import("mongoose").DefaultSchemaOptions> & IPayment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IPayment>;
