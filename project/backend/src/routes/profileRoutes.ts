<<<<<<< HEAD
=======
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       USER PROFILE API ROUTES                               ║
 * ║                       Used in Frontend & Backend                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║ This file handles user profile operations:                                 ║
 * ║  1. GET /api/profile - Get current user's profile                          ║
 * ║  2. PATCH /api/profile - Update user's profile information                 ║
 * ║                                                                            ║
 * ║ FRONTEND USAGE: client/src/pages/profile.tsx                              ║
 * ║   - Fetch profile (line 58)                                               ║
 * ║   - Update profile (line 86)                                              ║
 * ║                                                                            ║
 * ║ FRONTEND HOOKS: use-auth.ts checks user profile on app load                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
// backend/src/routes/profileRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';

const router = Router();

<<<<<<< HEAD
=======
/**
 * GET /api/profile
 * 
 * FRONTEND USAGE: client/src/pages/profile.tsx (line 58)
 * Retrieves current authenticated user's profile information
 * 
 * RESPONSE (200 OK):
 *   - Profile object: { id, email, firstName, lastName, role, preference, 
 *                       gender, semester, rollNo, programme, profileImageUrl,
 *                       createdAt, updatedAt }
 * 
 * RESPONSE (404):
 *   - error: 'User not found'
 */
>>>>>>> 6fc2a7b (google maps, google calender added)
// GET / - Get current user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      preference: user.preference,
      gender: user.gender,
      semester: user.semester,
      rollNo: user.rollNo,
      programme: user.programme,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH / - Update user profile
router.patch('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowedUpdates = ['firstName', 'lastName', 'preference', 'department', 'year'];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    Object.assign(user, updates);
    user.updatedAt = new Date();
    await user.save();

    res.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      preference: user.preference,
      gender: user.gender,
      semester: user.semester,
      rollNo: user.rollNo,
      programme: user.programme,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
