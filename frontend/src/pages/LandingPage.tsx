import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, BarChart3, Users, Zap, Globe, ArrowRight, Check, Star, 
  Database, Cloud, Cpu, Play, ChevronRight, Sparkles, Shield, Clock,
  PieChart, LineChart, Activity, Target, Award, Rocket, Heart,
  MousePointer, DollarSign, ShoppingCart, Building2, Send, Phone, Mail, Building, CheckCircle, Mic
} from 'lucide-react'
import toast from 'react-hot-toast'
import { VoiceAssistant } from '@/components/VoiceAssistant'

// ============================================
// 🚀 ANALITIX AI - PREMIUM LANDING PAGE
// Революционный дизайн с визуализациями
// ============================================

// Анимированный график для Hero секции
const AnimatedChart = () => {
  const [data, setData] = useState([40, 65, 45, 80, 55, 90, 70, 95, 85, 100])
  
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(v => Math.max(20, Math.min(100, v + (Math.random() - 0.4) * 15))))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-48 flex items-end justify-between gap-2 px-4">
      {data.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ height: `${value}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      ))}
      {/* Линия тренда */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${192 - data[0] * 1.8} ${data.map((v, i) => `L ${(i + 1) * 10}% ${192 - v * 1.8}`).join(' ')}`}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          className="drop-shadow-lg"
        />
      </svg>
    </div>
  )
}

// Анимированные метрики
const AnimatedMetric = ({ value, suffix, label, delay = 0 }: { value: number; suffix: string; label: string; delay?: number }) => {
  const [current, setCurrent] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let step = 0
      const interval = setInterval(() => {
        step++
        setCurrent(Math.min(value, Math.round(increment * step)))
        if (step >= steps) clearInterval(interval)
      }, duration / steps)
    }, delay)
    return () => clearTimeout(timer)
  }, [isVisible, value, delay])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {current.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400">{label}</div>
    </div>
  )
}

// Плавающие частицы
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-500/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  )
}

// 🎯 Летающие рекламные баннеры
const FloatingBanners = () => {
  const banners = [
    {
      icon: '🚀',
      title: 'AI-прогнозы',
      subtitle: 'Точность 95%',
      color: 'from-purple-500 to-pink-500',
      position: 'top-32 left-10',
      delay: '0s'
    },
    {
      icon: '📊',
      title: '+45% выручка',
      subtitle: 'За 3 месяца',
      color: 'from-green-500 to-emerald-500',
      position: 'top-48 right-20',
      delay: '1s'
    },
    {
      icon: '⚡',
      title: '10 отраслей',
      subtitle: 'Готовые дашборды',
      color: 'from-amber-500 to-orange-500',
      position: 'bottom-40 left-20',
      delay: '2s'
    },
    {
      icon: '🎯',
      title: 'RFM-анализ',
      subtitle: 'Сегментация клиентов',
      color: 'from-cyan-500 to-blue-500',
      position: 'bottom-32 right-10',
      delay: '0.5s'
    }
  ]

  return (
    <>
      {banners.map((banner, idx) => (
        <div
          key={idx}
          className={`absolute ${banner.position} z-20 hidden lg:block animate-float`}
          style={{ animationDelay: banner.delay, animationDuration: '6s' }}
        >
          <div className={`bg-gradient-to-r ${banner.color} p-[2px] rounded-2xl shadow-2xl`}>
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">{banner.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{banner.title}</p>
                <p className="text-gray-400 text-xs">{banner.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

// 📈 Мини круговая диаграмма
const MiniPieChart = () => {
  const segments = [
    { percent: 35, color: '#06b6d4' },
    { percent: 25, color: '#8b5cf6' },
    { percent: 20, color: '#f59e0b' },
    { percent: 20, color: '#10b981' }
  ]
  
  let currentAngle = 0
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {segments.map((seg, idx) => {
        const angle = (seg.percent / 100) * 360
        const startAngle = currentAngle
        const endAngle = currentAngle + angle
        currentAngle = endAngle
        
        const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180)
        const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180)
        const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180)
        const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180)
        const largeArc = angle > 180 ? 1 : 0
        
        return (
          <path
            key={idx}
            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={seg.color}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            style={{ 
              animation: `fade-in-up 0.5s ease-out forwards`,
              animationDelay: `${idx * 0.1}s`,
              opacity: 0
            }}
          />
        )
      })}
      <circle cx="50" cy="50" r="25" fill="#111827" />
      <text x="50" y="50" textAnchor="middle" dy="0.3em" fill="white" fontSize="12" fontWeight="bold">
        100%
      </text>
    </svg>
  )
}

// 📊 Мини линейный график
const MiniLineChart = () => {
  const points = [20, 35, 25, 45, 35, 55, 45, 65, 55, 75, 65, 85]
  const width = 200
  const height = 80
  
  const pathD = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - (p / 100) * height
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  
  const areaD = pathD + ` L ${width} ${height} L 0 ${height} Z`
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={(i / (points.length - 1)) * width}
          cy={height - (p / 100) * height}
          r="3"
          fill="#06b6d4"
          className="animate-pulse"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </svg>
  )
}

