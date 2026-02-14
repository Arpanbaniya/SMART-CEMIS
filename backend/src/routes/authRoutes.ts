import { Router } from 'express';
import { User } from '../models/User';
import { requireAuth } from '../middleware/requireAuth';
import '../types/session';
import bcrypt from 'bcrypt';
import { generateVerificationToken, hashToken } from '../utils/generateToken';
import { sendVerificationEmail } from '../utils/sendgrid';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'LOGIN_VALIDATION_FAILED',
        message: 'Login failed: Please provide both email and password.',
        details: {
          emailProvided: !!email,
          passwordProvided: !!password,
          requiredFields: ['email', 'password']
        }
      });
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
          preference: 'physical',
          isVerified: true // Super admin is auto-verified
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
      return res.status(401).json({ 
        error: 'USER_NOT_FOUND',
        message: `Login failed: No account found with email '${email}'. Please check your email or register for a new account.`,
        details: {
          attemptedEmail: email,
          suggestion: 'Verify your email address or create a new account'
        }
      });
    }

    // ✅ NEW: Check if user email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email first. Check your inbox or resend the verification email.',
        details: {
          isVerified: false,
          email: email
        }
      });
    }

    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) {
      return res.status(401).json({ 
        error: 'INVALID_PASSWORD',
        message: 'Login failed: Incorrect password. Please check your password and try again.',
        details: {
          attemptedEmail: email,
          suggestion: 'Double-check your password or use the "forgot password" feature if available'
        }
      });
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

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, preference } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'REGISTRATION_VALIDATION_FAILED',
        message: 'Registration failed: Please fill in all required fields.',
        details: {
          nameProvided: !!name,
          emailProvided: !!email,
          passwordProvided: !!password,
          requiredFields: ['name', 'email', 'password']
        }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'EMAIL_ALREADY_EXISTS',
        message: `Registration failed: The email address '${email}' is already registered. Please use a different email or try logging in.`,
        details: {
          existingEmail: email,
          suggestion: 'Try logging in with your existing account or use a different email address'
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || null;
    const { raw, hashed } = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create user with verification fields
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'user',
      preference: preference || 'physical',
      profileImageUrl: null,
      isVerified: false, // New users are not verified
      verificationToken: hashed, // Store hashed token
      verificationExpires: verificationExpires,
      lastVerificationSentAt: new Date()
    });

    await user.save();
    sendVerificationEmail(email, raw).catch((err) => {
      // Already logged in sendVerificationEmail, just catch to prevent unhandled rejection
      console.error('Failed to send verification email:', err);
    });

    return res.status(201).json({
      message: 'Account created successfully! We have sent a verification link to your email. Please check your inbox and spam folder.',
      email: email,
      requiresEmailVerification: true
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/user', requireAuth, async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'No valid session found' });
    }

    const user = await User.findById(req.session.userId).select('-password');
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'User session invalid - user not found' });
    }
    
    const userObj = user.toJSON();
    res.json({
      ...userObj,
      id: user._id.toString()
    });
  } catch (error: any) {
    console.error('Auth user fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Verification failed: Your token is invalid or has expired. Please request a new verification email.'
      });
    }

    // Mark user as verified and clear token fields
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    console.log(`✅ Email verified for user: ${user.email}`);

    return res.json({
      message: 'Email verified successfully! You can now log in to your account.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      error: 'VERIFICATION_ERROR',
      message: 'An error occurred during email verification. Please try again.'
    });
  }
});

// ┌──────────────────────────────────────┐
// │   RESEND VERIFICATION ROUTE (NEW)    │
// └──────────────────────────────────────┘
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'EMAIL_REQUIRED',
        message: 'Resend failed: Email is required.'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: `No account found with email '${email}'. Please check and try again.`
      });
    }

    // If already verified, return error
    if (user.isVerified) {
      return res.status(400).json({
        error: 'ALREADY_VERIFIED',
        message: 'This email is already verified. You can log in to your account.'
      });
    }

    // Check resend cooldown (30 seconds)
    const now = new Date();
    if (user.lastVerificationSentAt) {
      const timeSinceLastSend = (now.getTime() - user.lastVerificationSentAt.getTime()) / 1000; // seconds
      if (timeSinceLastSend < 30) {
        const secondsRemaining = Math.ceil(30 - timeSinceLastSend);
        return res.status(429).json({
          error: 'RESEND_COOLDOWN',
          message: `Please wait ${secondsRemaining} second(s) before requesting another verification email.`
        });
      }
    }

    // Generate new token
    const { raw, hashed } = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    user.verificationToken = hashed;
    user.verificationExpires = verificationExpires;
    user.lastVerificationSentAt = now;
    await user.save();

    // Send verification email (fire-and-forget)
    sendVerificationEmail(email, raw).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    console.log(`🔄 Verification email resent to: ${email}`);

    return res.json({
      message: 'Verification email sent successfully! Please check your inbox and spam folder.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      error: 'RESEND_ERROR',
      message: 'An error occurred while resending the verification email. Please try again.'
    });
  }
});

// ┌──────────────────────────────────────┐
// │           LOGOUT ROUTE               │
// └──────────────────────────────────────┘
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('myevent.sid', {
      path: '/',
      httpOnly: true,
      secure: false, // Simplified for development
      sameSite: 'lax'
    });
    res.json({ ok: true });
  });
});

export default router;