export interface IChatFile {
    fileName: string;
    originalFileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
}
export interface IChatMessage {
    userId: string;
    username: string;
    userRole: 'student_admin' | 'super_admin';
    content: string;
    files?: IChatFile[];
    isDeleted: boolean;
    deletedBy?: string;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatMessage: import("mongoose").Model<IChatMessage, {}, {}, {}, import("mongoose").Document<unknown, {}, IChatMessage, {}, import("mongoose").DefaultSchemaOptions> & IChatMessage & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IChatMessage>;
