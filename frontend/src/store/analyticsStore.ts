import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AnalyticsState {
  analytics: any | null
  setAnalytics: (analytics: any) => void
  clearAnalytics: () => void

  // Полные данные загрузки, хранятся по ключу отрасли
  uploadData: Record<string, any>
  setUploadData: (industry: string, data: any) => void
  getUploadData: (industry: string) => any
  clearUploadData: (industry: string) => void
  clearAllUploadData: () => void
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      analytics: null,
      setAnalytics: (analytics) => set({ analytics }),
      clearAnalytics: () => set({ analytics: null }),

      uploadData: {},
      setUploadData: (industry, data) =>
        set((state) => ({
          uploadData: { ...state.uploadData, [industry]: data },
        })),
      getUploadData: (industry) => get().uploadData[industry] || null,
      clearUploadData: (industry) =>
        set((state) => {
          const copy = { ...state.uploadData }
          delete copy[industry]
          return { uploadData: copy }
        }),
      clearAllUploadData: () => set({ uploadData: {} }),
    }),
    {
      name: 'analytics-storage',
    }
  )
)
