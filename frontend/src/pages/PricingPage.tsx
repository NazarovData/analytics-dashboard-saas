import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Check, X, Building2, Sparkles, Crown, Rocket, 
  Shield, Clock, BarChart3, Gift, ArrowRight,
  Star, Quote, ChevronRight, Calculator, DollarSign,
  Percent, Award, Headphones,
  Mail, Phone, MessageCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// ============================================
// 🎨 PREMIUM PRICING PAGE - WORLD CLASS UX/UI
// ============================================

// Animated background particles
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      color: string
    }> = []
    
    const colors = ['#8B5CF6', '#06B6D4', '#EC4899', '#F59E0B', '#10B981']
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((particle, i) => {
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
        
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.opacity
        ctx.fill()
        
        // Connect nearby particles
        particles.forEach((p2, j) => {
          if (i === j) return
          const dx = particle.x - p2.x
          const dy = particle.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 120) {
            ctx.beginPath()
            ctx.strokeStyle = particle.color
            ctx.globalAlpha = (120 - distance) / 120 * 0.15
            ctx.lineWidth = 0.5
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

// Floating 3D elements
const FloatingElements = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Gradient orbs */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
    <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-float-medium" />
    <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl animate-float-fast" />
    <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-float-slow" />
    
    {/* Geometric shapes */}
    <div className="absolute top-1/4 right-10 w-20 h-20 border-2 border-purple-500/20 rotate-45 animate-spin-slow" />
    <div className="absolute bottom-1/4 left-20 w-16 h-16 border-2 border-cyan-500/20 rounded-full animate-pulse-slow" />
    <div className="absolute top-1/2 left-10 w-12 h-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rotate-12 animate-bounce-slow" />
  </div>
)

// Pricing tiers data
const tiers = [
  {
    id: 'starter',
    name: 'Стартап',
    subtitle: 'Для начинающих',
    price: { monthly: 4900, yearly: 3920 },
    originalPrice: { monthly: 9900, yearly: 7920 },
    description: 'Идеально для малого бизнеса и стартапов',
    icon: Rocket,
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    bgGradient: 'from-blue-500/10 via-cyan-500/5 to-teal-500/10',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/20',
    features: [
      { text: 'До 5,000 строк данных', included: true, highlight: false },
      { text: '10 основных метрик', included: true, highlight: false },
      { text: 'Ежедневные отчеты', included: true, highlight: false },
      { text: 'Базовая AI-аналитика', included: true, highlight: false },
      { text: 'Email поддержка', included: true, highlight: false },
      { text: 'Экспорт в CSV', included: true, highlight: false },
      { text: 'AI прогнозы на 7 дней', included: false, highlight: false },
      { text: 'RFM сегментация', included: false, highlight: false },
      { text: 'A/B тестирование', included: false, highlight: false },
      { text: 'API доступ', included: false, highlight: false },
      { text: 'Персональный менеджер', included: false, highlight: false },
    ],
    cta: 'Начать бесплатно',
    ctaSecondary: '14 дней пробный период',
    popular: false,
    badge: null
  },
  {
    id: 'professional',
    name: 'Профессионал',
    subtitle: 'Самый популярный',
    price: { monthly: 14900, yearly: 11920 },
    originalPrice: { monthly: 24900, yearly: 19920 },
    description: 'Полный набор инструментов для роста',
    icon: Crown,
    gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
    bgGradient: 'from-purple-500/15 via-violet-500/10 to-fuchsia-500/15',
    borderColor: 'border-purple-500/50',
    glowColor: 'shadow-purple-500/30',
    features: [
      { text: 'До 50,000 строк данных', included: true, highlight: true },
      { text: '30+ продвинутых метрик', included: true, highlight: true },
      { text: 'Отчеты в реальном времени', included: true, highlight: false },
      { text: 'Полная AI-аналитика', included: true, highlight: true },
      { text: 'Приоритетная поддержка 24/7', included: true, highlight: false },
      { text: 'Экспорт в PDF, Excel, CSV', included: true, highlight: false },
      { text: 'AI прогнозы на 30 дней', included: true, highlight: true },
      { text: 'RFM сегментация', included: true, highlight: true },
      { text: 'A/B тестирование', included: true, highlight: true },
      { text: 'API доступ (1000 запросов/день)', included: true, highlight: false },
      { text: 'Персональный менеджер', included: false, highlight: false },
    ],
    cta: 'Попробовать 14 дней',
    ctaSecondary: 'Без карты • Отмена в любой момент',
    popular: true,
    badge: '🔥 ХИТПРОДАЖ'
  },
  {
    id: 'enterprise',
    name: 'Корпоративный',
    subtitle: 'Для крупного бизнеса',
    price: { monthly: 49900, yearly: 39920 },
    originalPrice: { monthly: 99900, yearly: 79920 },
    description: 'Максимальные возможности и поддержка',
    icon: Building2,
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    bgGradient: 'from-amber-500/10 via-orange-500/5 to-red-500/10',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
    features: [
      { text: 'Безлимит данных', included: true, highlight: true },
      { text: 'Все метрики + кастомные', included: true, highlight: true },
      { text: 'White-label решение', included: true, highlight: true },
      { text: 'Выделенный AI-движок', included: true, highlight: true },
      { text: 'Персональный аналитик', included: true, highlight: true },
      { text: 'Все форматы экспорта', included: true, highlight: false },
      { text: 'AI прогнозы на 90 дней', included: true, highlight: true },
      { text: 'Расширенная RFM', included: true, highlight: false },
      { text: 'Мультивариантное A/B', included: true, highlight: true },
      { text: 'API без лимитов', included: true, highlight: true },
      { text: 'Выделенный менеджер', included: true, highlight: true },
    ],
    cta: 'Связаться с нами',
    ctaSecondary: 'Индивидуальные условия',
    popular: false,
    badge: '👑 VIP'
  }
]

// Testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Александр Петров',
    role: 'CEO, TechStart',
    avatar: '👨‍💼',
    company: 'TechStart',
    rating: 5,
    text: 'Analitix AI полностью изменил наш подход к аналитике. За 3 месяца мы увеличили выручку на 47% благодаря AI-рекомендациям!',
    metrics: { revenue: '+47%', time: '-60%', roi: '340%' }
  },
  {
    id: 2,
    name: 'Мария Иванова',
    role: 'Директор по маркетингу',
    avatar: '👩‍💼',
    company: 'RetailPro',
    rating: 5,
    text: 'RFM-сегментация помогла нам точно определить VIP-клиентов. Конверсия email-рассылок выросла в 3 раза!',
    metrics: { conversion: '+300%', ltv: '+85%', churn: '-40%' }
  },
  {
    id: 3,
    name: 'Дмитрий Козлов',
    role: 'Основатель',
    avatar: '👨‍🚀',
    company: 'E-Commerce Plus',
    rating: 5,
    text: 'A/B тестирование в Analitix AI сэкономило нам сотни часов. Теперь мы принимаем решения на основе данных, а не интуиции.',
    metrics: { decisions: '10x быстрее', accuracy: '95%', savings: '₽2M' }
  },
  {
    id: 4,
    name: 'Елена Смирнова',
    role: 'CFO',
    avatar: '👩‍💻',
    company: 'FinanceHub',
    rating: 5,
    text: 'Прогнозы выручки оказались точнее наших внутренних моделей. Теперь планирование бюджета стало намного проще.',
    metrics: { accuracy: '94%', planning: '+80%', efficiency: '5x' }
  }
]

// Feature comparison data
const comparisonFeatures = [
  { 
    category: '📊 Данные и аналитика',
    features: [
      { name: 'Лимит строк данных', starter: '5,000', pro: '50,000', enterprise: 'Безлимит' },
      { name: 'Количество метрик', starter: '10', pro: '30+', enterprise: 'Все + кастом' },
      { name: 'История данных', starter: '30 дней', pro: '1 год', enterprise: 'Безлимит' },
      { name: 'Обновление данных', starter: 'Ежедневно', pro: 'Реал-тайм', enterprise: 'Реал-тайм' },
    ]
  },
  {
    category: '🤖 AI и прогнозы',
    features: [
      { name: 'AI-рекомендации', starter: 'Базовые', pro: 'Продвинутые', enterprise: 'Персональные' },
      { name: 'Прогноз выручки', starter: '7 дней', pro: '30 дней', enterprise: '90 дней' },
      { name: 'RFM сегментация', starter: '❌', pro: '✅', enterprise: '✅ Расширенная' },
      { name: 'Детектор аномалий', starter: '❌', pro: '✅', enterprise: '✅ + алерты' },
    ]
  },
  {
    category: '🧪 Тестирование',
    features: [
      { name: 'A/B тесты', starter: '❌', pro: '✅ до 5', enterprise: '✅ Безлимит' },
      { name: 'Мультивариантные тесты', starter: '❌', pro: '❌', enterprise: '✅' },
      { name: 'Статистическая значимость', starter: '❌', pro: '✅', enterprise: '✅ + CI' },
    ]
  },
  {
    category: '📤 Экспорт и интеграции',
    features: [
      { name: 'Экспорт отчетов', starter: 'CSV', pro: 'PDF, Excel, CSV', enterprise: 'Все + API' },
      { name: 'API доступ', starter: '❌', pro: '1000/день', enterprise: 'Безлимит' },
      { name: 'Интеграции', starter: '❌', pro: '5 сервисов', enterprise: 'Все + кастом' },
      { name: 'Webhooks', starter: '❌', pro: '✅', enterprise: '✅ + очереди' },
    ]
  },
  {
    category: '🛡️ Поддержка',
    features: [
      { name: 'Техподдержка', starter: 'Email', pro: '24/7 чат', enterprise: 'Выделенный менеджер' },
      { name: 'Время ответа', starter: '24 часа', pro: '2 часа', enterprise: '15 минут' },
      { name: 'Обучение', starter: 'Документация', pro: 'Вебинары', enterprise: 'Персональное' },
      { name: 'SLA', starter: '99%', pro: '99.9%', enterprise: '99.99%' },
    ]
  }
]

// ROI Calculator component
const ROICalculator = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(1000000)
  const [improvement, setImprovement] = useState(15)
  
  const additionalRevenue = monthlyRevenue * (improvement / 100)
  const yearlyBenefit = additionalRevenue * 12
  const investmentCost = 14900 * 12
  const roi = ((yearlyBenefit - investmentCost) / investmentCost * 100).toFixed(0)
  
  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 backdrop-blur-xl border-emerald-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiMxMGI5ODEiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Калькулятор ROI</CardTitle>
            <CardDescription className="text-emerald-200">Рассчитайте вашу выгоду от Analitix AI</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-8">
        {/* Input sliders */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-white font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Ваша месячная выручка
              </label>
              <span className="text-emerald-300 font-bold text-lg">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(monthlyRevenue)}
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max="10000000"
              step="100000"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                         [&::-webkit-slider-thumb]:from-emerald-400 [&::-webkit-slider-thumb]:to-teal-400
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/50
                         [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-white font-medium flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-400" />
                Ожидаемый рост с AI-аналитикой
              </label>
              <span className="text-emerald-300 font-bold text-lg">+{improvement}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={improvement}
              onChange={(e) => setImprovement(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                         [&::-webkit-slider-thumb]:from-emerald-400 [&::-webkit-slider-thumb]:to-teal-400
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/50
                         [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform
                         [&::-webkit-slider-thumb]:hover:scale-110"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Консервативно (5%)</span>
              <span>Средне (15-25%)</span>
              <span>Агрессивно (50%)</span>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">Доп. выручка/мес</p>
            <p className="text-2xl font-bold text-white">
              +{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(additionalRevenue)}₽
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">Доп. выручка/год</p>
            <p className="text-2xl font-bold text-emerald-400">
              +{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(yearlyBenefit)}₽
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all hover:scale-105">
            <p className="text-gray-400 text-sm mb-1">Стоимость/год</p>
            <p className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(investmentCost)}₽
            </p>
          </div>
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-500/30 hover:scale-105 transition-all">
            <p className="text-emerald-300 text-sm mb-1 font-medium">Ваш ROI</p>
            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              {roi}%
            </p>
          </div>
        </div>
        
        <div className="text-center pt-4 border-t border-white/10">
          <p className="text-gray-300 text-sm">
            💡 Средний клиент Analitix AI увеличивает выручку на <span className="text-emerald-400 font-bold">23%</span> за первые 3 месяца
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Pricing card component
const PricingCard = ({ 
  tier, 
  isYearly, 
  index 
}: { 
  tier: typeof tiers[0]
  isYearly: boolean
  index: number 
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  
  const price = isYearly ? tier.price.yearly : tier.price.monthly
  const originalPrice = isYearly ? tier.originalPrice.yearly : tier.originalPrice.monthly
  const savings = originalPrice - price
  const Icon = tier.icon
  
  return (
    <div
      className={`relative group transition-all duration-500 ${
        tier.popular ? 'md:-mt-8 md:mb-8 z-10' : ''
      }`}
      style={{ animationDelay: `${index * 150}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${tier.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
      
      {/* Badge */}
      {tier.badge && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
          <div className={`px-6 py-2 bg-gradient-to-r ${tier.gradient} text-white text-sm font-bold rounded-full shadow-xl animate-bounce-slow`}>
            {tier.badge}
          </div>
        </div>
      )}
      
      <Card className={`relative h-full bg-gradient-to-br ${tier.bgGradient} backdrop-blur-xl ${tier.borderColor} border-2 overflow-hidden transition-all duration-500 ${
        tier.popular ? 'ring-2 ring-purple-500/50 shadow-2xl shadow-purple-500/20' : ''
      } ${isHovered ? `shadow-2xl ${tier.glowColor}` : ''}`}>
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>
        
        {/* Popular ribbon */}
        {tier.popular && (
          <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
            <div className="absolute top-4 right-[-35px] w-[170px] transform rotate-45 bg-gradient-to-r from-purple-600 to-pink-600 text-center py-2 text-white text-xs font-bold shadow-lg">
              ПОПУЛЯРНЫЙ
            </div>
          </div>
        )}
        
        <CardHeader className="relative pb-0">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${tier.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <div className="w-full h-full bg-gray-900/80 rounded-2xl flex items-center justify-center">
              <Icon className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <div className="space-y-1">
            <p className={`text-sm font-medium bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>
              {tier.subtitle}
            </p>
            <CardTitle className="text-3xl font-black text-white">{tier.name}</CardTitle>
            <CardDescription className="text-gray-400">{tier.description}</CardDescription>
          </div>
          
          {/* Price */}
          <div className="mt-6 mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tight">
                {new Intl.NumberFormat('ru-RU').format(price)}
              </span>
              <span className="text-gray-400 text-lg">₽/{isYearly ? 'мес' : 'мес'}</span>
            </div>
            {savings > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-500 line-through text-lg">
                  {new Intl.NumberFormat('ru-RU').format(originalPrice)}₽
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${tier.gradient} text-white`}>
                  -{Math.round((savings / originalPrice) * 100)}%
                </span>
              </div>
            )}
            {isYearly && (
              <p className="text-emerald-400 text-sm mt-1 font-medium">
                💰 Экономия {new Intl.NumberFormat('ru-RU').format((tier.price.monthly - tier.price.yearly) * 12)}₽/год
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative pt-6 space-y-6">
          {/* Features */}
          <ul className="space-y-3">
            {tier.features.map((feature, idx) => (
              <li 
                key={idx} 
                className={`flex items-start gap-3 transition-all duration-300 ${
                  isHovered && feature.included ? 'translate-x-1' : ''
                }`}
                style={{ transitionDelay: `${idx * 30}ms` }}
              >
                {feature.included ? (
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    feature.highlight 
                      ? `bg-gradient-to-r ${tier.gradient}` 
                      : 'bg-emerald-500/20'
                  }`}>
                    <Check className={`h-3 w-3 ${feature.highlight ? 'text-white' : 'text-emerald-400'}`} />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                    <X className="h-3 w-3 text-gray-600" />
                  </div>
                )}
                <span className={`text-sm ${
                  feature.included 
                    ? feature.highlight 
                      ? 'text-white font-medium' 
                      : 'text-gray-300'
                    : 'text-gray-600'
                }`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
          
          {/* CTA Button */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => navigate('/register')}
              className={`w-full py-6 text-lg font-bold transition-all duration-300 ${
                tier.popular
                  ? `bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-1`
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:-translate-y-1'
              }`}
            >
              {tier.cta}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-center text-gray-500 text-sm">{tier.ctaSecondary}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Testimonial card
const TestimonialCard = ({ testimonial, isActive }: { testimonial: typeof testimonials[0], isActive: boolean }) => (
  <div className={`transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-50 scale-95'}`}>
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden h-full">
      <CardContent className="p-8">
        {/* Quote icon */}
        <Quote className="h-10 w-10 text-purple-500/30 mb-4" />
        
        {/* Rating */}
        <div className="flex gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        
        {/* Text */}
        <p className="text-gray-300 text-lg leading-relaxed mb-6">"{testimonial.text}"</p>
        
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(testimonial.metrics).map(([key, value]) => (
            <div key={key} className="text-center p-3 bg-white/5 rounded-lg">
              <p className="text-emerald-400 font-bold text-lg">{value}</p>
              <p className="text-gray-500 text-xs capitalize">{key}</p>
            </div>
          ))}
        </div>
        
        {/* Author */}
        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
          <div className="text-4xl">{testimonial.avatar}</div>
          <div>
            <p className="text-white font-semibold">{testimonial.name}</p>
            <p className="text-gray-400 text-sm">{testimonial.role}, {testimonial.company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

// Main component
export default function PricingPage() {
  const navigate = useNavigate()
  const [isYearly, setIsYearly] = useState(true)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Animated background */}
      <ParticleField />
      <FloatingElements />
      
      {/* Main gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Analitix AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white"
                onClick={() => navigate('/login')}
              >
                Войти
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
                onClick={() => navigate('/register')}
              >
                Начать бесплатно
              </Button>
            </div>
          </div>
        </nav>
        
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-8 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Более 1000+ компаний уже с нами</span>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Инвестируйте в
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                рост вашего бизнеса
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              Прозрачные цены. Мощная AI-аналитика. Гарантия результата или возврат денег.
              <br />
              <span className="text-emerald-400 font-medium">Начните бесплатно — платите только когда увидите результат.</span>
            </p>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <span className={`text-lg font-medium transition-colors ${!isYearly ? 'text-white' : 'text-gray-500'}`}>
                Помесячно
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative w-20 h-10 rounded-full transition-all duration-300 ${
                  isYearly 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-300 ${
                  isYearly ? 'left-11' : 'left-1'
                }`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-medium transition-colors ${isYearly ? 'text-white' : 'text-gray-500'}`}>
                  Годовой
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full border border-emerald-500/30">
                  -20%
                </span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Cards */}
        <section className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              {tiers.map((tier, index) => (
                <PricingCard key={tier.id} tier={tier} isYearly={isYearly} index={index} />
              ))}
            </div>
          </div>
        </section>
        
        {/* Trust badges */}
        <section className="py-12 px-4 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Shield, text: '256-bit SSL шифрование', color: 'text-emerald-400' },
                { icon: Clock, text: '14 дней возврат денег', color: 'text-blue-400' },
                { icon: Headphones, text: 'Поддержка 24/7', color: 'text-purple-400' },
                { icon: Award, text: '99.9% uptime гарантия', color: 'text-amber-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* ROI Calculator */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Рассчитайте вашу выгоду
              </h2>
              <p className="text-gray-400 text-lg">
                Узнайте, сколько вы заработаете с Analitix AI
              </p>
            </div>
            <ROICalculator />
          </div>
        </section>
        
        {/* Feature Comparison */}
        <section className="py-20 px-4 bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Сравнение тарифов
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Детальное сравнение всех возможностей
              </p>
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                {showComparison ? 'Скрыть таблицу' : 'Показать полную таблицу'}
                <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showComparison ? 'rotate-90' : ''}`} />
              </Button>
            </div>
            
            {showComparison && (
              <div className="overflow-x-auto animate-fade-in-up">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-4 text-gray-400 font-medium">Функция</th>
                      <th className="text-center py-4 px-4">
                        <div className="text-cyan-400 font-bold">Стартап</div>
                        <div className="text-gray-500 text-sm">4,900₽/мес</div>
                      </th>
                      <th className="text-center py-4 px-4 bg-purple-500/10 rounded-t-xl">
                        <div className="text-purple-400 font-bold">Профессионал</div>
                        <div className="text-gray-500 text-sm">14,900₽/мес</div>
                      </th>
                      <th className="text-center py-4 px-4">
                        <div className="text-amber-400 font-bold">Корпоративный</div>
                        <div className="text-gray-500 text-sm">49,900₽/мес</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((category, catIdx) => (
                      <>
                        <tr key={`cat-${catIdx}`} className="bg-white/5">
                          <td colSpan={4} className="py-3 px-4 text-white font-bold">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featIdx) => (
                          <tr key={`feat-${catIdx}-${featIdx}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 text-gray-300">{feature.name}</td>
                            <td className="py-3 px-4 text-center text-gray-400">{feature.starter}</td>
                            <td className="py-3 px-4 text-center text-white bg-purple-500/5">{feature.pro}</td>
                            <td className="py-3 px-4 text-center text-gray-300">{feature.enterprise}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Что говорят наши клиенты
              </h2>
              <p className="text-gray-400 text-lg">
                Реальные результаты от реальных компаний
              </p>
            </div>
            
            {/* Testimonials carousel */}
            <div className="relative">
              <div className="grid md:grid-cols-2 gap-8">
                {testimonials.slice(activeTestimonial, activeTestimonial + 2).map((testimonial) => (
                  <TestimonialCard 
                    key={testimonial.id} 
                    testimonial={testimonial} 
                    isActive={true}
                  />
                ))}
              </div>
              
              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i === activeTestimonial 
                        ? 'bg-purple-500 w-8' 
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-20 px-4 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Часто задаваемые вопросы
              </h2>
            </div>
            
            <div className="grid gap-4">
              {[
                {
                  q: 'Можно ли попробовать бесплатно?',
                  a: 'Да! Все тарифы включают 14-дневный бесплатный период. Карта не требуется. Отмена в любой момент.'
                },
                {
                  q: 'Что если мне не подойдет?',
                  a: 'Мы предоставляем полный возврат денег в течение 14 дней без вопросов. Если за это время вы не увидите ценности — вернем 100% оплаты.'
                },
                {
                  q: 'Можно ли сменить тариф?',
                  a: 'Конечно! Вы можете повысить или понизить тариф в любой момент. При повышении разница пересчитывается пропорционально.'
                },
                {
                  q: 'Безопасны ли мои данные?',
                  a: 'Абсолютно. Мы используем 256-bit SSL шифрование, регулярные бэкапы, и соответствуем стандартам GDPR и ФЗ-152.'
                },
                {
                  q: 'Есть ли скрытые платежи?',
                  a: 'Нет. Цена, которую вы видите — это всё, что вы платите. Никаких комиссий, setup fees или дополнительных сборов.'
                },
                {
                  q: 'Какие способы оплаты принимаете?',
                  a: 'Visa, MasterCard, МИР, Apple Pay, Google Pay, а также банковский перевод для корпоративных клиентов.'
                }
              ].map((faq, i) => (
                <Card key={i} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30 transition-all">
                  <CardContent className="p-6">
                    <h3 className="text-white font-semibold mb-2 flex items-start gap-3">
                      <span className="text-purple-400">Q:</span>
                      {faq.q}
                    </h3>
                    <p className="text-gray-400 pl-6">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-white/10 p-12">
                <Gift className="h-16 w-16 text-purple-400 mx-auto mb-6 animate-bounce-slow" />
                
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Готовы начать?
                </h2>
                <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                  Присоединяйтесь к 1000+ компаний, которые уже используют Analitix AI для роста бизнеса
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white px-10 py-6 text-lg font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:-translate-y-1"
                  >
                    Начать 14-дневный триал
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 px-10 py-6 text-lg"
                  >
                    Посмотреть демо
                  </Button>
                </div>
                
                <p className="text-gray-500 text-sm">
                  ✓ Без карты &nbsp;&nbsp; ✓ Отмена в любой момент &nbsp;&nbsp; ✓ Полный возврат 14 дней
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-white">Analitix AI</span>
                </div>
                <p className="text-gray-400 text-sm">
                  AI-аналитика для роста вашего бизнеса
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Продукт</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="hover:text-white cursor-pointer transition-colors">Возможности</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Тарифы</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Интеграции</li>
                  <li className="hover:text-white cursor-pointer transition-colors">API</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Компания</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="hover:text-white cursor-pointer transition-colors">О нас</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Блог</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Карьера</li>
                  <li className="hover:text-white cursor-pointer transition-colors">Контакты</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Контакты</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    support@analitix.ai
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +7 (800) 123-45-67
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Telegram: @analitix_ai
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © 2024 Analitix AI. Все права защищены.
              </p>
              <div className="flex gap-6 text-gray-500 text-sm">
                <span className="hover:text-white cursor-pointer transition-colors">Политика конфиденциальности</span>
                <span className="hover:text-white cursor-pointer transition-colors">Условия использования</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
