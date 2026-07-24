import api from './api'

export const uploadService = {
  async uploadFile(file: File, type: string): Promise<{ key: string; url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api.upload<{ key: string; url: string }>('/upload', formData)
  },

  async getFileUrl(key: string): Promise<{ url: string }> {
    return api.get<{ url: string }>(`/upload/${encodeURIComponent(key)}`)
  },

  async deleteFile(key: string): Promise<void> {
    return api.delete<void>(`/upload/${encodeURIComponent(key)}`)
  },
}

export default uploadService
