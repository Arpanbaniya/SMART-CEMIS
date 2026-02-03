"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationToken = generateVerificationToken;
exports.hashToken = hashToken;
// backend/src/utils/generateToken.ts
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure verification token
 * Returns both raw (for email) and hashed (for database storage) versions
 */
function generateVerificationToken() {
    // Generate 64-char hex token (32 bytes)
    const raw = crypto_1.default.randomBytes(32).toString('hex');
    // Hash the raw token with SHA-256
    const hashed = crypto_1.default
        .createHash('sha256')
        .update(raw)
        .digest('hex');
    return { raw, hashed };
}
/**
 * Hash a verification token (used when validating)
 */
function hashToken(token) {
    return crypto_1.default
        .createHash('sha256')
        .update(token)
        .digest('hex');
}
//# sourceMappingURL=generateToken.js.map