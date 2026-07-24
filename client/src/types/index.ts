export interface User {
  uid: string
  email: string
  displayName: string
  photoURL: string
  role: 'teacher' | 'student'
  createdAt: string
}

export interface Class {
  id: string
  title: string
  description: string
  teacherId: string
  teacherName: string
  scheduledAt: string
  duration: number
  recurring: boolean
  status: 'upcoming' | 'active' | 'ongoing' | 'completed' | 'cancelled'
  roomId: string
  inviteCode: string
  maxStudents: number
  createdAt: string
  currentMeetingId?: string
}

export interface Meeting {
  id: string
  classId: string
  title: string
  teacherId: string
  startTime: string
  endTime: string
  duration: number
  recordingUrl: string
  status: 'scheduled' | 'live' | 'ended' | 'recording'
  participants: string[]
  participantsCount: number
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'teacher' | 'student'
  content: string
  timestamp: string
  type: 'text' | 'file' | 'system'
}

export interface Assignment {
  id: string
  classId: string
  title: string
  description: string
  dueDate: string
  files: string[]
  createdAt: string
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  files: string[]
  submittedAt: string
  grade: number
  feedback: string
}

export interface Announcement {
  id: string
  classId: string
  teacherId: string
  title: string
  content: string
  createdAt: string
  attachments: string[]
}

export interface WhiteboardAction {
  id: string
  type: string
  data: unknown
  timestamp: string
  userId: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: string
}

export interface Attendance {
  id: string
  classId: string
  meetingId: string
  studentId: string
  studentName: string
  joinTime: string
  leaveTime: string
  duration: number
  status: 'present' | 'late' | 'absent'
}

export interface DashboardStats {
  totalClasses: number
  upcomingMeetings: number
  totalStudents: number
  totalAssignments: number
}
