import { Router, Request, Response } from 'express';
import { getParam } from '../utils/express';
import { verifyToken, requireRole } from '../middleware/auth';
import { createAssignmentValidation } from '../middleware/validate';
import { db } from '../config/firebase';
import { Assignment, Submission } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';
import { getClass } from '../services/classes';
import { createNotification } from '../services/notifications';
import { uploadClassFile, validateFileType, validateFileSize } from '../services/files';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

router.post('/', requireRole('teacher'), createAssignmentValidation, async (req: Request, res: Response) => {
  try {
    const { classId, title, description, dueDate } = req.body;

    const classData = await getClass(classId);
    if (!classData) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }
    if (classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const assignment: Assignment = {
      id: generateId(),
      classId,
      title,
      description,
      dueDate,
      files: [],
      createdAt: toTimestamp(),
    };

    await db.ref(`assignments/${assignment.id}`).set(assignment);
    await db.ref(`class-assignments/${classId}/${assignment.id}`).set(true);

    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/class/:classId', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`class-assignments/${getParam(req, 'classId')}`).once('value');
    const assignmentIds = snapshot.val();
    if (!assignmentIds) {
      res.json({ assignments: [] });
      return;
    }

    const assignments: Assignment[] = [];
    for (const id of Object.keys(assignmentIds)) {
      const assignmentSnapshot = await db.ref(`assignments/${id}`).once('value');
      const assignment = assignmentSnapshot.val();
      if (assignment) assignments.push(assignment);
    }

    assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ assignments });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }
    res.json({ assignment });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const classData = await getClass(assignment.classId);
    if (!classData || classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { title, description, dueDate } = req.body;
    const updates: Partial<Assignment> = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate) updates.dueDate = dueDate;

    await db.ref(`assignments/${getParam(req, 'id')}`).update(updates);
    const updated = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');

    res.json({ message: 'Assignment updated', assignment: updated.val() });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const classData = await getClass(assignment.classId);
    if (!classData || classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await db.ref(`assignments/${getParam(req, 'id')}`).remove();
    await db.ref(`class-assignments/${assignment.classId}/${getParam(req, 'id')}`).remove();
    await db.ref(`submissions/${getParam(req, 'id')}`).remove();

    res.json({ message: 'Assignment deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/submit', requireRole('student'), upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const existingSnapshot = await db
      .ref(`submissions/${getParam(req, 'id')}/${req.userId}`)
      .once('value');
    if (existingSnapshot.val()) {
      res.status(409).json({ error: 'Already submitted' });
      return;
    }

    const files: Submission['files'] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (!validateFileType(file)) {
          res.status(400).json({ error: `Invalid file type: ${file.originalname}` });
          return;
        }
        if (!validateFileSize(file, 50)) {
          res.status(400).json({ error: `File too large: ${file.originalname}` });
          return;
        }

        const uploaded = await uploadClassFile(assignment.classId, file, 'submissions');
        files.push({
          id: generateId(),
          name: uploaded.name,
          url: uploaded.url,
          size: uploaded.size,
          type: file.mimetype,
          uploadedAt: toTimestamp(),
        });
      }
    }

    const submission: Submission = {
      id: generateId(),
      assignmentId: getParam(req, 'id'),
      studentId: req.userId!,
      studentName: req.user!.displayName,
      files,
      submittedAt: toTimestamp(),
      grade: 0,
      feedback: '',
    };

    await db.ref(`submissions/${getParam(req, 'id')}/${req.userId}`).set(submission);

    const classData = await getClass(assignment.classId);
    if (classData) {
      await createNotification(
        classData.teacherId,
        'New Assignment Submission',
        `${req.user!.displayName} submitted: ${assignment.title}`,
        'assignment'
      );
    }

    res.status(201).json({ message: 'Assignment submitted', submission });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/submissions', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const snapshot = await db.ref(`assignments/${getParam(req, 'id')}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const classData = await getClass(assignment.classId);
    if (!classData || classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const submissionsSnapshot = await db.ref(`submissions/${getParam(req, 'id')}`).once('value');
    const submissionsData = submissionsSnapshot.val();
    const submissions: Submission[] = submissionsData
      ? Object.values(submissionsData as Record<string, Submission>)
      : [];

    res.json({ submissions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/submissions/:submissionId/grade', requireRole('teacher'), async (req: Request, res: Response) => {
  try {
    const { assignmentId, studentId, grade, feedback } = req.body;

    const snapshot = await db.ref(`assignments/${assignmentId}`).once('value');
    const assignment = snapshot.val();
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    const classData = await getClass(assignment.classId);
    if (!classData || classData.teacherId !== req.userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await db.ref(`submissions/${assignmentId}/${studentId}`).update({
      grade: grade || 0,
      feedback: feedback || '',
    });

    await createNotification(
      studentId,
      'Assignment Graded',
      `Your submission for "${assignment.title}" has been graded: ${grade || 0}`,
      'grade'
    );

    res.json({ message: 'Submission graded' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
