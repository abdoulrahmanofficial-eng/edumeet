import api from './api'
import type { Assignment, Submission } from '@/types'

export const assignmentsService = {
  async createAssignment(data: Omit<Assignment, 'id' | 'createdAt'>): Promise<Assignment> {
    return api.post<Assignment>('/assignments', data)
  },

  async getClassAssignments(classId: string): Promise<Assignment[]> {
    return api.get<Assignment[]>(`/assignments/class/${classId}`)
  },

  async getAssignment(id: string): Promise<Assignment> {
    return api.get<Assignment>(`/assignments/${id}`)
  },

  async submitAssignment(assignmentId: string, formData: FormData): Promise<Submission> {
    return api.upload<Submission>(`/assignments/${assignmentId}/submit`, formData)
  },

  async getSubmissions(assignmentId: string): Promise<Submission[]> {
    return api.get<Submission[]>(`/assignments/${assignmentId}/submissions`)
  },

  async gradeSubmission(
    submissionId: string,
    data: { grade: number; feedback: string }
  ): Promise<Submission> {
    return api.put<Submission>(`/submissions/${submissionId}/grade`, data)
  },
}

export default assignmentsService
