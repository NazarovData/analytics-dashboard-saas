import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, X, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceAssistantProps {
  onCommand?: (command: string, response: VoiceResponse) => void
}

interface VoiceResponse {
  command: string
  response_text: string
  action?: string | null
  data?: Record<string, unknown> | null
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ru-RU'

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex
        const result = event.results[current]
        const transcriptText = result[0].transcript
        setTranscript(transcriptText)

        if (result.isFinal) {
          processCommand(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setResponse('Ошибка распознавания. Попробуйте ещё раз.')
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const processCommand = async (text: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/advanced/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (res.ok) {
        const data: VoiceResponse = await res.json()
        setResponse(data.response_text)
        speak(data.response_text)
        onCommand?.(data.command, data)
      } else {
        setResponse('Не удалось обработать команду')
      }
    } catch (error) {
      console.error('Error processing command:', error)
      // Fallback to local processing
      const localResponse = processLocalCommand(text)
      setResponse(localResponse.response_text)
      speak(localResponse.response_text)
      onCommand?.(localResponse.command, localResponse)
    } finally {
      setIsProcessing(false)
    }
  }

  const processLocalCommand = (text: string): VoiceResponse => {
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('продаж') || lowerText.includes('выручк') || lowerText.includes('доход')) {
      return { command: 'sales', response_text: 'Показываю данные по продажам' }
    }
    if (lowerText.includes('клиент') || lowerText.includes('покупател')) {
      return { command: 'customers', response_text: 'Открываю аналитику клиентов' }
    }
    if (lowerText.includes('товар') || lowerText.includes('продукт')) {
      return { command: 'products', response_text: 'Показываю аналитику товаров' }
    }
    if (lowerText.includes('прогноз') || lowerText.includes('предсказ')) {
      return { command: 'forecast', response_text: 'Формирую прогноз' }
    }
    if (lowerText.includes('демо') || lowerText.includes('показ')) {
      return { command: 'demo', response_text: 'Открываю демо версию' }
    }
    if (lowerText.includes('тариф') || lowerText.includes('цен')) {
      return { command: 'pricing', response_text: 'Показываю тарифы' }
    }
    if (lowerText.includes('магазин') || lowerText.includes('ecommerce')) {
      return { command: 'ecommerce', response_text: 'Открываю дашборд интернет-магазина' }
    }
    if (lowerText.includes('кафе') || lowerText.includes('ресторан')) {
      return { command: 'cafe', response_text: 'Открываю дашборд кафе' }
    }
    
    return { command: 'unknown', response_text: 'Не понял команду. Скажите: продажи, клиенты, товары или прогноз' }
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ru-RU'
      utterance.rate = 1
      speechSynthesis.speak(utterance)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setResponse('Ваш браузер не поддерживает голосовой ввод')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      setResponse(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        data-voice-assistant
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-110 transition-all group"
      >
        <Mic className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span className="font-semibold text-white">AI Голосовой Ассистент</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Mic Button */}
              <div className="flex justify-center">
                <button
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`
                    relative p-8 rounded-full transition-all
                    ${isListening 
                      ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                  ) : isListening ? (
                    <MicOff className="h-10 w-10 text-white" />
                  ) : (
                    <Mic className="h-10 w-10 text-white" />
                  )}
                  
                  {/* Pulse rings when listening */}
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                      <span className="absolute inset-[-8px] rounded-full border-2 border-red-500 animate-pulse opacity-50" />
                    </>
                  )}
                </button>
              </div>

              {/* Status */}
              <div className="text-center">
                {isListening && (
                  <p className="text-green-400 font-medium animate-pulse">
                    🎤 Слушаю...
                  </p>
                )}
                {isProcessing && (
                  <p className="text-purple-400 font-medium">
                    ⏳ Обрабатываю...
                  </p>
                )}
                {!isListening && !isProcessing && (
                  <p className="text-gray-400">
                    Нажмите на микрофон и скажите команду
                  </p>
                )}
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400 mb-1">Вы сказали:</p>
                  <p className="text-white">{transcript}</p>
                </div>
              )}

              {/* Response */}
              {response && (
                <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Volume2 className="h-4 w-4 text-purple-400" />
                    <p className="text-sm text-purple-400">Ответ:</p>
                  </div>
                  <p className="text-white">{response}</p>
                </div>
              )}

              {/* Commands hint */}
              <div className="text-center text-sm text-gray-500">
                <p>Примеры команд:</p>
                <p className="text-gray-400">"Покажи продажи", "Открой клиентов", "Сделай прогноз"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Add types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}















