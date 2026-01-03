// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

// Hardcoded super admin credentials
const SUPER_ADMIN_EMAIL = 'admin@college.edu';
const SUPER_ADMIN_PASSWORD = 'admin';
const SUPER_ADMIN_ID = 'super_admin_1';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check for super admin
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      // Ensure super admin exists in DB
      let user = await User.findOne({ email: SUPER_ADMIN_EMAIL });
      if (!user) {
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
        user = new User({
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};