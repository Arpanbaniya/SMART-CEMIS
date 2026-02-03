import { Document } from 'mongoose';
export interface IFeedback extends Document {
    eventId: string;
    userId?: string;
    registrationId?: string;
    rating?: number;
    comment?: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence?: number;
    flagged?: boolean;
    isEdited?: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Feedback: import("mongoose").Model<IFeedback, {}, {}, {}, Document<unknown, {}, IFeedback, {}, import("mongoose").DefaultSchemaOptions> & IFeedback & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any, IFeedback>;
