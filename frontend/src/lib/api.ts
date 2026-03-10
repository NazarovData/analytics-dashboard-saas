import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  FileUploadResponse,
  FileListResponse,
  AnalyticsMetrics,
} from '@/types'

// Production: задайте VITE_API_URL = https://your-backend.onrender.com/api/v1
// Иначе в PROD fetch на localhost даст "Failed to fetch"
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  ((import.meta as any).env?.PROD
    ? '/api/v1'
    : 'http://localhost:8000/api/v1')

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post<TokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token } = response.data
        useAuthStore.getState().setTokens(access_token, refresh_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me')
    return response.data
  },
}

// Files API
export const filesApi = {
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<FileUploadResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  getFiles: async (): Promise<FileListResponse> => {
    const response = await api.get<FileListResponse>('/files')
    return response.data
  },

  getFile: async (fileId: number): Promise<FileUploadResponse> => {
    const response = await api.get<FileUploadResponse>(`/files/${fileId}`)
    return response.data
  },

  getAnalytics: async (
    fileId: number,
    forceRecalculate = false
  ): Promise<AnalyticsMetrics> => {
    const response = await api.get<AnalyticsMetrics>(`/files/${fileId}/analytics`, {
      params: { force_recalculate: forceRecalculate },
    })
    return response.data
  },

  deleteFile: async (fileId: number): Promise<void> => {
    await api.delete(`/files/${fileId}`)
  },
}

// Mapper API
export const mapperApi = {
  saveTemplate: async (data: {
    industry: string
    country: string
    mapping: Record<string, string | null>
    user_id?: number
  }) => {
    const response = await api.post('/mapper/templates', data)
    return response.data
  },

  loadTemplate: async (industry: string, userId = 0) => {
    const response = await api.get(`/mapper/templates/${industry}`, {
      params: { user_id: userId },
    })
    return response.data
  },

  listTemplates: async (userId = 0) => {
    const response = await api.get('/mapper/templates', {
      params: { user_id: userId },
    })
    return response.data
  },

  deleteTemplate: async (industry: string, userId = 0) => {
    const response = await api.delete(`/mapper/templates/${industry}`, {
      params: { user_id: userId },
    })
    return response.data
  },

  saveTransactions: async (data: {
    industry: string
    country: string
    rows: Record<string, any>[]
    user_id?: number
  }) => {
    const response = await api.post('/mapper/transactions', data)
    return response.data
  },

  getTransactions: async (industry: string, userId = 0, limit = 1000) => {
    const response = await api.get(`/mapper/transactions/${industry}`, {
      params: { user_id: userId, limit },
    })
    return response.data
  },
}














