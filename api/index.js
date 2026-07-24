// Vercel serverless entry point
// This file must be JavaScript and NOT import from server/ source
// to avoid TypeScript compilation issues in Vercel's build pipeline.
//
// Instead, we set up Express directly here and register all routes.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import Firebase Admin SDK
const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

const app = express();

// Initialize Firebase Admin (guard against re-initialization on warm starts)
const firebaseConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')
      : (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    ),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}
const adminApp = getApp();
const auth = getAuth(adminApp);
const db = getDatabase(adminApp);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ==================== AUTH ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const snapshot = await db.ref(`users/${uid}`).once('value');
    let userData = snapshot.val();

    if (!userData) {
      const userRecord = await auth.getUser(uid);
      userData = {
        id: uid, uid, email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        role: 'student', createdAt: new Date().toISOString(),
      };
      await db.ref(`users/${uid}`).set(userData);
    }

    res.json({ message: 'Login successful', token: idToken, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { idToken, displayName, role } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID token is required' });

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || '';

    const existing = await db.ref(`users/${uid}`).once('value');
    if (existing.val()) {
      return res.status(409).json({ error: 'User already registered' });
    }

    const user = {
      id: uid, uid, email,
      displayName: displayName || '',
      photoURL: decodedToken.picture || '',
      role: role || 'student',
      createdAt: new Date().toISOString(),
    };
    await db.ref(`users/${uid}`).set(user);

    res.status(201).json({ message: 'User registered successfully', token: idToken, user });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    await auth.generatePasswordResetLink(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to send reset email' });
  }
});

// Auth middleware
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const snap = await db.ref(`users/${decodedToken.uid}`).once('value');
    const userData = snap.val();
    if (!userData) return res.status(401).json({ error: 'User not found' });
    req.user = userData;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
}

app.get('/api/auth/me', verifyToken, async (req, res) => {
  const snap = await db.ref(`users/${req.userId}`).once('value');
  const data = snap.val();
  if (!data) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...data, uid: req.userId } });
});

app.put('/api/auth/profile', verifyToken, async (req, res) => {
  const { displayName, photoURL } = req.body;
  const updates = {};
  if (displayName) updates.displayName = displayName;
  if (photoURL) updates.photoURL = photoURL;
  if (Object.keys(updates).length > 0) {
    await db.ref(`users/${req.userId}`).update(updates);
  }
  const snap = await db.ref(`users/${req.userId}`).once('value');
  res.json({ message: 'Profile updated', user: snap.val() });
});

// ==================== CLASSES ROUTES ====================

app.post('/api/classes', verifyToken, requireRole('teacher'), async (req, res) => {
  const { title, description, scheduledAt, duration, maxStudents, recurring } = req.body;
  const id = require('crypto').randomUUID();
  const inviteCode = Math.random().toString(36).substring(2, 10);
  const classData = {
    id, title, description: description || '', teacherId: req.userId,
    teacherName: req.user.displayName, scheduledAt: scheduledAt || '',
    duration: duration || 60, maxStudents: maxStudents || 50,
    recurring: recurring || 'none', status: 'upcoming',
    roomId: id, inviteCode, createdAt: new Date().toISOString(),
  };
  await db.ref(`classes/${id}`).set(classData);
  res.status(201).json(classData);
});

app.get('/api/classes', verifyToken, async (req, res) => {
  const snap = await db.ref('classes').once('value');
  const all = snap.val() || {};
  const list = Object.values(all);
  if (req.user.role === 'teacher') {
    return res.json(list.filter(c => c.teacherId === req.userId));
  }
  // For students, return classes they're enrolled in
  const enrollSnap = await db.ref(`students/${req.userId}/classes`).once('value');
  const enrolled = enrollSnap.val() || {};
  const enrolledIds = new Set(Object.keys(enrolled));
  res.json(list.filter(c => enrolledIds.has(c.id)));
});

app.get('/api/classes/:id', verifyToken, async (req, res) => {
  const snap = await db.ref(`classes/${req.params.id}`).once('value');
  const classData = snap.val();
  if (!classData) return res.status(404).json({ error: 'Class not found' });
  res.json(classData);
});

