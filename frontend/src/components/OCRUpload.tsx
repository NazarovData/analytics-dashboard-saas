import React, { useState, useRef, useCallback } from 'react'
import { filesApi } from '../lib/api'

interface OCRUploadProps {
  onUploadComplete?: (data: any) => void
  onError?: (error: string) => void
}

export function OCRUpload({ onUploadComplete, onError }: OCRUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      onError?.('Неподдерживаемый формат файла. Используйте JPG, PNG или PDF.')
      return
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      onError?.('Файл слишком большой. Максимальный размер: 50 МБ.')
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    // Upload file
    await uploadFile(file)
  }, [onError])

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setOcrProgress('Загрузка файла...')

    try {
      setOcrProgress('Распознавание текста (OCR)... Это может занять некоторое время...')

      const response = await filesApi.uploadFile(file)

      setOcrProgress('Обработка данных...')

      if (response.success) {
        setOcrProgress('Готово!')
        onUploadComplete?.(response)
        
        // Reset after success
        setTimeout(() => {
          setPreview(null)
          setSelectedFile(null)
          setOcrProgress('')
        }, 2000)
      } else {
        throw new Error(response.message || 'Ошибка загрузки файла')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при загрузке файла'
      onError?.(errorMessage)
      setOcrProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleCameraCapture = () => {
    // Request camera access
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        // Create video element
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()

        // Create canvas to capture frame
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Capture frame after a short delay
          setTimeout(() => {
            ctx?.drawImage(video, 0, 0)
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `photo_${Date.now()}.jpg`, {
                  type: 'image/jpeg',
                })
                handleFileSelect(file)
              }

              // Stop camera
              stream.getTracks().forEach((track) => track.stop())
            }, 'image/jpeg', 0.9)
          }, 1000)
        })
      })
      .catch((error) => {
        console.error('Camera access error:', error)
        onError?.('Не удалось получить доступ к камере. Разрешите доступ к камере в настройках браузера.')
      })
  }

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600">
              {selectedFile?.name}
            </p>
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setPreview(null)
                  setSelectedFile(null)
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Удалить
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">📸</div>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Загрузите фото тетради
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Перетащите файл сюда или нажмите для выбора
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Поддерживаются: JPG, PNG, PDF (до 50 МБ)
              </p>
            </div>
          </div>
        )}

        {/* Camera Button */}
        {!preview && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleCameraCapture()
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📷 Сфотографировать
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{ocrProgress || 'Обработка...'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: ocrProgress.includes('%')
                  ? ocrProgress.match(/\d+/)?.[0] + '%'
                  : '100%',
                animation: ocrProgress.includes('%')
                  ? 'none'
                  : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Распознавание текста может занять 30-60 секунд...
          </p>
        </div>
      )}

      {/* Tips */}
      {!isUploading && !preview && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            💡 Советы для лучшего распознавания:
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Используйте хорошее освещение</li>
            <li>Убедитесь, что текст четкий и читаемый</li>
            <li>Держите камеру параллельно странице</li>
            <li>Избегайте теней и бликов</li>
          </ul>
        </div>
      )}
    </div>
  )
}

