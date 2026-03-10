/**
 * 💾 Хук для автосохранения данных
 * Автоматически сохраняет состояние в localStorage
 */

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export function useAutoSave<T>(
  data: T,
  key: string,
  options: {
    debounceMs?: number
    enabled?: boolean
    onSave?: (data: T) => void
    showToast?: boolean
  } = {}
) {
  const {
    debounceMs = 1000,
    enabled = true,
    onSave,
    showToast = false
  } = options

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!enabled || isFirstRender.current) {
      isFirstRender.current = false
      // Загружаем сохранённые данные при первой загрузке
      const saved = localStorage.getItem(`autosave_${key}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (onSave) {
            onSave(parsed)
          }
        } catch (e) {
          console.error('Error loading autosaved data:', e)
        }
      }
      return
    }

    // Дебаунс для избежания частых сохранений
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const dataString = JSON.stringify(data)
    
    // Пропускаем сохранение, если данные не изменились
    if (dataString === lastSavedRef.current) {
      return
    }

    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`autosave_${key}`, dataString)
        lastSavedRef.current = dataString
        
        if (showToast) {
          toast.success('💾 Автосохранено', {
            duration: 2000,
            icon: '💾',
            position: 'bottom-right'
          })
        }

        if (onSave) {
          onSave(data)
        }
      } catch (error) {
        console.error('Autosave error:', error)
        if (showToast) {
          toast.error('Ошибка автосохранения')
        }
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, key, enabled, debounceMs, onSave, showToast])

  // Функция для ручного сохранения
  const save = () => {
    try {
      localStorage.setItem(`autosave_${key}`, JSON.stringify(data))
      lastSavedRef.current = JSON.stringify(data)
      
      if (showToast) {
        toast.success('💾 Сохранено', {
          duration: 2000,
          position: 'bottom-right'
        })
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Ошибка сохранения')
    }
  }

  // Функция для загрузки сохранённых данных
  const load = (): T | null => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      if (saved) {
        return JSON.parse(saved) as T
      }
    } catch (error) {
      console.error('Load error:', error)
    }
    return null
  }

  // Функция для очистки сохранённых данных
  const clear = () => {
    localStorage.removeItem(`autosave_${key}`)
    lastSavedRef.current = ''
    if (showToast) {
      toast.success('Данные очищены')
    }
  }

  return { save, load, clear }
}


