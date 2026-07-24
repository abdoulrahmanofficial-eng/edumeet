import { create } from 'zustand'
import type { Meeting, User } from '@/types'
import { meetingsService } from '@/services/meetings'

interface MeetingState {
  currentMeeting: Meeting | null
  participants: User[]
  isLoading: boolean
  error: string | null
  createMeeting: (classId: string) => Promise<Meeting>
  startMeeting: (id: string) => Promise<Meeting>
  endMeeting: (id: string) => Promise<Meeting>
  fetchMeeting: (id: string) => Promise<void>
  fetchParticipants: (meetingId: string) => Promise<void>
  getMeetingToken: (id: string) => Promise<string>
  reset: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
  currentMeeting: null,
  participants: [],
  isLoading: false,
  error: null,

  createMeeting: async (classId) => {
    set({ isLoading: true, error: null })
    try {
      const meeting = await meetingsService.createMeeting(classId)
      set({ currentMeeting: meeting, isLoading: false })
      return meeting
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create meeting'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  startMeeting: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const meeting = await meetingsService.startMeeting(id)
      set({ currentMeeting: meeting, isLoading: false })
      return meeting
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start meeting'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  endMeeting: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const meeting = await meetingsService.endMeeting(id)
      set({ currentMeeting: meeting, isLoading: false })
      return meeting
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end meeting'
      set({ error: message, isLoading: false })
      throw err
    }
  },

  fetchMeeting: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const meeting = await meetingsService.getMeeting(id)
      set({ currentMeeting: meeting, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch meeting'
      set({ error: message, isLoading: false })
    }
  },

  fetchParticipants: async (meetingId) => {
    set({ isLoading: true, error: null })
    try {
      const participants = await meetingsService.getParticipants(meetingId)
      set({ participants, isLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch participants'
      set({ error: message, isLoading: false })
    }
  },

  getMeetingToken: async (id) => {
    const { token } = await meetingsService.getMeetingToken(id)
    return token
  },

  reset: () => set({ currentMeeting: null, participants: [], isLoading: false, error: null }),
}))