app.get('/api/classes/:id/students', verifyToken, async (req, res) => {
  const studSnap = await db.ref(`class-students/${req.params.id}`).once('value');
  const studData = studSnap.val() || {};
  res.json(Object.values(studData));
});

app.put('/api/classes/:id', verifyToken, requireRole('teacher'), async (req, res) => {
  const snap = await db.ref(`classes/${req.params.id}`).once('value');
  if (!snap.val()) return res.status(404).json({ error: 'Class not found' });
  if (snap.val().teacherId !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  await db.ref(`classes/${req.params.id}`).update(req.body);
  res.json({ message: 'Class updated' });
});

app.delete('/api/classes/:id', verifyToken, requireRole('teacher'), async (req, res) => {
  const snap = await db.ref(`classes/${req.params.id}`).once('value');
  if (!snap.val()) return res.status(404).json({ error: 'Class not found' });
  if (snap.val().teacherId !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  await db.ref(`classes/${req.params.id}`).remove();
  res.json({ message: 'Class deleted' });
});

app.post('/api/classes/join', verifyToken, async (req, res) => {
  const code = req.body.inviteCode || req.body.code;
  if (!code) return res.status(400).json({ error: 'Invite code is required' });
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can join classes' });
  const snap = await db.ref('classes').orderByChild('inviteCode').equalTo(code).once('value');
  const data = snap.val();
  if (!data) return res.status(404).json({ error: 'Invalid invite code' });
  const classId = Object.keys(data)[0];
  await db.ref(`class-students/${classId}/${req.userId}`).set({
    id: req.userId, displayName: req.user.displayName, email: req.user.email, joinedAt: new Date().toISOString(),
  });
  await db.ref(`students/${req.userId}/classes/${classId}`).set(true);
  const joinedClass = (await db.ref(`classes/${classId}`).once('value')).val();
  res.json(joinedClass);
});

// ==================== MEETINGS ROUTES ====================

app.post('/api/meetings/:classId', verifyToken, requireRole('teacher'), async (req, res) => {
  const classSnap = await db.ref(`classes/${req.params.classId}`).once('value');
  const classData = classSnap.val();
  if (!classData) return res.status(404).json({ error: 'Class not found' });
  if (classData.teacherId !== req.userId) return res.status(403).json({ error: 'Not authorized' });
  const id = require('crypto').randomUUID();
  const meeting = { id, classId: req.params.classId, title: classData.title, teacherId: req.userId, startTime: new Date().toISOString(), endTime: '', duration: 0, recordingUrl: '', status: 'live', participants: [req.userId] };
  await db.ref(`meetings/${id}`).set(meeting);
  await db.ref(`classes/${req.params.classId}/status`).set('ongoing');
  await db.ref(`classes/${req.params.classId}/currentMeetingId`).set(id);
  res.status(201).json(meeting);
});

app.post('/api/meetings/:id/start', verifyToken, requireRole('teacher'), async (req, res) => {
  const snap = await db.ref(`meetings/${req.params.id}`).once('value');
  if (!snap.val()) return res.status(404).json({ error: 'Meeting not found' });
  await db.ref(`meetings/${req.params.id}`).update({ status: 'live', startTime: new Date().toISOString() });
  const started = (await db.ref(`meetings/${req.params.id}`).once('value')).val();
  res.json(started);
});

app.post('/api/meetings/:id/end', verifyToken, requireRole('teacher'), async (req, res) => {
  const snap = await db.ref(`meetings/${req.params.id}`).once('value');
  const meeting = snap.val();
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  if (meeting.teacherId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

  try {
    const roomService = getRoomService();
    const participants = await roomService.listParticipants(req.params.id);
    for (const p of participants) {
      if (p.identity === req.userId) continue;
      try {
        await roomService.removeParticipant(req.params.id, p.identity);
      } catch (kickErr) {
        console.error(`Failed to kick participant ${p.identity}:`, kickErr);
      }
    }
  } catch (err) {
    console.error('Failed to list/kick participants:', err);
  }

  // Update class status and clear currentMeetingId
  if (meeting.classId) {
    await db.ref(`classes/${meeting.classId}/status`).set('ended');
    await db.ref(`classes/${meeting.classId}/currentMeetingId`).remove();
  }

  // Delete the meeting document
  await db.ref(`meetings/${req.params.id}`).remove();

  res.json({ message: 'Meeting ended and room deleted' });
});

app.get('/api/meetings/:id', verifyToken, async (req, res) => {
  const snap = await db.ref(`meetings/${req.params.id}`).once('value');
  const meeting = snap.val();
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  res.json(meeting);
});

app.post('/api/meetings/:id/token', verifyToken, async (req, res) => {
  try {
    const { AccessToken } = require('livekit-server-sdk');
    const apiKey = process.env.LIVEKIT_API_KEY || '';
    const apiSecret = process.env.LIVEKIT_API_SECRET || '';
    if (!apiKey || !apiSecret) {
      return res.status(503).json({ error: 'LiveKit not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in environment variables.' });
    }
    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.userId,
      name: req.user.displayName || '',
      attributes: { role: req.user.role || 'student' },
    });
    at.addGrant({ room: req.params.id, roomJoin: true, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    res.json({ token });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

function getRoomService() {
  const { RoomServiceClient } = require('livekit-server-sdk');
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';
  let host = process.env.LIVEKIT_URL || '';
  host = host.replace(/^wss:\/\//, 'https://').replace(/^ws:\/\//, 'http://');
  return new RoomServiceClient(host, apiKey, apiSecret);
}

async function getParticipantTrackSid(roomService, room, identity, type, source) {
  const participants = await roomService.listParticipants(room);
  const p = participants.find((x) => x.identity === identity);
  if (!p) return null;
  const track = p.tracks.find((t) => t.type === type && t.source === source);
  return track ? track.sid : null;
}

app.post(
  '/api/meetings/:id/participants/:identity/mute',
  verifyToken,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const roomService = getRoomService();
      const trackSid = await getParticipantTrackSid(roomService, req.params.id, req.params.identity, 0, 2);
      if (!trackSid) return res.status(404).json({ error: 'Microphone track not found' });
      await roomService.mutePublishedTrack(req.params.id, req.params.identity, trackSid, true);
      res.json({ message: 'Participant microphone muted' });
    } catch (err) {
      console.error('Mute participant error:', err);
      res.status(500).json({ error: 'Failed to mute participant' });
    }
  },
);

app.post(
  '/api/meetings/:id/participants/:identity/disable-video',
  verifyToken,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const roomService = getRoomService();
      const trackSid = await getParticipantTrackSid(roomService, req.params.id, req.params.identity, 1, 1);
      if (!trackSid) return res.status(404).json({ error: 'Camera track not found' });
      await roomService.mutePublishedTrack(req.params.id, req.params.identity, trackSid, true);
      res.json({ message: 'Participant camera disabled' });
    } catch (err) {
      console.error('Disable video error:', err);
      res.status(500).json({ error: 'Failed to disable camera' });
    }
  },
);

app.post(
  '/api/meetings/:id/participants/:identity/enable-video',
  verifyToken,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const roomService = getRoomService();
      const trackSid = await getParticipantTrackSid(roomService, req.params.id, req.params.identity, 1, 1);
      if (!trackSid) return res.status(404).json({ error: 'Camera track not found' });
      await roomService.mutePublishedTrack(req.params.id, req.params.identity, trackSid, false);
      res.json({ message: 'Participant camera enabled' });
    } catch (err) {
      console.error('Enable video error:', err);
      res.status(500).json({ error: 'Failed to enable camera' });
    }
  },
);

app.post(
  '/api/meetings/:id/participants/:identity/remove',
  verifyToken,
  requireRole('teacher'),
  async (req, res) => {
    try {
      const roomService = getRoomService();
      await roomService.removeParticipant(req.params.id, req.params.identity);
      res.json({ message: 'Participant removed' });
    } catch (err) {
      console.error('Remove participant error:', err);
      res.status(500).json({ error: 'Failed to remove participant' });
    }
  },
);

app.get('/api/meetings/:id/participants', verifyToken, async (req, res) => {
  const partSnap = await db.ref(`meetings/${req.params.id}/participants`).once('value');
  const participantIds = partSnap.val() || [];
  const participants = [];
  for (const uid of participantIds) {
    const uSnap = await db.ref(`users/${uid}`).once('value');
    const u = uSnap.val();
    if (u) participants.push({ id: uid, ...u });
  }
  res.json(participants);
});

// ==================== ATTENDANCE ROUTES ====================

app.post('/api/attendance/join', verifyToken, async (req, res) => {
  const { meetingId } = req.body;
  const id = require('crypto').randomUUID();
  const record = { id, meetingId, studentId: req.userId, studentName: req.user.displayName, joinTime: new Date().toISOString(), leaveTime: '', duration: 0, status: 'present' };
  await db.ref(`attendance/${id}`).set(record);
  await db.ref(`meetings/${meetingId}/participants`).transaction(p => [...(p || []), req.userId]);
  res.json({ message: 'Attendance recorded', record });
});

app.post('/api/attendance/leave', verifyToken, async (req, res) => {
  const { meetingId } = req.body;
  const snap = await db.ref('attendance').orderByChild('meetingId').equalTo(meetingId).once('value');
  const data = snap.val() || {};
  const record = Object.values(data).find(r => r.studentId === req.userId && !r.leaveTime);
  if (record) {
    const leaveTime = new Date().toISOString();
    const duration = Math.floor((new Date(leaveTime).getTime() - new Date(record.joinTime).getTime()) / 1000);
    await db.ref(`attendance/${record.id}`).update({ leaveTime, duration });
  }
  res.json({ message: 'Leave recorded' });
});

app.get('/api/attendance/class/:classId', verifyToken, requireRole('teacher'), async (req, res) => {
  const snap = await db.ref('attendance').once('value');
  const all = Object.values(snap.val() || {});
  // Get meetings for this class
  const meetSnap = await db.ref('meetings').once('value');
  const meetings = Object.values(meetSnap.val() || {}).filter(m => m.classId === req.params.classId);
  const meetingIds = new Set(meetings.map(m => m.id));
  const records = all.filter(r => meetingIds.has(r.meetingId));
  res.json(records);
});

app.get('/api/attendance/me', verifyToken, async (req, res) => {
  const snap = await db.ref('attendance').once('value');
  const all = Object.values(snap.val() || {});
  res.json(all.filter(r => r.studentId === req.userId));
});

// ==================== ASSIGNMENTS ROUTES ====================

app.post('/api/assignments', verifyToken, requireRole('teacher'), async (req, res) => {
  const { classId, title, description, dueDate } = req.body;
  const id = require('crypto').randomUUID();
  const assignment = { id, classId, title, description: description || '', dueDate: dueDate || '', files: [], createdAt: new Date().toISOString() };
  await db.ref(`assignments/${id}`).set(assignment);
  await db.ref(`class-assignments/${classId}/${id}`).set(true);
  res.status(201).json(assignment);
});

app.get('/api/assignments/class/:classId', verifyToken, async (req, res) => {
  const snap = await db.ref('assignments').once('value');
  const all = Object.values(snap.val() || {});
  res.json(all.filter(a => a.classId === req.params.classId));
});

app.get('/api/assignments/:id', verifyToken, async (req, res) => {
  const snap = await db.ref(`assignments/${req.params.id}`).once('value');
  const assignment = snap.val();
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
  res.json(assignment);
});

app.get('/api/assignments/:id/submissions', verifyToken, async (req, res) => {
  const subSnap = await db.ref(`submissions/${req.params.id}`).once('value');
  const subs = Object.values(subSnap.val() || {});
  res.json(subs);
});

app.post('/api/assignments/:id/submit', verifyToken, async (req, res) => {
  const { content } = req.body;
  const snap = await db.ref(`assignments/${req.params.id}`).once('value');
  if (!snap.val()) return res.status(404).json({ error: 'Assignment not found' });
  const subId = require('crypto').randomUUID();
  const submission = { id: subId, assignmentId: req.params.id, studentId: req.userId, studentName: req.user.displayName, files: [], content: content || '', submittedAt: new Date().toISOString(), grade: null, feedback: '' };
  await db.ref(`submissions/${req.params.id}/${subId}`).set(submission);
  res.status(201).json(submission);
});

app.put('/api/assignments/submissions/:subId/grade', verifyToken, requireRole('teacher'), async (req, res) => {
  const { grade, feedback } = req.body;
  // Find the submission across all assignments
  const snap = await db.ref('submissions').once('value');
  const all = snap.val() || {};
  for (const assignId of Object.keys(all)) {
    if (all[assignId][req.params.subId]) {
      await db.ref(`submissions/${assignId}/${req.params.subId}`).update({ grade, feedback });
      const updated = (await db.ref(`submissions/${assignId}/${req.params.subId}`).once('value')).val();
      return res.json(updated);
    }
  }
  res.status(404).json({ error: 'Submission not found' });
});

// ==================== ANNOUNCEMENTS ROUTES ====================

app.post('/api/announcements', verifyToken, requireRole('teacher'), async (req, res) => {
  const { classId, title, content } = req.body;
  const id = require('crypto').randomUUID();
  const announcement = { id, classId, teacherId: req.userId, teacherName: req.user.displayName, title, content: content || '', createdAt: new Date().toISOString(), attachments: [] };
  await db.ref(`announcements/${id}`).set(announcement);
  await db.ref(`class-announcements/${classId}/${id}`).set(true);
  res.status(201).json({ message: 'Announcement created', announcement });
});

app.get('/api/announcements/class/:classId', verifyToken, async (req, res) => {
  const snap = await db.ref('announcements').once('value');
  const all = Object.values(snap.val() || {});
  res.json(all.filter(a => a.classId === req.params.classId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.delete('/api/announcements/:id', verifyToken, requireRole('teacher'), async (req, res) => {
  await db.ref(`announcements/${req.params.id}`).remove();
  res.json({ message: 'Deleted' });
});

// ==================== WHITEBOARD ROUTES ====================

app.post('/api/whiteboard/actions', verifyToken, async (req, res) => {
  const { meetingId, action } = req.body;
  const id = require('crypto').randomUUID();
  const act = { id, ...action, timestamp: new Date().toISOString(), userId: req.userId };
  await db.ref(`whiteboard/${meetingId}/actions/${id}`).set(act);
  res.status(201).json({ action: act });
});

app.get('/api/whiteboard/:meetingId/actions', verifyToken, async (req, res) => {
  const snap = await db.ref(`whiteboard/${req.params.meetingId}/actions`).once('value');
  res.json({ actions: Object.values(snap.val() || {}) });
});

app.delete('/api/whiteboard/:meetingId', verifyToken, requireRole('teacher'), async (req, res) => {
  await db.ref(`whiteboard/${req.params.meetingId}/actions`).remove();
  res.json({ message: 'Board cleared' });
});

// ==================== UPLOAD ROUTES ====================
// Note: File upload to Vercel requires R2 or other storage.
// This endpoint returns a presigned URL config or accepts base64 for small files.

app.post('/api/upload', verifyToken, requireRole('teacher'), async (req, res) => {
  const { fileName, fileType, base64 } = req.body;
  if (!fileName || !base64) return res.status(400).json({ error: 'fileName and base64 content required' });
  const key = `uploads/${req.userId}/${Date.now()}-${fileName}`;
  // For Vercel, store base64 content in RTDB as fallback
  await db.ref(`files/${key}`).set({ fileName, fileType, content: base64, uploadedBy: req.userId, uploadedAt: new Date().toISOString() });
  res.json({ url: `/api/files/${key}`, key });
});

app.get(/^\/api\/files\/(.+)$/, async (req, res) => {
  const key = req.params[0] || req.params.key;
  const snap = await db.ref(`files/${key}`).once('value');
  const data = snap.val();
  if (!data) return res.status(404).json({ error: 'File not found' });
  const matches = data.content.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    res.setHeader('Content-Type', matches[1]);
    res.send(Buffer.from(matches[2], 'base64'));
  } else {
    res.json(data);
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

module.exports = app;
