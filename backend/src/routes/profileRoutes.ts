// backend/src/routes/profileRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { User } from '../models/User';

const router = Router();

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
