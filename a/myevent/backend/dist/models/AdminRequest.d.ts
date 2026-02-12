export interface IAdminRequest {
    userId: string;
    eventId?: string;
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    eventDescription?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
    usedForEventCreation?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AdminRequest: import("mongoose").Model<IAdminRequest, {}, {}, {}, import("mongoose").Document<unknown, {}, IAdminRequest, {}, import("mongoose").DefaultSchemaOptions> & IAdminRequest & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IAdminRequest>;
