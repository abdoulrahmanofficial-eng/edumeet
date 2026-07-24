import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  getClassAttendance,
  getStudentAttendance,
  getMeetingAttendance,
} from '../services/attendance';

const router = Router();

router.use(verifyToken);

router.get('/class/:classId', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const attendance = await getClassAttendance(getParam(req, 'classId'));
    res.json({ attendance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const attendance = await getStudentAttendance(req.userId!);
    res.json({ attendance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/meeting/:meetingId', async (req: Request, res: Response) => {
  try {
    const attendance = await getMeetingAttendance(getParam(req, 'meetingId'));
    res.json({ attendance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
