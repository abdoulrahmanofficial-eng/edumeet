import { create } from 'zustand'
import { ref, onChildAdded, off } from 'firebase/database'
import type { Notification } from '@/types'
import { notificationsService } from '@/services/notifications'
import { db } from '@/firebase/config'
import { useAuthStore } from './authStore'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  addRealtimeNotification: (notification: Notification) => void
  cleanup: () => void
  subscribeToRealtime: () => () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  let unsubscribeRealtime: (() => void) | null = null

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
      set({ isLoading: true, error: null })
      try {
        const notifications = await notificationsService.getNotifications()
        const unreadCount = notifications.filter((n) => !n.read).length
        set({ notifications, unreadCount, isLoading: false })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch notifications'
        set({ error: message, isLoading: false })
      }
    },

    markRead: async (id) => {
      try {
        await notificationsService.markAsRead(id)
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = notifications.filter((n) => !n.read).length
          return { notifications, unreadCount }
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark notification as read'
        set({ error: message })
      }
    },

    markAllRead: async () => {
      try {
        await notificationsService.markAllAsRead()
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark all as read'
        set({ error: message })
      }
    },

    addRealtimeNotification: (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.read ? 0 : 1),
      }))
    },

    cleanup: () => {
      if (unsubscribeRealtime) {
        unsubscribeRealtime()
        unsubscribeRealtime = null
      }
    },

    subscribeToRealtime: () => {
      const user = useAuthStore.getState().user
      if (!user) return () => {}

      if (unsubscribeRealtime) {
        unsubscribeRealtime()
      }

      const notificationsRef = ref(db, `notifications/${user.uid}`)
      const listener = onChildAdded(notificationsRef, (snapshot) => {
        const notification = snapshot.val() as Notification
        if (notification) {
          get().addRealtimeNotification({ ...notification, id: snapshot.key! })
        }
      })

      unsubscribeRealtime = () => {
        off(notificationsRef, 'child_added', listener)
      }

      return unsubscribeRealtime
    },
  }
})
