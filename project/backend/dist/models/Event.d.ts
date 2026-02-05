export declare const EVENT_CATEGORIES: readonly ["sports", "technology", "cultural", "academic", "music", "art", "workshop", "competition", "social", "other"];
export declare const EVENT_STATUS: readonly ["draft", "upcoming", "ongoing", "completed", "cancelled"];
export interface IEvent {
    title: string;
    description: string;
    category: string;
    date: Date;
    time: string;
    location?: string;
    capacity: number;
    participantCount: number;
    isPaid: boolean;
    price: number;
    isSportsEvent: boolean;
    tournamentType?: string;
    status: string;
    createdById: string;
    imageUrl?: string;
    mapUrl?: string;
    isTeamEvent?: boolean;
    maxTeams?: number;
    maxTeamMembers?: number;
    genderFixed?: 'Male' | 'Female' | 'Other' | null;
}
export declare const Event: import("mongoose").Model<IEvent, {}, {}, {}, import("mongoose").Document<unknown, {}, IEvent, {}, import("mongoose").DefaultSchemaOptions> & IEvent & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, IEvent>;
