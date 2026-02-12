import { Document } from 'mongoose';
export interface IAdminLog extends Document {
    userId: string;
    action: 'create' | 'update' | 'delete' | 'revoke' | 'approve' | 'reject';
    entityType: 'event' | 'admin_request' | 'user_role';
    entityId: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export declare const AdminLog: import("mongoose").Model<IAdminLog, {}, {}, {}, Document<unknown, {}, IAdminLog, {}, import("mongoose").DefaultSchemaOptions> & IAdminLog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any, IAdminLog>;
