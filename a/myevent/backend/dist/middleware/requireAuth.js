"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSuperAdmin = exports.requireAdmin = exports.requireAuth = void 0;
const User_1 = require("../models/User");
const requireAuth = (req, res, next) => {
    try {
        console.log('RequireAuth middleware - session:', req.session);
        console.log('RequireAuth middleware - userId:', req.session?.userId);
        if (!req.session) {
            console.log('No session found in request');
            return res.status(401).json({ message: 'Unauthorized - No session found' });
        }
        if (!req.session.userId) {
            console.log('Session exists but no userId');
            return res.status(401).json({ message: 'Unauthorized - No valid session found' });
        }
        console.log('RequireAuth passed for userId:', req.session.userId);
        next();
    }
    catch (error) {
        console.error('RequireAuth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error in authentication' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_1.User.findById(req.session.userId);
        if (!user || (user.role !== 'student_admin' && user.role !== 'super_admin')) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    }
    catch (error) {
        console.error('RequireAdmin middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireAdmin = requireAdmin;
const requireSuperAdmin = async (req, res, next) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_1.User.findById(req.session.userId);
        if (!user || user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Forbidden: Super admin access required' });
        }
        next();
    }
    catch (error) {
        console.error('RequireSuperAdmin middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requireSuperAdmin = requireSuperAdmin;
//# sourceMappingURL=requireAuth.js.map