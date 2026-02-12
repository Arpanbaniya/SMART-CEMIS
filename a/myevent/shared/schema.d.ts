export declare const EVENT_CATEGORIES: readonly ["sports", "technology", "cultural", "academic", "music", "art", "workshop", "competition", "social", "other"];
export declare const USER_ROLES: readonly ["user", "student_admin", "super_admin"];
export declare const EVENT_STATUS: readonly ["draft", "upcoming", "ongoing", "completed", "cancelled"];
export declare const USER_PREFERENCES: readonly ["physical", "innovative", "both"];
export type EventCategory = typeof EVENT_CATEGORIES[number];
export type UserRole = typeof USER_ROLES[number];
export type EventStatus = typeof EVENT_STATUS[number];
export type UserPreference = typeof USER_PREFERENCES[number];
export interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    gender?: 'male' | 'female' | 'other';
    role: UserRole;
    preference: UserPreference;
    profileImageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface Event {
    id: string;
    title: string;
    description: string;
    category: EventCategory;
    date: string;
    time: string;
    location: string;
    capacity: number;
    participantCount: number;
    isPaid: boolean;
    price: number;
    isSportsEvent: boolean;
    tournamentType?: string;
    status: EventStatus;
    createdById: string;
    imageUrl?: string;
    mapUrl?: string;
    timezone?: string;
    durationMinutes?: number;
    isTeamEvent?: boolean;
    maxTeams?: number;
    maxTeamMembers?: number;
    genderFixed?: 'Male' | 'Female' | 'Other' | null;
    createdAt: string;
    updatedAt: string;
    created_at: string;
    updated_at: string;
}
export interface AdminRequest {
    id: string;
    userId: string;
    eventId?: string;
    status: 'pending' | 'approved' | 'rejected';
    message: string;
    eventDescription?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    rejectionReason?: string;
    usedForEventCreation?: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Payment {
    id: string;
    userId: string;
    eventId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    method: string;
    createdAt: string;
}
export interface Feedback {
    id: string;
    eventId: string;
    userId: string | {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    rating?: number;
    comment?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    isEdited?: boolean;
    editedAt?: string;
    createdAt: string;
}
export interface Comment {
    id: string;
    eventId: string;
    userId: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        profileImageUrl?: string | null;
    };
    content: string;
    createdAt: string;
    updatedAt?: string;
    isEdited: boolean;
    editedAt?: string;
}
export interface Registration {
    id: string;
    eventId: string;
    userId: string;
    studentName: string;
    semester: number;
    rollNo: string;
    programme: string;
    email: string;
    gender: 'male' | 'female' | 'other';
    teamName?: string;
    teamMembers?: string[];
    paymentStatus?: 'pending' | 'completed' | 'failed';
    paymentAmount?: number;
    status?: 'registered' | 'cancelled' | 'attended';
    createdAt: string;
}
export interface UserProfile {
    id: string;
    userId: string;
    role: UserRole;
    preference: UserPreference;
    phone?: string;
    bio?: string;
    createdAt: string;
    updatedAt: string;
}
export interface Match {
    id: string;
    participant1: string | null;
    participant2: string | null;
    winner: string | null;
    score1?: number;
    score2?: number;
    isBye: boolean;
}
export interface TournamentRound {
    roundNumber: number;
    matches: Match[];
}
export interface Tournament {
    id: string;
    eventId: string;
    currentRound: number;
    isComplete: boolean;
    rounds: TournamentRound[];
    createdAt: string;
    updatedAt: string;
}
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    eventId?: string;
    createdAt: string;
}
export interface Favorite {
    id: string;
    userId: string;
    eventId: string;
    createdAt: string;
}
