export interface IMatch {
    _id?: string;
    participant1: string | null;
    participant2: string | null;
    winner: string | null;
    score1?: number;
    score2?: number;
    isBye: boolean;
}
export interface ITournamentRound {
    roundNumber: number;
    matches: IMatch[];
}
export interface ITournament {
    eventId: string;
    currentRound: number;
    isComplete: boolean;
    rounds: ITournamentRound[];
}
export declare const Tournament: import("mongoose").Model<ITournament, {}, {}, {}, import("mongoose").Document<unknown, {}, ITournament, {}, import("mongoose").DefaultSchemaOptions> & ITournament & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, ITournament>;
