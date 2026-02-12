"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const requireAuth_1 = require("../middleware/requireAuth");
const sendgrid_1 = require("../utils/sendgrid");
const router = express_1.default.Router();
// Helper function to hash token
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
// POST - Request email change
router.post('/request', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const { newEmail, password } = req.body;
        const userId = req.session.userId;
        // Validation
        if (!newEmail || !password) {
            return res.status(400).json({ error: 'New email and password are required' });
        }
        // Get user
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Verify password
        const bcrypt = require('bcrypt');
        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        // Normalize email
        const normalizedEmail = newEmail.toLowerCase().trim();
        // Check if new email is same as current
        if (normalizedEmail === user.email) {
            return res.status(400).json({ error: 'This is already your email address' });
        }
        // Check if email already exists
        const existingUser = await User_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'This email is already registered' });
        }
        // Rate limiting: max 3 email change requests per 24 hours
        if (user.lastEmailChangeRequest) {
            const timeSinceLastRequest = Date.now() - new Date(user.lastEmailChangeRequest).getTime();
            const changesInLast24Hours = await User_1.User.countDocuments({
                _id: userId,
                lastEmailChangeRequest: {
                    $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            });
            if (changesInLast24Hours >= 3) {
                return res.status(429).json({
                    error: 'Too many email change requests. Try again in 24 hours.'
                });
            }
        }
        // Check if there's already a pending email change
        if (user.pendingEmail && user.pendingEmailExpiresAt && user.pendingEmailExpiresAt > new Date()) {
            return res.status(400).json({
                error: 'You have a pending email change. Cancel it first or wait for it to expire.'
            });
        }
        // Generate token
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = hashToken(token);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        // Update user
        user.pendingEmail = normalizedEmail;
        user.pendingEmailToken = hashedToken;
        user.pendingEmailExpiresAt = expiresAt;
        user.lastEmailChangeRequest = new Date();
        await user.save();
        // Send verification email
        const emailSent = await (0, sendgrid_1.sendEmailChangeVerification)(normalizedEmail, token, user.firstName || 'User');
        // Return success regardless - user can retry or manually enter token
        res.json({
            success: true,
            message: emailSent
                ? 'Verification email sent to ' + normalizedEmail
                : 'Email change request created. If you don\'t receive the verification email, check your spam folder or try resending.',
            expiresIn: 30, // minutes
            emailSent: emailSent,
            tokenForTesting: process.env.NODE_ENV === 'development' ? token : undefined
        });
    }
    catch (error) {
        console.error('Email change request error:', error);
        res.status(500).json({ error: 'Failed to process email change request' });
    }
});
// POST - Verify email change
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }
        const hashedToken = hashToken(token);
        // Find user with pending email change
        const user = await User_1.User.findOne({
            pendingEmailToken: hashedToken,
            pendingEmailExpiresAt: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        const oldEmail = user.email;
        const newEmail = user.pendingEmail;
        // Update user email
        user.email = newEmail;
        user.pendingEmail = undefined;
        user.pendingEmailToken = undefined;
        user.pendingEmailExpiresAt = undefined;
        await user.save();
        // Send confirmation emails
        try {
            await (0, sendgrid_1.sendEmailChangeNotification)(newEmail, oldEmail, user.firstName || 'User');
            // Also notify old email (in case account was compromised)
            await (0, sendgrid_1.sendEmailChangeNotification)(oldEmail, oldEmail, user.firstName || 'User');
        }
        catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Email already changed, just log the error
        }
        res.json({
            success: true,
            message: 'Email successfully changed to ' + newEmail
        });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: 'Failed to verify email change' });
    }
});
// POST - Resend verification email
router.post('/resend', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        // Get user
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Check if there's a pending email change
        if (!user.pendingEmail || !user.pendingEmailToken || !user.pendingEmailExpiresAt) {
            return res.status(400).json({ error: 'No pending email change found' });
        }
        // Check if token is still valid
        if (user.pendingEmailExpiresAt <= new Date()) {
            user.pendingEmail = undefined;
            user.pendingEmailToken = undefined;
            user.pendingEmailExpiresAt = undefined;
            await user.save();
            return res.status(400).json({ error: 'Verification token expired. Please request a new email change.' });
        }
        // Rate limit resends: max 5 per request
        const resendCount = user.resendCount || 0;
        if (resendCount >= 5) {
            return res.status(429).json({ error: 'Too many resend attempts. Please try again later.' });
        }
        // Decode the old token if possible, or generate a new one
        const newToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(newToken).digest('hex');
        const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        // Update user
        user.pendingEmailToken = hashedToken;
        user.pendingEmailExpiresAt = newExpiresAt;
        user.resendCount = resendCount + 1;
        await user.save();
        // Send verification email
        try {
            await (0, sendgrid_1.sendEmailChangeVerification)(user.pendingEmail, newToken, user.firstName || 'User');
        }
        catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            return res.status(500).json({ error: 'Failed to resend verification email' });
        }
        res.json({
            success: true,
            message: 'Verification email resent to ' + user.pendingEmail,
            expiresIn: 30 // minutes
        });
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
});
// POST - Cancel pending email change
router.post('/cancel', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        // Get user
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Check if there's a pending email change
        if (!user.pendingEmail) {
            return res.status(400).json({ error: 'No pending email change to cancel' });
        }
        // Cancel the change
        user.pendingEmail = undefined;
        user.pendingEmailToken = undefined;
        user.pendingEmailExpiresAt = undefined;
        user.resendCount = 0;
        await user.save();
        res.json({
            success: true,
            message: 'Email change cancelled'
        });
    }
    catch (error) {
        console.error('Cancel email change error:', error);
        res.status(500).json({ error: 'Failed to cancel email change' });
    }
});
// GET - Check pending email status
router.get('/status', requireAuth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        // Get user
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Check pending email
        const hasPending = user.pendingEmail && user.pendingEmailExpiresAt && user.pendingEmailExpiresAt > new Date();
        res.json({
            hasPending,
            pendingEmail: hasPending ? user.pendingEmail : null,
            expiresAt: hasPending ? user.pendingEmailExpiresAt : null,
            currentEmail: user.email
        });
    }
    catch (error) {
        console.error('Check email status error:', error);
        res.status(500).json({ error: 'Failed to check email status' });
    }
});
exports.default = router;
//# sourceMappingURL=emailChangeRoutes.js.map