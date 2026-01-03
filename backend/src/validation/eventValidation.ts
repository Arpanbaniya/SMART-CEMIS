// backend/src/validation/eventValidation.ts
import { z } from 'zod';
import { EVENT_CATEGORIES } from '../../../shared/schema';

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(EVENT_CATEGORIES, { message: 'Invalid category' }),
  date: z.string().min(1, 'Date is required'), // ✅ Fix: frontend sends date string like "2024-12-31"
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  mapUrl: z.string().url().optional().or(z.literal('')), // ✅ Add missing field
  capacity: z.number().int().min(1).default(100),
  isPaid: z.boolean().default(false),
  price: z.number().int().min(0).default(0),
  isSportsEvent: z.boolean().default(false), // ✅ Add missing field
  tournamentType: z.string().optional(), // ✅ Add missing field
});