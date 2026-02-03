export interface IFavorite {
    userId: string;
    eventId: string;
    createdAt: Date;
}
export declare const Favorite: import("mongoose").Model<IFavorite, {}, {}, {}, import("mongoose").Document<unknown, {}, IFavorite, {}, import("mongoose").DefaultSchemaOptions> & IFavorite & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IFavorite>;
