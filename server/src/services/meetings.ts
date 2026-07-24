import { AccessToken } from 'livekit-server-sdk';
import { db } from '../config/firebase';
import { config } from '../config';
import { Meeting, User } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';
import { getClass } from './classes';

export async function createMeeting(
  classId: string,
  teacherId: string
): Promise<Meeting> {
  const classData = await getClass(classId);
  if (!classData) throw new Error('Class not found');
  if (classData.teacherId !== teacherId) throw new Error('Not authorized');

  const id = generateId();
  const meeting: Meeting = {
    id,
    classId,
    title: classData.title,
    teacherId,
    startTime: toTimestamp(),
    endTime: '',
    duration: 0,
    recordingUrl: '',
    status: 'active',
    participants: [teacherId],
  };

  await db.ref(`meetings/${id}`).set(meeting);
  await db.ref(`class-meetings/${classId}/${id}`).set(true);
  await db.ref(`classes/${classId}/status`).set('ongoing');

  return meeting;
}

export async function startMeeting(meetingId: string): Promise<Meeting> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  meeting.status = 'active';
  meeting.startTime = toTimestamp();
  await db.ref(`meetings/${meetingId}`).update({
    status: 'active',
    startTime: meeting.startTime,
  });

  return meeting;
}

export async function endMeeting(meetingId: string): Promise<Meeting> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  const endTime = toTimestamp();
  const startMs = new Date(meeting.startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const duration = Math.floor((endMs - startMs) / 1000);

  meeting.status = 'ended';
  meeting.endTime = endTime;
  meeting.duration = duration;
  await db.ref(`meetings/${meetingId}`).update({
    status: 'ended',
    endTime,
    duration,
  });

  await db.ref(`classes/${meeting.classId}/status`).set('completed');

  return meeting;
}

export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  const snapshot = await db.ref(`meetings/${meetingId}`).once('value');
  return snapshot.val();
}

export async function generateLiveKitToken(
  identity: string,
  room: string,
  role: string
): Promise<string> {
  if (!config.livekit.apiKey || !config.livekit.apiSecret) {
    throw new Error('LiveKit credentials not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env');
  }
  const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity,
    name: identity,
  });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: role === 'teacher',
    canSubscribe: true,
  });

  return await at.toJwt();
}

export async function addParticipant(
  meetingId: string,
  userId: string,
  _userData: Partial<User>
): Promise<void> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  if (!meeting.participants.includes(userId)) {
    meeting.participants.push(userId);
    await db.ref(`meetings/${meetingId}/participants`).set(meeting.participants);
  }
}

export async function removeParticipant(
  meetingId: string,
  userId: string
): Promise<void> {
  const meeting = await getMeeting(meetingId);
  if (!meeting) throw new Error('Meeting not found');

  meeting.participants = meeting.participants.filter(id => id !== userId);
  await db.ref(`meetings/${meetingId}/participants`).set(meeting.participants);
}

export async function getClassMeetings(classId: string): Promise<Meeting[]> {
  const snapshot = await db.ref(`class-meetings/${classId}`).once('value');
  const meetingIds = snapshot.val();
  if (!meetingIds) return [];

  const meetings: Meeting[] = [];
  for (const id of Object.keys(meetingIds)) {
    const meeting = await getMeeting(id);
    if (meeting) meetings.push(meeting);
  }

  return meetings.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}
