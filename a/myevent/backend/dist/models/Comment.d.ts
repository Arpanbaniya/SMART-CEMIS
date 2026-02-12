import { Document } from 'mongoose';
export interface IComment extends Document {
    eventId: string;
    userId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    isEdited: boolean;
    editedAt?: Date;
}
export declare const Comment: import("mongoose").Model<IComment, {}, {}, {}, Document<unknown, {}, IComment, {}, import("mongoose").DefaultSchemaOptions> & IComment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any, IComment>;
