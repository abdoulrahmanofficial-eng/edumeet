import api from './api'
import type { Attendance } from '@/types'

export const attendanceService = {
  async getClassAttendance(classId: string): Promise<Attendance[]> {
    return api.get<Attendance[]>(`/attendance/class/${classId}`)
  },

  async getMyAttendance(): Promise<Attendance[]> {
    return api.get<Attendance[]>('/attendance/me')
  },

  async getMeetingAttendance(meetingId: string): Promise<Attendance[]> {
    return api.get<Attendance[]>(`/attendance/meeting/${meetingId}`)
  },
}

export default attendanceService
