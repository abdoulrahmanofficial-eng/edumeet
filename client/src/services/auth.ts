import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { api } from './api'
import type { User } from '@/types'

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()
    const data = await api.post<{ user: User; token: string }>('/auth/login', { idToken })
    return { user: data.user, token: data.token }
  },

  async register(email: string, password: string, displayName: string, role: 'teacher' | 'student'): Promise<{ user: User; token: string }> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const idToken = await userCredential.user.getIdToken()
    const data = await api.post<{ user: User; token: string }>('/auth/register', {
      idToken,
      displayName,
      role,
    })
    return { user: data.user, token: data.token }
  },

  async logout(): Promise<void> {
    await signOut(auth)
    localStorage.removeItem('token')
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    await sendPasswordResetEmail(auth, email)
    return { message: 'Password reset email sent' }
  },

  async getCurrentUser(): Promise<User> {
    const user = auth.currentUser
    if (!user) throw new Error('Not authenticated')
    const idToken = await user.getIdToken(true)
    localStorage.setItem('token', idToken)
    const data = await api.get<{ user: User }>('/auth/me')
    return data.user
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const result = await api.put<{ user: User }>('/auth/profile', data)
    return result.user
  },

  async uploadProfileImage(file: File): Promise<{ photoURL: string }> {
    const formData = new FormData()
    formData.append('image', file)
    return api.upload<{ photoURL: string }>('/auth/profile/image', formData)
  },
}

export default authService
