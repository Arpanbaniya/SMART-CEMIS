// shared/models/auth.ts

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string; // ISO string (e.g., "2025-12-27T10:00:00Z")
  updatedAt: string;
}

// Optional: If you ever need session typing (less critical for frontend)
export interface Session {
  sid: string;
  sess: any; // or define more precisely later
  expire: string;
}