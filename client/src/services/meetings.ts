import api from './api'
import type { Meeting, User } from '@/types'

export const meetingsService = {
  async createMeeting(classId: string): Promise<Meeting> {
    return api.post<Meeting>(`/meetings/${classId}`)
  },

  async startMeeting(id: string): Promise<Meeting> {
    return api.post<Meeting>(`/meetings/${id}/start`)
  },

  async endMeeting(id: string): Promise<Meeting> {
    return api.post<Meeting>(`/meetings/${id}/end`)
  },

  async getMeeting(id: string): Promise<Meeting> {
    return api.get<Meeting>(`/meetings/${id}`)
  },

  async getMeetingToken(id: string): Promise<{ token: string }> {
    return api.post<{ token: string }>(`/meetings/${id}/token`)
  },

  async getParticipants(meetingId: string): Promise<User[]> {
    return api.get<User[]>(`/meetings/${meetingId}/participants`)
  },

  async muteParticipant(meetingId: string, identity: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/meetings/${meetingId}/participants/${identity}/mute`)
  },

  async disableParticipantCamera(meetingId: string, identity: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/meetings/${meetingId}/participants/${identity}/disable-video`)
  },

  async enableParticipantCamera(meetingId: string, identity: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/meetings/${meetingId}/participants/${identity}/enable-video`)
  },

  async removeParticipant(meetingId: string, identity: string): Promise<{ message: string }> {
    return api.post<{ message: string }>(`/meetings/${meetingId}/participants/${identity}/remove`)
  },
}

export default meetingsService
