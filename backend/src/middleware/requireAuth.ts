// backend/src/middleware/requireAuth.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    console.error('RequireAuth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error in authentication' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);
    if (!user || (user.role !== 'student_admin' && user.role !== 'super_admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (error) {
    console.error('RequireAdmin middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden: Super admin access required' });
    }

    next();
  } catch (error) {
    console.error('RequireSuperAdmin middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};