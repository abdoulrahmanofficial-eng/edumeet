import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import {
  createMeeting,
  startMeeting,
  endMeeting,
  getMeeting,
  generateLiveKitToken,
  addParticipant,
  removeParticipant,
  getClassMeetings,
} from '../services/meetings';
import { getClass } from '../services/classes';
import { recordJoin, recordLeave } from '../services/attendance';
import { createNotification } from '../services/notifications';

const router = Router();

router.use(verifyToken);

router.post('/:classId', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const meeting = await createMeeting(getParam(req, 'classId'), req.userId!);
    res.status(201).json({ message: 'Meeting created', meeting });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/start', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const meeting = await startMeeting(getParam(req, 'id'));
    res.json({ message: 'Meeting started', meeting });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/end', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const meeting = await endMeeting(getParam(req, 'id'));
    res.json({ message: 'Meeting ended', meeting });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const meeting = await getMeeting(getParam(req, 'id'));
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }
    res.json({ meeting });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/token', async (req: Request, res: Response) => {
  try {
    const meeting = await getMeeting(getParam(req, 'id'));
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    const { identity, room, role } = req.body;
    const livrIdentity = identity || req.userId;
    const livrRoom = room || meeting.classId;
    const livrRole = role || req.user!.role;

    const token = await generateLiveKitToken(
      livrIdentity as string,
      livrRoom as string,
      livrRole as string
    );

    await addParticipant(getParam(req, 'id'), req.userId!, {
      displayName: req.user!.displayName,
      email: req.user!.email,
    });

    if (req.user!.role === 'student') {
      await recordJoin(getParam(req, 'id'), req.userId!, req.user!.displayName);

      const classData = await getClass(meeting.classId);
      if (classData) {
        await createNotification(
          classData.teacherId,
          'Student Joined Meeting',
          `${req.user!.displayName} has joined the meeting`,
          'meeting'
        );
      }
    }

    res.json({ token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/participants', async (req: Request, res: Response) => {
  try {
    const meeting = await getMeeting(getParam(req, 'id'));
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }
    res.json({ participants: meeting.participants });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/participants/remove', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    await removeParticipant(getParam(req, 'id'), userId);

    if (req.user!.role === 'student') {
      await recordLeave(getParam(req, 'id'), userId);
    }

    res.json({ message: 'Participant removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/class/:classId', async (req: Request, res: Response) => {
  try {
    const meetings = await getClassMeetings(getParam(req, 'classId'));
    res.json({ meetings });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
