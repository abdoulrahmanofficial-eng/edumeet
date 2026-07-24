import { Router, Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import { registerUser, resetPassword, getUserData, updateUserProfile, getUserRole } from '../services/auth';
import { User, UserRole } from '../types';
import { toTimestamp } from '../utils/helpers';
import { verifyToken } from '../middleware/auth';
import { registerValidation } from '../middleware/validate';
import { uploadProfileImage, validateFileType, validateFileSize } from '../services/files';
import { authRateLimiter } from '../middleware/security';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', authRateLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role } = req.body;
    const { user, customToken } = await registerUser(email, password, displayName, role);

    res.status(201).json({
      message: 'User registered successfully',
      token: customToken,
      user,
    });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ error: 'ID token is required' });
      return;
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let userData = await getUserData(uid);

    if (!userData) {
      const userRecord = await auth.getUser(uid);
      const newUser: User = {
        id: uid,
        uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || decodedToken.name || '',
        photoURL: userRecord.photoURL || '',
        role: (await getUserRole(uid)) as UserRole,
        createdAt: toTimestamp(),
      };
      await db.ref(`users/${uid}`).set(newUser);
      userData = newUser;
    }

    res.json({
      message: 'Login successful',
      token: idToken,
      user: userData,
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    await resetPassword(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send reset email' });
  }
});

router.get('/verify', verifyToken, async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Email is valid', user: req.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    const userData = await getUserData(req.userId!);
    if (!userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: userData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/profile', verifyToken, async (req: Request, res: Response) => {
  try {
    const { displayName, photoURL } = req.body;
    await updateUserProfile(req.userId!, { displayName, photoURL });

    const updatedUser = await getUserData(req.userId!);
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/profile/image', verifyToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    if (!validateFileType(req.file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])) {
      res.status(400).json({ error: 'Invalid file type. Allowed: jpg, png, gif, webp' });
      return;
    }

    if (!validateFileSize(req.file, 5)) {
      res.status(400).json({ error: 'File too large. Max 5MB' });
      return;
    }

    const url = await uploadProfileImage(req.userId!, req.file);
    await updateUserProfile(req.userId!, { photoURL: url });

    res.json({ message: 'Profile image updated', photoURL: url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
