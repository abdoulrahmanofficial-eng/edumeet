import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import { uploadClassFile, deleteClassFile, getFileUrl, validateFileType, validateFileSize } from '../services/files';
import { uploadProfileImage } from '../services/files';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.post('/', requireRole('teacher'), upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    if (!validateFileType(req.file)) {
      res.status(400).json({ error: 'Invalid file type' });
      return;
    }

    if (!validateFileSize(req.file, 50)) {
      res.status(400).json({ error: 'File too large. Max 50MB' });
      return;
    }

    const { classId, type } = req.body;
    if (!classId) {
      res.status(400).json({ error: 'classId is required' });
      return;
    }

    const result = await uploadClassFile(classId, req.file, type || 'general');
    res.status(201).json({
      message: 'File uploaded',
      file: result,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/profile', upload.single('image'), async (req: Request, res: Response) => {
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
    res.json({ message: 'Profile image uploaded', url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:key', async (req: Request, res: Response) => {
  try {
    await deleteClassFile(req.userId!, getParam(req, 'key'));
    res.json({ message: 'File deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/url/:key', async (req: Request, res: Response) => {
  try {
    const url = await getFileUrl(getParam(req, 'key'));
    res.json({ url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
