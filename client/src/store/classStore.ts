import { create } from 'zustand'
import type { Class, User } from '@/types'
import { classesService } from '@/services/classes'

interface ClassState {
  classes: Class[]
  currentClass: Class | null
  students: User[]
  isLoading: boolean
  error: string | null
  fetchClasses: () => Promise<void>
  fetchClass: (id: string) => Promise<void>
  createClass: (data: Omit<Class, 'id' | 'createdAt' | 'roomId' | 'inviteCode'>) => Promise<Class>
  updateClass: (id: string, data: Partial<Class>) => Promise<Class>
  deleteClass: (id: string) => Promise<void>
  joinClass: (inviteCode: string) => Promise<Class>
  leaveClass: (classId: string) => Promise<void>
  fetchStudents: (classId: string) => Promise<void>
}

export const useClassStore = create<ClassState>((set) => ({
  classes: [],
  currentClass: null,
  students: [],
  isLoading: false,
  error: null,

  fetchClasses: async () => {
    set({ isLoading: true, error: null })
    try {
      const classes = await classesService.getClasses()
      set({ classes, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch classes'
      set({ error: message, isLoading: false })
    }
  },

  fetchClass: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const currentClass = await classesService.getClass(id)
      set({ currentClass, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch class'
      set({ error: message, isLoading: false })
    }
  },

  createClass: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newClass = await classesService.createClass(data)
      set((state) => ({ classes: [...state.classes, newClass], isLoading: false }))
      return newClass
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create class'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  updateClass: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await classesService.updateClass(id, data)
      set((state) => ({
        classes: state.classes.map((c) => (c.id === id ? updated : c)),
        currentClass: state.currentClass?.id === id ? updated : state.currentClass,
        isLoading: false,
      }))
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update class'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  deleteClass: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await classesService.deleteClass(id)
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        currentClass: state.currentClass?.id === id ? null : state.currentClass,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete class'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  joinClass: async (inviteCode) => {
    set({ isLoading: true, error: null })
    try {
      const joinedClass = await classesService.joinClass(inviteCode)
      set((state) => ({ classes: [...state.classes, joinedClass], isLoading: false }))
      return joinedClass
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join class'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  leaveClass: async (classId) => {
    set({ isLoading: true, error: null })
    try {
      await classesService.leaveClass(classId)
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== classId),
        currentClass: state.currentClass?.id === classId ? null : state.currentClass,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave class'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  fetchStudents: async (classId) => {
    set({ isLoading: true, error: null })
    try {
      const students = await classesService.getClassStudents(classId)
      set({ students, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch students'
      set({ error: message, isLoading: false })
    }
  },
}))