// 📊 Большой дашборд превью с несколькими графиками
const FullDashboardPreview = () => {
  const [metrics, setMetrics] = useState({
    revenue: 2847500,
    orders: 1247,
    customers: 892,
    conversion: 4.7
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 10000),
        orders: prev.orders + Math.floor(Math.random() * 5),
        customers: prev.customers + Math.floor(Math.random() * 3),
        conversion: Math.max(3, Math.min(8, prev.conversion + (Math.random() - 0.5) * 0.3))
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/30">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Analitix AI Dashboard</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Обновлено только что
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/5 rounded-xl p-3 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">Выручка</span>
          </div>
          <div className="text-lg font-bold text-white">₽{(metrics.revenue / 1000000).toFixed(2)}M</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400">+23.5%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/5 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Заказы</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.orders}</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-blue-400">+18.2%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/5 rounded-xl p-3 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400">Клиенты</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.customers}</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-purple-400" />
            <span className="text-xs text-purple-400">+12.8%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/5 rounded-xl p-3 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-400">Конверсия</span>
          </div>
          <div className="text-lg font-bold text-white">{metrics.conversion.toFixed(1)}%</div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-amber-400">+0.8%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="col-span-2 bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">📈 Динамика продаж</span>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">+34.2%</span>
          </div>
          <div className="h-32">
            <AnimatedChart />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">📊 Сегменты</span>
          </div>
          <div className="h-32 flex items-center justify-center">
            <div className="w-28 h-28">
              <MiniPieChart />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Line Chart */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">📉 Тренд LTV</span>
            <span className="text-xs text-cyan-400">₽12,450</span>
          </div>
          <div className="h-20">
            <MiniLineChart />
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white font-medium">🏆 Топ товары</span>
          </div>
          <div className="space-y-2">
            {[
              { name: 'iPhone 15 Pro', value: 85 },
              { name: 'MacBook Air', value: 72 },
              { name: 'AirPods Pro', value: 58 }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 truncate">{item.name}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="text-xs text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl flex items-center gap-3">
        <div className="p-2 bg-purple-500/30 rounded-lg">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white font-medium">AI-рекомендация</p>
          <p className="text-xs text-gray-400">Увеличьте рекламный бюджет на 15% — прогноз роста выручки +28%</p>
        </div>
        <ChevronRight className="h-5 w-5 text-purple-400" />
      </div>
    </div>
  )
}

// Живой дашборд превью
const LiveDashboardPreview = () => {
  const [metrics, setMetrics] = useState({
    revenue: 2847500,
    orders: 1247,
    customers: 892,
    conversion: 4.7
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 10000),
        orders: prev.orders + Math.floor(Math.random() * 5),
        customers: prev.customers + Math.floor(Math.random() * 3),
        conversion: Math.max(3, Math.min(8, prev.conversion + (Math.random() - 0.5) * 0.3))
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Analitix AI</h3>
            <p className="text-xs text-gray-400">Обновлено только что</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">Выручка</span>
          </div>
          <div className="text-xl font-bold text-white">
            ₽{(metrics.revenue / 1000000).toFixed(2)}M
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400">+23.5%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Заказы</span>
          </div>
          <div className="text-xl font-bold text-white">{metrics.orders}</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-blue-400" />
            <span className="text-xs text-blue-400">+18.2%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400">Клиенты</span>
          </div>
          <div className="text-xl font-bold text-white">{metrics.customers}</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-purple-400" />
            <span className="text-xs text-purple-400">+12.8%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-gray-400">Конверсия</span>
          </div>
          <div className="text-xl font-bold text-white">{metrics.conversion.toFixed(1)}%</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-amber-400" />
            <span className="text-xs text-amber-400">+0.8%</span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Динамика продаж</span>
          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">+34.2%</span>
        </div>
        <AnimatedChart />
      </div>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Activity,
      title: 'Аналитика в реальном времени',
      description: 'Отслеживайте выручку, заказы и клиентов с автоматическим обновлением каждые 5 секунд',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Database,
      title: 'Интеграция с CRM и БД',
      description: 'Bitrix24, 1С, Google Sheets, PostgreSQL, ClickHouse — всё в одном месте',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Sparkles,
      title: 'AI-прогнозы и инсайты',
      description: 'Нейросеть анализирует данные и даёт рекомендации для роста бизнеса',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: PieChart,
      title: 'RFM-сегментация',
      description: 'Автоматическое разделение клиентов на группы для точечного маркетинга',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: LineChart,
      title: 'Когортный анализ',
      description: 'Отслеживайте поведение групп клиентов во времени',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'A/B тестирование',
      description: 'Тестируйте гипотезы и принимайте решения на основе данных',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const industries = [
    { icon: ShoppingCart, name: 'E-commerce', color: 'bg-blue-500' },
    { icon: Building2, name: 'Розница', color: 'bg-orange-500' },
    { icon: Users, name: 'CRM', color: 'bg-purple-500' },
    { icon: DollarSign, name: 'Финансы', color: 'bg-green-500' },
    { icon: Target, name: 'Маркетинг', color: 'bg-pink-500' },
    { icon: Cpu, name: 'Логистика', color: 'bg-cyan-500' },
  ]

  const testimonials = [
    {
      name: 'Алексей Петров',
      role: 'CEO, TechStore (Москва)',
      image: '👨‍💼',
      text: 'Раньше тратили 20 часов в неделю на отчёты в Excel. Теперь загружаем данные — и через минуту видим всю аналитику. ROI окупился за первый месяц!',
      rating: 5,
      result: '+45% к выручке'
    },
    {
      name: 'Мария Иванова',
      role: 'Маркетолог, FoodDelivery',
      image: '👩‍💻',
      text: 'AI Trust Score — это гениально! Теперь точно знаю, каким данным доверять. Рекомендации по сегментации клиентов увеличили конверсию на 35%.',
      rating: 5,
      result: '+35% конверсия'
    },
    {
      name: 'Дмитрий Козлов',
      role: 'CFO, LogiTrans',
      image: '👨‍💻',
      text: 'Интеграция с 1С заняла 10 минут. Теперь P&L, кэшфлоу и юнит-экономика обновляются автоматически. Финдиректор должен анализировать, а не собирать данные.',
      rating: 5,
      result: '12 часов/нед экономии'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <FloatingParticles />
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-gray-950/90 backdrop-blur-xl border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur-lg opacity-50" />
                <div className="relative p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Analitix AI
                </span>
              </div>
            </div>
            
            {/* 🎤 AI Assistant Button */}
            <button
              onClick={() => {
                const voiceBtn = document.querySelector('[data-voice-assistant]') as HTMLButtonElement
                if (voiceBtn) voiceBtn.click()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              <Mic className="h-5 w-5" />
              <span className="hidden sm:inline">AI Ассистент</span>
              <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-xs font-bold rounded animate-pulse">NEW</span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Возможности</a>
              <a href="#integrations" className="text-gray-400 hover:text-white transition-colors">Интеграции</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Цены</a>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white"
              >
                Войти
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6"
              >
                Начать бесплатно
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Floating Banners */}
        <FloatingBanners />

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-full">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">Powered by AI</span>
              <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full animate-pulse">NEW</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-white">Революция в</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                бизнес-аналитике
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-lg">
              Объедините все данные в единую систему. AI анализирует, прогнозирует и даёт рекомендации для роста вашего бизнеса.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-105"
              >
                Начать бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl hover:scale-105 transition-all"
              >
                <Play className="mr-2 h-5 w-5" />
                Смотреть демо
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-gray-400">Без кредитной карты</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-gray-400">14 дней бесплатно</span>
              </div>
            </div>
          </div>

          {/* Right Content - Full Dashboard Preview */}
          <div className="relative z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur-2xl" />
            <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
              <FullDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedMetric value={500} suffix="+" label="Компаний" delay={0} />
            <AnimatedMetric value={100} suffix="K+" label="Обработано строк" delay={200} />
            <AnimatedMetric value={95} suffix="%" label="Точность AI" delay={400} />
            <AnimatedMetric value={48} suffix="/5" label="Рейтинг" delay={600} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Всё что нужно для
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> роста бизнеса</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Мощные инструменты аналитики с AI, которые помогут принимать правильные решения
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - 3 Steps */}
      <section className="py-24 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Как это
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> работает</span>
            </h2>
            <p className="text-xl text-gray-400">
              Результат за 30 секунд. Без аналитика. Без сложных настроек.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative text-center group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="pt-24 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-all h-full">
                <div className="text-4xl mb-4">📤</div>
                <h3 className="text-xl font-bold text-white mb-3">Загрузите данные</h3>
                <p className="text-gray-400">Excel, CSV или подключите CRM. Система автоматически определит структуру данных.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="pt-24 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all h-full">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-white mb-3">AI анализирует</h3>
                <p className="text-gray-400">За 30 секунд нейросеть найдёт тренды, аномалии и возможности роста.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative text-center group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="pt-24 p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-green-500/50 transition-all h-full">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold text-white mb-3">Получите инсайты</h3>
                <p className="text-gray-400">Готовые рекомендации и прогнозы для принятия бизнес-решений.</p>
              </div>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="mt-12 text-center">
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg shadow-purple-500/25"
            >
              Попробовать с тестовыми данными
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Trust Score Section - Unique Feature */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full mb-6">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Эксклюзивная технология</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                AI Trust Score™
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> — доверяй данным</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-8">
                Мы не просто показываем цифры — мы говорим, <strong className="text-white">насколько им можно доверять</strong>. 
                Уникальная система оценки достоверности анализа.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Оценка качества данных</p>
                    <p className="text-gray-400 text-sm">Система проверяет полноту и корректность загруженных данных</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Уверенность в каждой метрике</p>
                    <p className="text-gray-400 text-sm">Видите уровень достоверности: 🟢 Высокая / 🟡 Средняя / 🔴 Требует проверки</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-green-500/20 rounded-full">
                    <Check className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Рекомендации по улучшению</p>
                    <p className="text-gray-400 text-sm">AI подсказывает, какие данные добавить для повышения точности</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* AI Trust Score Demo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-4">
                    <span className="text-3xl font-bold text-white">90%</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Trust Score</h3>
                  <p className="text-green-400 text-sm">✅ Высокая достоверность</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Качество данных</span>
                      <span className="text-green-400">100%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Точность расчётов</span>
                      <span className="text-green-400">82%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '82%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Достоверность инсайтов</span>
                      <span className="text-green-400">89%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-sm text-green-300">
                    💡 Данные подходят для бизнес-решений. Добавьте order_id для 100% точности.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-24 bg-gradient-to-b from-transparent via-cyan-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Для любой
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> отрасли</span>
            </h2>
            <p className="text-xl text-gray-400">
              10 специализированных дашбордов под ваш бизнес
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {industries.map((industry, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className={`p-2 ${industry.color} rounded-lg`}>
                  <industry.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">{industry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Интеграция с
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> любыми источниками</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Подключите вашу CRM, базу данных или таблицы за пару кликов. Данные синхронизируются автоматически.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {['Bitrix24', '1С', 'Google Sheets', 'PostgreSQL', 'ClickHouse', 'Excel'].map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <Database className="h-5 w-5 text-cyan-400" />
                    <span className="text-white">{name}</span>
                    <Check className="h-4 w-4 text-green-400 ml-auto" />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  {[Cloud, Database, Cpu, Globe].map((Icon, idx) => (
                    <div key={idx} className="p-4 bg-white/10 rounded-xl animate-float" style={{ animationDelay: `${idx * 0.5}s` }}>
                      <Icon className="h-8 w-8 text-cyan-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <p className="text-gray-400">Все данные в одном месте</p>
                  <p className="text-2xl font-bold text-white mt-2">Синхронизация за 5 минут</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Нам доверяют
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> тысячи компаний</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  {testimonial.result && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                      {testimonial.result}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="text-3xl">{testimonial.image}</div>
                  <div>
                    <p className="text-white font-medium">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Простые и
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> прозрачные цены</span>
            </h2>
            <p className="text-xl text-gray-400">Начните бесплатно. Масштабируйтесь по мере роста.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Стартер</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₽0</span>
                <span className="text-gray-400">/месяц</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['До 1,000 записей', 'CSV загрузка', 'Базовая аналитика', 'Email поддержка'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => navigate('/register')}
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Начать бесплатно
              </Button>
            </div>

            {/* Pro */}
            <div className="relative p-8 bg-gradient-to-b from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-sm font-bold">
                Популярный
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Профессионал</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₽5,990</span>
                <span className="text-gray-400">/месяц</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['До 100,000 записей', 'Все интеграции', 'AI прогнозы', 'Приоритетная поддержка', 'API доступ'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => navigate('/register')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Попробовать 14 дней
              </Button>
            </div>

            {/* Enterprise */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Неограниченные записи', 'Dedicated менеджер', 'On-premise', 'Custom интеграции', 'SLA 99.99%'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-300">
                    <Check className="h-5 w-5 text-purple-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Form Section */}
      <section id="contact" className="py-24 bg-gradient-to-b from-transparent via-cyan-950/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Info */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Получите 
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> бесплатную консультацию</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Оставьте заявку и наш специалист свяжется с вами в течение 15 минут
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: 'Покажем демо на ваших данных' },
                  { icon: CheckCircle, text: 'Подберём оптимальный тариф' },
                  { icon: CheckCircle, text: 'Поможем с настройкой интеграций' },
                  { icon: CheckCircle, text: '14 дней бесплатного тестирования' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-400 text-sm mb-2">Или свяжитесь напрямую:</p>
                <div className="flex flex-wrap gap-4">
                  <a href="tel:+79001234567" className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors">
                    <Phone className="h-4 w-4" />
                    +7 (900) 123-45-67
                  </a>
                  <a href="mailto:hello@analitix.ai" className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors">
                    <Mail className="h-4 w-4" />
                    hello@analitix.ai
                  </a>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Оставить заявку</h3>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  name: formData.get('name'),
                  phone: formData.get('phone'),
                  email: formData.get('email') || '',
                  company: formData.get('company') || '',
                  message: formData.get('message') || ''
                }
                try {
                  const response = await fetch('http://localhost:8000/api/v1/auth/lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  })
                  if (response.ok) {
                    toast.success('Заявка отправлена! Мы свяжемся с вами в ближайшее время.')
                    e.currentTarget.reset()
                  } else {
                    toast.error('Ошибка отправки. Попробуйте ещё раз.')
                  }
                } catch {
                  // Fallback - сохраняем локально
                  const leads = JSON.parse(localStorage.getItem('leads') || '[]')
                  leads.push({ ...data, date: new Date().toISOString() })
                  localStorage.setItem('leads', JSON.stringify(leads))
                  toast.success('Заявка сохранена! Мы свяжемся с вами.')
                  e.currentTarget.reset()
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Ваше имя *</label>
                  <Input 
                    name="name"
                    required
                    placeholder="Иван Иванов"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Телефон *</label>
                  <Input 
                    name="phone"
                    type="tel"
                    required
                    placeholder="+7 (999) 123-45-67"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Email</label>
                  <Input 
                    name="email"
                    type="email"
                    placeholder="ivan@company.ru"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Компания</label>
                  <Input 
                    name="company"
                    placeholder="ООО Ваша компания"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Комментарий</label>
                  <textarea 
                    name="message"
                    rows={3}
                    placeholder="Расскажите о вашем бизнесе и задачах..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <Button 
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить заявку
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="p-12 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 rounded-3xl">
            <Rocket className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Готовы трансформировать ваш бизнес?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Присоединяйтесь к тысячам компаний, которые уже используют Analitix AI
            </p>
            <Button 
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-12 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25"
            >
              Начать бесплатно
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Analitix AI</span>
            </div>
            <p className="text-gray-400">© 2024 Analitix AI. Все права защищены.</p>
            <div className="flex items-center gap-4">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="text-gray-400">Сделано с любовью для бизнеса</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 🎤 Voice AI Assistant */}
      <VoiceAssistant 
        onCommand={(cmd, response) => {
          console.log('Voice command on landing:', cmd)
          if (cmd === 'unknown') {
            toast('Скажите: "демо", "регистрация" или "тарифы"')
          }
        }}
      />
    </div>
  )
}