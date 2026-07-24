import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import { createClassValidation } from '../middleware/validate';
import {
  createClass,
  getClass,
  updateClass,
  deleteClass,
  getTeacherClasses,
  getStudentClasses,
  joinClass,
  leaveClass,
  generateInviteCode,
  getEnrolledStudents,
} from '../services/classes';
import { createNotification } from '../services/notifications';

const router = Router();

router.use(verifyToken);

router.post('/', requireRole('teacher'), createClassValidation, async (req: Request, res: Response) => {
  try {
    const classData = await createClass(req.body, req.userId!, req.user!.displayName);
    res.status(201).json({ message: 'Class created', class: classData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const role = req.user!.role;
    let classes;
    if (role === 'teacher') {
      classes = await getTeacherClasses(req.userId!);
    } else {
      classes = await getStudentClasses(req.userId!);
    }
    res.json({ classes });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const classData = await getClass(getParam(req, 'id'));
    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    res.json({ class: classData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const classData = await getClass(getParam(req, 'id'));
    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    if (classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await updateClass(getParam(req, 'id'), req.body);
    const updated = await getClass(getParam(req, 'id'));
    res.json({ message: 'Class updated', class: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    await deleteClass(getParam(req, 'id'), req.userId!);
    res.json({ message: 'Class deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/invite', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const classData = await getClass(getParam(req, 'id'));
    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    if (classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const code = await generateInviteCode(getParam(req, 'id'));
    res.json({ inviteCode: code });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/join/:code', requireRole('student'), async (req: Request, res: Response) => {
  try {
    const classData = await joinClass(getParam(req, 'code'), req.userId!);

    await createNotification(
      classData.teacherId,
      'New Student Joined',
      `${req.user!.displayName} has joined your class: ${classData.title}`,
      'class'
    );

    res.json({ message: 'Joined class successfully', class: classData });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/leave', async (req: Request, res: Response) => {
  try {
    await leaveClass(getParam(req, 'id'), req.userId!);
    res.json({ message: 'Left class successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/students', async (req: Request, res: Response) => {
  try {
    const students = await getEnrolledStudents(getParam(req, 'id'));
    res.json({ students });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
