// client/src/lib/types.ts
// Type definitions (client-side)

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'student_admin' | 'super_admin';
  preference: 'physical' | 'innovative' | 'both';
  profileImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: "sports" | "technology" | "cultural" | "academic" | "music" | "art" | "workshop" | "competition" | "social" | "other";
  date: string;
  time: string;
  location: string;
  capacity: number;
  participantCount: number;
  isPaid: boolean;
  price: number;
  isSportsEvent: boolean;
  tournamentType?: string;
  status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled";
  createdById: string;
  imageUrl?: string;
  mapUrl?: string;
  isTeamEvent?: boolean;
  maxTeams?: number;
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
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  teamName?: string;
  teamMembers?: string[];
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  status?: 'registered' | 'cancelled' | 'attended';
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
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  editedAt?: string;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  editedAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  eventId: string;
  amount: number;
  currency?: 'NPR';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  method: string;
  failureReason?: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  event?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  role: 'user' | 'student_admin' | 'super_admin';
  preference: 'physical' | 'innovative' | 'both';
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserPreference = 'physical' | 'innovative' | 'both';
