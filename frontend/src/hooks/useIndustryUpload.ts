import { useState, useEffect, useCallback } from 'react'
import { useAnalyticsStore } from '@/store/analyticsStore'
import toast from 'react-hot-toast'

interface UseIndustryUploadReturn {
  aiData: any | null
  isUploading: boolean
  uploadFile: (file: File) => Promise<any | null>
  uploadDemo: (demoUrl: string) => Promise<any | null>
  clearData: () => void
}

/**
 * Хук для загрузки файлов с AI-анализом через бэкенд.
 * Отправляет файл на /api/v1/files/upload, сохраняет результат в store.
 * При монтировании восстанавливает данные из localStorage.
 */
export function useIndustryUpload(industry: string): UseIndustryUploadReturn {
  const [aiData, setAiData] = useState<any | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { setUploadData, getUploadData, setAnalytics } = useAnalyticsStore.getState()

  // Восстанавливаем сохранённые данные при монтировании
  useEffect(() => {
    const saved = useAnalyticsStore.getState().getUploadData(industry)
    if (saved) {
      setAiData(saved)
    }
  }, [industry])

  const sendToBackend = useCallback(async (file: File): Promise<any | null> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const API_URL =
        (import.meta as any).env?.VITE_API_URL ||
        ((import.meta as any).env?.PROD
          ? '/api/v1'
          : 'http://localhost:8000/api/v1')

      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || `Ошибка сервера: ${response.status}`)
      }

      const result = await response.json()

      // Сохраняем в store (persisted в localStorage)
      useAnalyticsStore.getState().setUploadData(industry, result)

      // Обновляем analytics для AI-чата
      if (result.analytics) {
        useAnalyticsStore.getState().setAnalytics(result.analytics)
      }

      setAiData(result)
      return result
    } catch (error: any) {
      console.error(`[${industry}] Ошибка AI-анализа:`, error)
      const msg = error?.message || ''
      if (msg === 'Failed to fetch' || msg.includes('NetworkError')) {
        toast.error('API недоступен. Проверьте VITE_API_URL в Vercel.', { duration: 5000 })
      } else {
        toast.error(msg || 'Ошибка AI-анализа')
      }
      return null
    } finally {
      setIsUploading(false)
    }
  }, [industry])

  const uploadFile = useCallback(async (file: File) => {
    return sendToBackend(file)
  }, [sendToBackend])

  const uploadDemo = useCallback(async (demoUrl: string) => {
    setIsUploading(true)
    try {
      const response = await fetch(demoUrl)
      if (!response.ok) throw new Error('Не удалось загрузить демо-файл')
      const blob = await response.blob()
      const fileName = demoUrl.split('/').pop() || 'demo.csv'
      const file = new File([blob], fileName, { type: 'text/csv' })
      return sendToBackend(file)
    } catch (error: any) {
      console.error(`[${industry}] Ошибка загрузки демо:`, error)
      toast.error(error.message || 'Ошибка загрузки демо-данных')
      setIsUploading(false)
      return null
    }
  }, [industry, sendToBackend])

  const clearData = useCallback(() => {
    useAnalyticsStore.getState().clearUploadData(industry)
    setAiData(null)
  }, [industry])

  return { aiData, isUploading, uploadFile, uploadDemo, clearData }
}
