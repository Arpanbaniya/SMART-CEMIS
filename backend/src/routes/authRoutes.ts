// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { User } from '../models/User';
import { requireAuth } from '../middleware/requireAuth';
import '../types/session';
import bcrypt from 'bcrypt';

const router = Router();

// ┌──────────────────────────────┐
// │         LOGIN ROUTE          │
// └──────────────────────────────┘
router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hardcoded Super Admin credentials
    const SUPER_ADMIN_EMAIL = 'admin@college.edu';
    const SUPER_ADMIN_PASSWORD = 'admin';
    

    // Check for Super Admin
    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      let user = await User.findOne({ email: SUPER_ADMIN_EMAIL });
      if (!user) {
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
        user = new User({
          
          email: SUPER_ADMIN_EMAIL,
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          preference: 'both'
        });
        await user.save();
      }

      req.session.userId = user._id.toString();
      const userObj = user.toJSON();
      return res.json({ 
        user: { 
          ...userObj, 
          id: user._id.toString()
        } 
      });
    }

    // Normal user login
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user._id.toString();
    const userObj = user.toJSON();
    res.json({ 
      user: { 
        ...userObj, 
        id: user._id.toString(),
        password: undefined // Never send password back
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// ┌──────────────────────────────┐
// │       REGISTER ROUTE         │
// └──────────────────────────────┘
router.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, preference } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Parse name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || null;

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      preference: preference || 'both',
      profileImageUrl: null
    });

    await user.save();

    // Create session
    req.session.userId = user._id.toString();

    // Return user without password
    const userObj = user.toJSON();
    res.status(201).json({ 
      user: { 
        ...userObj, 
        id: user._id.toString(),
        password: undefined
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ┌──────────────────────────────┐
// │        GET CURRENT USER      │
// └──────────────────────────────┘
router.get('/api/auth/user', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User session invalid' });
    }
    const userObj = user.toJSON();
    res.json(userObj);
  } catch (error) {
    console.error('Auth user fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ┌──────────────────────────────┐
// │           LOGOUT             │
// └──────────────────────────────┘
router.post('/api/auth/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    res.json({ ok: true });
  });
});

export default router;