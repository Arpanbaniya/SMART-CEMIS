// backend/src/validation/eventValidation.ts
import { z } from 'zod';

// Event categories (synced with shared/schema.ts)
const EVENT_CATEGORIES = [
  "sports", "technology", "cultural", "academic", "music",
  "art", "workshop", "competition", "social", "other"
] as const;

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(EVENT_CATEGORIES, { message: 'Invalid category' }),
  date: z.string().min(1, 'Date is required'), // Fix: frontend sends date string like "2024-12-31"
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  imageUrl: z.string().url().optional().or(z.literal('')), // Add image URL field
  mapUrl: z.string().url().optional().or(z.literal('')), // Add missing field
  capacity: z.number().int().min(1).default(100),
  isPaid: z.boolean().default(false),
  price: z.number().int().min(0).default(0),
  isSportsEvent: z.boolean().default(false), // Add missing field
  isTeamEvent: z.boolean().default(false), // Add team event field
  maxTeams: z.number().int().min(1).optional(), // Add max teams field
  maxTeamMembers: z.number().int().min(1).optional(), // Add max team members field
  tournamentType: z.string().optional(), // Add missing field
  createdById: z.string().optional(), // Add createdById field (frontend sends this)
  status: z.string().optional(), // Add status field (frontend sends this)
});