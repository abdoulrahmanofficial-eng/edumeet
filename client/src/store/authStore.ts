import { create } from 'zustand'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/config'
import type { User } from '@/types'
import { authService } from '@/services/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string, displayName: string, role: 'teacher' | 'student') => Promise<User>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<User>
  clearError: () => void
  initialize: () => () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken()
          localStorage.setItem('token', token)
          set({ token })
          try {
            const user = await authService.getCurrentUser()
            set({ user, isLoading: false })
          } catch {
            set({ isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      } else {
        localStorage.removeItem('token')
        set({ user: null, token: null, isLoading: false })
      }
    })
    return unsubscribe
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { user, token } = await authService.login(email, password)
      localStorage.setItem('token', token)
      set({ user, token, isLoading: false })
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      console.error('Login error full:', err)
      set({ error: message, isLoading: false })
      throw err
    }
  },

  register: async (email, password, displayName, role) => {
    set({ isLoading: true, error: null })
    try {
      const { user, token } = await authService.register(email, password, displayName, role)
      localStorage.setItem('token', token)
      set({ user, token, isLoading: false })
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    set({ user: null, token: null, error: null })
  },

  fetchUser: async () => {
    const token = get().token
    if (!token) {
      set({ isLoading: false })
      return
    }
    set({ isLoading: true, error: null })
    try {
      const user = await authService.getCurrentUser()
      set({ user, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isLoading: false })
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const user = await authService.updateProfile(data)
      set({ user, isLoading: false })
      return user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))
