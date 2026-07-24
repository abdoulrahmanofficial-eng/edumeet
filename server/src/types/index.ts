export type UserRole = 'teacher' | 'student';

export type ClassStatus = 'upcoming' | 'ongoing' | 'completed';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';
export type MeetingStatus = 'scheduled' | 'active' | 'ended';
export type MessageType = 'text' | 'file' | 'system';
export type WhiteboardActionType = 'draw' | 'erase' | 'text' | 'shape' | 'image';
export type PresenceStatus = 'online' | 'offline' | 'away';
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  scheduledAt: string;
  duration: number;
  recurring: RecurringType;
  status: ClassStatus;
  roomId: string;
  inviteCode: string;
  createdAt: string;
  maxStudents: number;
}

export interface Meeting {
  id: string;
  classId: string;
  title: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  duration: number;
  recordingUrl: string;
  status: MeetingStatus;
  participants: string[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  type: MessageType;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  files: Attachment[];
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  files: Attachment[];
  submittedAt: string;
  grade: number;
  feedback: string;
}

export interface Announcement {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  content: string;
  createdAt: string;
  attachments: Attachment[];
}

export interface WhiteboardAction {
  id: string;
  type: WhiteboardActionType;
  data: Record<string, unknown>;
  timestamp: string;
  userId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastSeen: string;
  classId: string;
}

export interface Attendance {
  id: string;
  classId: string;
  meetingId: string;
  studentId: string;
  studentName: string;
  joinTime: string;
  leaveTime: string;
  duration: number;
  status: AttendanceStatus;
}

export interface AuthRequest {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

export interface CreateClassRequest {
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  recurring: RecurringType;
  maxStudents: number;
}
