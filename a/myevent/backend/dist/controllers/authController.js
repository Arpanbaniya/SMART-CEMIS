"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
// Hardcoded super admin credentials
const SUPER_ADMIN_EMAIL = 'admin@college.edu';
const SUPER_ADMIN_PASSWORD = 'admin';
const SUPER_ADMIN_ID = 'super_admin_1';
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // Check for super admin
        if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
            // Ensure super admin exists in DB
            let user = await User_1.User.findOne({ email: SUPER_ADMIN_EMAIL });
            if (!user) {
                const hashedPassword = await bcrypt_1.default.hash(SUPER_ADMIN_PASSWORD, 12);
                user = new User_1.User({
                    _id: SUPER_ADMIN_ID,
                    email: SUPER_ADMIN_EMAIL,
                    password: hashedPassword,
                    firstName: 'Super',
                    lastName: 'Admin',
                    role: 'super_admin'
                });
                await user.save();
            }
            // Set session
            req.session.userId = user._id.toString();
            const userObj = user.toJSON();
            return res.json({ user: { ...userObj, id: user._id.toString() } });
        }
        // Normal user login will go here later
        res.status(401).json({ error: 'Invalid credentials' });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map