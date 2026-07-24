const API_URL = '/api'

const getToken = () => localStorage.getItem('token')

class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData?: boolean
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const config: RequestInit = {
    method,
    headers,
  }

  if (body !== undefined) {
    config.body = isFormData ? (body as FormData) : JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${path}`, config)

  if (!response.ok) {
    let errorData: unknown
    try {
      errorData = await response.json()
    } catch {
      errorData = null
    }
    const message =
      (errorData as { message?: string })?.message ||
      `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, errorData)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),

  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),

  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),

  delete: <T>(path: string) => request<T>('DELETE', path),

  upload: <T>(path: string, formData: FormData) =>
    request<T>('PUT', path, formData, true),
}

export { ApiError }
export default api
