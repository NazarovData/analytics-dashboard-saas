import { useNavigate } from 'react-router-dom'
import { 
  ShoppingCart, Megaphone, Package, Truck, Coffee, Scissors, 
  Store, Target, Users, DollarSign, Sparkles, ArrowRight,
  TrendingUp, BarChart3, Zap, Mic, FileSpreadsheet
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { VoiceAssistant } from '@/components/VoiceAssistant'

// ============================================
// 🏭 INDUSTRY SELECT PAGE
// Страница выбора отрасли
// ============================================

interface IndustryOption {
  id: string
  title: string
  subtitle: string
  icon: React.ElementType
  color: string
  gradient: string
  route: string
  features: string[]
  isPopular?: boolean
  isNew?: boolean
}

const industries: IndustryOption[] = [
  {
    id: 'ecommerce',
    title: 'Интернет-магазин',
    subtitle: 'E-commerce, маркетплейсы',
    icon: ShoppingCart,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    route: '/dashboard',
    features: ['RFM-сегментация', 'LTV клиентов', 'Когортный анализ'],
    isPopular: true
  },
  {
    id: 'avito',
    title: 'Авито',
    subtitle: 'Доски объявлений',
    icon: Megaphone,
    color: 'cyan',
    gradient: 'from-cyan-500 to-teal-500',
    route: '/dashboard/avito',
    features: ['Просмотры/звонки', 'Конверсия', 'ТОП объявлений'],
    isNew: true
  },
  {
    id: 'warehouse',
    title: 'Склад',
    subtitle: 'Складской учёт',
    icon: Package,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    route: '/dashboard/warehouse',
    features: ['ABC-анализ', 'Неликвиды', 'Оборачиваемость']
  },
  {
    id: 'logistics',
    title: 'Логистика',
    subtitle: 'Доставки, маршруты',
    icon: Truck,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    route: '/dashboard/logistics',
    features: ['Статусы доставок', 'Время в пути', 'Стоимость']
  },
  {
    id: 'cafe',
    title: 'Кафе / Ресторан',
    subtitle: 'HoReCa',
    icon: Coffee,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    route: '/dashboard/cafe',
    features: ['Фудкост', 'ТОП блюд', 'Часы пик']
  },
  {
    id: 'beauty',
    title: 'Салон красоты',
    subtitle: 'Бьюти-индустрия',
    icon: Scissors,
    color: 'pink',
    gradient: 'from-pink-500 to-purple-500',
    route: '/dashboard/beauty',
    features: ['Рейтинг мастеров', 'Загрузка', 'Возвращаемость']
  },
  {
    id: 'retail',
    title: 'Розница',
    subtitle: 'Офлайн магазины',
    icon: Store,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-500',
    route: '/dashboard/retail',
    features: ['Кассовые данные', 'Средний чек', 'Конверсия']
  },
  {
    id: 'marketing',
    title: 'Маркетинг',
    subtitle: 'ROMI, реклама',
    icon: Target,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-500',
    route: '/dashboard/marketing',
    features: ['ROMI', 'CTR/CPC/CAC', 'Воронка'],
    isNew: true
  },
  {
    id: 'crm',
    title: 'CRM',
    subtitle: 'Клиенты, сделки',
    icon: Users,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    route: '/dashboard/crm',
    features: ['Воронка продаж', 'LTV', 'Churn']
  },
  {
    id: 'finance',
    title: 'Финансы',
    subtitle: 'P&L, учёт',
    icon: DollarSign,
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    route: '/dashboard/finance',
    features: ['Доходы/расходы', 'Прибыль', 'Кэшфлоу']
  }
]

export default function IndustrySelectPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-12">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <span className="text-lg md:text-xl font-bold text-white">Analitix AI</span>
          </div>
          
          {/* 🎤 AI Assistant Button */}
          <button
            onClick={() => {
              const voiceBtn = document.querySelector('[data-voice-assistant]') as HTMLButtonElement
              if (voiceBtn) voiceBtn.click()
            }}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/30 hover:scale-105 transition-all"
          >
            <Mic className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">AI Ассистент</span>
            <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-xs font-bold rounded animate-pulse">NEW</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">AI-аналитика для любого бизнеса</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Выберите вашу
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text"> отрасль</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Каждый дашборд настроен под специфику вашего бизнеса с уникальными метриками и AI-инсайтами
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10+</div>
            <div className="text-gray-500 text-sm">отраслей</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-gray-500 text-sm">метрик</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white flex items-center gap-1">
              <Zap className="h-6 w-6 text-amber-400" />
              AI
            </div>
            <div className="text-gray-500 text-sm">инсайты</div>
          </div>
        </div>

        {/* Industry Grid */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-400" />
          Выберите отрасль
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {industries.map((industry) => (
            <Card
              key={industry.id}
              onClick={() => navigate(industry.route)}
              className={`
                relative overflow-hidden cursor-pointer transition-all duration-300
                bg-white/5 backdrop-blur-xl border-white/10
                hover:border-white/30 hover:bg-white/10 hover:scale-[1.02]
                hover:shadow-xl hover:shadow-${industry.color}-500/10
                group
              `}
            >
              {/* Popular/New Badge */}
              {industry.isPopular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  ТОП
                </div>
              )}
              {industry.isNew && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                  NEW
                </div>
              )}

              <CardContent className="p-4 md:p-6">
                {/* Icon */}
                <div className={`
                  w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4
                  bg-gradient-to-r ${industry.gradient}
                  shadow-lg shadow-${industry.color}-500/20
                  group-hover:scale-110 transition-transform
                `}>
                  <industry.icon className="h-5 w-5 md:h-7 md:w-7 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-sm md:text-lg font-bold text-white mb-0.5 md:mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 group-hover:bg-clip-text transition-all">
                  {industry.title}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-4">{industry.subtitle}</p>

                {/* Features — hidden on very small screens */}
                <div className="hidden sm:block space-y-2 mb-4">
                  {industry.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${industry.gradient}`} />
                      <span className="text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium">Открыть</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>

              {/* Hover gradient */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                bg-gradient-to-br ${industry.gradient} mix-blend-overlay
              `} style={{ opacity: 0.05 }} />
            </Card>
          ))}
        </div>

        {/* CSV Mapper CTA */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <Card
            onClick={() => navigate('/mapper')}
            className="cursor-pointer w-full max-w-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-xl border-green-500/20 hover:border-green-500/40 hover:scale-[1.01] transition-all"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  CSV Маппер
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold rounded">NEW</span>
                </h3>
                <p className="text-gray-400 text-sm">
                  Загрузите CSV из любой кассовой системы — автоматический маппинг колонок для РФ, РТ, УЗ
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-green-400" />
            </CardContent>
          </Card>

          {/* Bottom CTA */}
          <Card className="inline-block bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold">Не нашли свою отрасль?</h3>
                <p className="text-gray-400 text-sm">Загрузите любые данные — AI адаптируется автоматически</p>
              </div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Универсальный дашборд
              </button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 🎤 Voice AI Assistant */}
      <VoiceAssistant 
        onCommand={(cmd, response) => {
          console.log('Voice command on industry page:', cmd)
          // Навигация по голосу
          if (cmd === 'ecommerce' || response.response_text?.includes('магазин')) {
            navigate('/dashboard')
          } else if (cmd === 'cafe' || response.response_text?.includes('кафе')) {
            navigate('/dashboard/cafe')
          }
        }}
      />
    </div>
  )
}