import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken } from '../middleware/auth';
import {
  saveAction,
  getActions,
  clearBoard,
  undoAction,
  redoAction,
} from '../services/whiteboard';

const router = Router();

router.use(verifyToken);

router.post('/actions', async (req: Request, res: Response) => {
  try {
    const { meetingId, type, data } = req.body;
    if (!meetingId || !type) {
      res.status(400).json({ error: 'meetingId and type are required' });
      return;
    }

    const action = await saveAction(meetingId, {
      type,
      data: data || {},
      userId: req.userId!,
    });

    res.status(201).json({ message: 'Action saved', action });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:meetingId/actions', async (req: Request, res: Response) => {
  try {
    const actions = await getActions(getParam(req, 'meetingId'));
    res.json({ actions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:meetingId', async (req: Request, res: Response) => {
  try {
    await clearBoard(getParam(req, 'meetingId'));
    res.json({ message: 'Board cleared' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:meetingId/undo', async (req: Request, res: Response) => {
  try {
    const currentIndex = await undoAction(getParam(req, 'meetingId'));
    res.json({ message: 'Undo successful', currentIndex });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:meetingId/redo', async (req: Request, res: Response) => {
  try {
    const currentIndex = await redoAction(getParam(req, 'meetingId'));
    res.json({ message: 'Redo successful', currentIndex });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
