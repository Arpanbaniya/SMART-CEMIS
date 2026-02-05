export interface IUser {
    email: string;
    password?: string;
    firstName: string | null;
    lastName: string | null;
    gender?: 'male' | 'female' | 'other';
    role: 'user' | 'student_admin' | 'super_admin';
    preference: 'physical' | 'innovative' | 'both';
    profileImageUrl?: string | null;
    lastLogin?: Date;
    isVerified: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
    lastVerificationSentAt?: Date;
    semester?: number;
    rollNo?: string;
    programme?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IUser>;
