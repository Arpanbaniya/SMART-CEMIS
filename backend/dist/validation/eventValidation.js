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
    date: zod_1.z.string().min(1, 'Date is required'), // Frontend sends date string like "2024-12-31"
    time: zod_1.z.string().min(1, 'Time is required'),
    endDate: zod_1.z.string().min(1, 'End date is required'), // When event ends (date)
    endTime: zod_1.z.string().min(1, 'End time is required'), // When event ends (time)
    location: zod_1.z.string().min(1, 'Location is required'),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    mapUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    capacity: zod_1.z.number().int().min(1).default(100),
    isPaid: zod_1.z.boolean().default(false),
    price: zod_1.z.number().int().min(0).default(0),
    isSportsEvent: zod_1.z.boolean().default(false),
    isTeamEvent: zod_1.z.boolean().default(false),
    maxTeams: zod_1.z.number().int().min(1).optional(),
    maxTeamMembers: zod_1.z.number().int().min(1).optional(),
    tournamentType: zod_1.z.string().optional(),
    createdById: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
});
//# sourceMappingURL=eventValidation.js.map