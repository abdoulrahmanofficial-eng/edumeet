import api from './api'
import type { Notification } from '@/types'

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    return api.get<Notification[]>('/notifications')
  },

  async markAsRead(id: string): Promise<Notification> {
    return api.put<Notification>(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<{ message: string }> {
    return api.put<{ message: string }>('/notifications/read-all')
  },
}

export default notificationsService
