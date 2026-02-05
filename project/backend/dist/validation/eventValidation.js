"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventSchema = void 0;
// backend/src/validation/eventValidation.ts
const zod_1 = require("zod");
// Event categories (synced with shared/schema.ts)
const EVENT_CATEGORIES = [
    "sports", "technology", "cultural", "academic", "music",
    "art", "workshop", "competition", "social", "other"
];
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    category: zod_1.z.enum(EVENT_CATEGORIES, { message: 'Invalid category' }),
    date: zod_1.z.string().min(1, 'Date is required'), // Fix: frontend sends date string like "2024-12-31"
    time: zod_1.z.string().min(1, 'Time is required'),
    location: zod_1.z.string().min(1, 'Location is required'),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')), // Add image URL field
    mapUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')), // Add missing field
    capacity: zod_1.z.number().int().min(1).default(100),
    isPaid: zod_1.z.boolean().default(false),
    price: zod_1.z.number().int().min(0).default(0),
    isSportsEvent: zod_1.z.boolean().default(false), // Add missing field
    isTeamEvent: zod_1.z.boolean().default(false), // Add team event field
    maxTeams: zod_1.z.number().int().min(1).optional(), // Add max teams field
    maxTeamMembers: zod_1.z.number().int().min(1).optional(), // Add max team members field
    tournamentType: zod_1.z.string().optional(), // Add missing field
    createdById: zod_1.z.string().optional(), // Add createdById field (frontend sends this)
    status: zod_1.z.string().optional(), // Add status field (frontend sends this)
});
//# sourceMappingURL=eventValidation.js.map