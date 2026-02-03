import mongoose, { Document } from 'mongoose';
export interface IRegistration extends Document {
    userId: string;
    eventId: string;
    registeredAt: Date;
    status: 'registered' | 'cancelled' | 'completed';
    teamName?: string;
    teamMembers?: string[];
    studentName: string;
    semester: number;
    rollNo: string;
    programme: string;
    email: string;
    gender: 'male' | 'female' | 'other';
}
export declare const Registration: mongoose.Model<IRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IRegistration, {}, mongoose.DefaultSchemaOptions> & IRegistration & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, IRegistration>;
