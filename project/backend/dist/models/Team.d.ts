export interface ITeam {
    name: string;
    members: string[];
    eventId: string;
}
export declare const Team: import("mongoose").Model<ITeam, {}, {}, {}, import("mongoose").Document<unknown, {}, ITeam, {}, import("mongoose").DefaultSchemaOptions> & ITeam & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, ITeam>;
