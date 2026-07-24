import api from './api'
import type { Class, User } from '@/types'

export const classesService = {
  async createClass(data: Omit<Class, 'id' | 'createdAt' | 'roomId' | 'inviteCode'>): Promise<Class> {
    return api.post<Class>('/classes', data)
  },

  async getClasses(): Promise<Class[]> {
    return api.get<Class[]>('/classes')
  },

  async getClass(id: string): Promise<Class> {
    return api.get<Class>(`/classes/${id}`)
  },

  async updateClass(id: string, data: Partial<Class>): Promise<Class> {
    return api.put<Class>(`/classes/${id}`, data)
  },

  async deleteClass(id: string): Promise<void> {
    return api.delete<void>(`/classes/${id}`)
  },

  async joinClass(inviteCode: string): Promise<Class> {
    return api.post<Class>('/classes/join', { inviteCode })
  },

  async leaveClass(classId: string): Promise<void> {
    return api.post<void>(`/classes/${classId}/leave`)
  },

  async getClassStudents(classId: string): Promise<User[]> {
    return api.get<User[]>(`/classes/${classId}/students`)
  },
}

export default classesService
