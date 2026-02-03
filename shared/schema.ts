// shared/schema.ts

// ====== CONSTANTS ======
export const EVENT_CATEGORIES = [
  "sports", "technology", "cultural", "academic", "music",
  "art", "workshop", "competition", "social", "other"
] as const;

export const USER_ROLES = ["user", "student_admin", "super_admin"] as const;
export const EVENT_STATUS = ["draft", "upcoming", "ongoing", "completed", "cancelled"] as const;
export const USER_PREFERENCES = ["physical", "innovative", "both"] as const;

// ====== REUSABLE TYPES ======
export type EventCategory = typeof EVENT_CATEGORIES[number];
export type UserRole = typeof USER_ROLES[number];
export type EventStatus = typeof EVENT_STATUS[number];
export type UserPreference = typeof USER_PREFERENCES[number];

// ====== TYPE DEFINITIONS ======
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
  category: EventCategory; // 
  date: string;
  time: string;
  location: string;
  capacity: number;
  participantCount: number;
  isPaid: boolean;
  price: number;
  isSportsEvent: boolean;
  tournamentType?: string;
  status: EventStatus; // 
  createdById: string;
  imageUrl?: string;
  mapUrl?: string;
  timezone?: string; // Optional timezone for calendar integration
  durationMinutes?: number; // Optional duration for calendar integration
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
  eventDescription?: string; // Description of the event they want to create
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string; // Reason for rejection
  usedForEventCreation?: boolean; // Track if this approved request has been used
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

// ====== OPTIONAL: FUTURE FEATURES ======
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