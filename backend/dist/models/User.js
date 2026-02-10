"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// backend/src/models/User.ts
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional for OAuth later
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'student_admin', 'super_admin'],
        default: 'user'
    },
    preference: {
        type: String,
        enum: ['physical', 'innovative'],
        default: 'physical'
    },
    phone: { type: String, default: undefined },
    bio: { type: String, default: undefined },
    profileImageUrl: { type: String, default: null },
    lastLogin: { type: Date },
    // Email verification fields
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: undefined },
    verificationExpires: { type: Date, default: undefined },
    lastVerificationSentAt: { type: Date, default: undefined },
    // Student details for event registration
    semester: { type: Number, min: 1, max: 8 },
    rollNo: { type: String },
    programme: {
        type: String,
        enum: ['Bachelor of Computer Engineering', 'Bachelor of Software Engineering', 'Bachelor of Civil Engineering', 'Bachelor of Electrical Engineering', 'Bachelor of Mechanical Engineering', 'Bachelor of Chemical Engineering', 'Other']
    }
}, { timestamps: true });
// Map _id to id for frontend
userSchema.virtual('id').get(function () {
    return this._id.toString();
});
userSchema.set('toJSON', { virtuals: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map