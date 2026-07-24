import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import { createAnnouncementValidation } from '../middleware/validate';
import { db } from '../config/firebase';
import { Announcement } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';
import { getClass, getEnrolledStudents } from '../services/classes';
import { createNotification } from '../services/notifications';
import { uploadClassFile, validateFileType, validateFileSize } from '../services/files';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.post('/', requireRole('teacher'), createAnnouncementValidation, upload.array('attachments', 5), async (req: Request, res: Response) => {
  try {
    const { classId, title, content } = req.body;

    const classData = await getClass(classId);
    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    if (classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const attachments: Announcement['attachments'] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (!validateFileType(file)) {
          continue;
        }
        if (!validateFileSize(file, 50)) {
          continue;
        }

        const uploaded = await uploadClassFile(classId, file, 'announcements');
        attachments.push({
          id: generateId(),
          name: uploaded.name,
          url: uploaded.url,
          size: uploaded.size,
          type: file.mimetype,
          uploadedAt: toTimestamp(),
        });
      }
    }

    const announcement: Announcement = {
      id: generateId(),
      classId,
      teacherId: req.userId!,
      title,
      content,
      createdAt: toTimestamp(),
      attachments,
    };

    await db.ref(`announcements/${announcement.id}`).set(announcement);
    await db.ref(`class-announcements/${classId}/${announcement.id}`).set(true);

    const students = await getEnrolledStudents(classId);
    for (const student of students) {
      await createNotification(
        student.uid,
        `New Announcement: ${title}`,
        content.substring(0, 100),
        'announcement'
      );
    }

    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/class/:classId', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`class-announcements/${getParam(req, 'classId')}`).once('value');
    const announcementIds = snapshot.val();
    if (!announcementIds) {
      res.json({ announcements: [] });
      return;
    }

    const announcements: Announcement[] = [];
    for (const id of Object.keys(announcementIds)) {
      const annSnapshot = await db.ref(`announcements/${id}`).once('value');
      const announcement = annSnapshot.val();
      if (announcement) announcements.push(announcement);
    }

    announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ announcements });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`announcements/${getParam(req, 'id')}`).once('value');
    const announcement = snapshot.val();
    if (!announcement) {
      res.status(404).json({ error: 'Announcement not found' });
      return;
    }

    const classData = await getClass(announcement.classId);
    if (!classData || classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await db.ref(`announcements/${getParam(req, 'id')}`).remove();
    await db.ref(`class-announcements/${announcement.classId}/${getParam(req, 'id')}`).remove();

    res.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
