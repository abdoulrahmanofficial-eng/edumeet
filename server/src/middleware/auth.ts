import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    const userSnapshot = await auth.getUser(decodedToken.uid);
    const dbSnapshot = await import('../config/firebase').then(m =>
      m.db.ref(`users/${decodedToken.uid}`).once('value')
    );
    const userData = dbSnapshot.val();

    if (!userData) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: userSnapshot.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL || '',
      role: userData.role || 'student',
      createdAt: userData.createdAt || '',
    };
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireEmailVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    if (!decodedToken.email_verified) {
      res.status(403).json({ error: 'Please verify your email before accessing this resource' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
