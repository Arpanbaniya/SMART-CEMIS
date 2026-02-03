// client/src/lib/constants.ts
// Event Categories (client-side constants)
export const EVENT_CATEGORIES = [
  "sports", "technology", "cultural", "academic", "music",
  "art", "workshop", "competition", "social", "other"
] as const;

export const EVENT_STATUS = ["draft", "upcoming", "ongoing", "completed", "cancelled"] as const;
export const USER_ROLES = ["user", "student_admin", "super_admin"] as const;
