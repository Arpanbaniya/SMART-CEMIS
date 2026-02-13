import mongoose, { Document } from 'mongoose';
export interface INotice extends Document {
    title: string;
    content: string;
    isPinned: boolean;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    emailNotificationSent: boolean;
    emailSentAt?: Date;
}
export declare const Notice: mongoose.Model<INotice, {}, {}, {}, mongoose.Document<unknown, {}, INotice, {}, mongoose.DefaultSchemaOptions> & INotice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, INotice>;
