import { db } from '../config/firebase';
import { Attendance, AttendanceStatus } from '../types';
import { generateId, toTimestamp } from '../utils/helpers';

export async function recordJoin(
  meetingId: string,
  studentId: string,
  studentName: string
): Promise<Attendance> {
  const meetingSnapshot = await db.ref(`meetings/${meetingId}`).once('value');
  const meeting = meetingSnapshot.val();
  if (!meeting) throw new Error('Meeting not found');

  const id = generateId();
  const attendance: Attendance = {
    id,
    classId: meeting.classId,
    meetingId,
    studentId,
    studentName,
    joinTime: toTimestamp(),
    leaveTime: '',
    duration: 0,
    status: 'present',
  };

  await db.ref(`attendance/${meetingId}/${studentId}`).set(attendance);
  await db.ref(`student-attendance/${studentId}/${meetingId}`).set(true);

  return attendance;
}

export async function recordLeave(
  meetingId: string,
  studentId: string
): Promise<Attendance> {
  const snapshot = await db
    .ref(`attendance/${meetingId}/${studentId}`)
    .once('value');
  const attendance = snapshot.val();
  if (!attendance) throw new Error('Attendance record not found');

  const leaveTime = toTimestamp();
  const joinMs = new Date(attendance.joinTime).getTime();
  const leaveMs = new Date(leaveTime).getTime();
  const duration = Math.floor((leaveMs - joinMs) / 1000);

  const minutesOnline = duration / 60;
  const status: AttendanceStatus =
    minutesOnline >= 10 ? 'present' : 'late';

  const updatedAttendance: Attendance = {
    ...attendance,
    leaveTime,
    duration,
    status,
  };

  await db
    .ref(`attendance/${meetingId}/${studentId}`)
    .update({
      leaveTime,
      duration,
      status,
    });

  return updatedAttendance;
}

export async function getClassAttendance(
  classId: string
): Promise<Attendance[]> {
  const meetingsSnapshot = await db
    .ref(`class-meetings/${classId}`)
    .once('value');
  const meetingIds = meetingsSnapshot.val();
  if (!meetingIds) return [];

  const allAttendance: Attendance[] = [];
  for (const meetingId of Object.keys(meetingIds)) {
    const attendanceSnapshot = await db
      .ref(`attendance/${meetingId}`)
      .once('value');
    const attendanceData = attendanceSnapshot.val();
    if (attendanceData) {
      for (const record of Object.values(attendanceData)) {
        allAttendance.push(record as Attendance);
      }
    }
  }

  return allAttendance.sort(
    (a, b) => new Date(b.joinTime).getTime() - new Date(a.joinTime).getTime()
  );
}

export async function getStudentAttendance(
  studentId: string
): Promise<Attendance[]> {
  const meetingSnapshot = await db
    .ref(`student-attendance/${studentId}`)
    .once('value');
  const meetingIds = meetingSnapshot.val();
  if (!meetingIds) return [];

  const allAttendance: Attendance[] = [];
  for (const meetingId of Object.keys(meetingIds)) {
    const record = await db
      .ref(`attendance/${meetingId}/${studentId}`)
      .once('value');
    const data = record.val();
    if (data) allAttendance.push(data);
  }

  return allAttendance.sort(
    (a, b) => new Date(b.joinTime).getTime() - new Date(a.joinTime).getTime()
  );
}

export async function getMeetingAttendance(
  meetingId: string
): Promise<Attendance[]> {
  const snapshot = await db.ref(`attendance/${meetingId}`).once('value');
  const data = snapshot.val();
  if (!data) return [];

  return Object.values(data as Record<string, Attendance>);
}
