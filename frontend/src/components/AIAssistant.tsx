import { useState, useEffect, useRef } from 'react'
import { 
  Mic, MicOff, Volume2, VolumeX, X, Sparkles, 
  Send, Bot, User, Loader2, ChevronRight,
  BarChart3, TrendingUp, DollarSign, Target,
  ShoppingCart, Truck, Coffee, Scissors, Store,
  Users, Megaphone, Package, PieChart, Play,
  CheckCircle, ArrowRight, Zap, Crown, Gift
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ============================================
// 🤖 AI VOICE ASSISTANT - Premium Version
// С презентацией всех услуг!
// ============================================

interface Message {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

interface Service {
  id: string
  name: string
  icon: any
  color: string
  path: string
  description: string
  features: string[]
  forWhom: string
}

interface AIAssistantProps {
  userName?: string
}

// Все наши услуги с подробным описанием
const SERVICES: Service[] = [
  {
    id: 'ecommerce',
    name: 'Интернет-магазин',
    icon: ShoppingCart,
    color: 'from-blue-500 to-cyan-500',
    path: '/dashboard',
    description: 'Полная аналитика для e-commerce и маркетплейсов. RFM-сегментация клиентов, LTV, когортный анализ.',
    features: ['RFM-сегментация', 'LTV клиентов', 'Когортный анализ', 'AI-прогнозы продаж', 'A/B тестирование'],
    forWhom: 'Для владельцев интернет-магазинов, продавцов на Wildberries, Ozon, Яндекс.Маркет'
  },
  {
    id: 'avito',
    name: 'Авито',
    icon: Target,
    color: 'from-purple-500 to-pink-500',
    path: '/dashboard/avito',
    description: 'Аналитика объявлений на Авито. Отслеживайте просмотры, звонки, конверсии и ROMI продвижения.',
    features: ['Просмотры и звонки', 'Конверсия объявлений', 'ROMI продвижения', 'Топ объявлений', 'Рекомендации AI'],
    forWhom: 'Для продавцов на Авито, риелторов, автодилеров'
  },
  {
    id: 'warehouse',
    name: 'Склад',
    icon: Package,
    color: 'from-green-500 to-emerald-500',
    path: '/dashboard/warehouse',
    description: 'Управление складом и запасами. ABC-анализ, оборачиваемость, критические остатки.',
    features: ['ABC-анализ товаров', 'Оборачиваемость', 'Критические остатки', 'Прогноз закупок', 'Мёртвый сток'],
    forWhom: 'Для складов, оптовиков, производителей'
  },
  {
    id: 'logistics',
    name: 'Логистика',
    icon: Truck,
    color: 'from-orange-500 to-red-500',
    path: '/dashboard/logistics',
    description: 'Аналитика доставок и маршрутов. Эффективность водителей, расход топлива, пунктуальность.',
    features: ['Статусы доставок', 'Рейтинг водителей', 'Расход топлива', 'Эффективность маршрутов', 'Время доставки'],
    forWhom: 'Для служб доставки, курьерских компаний, логистов'
  },
  {
    id: 'cafe',
    name: 'Кафе и Рестораны',
    icon: Coffee,
    color: 'from-amber-500 to-orange-500',
    path: '/dashboard/cafe',
    description: 'Аналитика для общепита. Продажи блюд, фудкост, часы пик, эффективность персонала.',
    features: ['Топ блюд меню', 'Фудкост', 'Часы пик', 'Эффективность официантов', 'Средний чек'],
    forWhom: 'Для кафе, ресторанов, баров, фастфуда, кофеен'
  },
  {
    id: 'beauty',
    name: 'Салон красоты',
    icon: Scissors,
    color: 'from-pink-500 to-rose-500',
    path: '/dashboard/beauty',
    description: 'Аналитика для бьюти-бизнеса. Рейтинг мастеров, популярные услуги, возвращаемость клиентов.',
    features: ['Рейтинг мастеров', 'Популярные услуги', 'Загруженность', 'Возвращаемость клиентов', 'Средний чек'],
    forWhom: 'Для салонов красоты, барбершопов, SPA, nail-студий'
  },
  {
    id: 'marketing',
    name: 'Маркетинг',
    icon: Megaphone,
    color: 'from-violet-500 to-purple-500',
    path: '/dashboard/marketing',
    description: 'Аналитика рекламных кампаний. ROMI, CTR, CPC, воронки конверсий, эффективность каналов.',
    features: ['ROMI кампаний', 'CTR и CPC', 'Воронки конверсий', 'Сравнение каналов', 'Бюджет и ROI'],
    forWhom: 'Для маркетологов, SMM-специалистов, рекламных агентств'
  },
  {
    id: 'finance',
    name: 'Финансы',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
    path: '/dashboard/finance',
    description: 'Финансовый учёт и аналитика. P&L, кэшфлоу, доходы и расходы, балансы счетов.',
    features: ['P&L отчёт', 'Кэшфлоу', 'Доходы/расходы', 'Балансы счетов', 'Рентабельность'],
    forWhom: 'Для финансовых директоров, бухгалтеров, владельцев бизнеса'
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: Users,
    color: 'from-indigo-500 to-blue-500',
    path: '/dashboard/crm',
    description: 'Управление клиентами и продажами. Воронка продаж, LTV, отток клиентов, сегментация.',
    features: ['Воронка продаж', 'LTV клиентов', 'Отток (Churn)', 'Сегментация', 'Топ клиентов'],
    forWhom: 'Для отделов продаж, менеджеров, CRM-специалистов'
  },
  {
    id: 'retail',
    name: 'Розница',
    icon: Store,
    color: 'from-orange-500 to-amber-500',
    path: '/dashboard/retail',
    description: 'Аналитика офлайн магазинов. Кассовые данные, средний чек, эффективность продавцов.',
    features: ['Выручка по точкам', 'Средний чек', 'Рейтинг кассиров', 'Часы пик', 'Способы оплаты'],
    forWhom: 'Для розничных сетей, магазинов, торговых точек'
  }
]

// Голосовые ответы
const VOICE_RESPONSES = {
  welcome: `Здравствуйте! Я AI-ассистент Analitix AI. 
    Мы предлагаем умную аналитику для 10 отраслей бизнеса. 
    Давайте я расскажу про каждую, чтобы вы выбрали подходящую для вас.`,
  
  serviceIntro: (service: Service) => 
    `${service.name}. ${service.description} Это подходит ${service.forWhom.toLowerCase()}.`,
  
  help: 'Скажите название отрасли, например "Авито" или "Кафе", и я открою нужный дашборд. Или нажмите на карточку услуги.',
  
  navigating: (name: string) => `Отлично! Открываю ${name}. Там вы увидите демо-данные и сможете загрузить свои.`,
  
  pricing: 'Открываю страницу тарифов. У нас есть планы от 990 рублей в месяц с бесплатным пробным периодом.',
  
  unknown: 'Не поняла. Скажите название отрасли или нажмите на карточку услуги.',
}

// Распознавание команд
const parseCommand = (text: string): { action: string; service?: Service } => {
  const lower = text.toLowerCase()
  
  // Поиск по услугам
  for (const service of SERVICES) {
    const keywords = service.name.toLowerCase().split(' ')
    if (keywords.some(kw => lower.includes(kw)) || lower.includes(service.id)) {
      return { action: 'navigate', service }
    }
  }
  
  // Специальные команды
  if (lower.includes('тариф') || lower.includes('цен') || lower.includes('стоимость')) {
    return { action: 'pricing' }
  }
  if (lower.includes('помощь') || lower.includes('помоги')) {
    return { action: 'help' }
  }
  
  return { action: 'unknown' }
}

export function AIAssistant({ userName }: AIAssistantProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [showServices, setShowServices] = useState(true)
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState(-1)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Инициализация Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'ru-RU'
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          handleUserMessage(transcript)
          setIsListening(false)
        }
        
        recognitionRef.current.onerror = () => setIsListening(false)
        recognitionRef.current.onend = () => setIsListening(false)
      }
    }
  }, [])

  // Автоматическое приветствие
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setTimeout(() => {
        const greeting = userName 
          ? `Здравствуйте, ${userName}! Добро пожаловать в Analitix AI.`
          : VOICE_RESPONSES.welcome
        addMessage('assistant', greeting)
        speak(greeting)
        setHasGreeted(true)
      }, 500)
    }
  }, [isOpen, hasGreeted, userName])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }])
  }

  const speak = (text: string, onEnd?: () => void) => {
    if (isMuted || !synthRef.current) {
      onEnd?.()
      return
    }
    
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ru-RU'
    utterance.rate = 1.05
    utterance.pitch = 1.1
    utterance.volume = 1.0
    
    // Лучший русский голос
    const voices = synthRef.current.getVoices()
    const russianVoice = voices.find(v => 
      v.lang.includes('ru') && (v.name.includes('Google') || v.name.includes('Microsoft'))
    ) || voices.find(v => v.lang.includes('ru')) || voices[0]
    if (russianVoice) utterance.voice = russianVoice
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      onEnd?.()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      onEnd?.()
    }
    
    synthRef.current.speak(utterance)
  }

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleUserMessage = (text: string) => {
    addMessage('user', text)
    setIsProcessing(true)
    
    setTimeout(() => {
      const { action, service } = parseCommand(text)
      
      if (action === 'navigate' && service) {
        const response = VOICE_RESPONSES.navigating(service.name)
        addMessage('assistant', response)
        speak(response)
        setTimeout(() => navigate(service.path), 2000)
      } else if (action === 'pricing') {
        addMessage('assistant', VOICE_RESPONSES.pricing)
        speak(VOICE_RESPONSES.pricing)
        setTimeout(() => navigate('/pricing'), 2000)
      } else if (action === 'help') {
        addMessage('assistant', VOICE_RESPONSES.help)
        speak(VOICE_RESPONSES.help)
      } else {
        addMessage('assistant', VOICE_RESPONSES.unknown)
        speak(VOICE_RESPONSES.unknown)
      }
      
      setIsProcessing(false)
    }, 500)
  }

  const handleServiceClick = (service: Service) => {
    setActiveService(service)
    const intro = VOICE_RESPONSES.serviceIntro(service)
    speak(intro)
  }

  const handleOpenService = (service: Service) => {
    const response = VOICE_RESPONSES.navigating(service.name)
    addMessage('assistant', response)
    speak(response)
    setTimeout(() => {
      navigate(service.path)
      setIsOpen(false)
    }, 1500)
  }

  // Презентация всех услуг по очереди
  const presentAllServices = () => {
    setCurrentSpeakingIndex(0)
  }

  useEffect(() => {
    if (currentSpeakingIndex >= 0 && currentSpeakingIndex < SERVICES.length) {
      const service = SERVICES[currentSpeakingIndex]
      setActiveService(service)
      speak(VOICE_RESPONSES.serviceIntro(service), () => {
        setTimeout(() => {
          if (currentSpeakingIndex < SERVICES.length - 1) {
            setCurrentSpeakingIndex(prev => prev + 1)
          } else {
            setCurrentSpeakingIndex(-1)
            speak('Это все наши услуги. Выберите подходящую или скажите название.')
          }
        }, 500)
      })
    }
  }, [currentSpeakingIndex])

  const handleSendText = () => {
    if (!inputText.trim()) return
    handleUserMessage(inputText)
    setInputText('')
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          <div className="relative p-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-white shadow-2xl hover:scale-110 transition-transform">
            <Bot className="h-7 w-7" />
          </div>
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-ping" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <span className="absolute -top-12 right-0 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          AI Ассистент 🤖
        </span>
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel - Larger for services showcase */}
          <div className="relative w-full max-w-4xl h-[85vh] bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`relative p-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 ${isSpeaking ? 'animate-pulse' : ''}`}>
                    <Bot className="h-7 w-7 text-white" />
                    {isSpeaking && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-green-500 rounded-full">
                        <Volume2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      AI Ассистент
                      <Crown className="h-5 w-5 text-amber-400" />
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isSpeaking ? '🎙️ Говорю...' : isListening ? '👂 Слушаю...' : '✨ Выберите услугу'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={presentAllServices}
                    disabled={currentSpeakingIndex >= 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    <span className="text-sm font-medium">Презентация</span>
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); synthRef.current?.cancel() }}
                    className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Services Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Наши услуги — выберите вашу отрасль
                  </h4>
                  <p className="text-gray-400 text-sm">Нажмите на карточку для подробностей или скажите голосом</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {SERVICES.map((service, idx) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className={`relative p-4 rounded-xl border transition-all text-left group ${
                        activeService?.id === service.id
                          ? 'bg-white/15 border-white/30 scale-105 shadow-xl'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      } ${currentSpeakingIndex === idx ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${service.color} w-fit mb-2`}>
                        {(() => {
                          const IconComponent = service.icon
                          return <IconComponent className="h-5 w-5 text-white" />
                        })()}
                      </div>
                      <h5 className="text-white font-medium text-sm mb-1">{service.name}</h5>
                      <p className="text-gray-500 text-xs line-clamp-2">{service.forWhom}</p>
                      
                      {activeService?.id === service.id && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Details Panel */}
              {activeService && (
                <div className="w-80 border-l border-white/10 bg-white/5 p-4 overflow-y-auto">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${activeService.color} w-fit mb-4`}>
                    {(() => {
                      const IconComponent = activeService.icon
                      return <IconComponent className="h-8 w-8 text-white" />
                    })()}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{activeService.name}</h3>
                  <p className="text-gray-300 text-sm mb-4">{activeService.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      Возможности:
                    </h4>
                    <ul className="space-y-2">
                      {activeService.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-300 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <h4 className="text-blue-400 font-medium text-sm mb-1">👤 Для кого:</h4>
                    <p className="text-gray-300 text-sm">{activeService.forWhom}</p>
                  </div>
                  
                  <button
                    onClick={() => handleOpenService(activeService)}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${activeService.color} text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all`}
                  >
                    Открыть дашборд
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <p className="text-center text-gray-500 text-xs mt-3">
                    Доступны демо-данные для тестирования
                  </p>
                </div>
              )}
            </div>

            {/* Chat Messages (collapsed) */}
            {messages.length > 0 && (
              <div className="max-h-32 overflow-y-auto border-t border-white/10 p-3 bg-black/20">
                {messages.slice(-3).map((msg) => (
                  <div key={msg.id} className={`flex gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                      msg.role === 'assistant' ? 'bg-white/10 text-gray-300' : 'bg-blue-500 text-white'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-gray-900/50">
              <div className="flex items-center gap-3">
                {/* Voice Button */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!recognitionRef.current || isSpeaking}
                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse scale-110' 
                      : 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                
                {/* Text Input */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="Скажите или напишите название отрасли..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                
                {/* Send Button */}
                <button
                  onClick={handleSendText}
                  disabled={!inputText.trim() || isProcessing}
                  className="p-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                </button>
              </div>
              
              {isListening && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-sm font-medium">Говорите название отрасли...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AIAssistant
