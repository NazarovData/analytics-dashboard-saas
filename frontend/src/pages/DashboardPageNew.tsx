import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, TrendingDown, LogOut, Upload, BarChart3, Users, DollarSign, 
  ShoppingCart, Award, Bell, BellDot, Sparkles,
  AlertTriangle, CheckCircle, Info, Target,
  Download, HelpCircle, PlayCircle, FileSpreadsheet, X,
  ChevronRight, ChevronDown, Lightbulb, ArrowUpRight,
  ArrowDownRight, Minus, Package, Crown, Gift,
  MousePointer, LayoutDashboard, PieChart as PieChartIcon, LineChart as LineChartIcon,
  RefreshCw, Database, Cloud, Cpu, FileUp, Link, Brain, Beaker, Map, Activity, Shield
} from 'lucide-react'
import { DashboardSidebar, QuickNavBar } from '@/components/DashboardSidebar'
import { 
  PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import toast from 'react-hot-toast'
import { createAnalyticsReport, exportToCSV } from '@/utils/pdfExport'
import { AITrustScore, ConfidenceBadge } from '@/components/AITrustScore'
import { AlertsNotification } from '@/components/AlertsNotification'
import { PeriodComparison } from '@/components/PeriodComparison'
import { LanguageSwitcher, useLanguage } from '@/context/LanguageContext'
import { useAnalyticsStore } from '@/store/analyticsStore'
import { getPalette, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'

const palette = getPalette('ecommerce')

// ============================================
// 🎨 PREMIUM DASHBOARD - CRYSTAL CLEAR UX/UI
// ============================================

// Types
interface AIInsight {
  type: 'success' | 'warning' | 'alert' | 'info'
  category: string
  title: string
  message: string
  recommendation: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: string
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'alert' | 'info'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  action: string
  category: string
  timestamp: string
  read: boolean
  icon: string
}

interface ForecastData {
  success: boolean
  forecast: Array<{ date: string; revenue: number; is_forecast: boolean }>
  trend: 'growing' | 'declining' | 'stable'
  trend_text: string
  trend_percentage: number
  total_forecast: number
  avg_historical: number
  volatility: number
  confidence: string
  recommendation: string
}

interface RFMSegment {
  segment: string
  name: string
  description: string
  color: string
  action: string
  count: number
  total_revenue: number
  avg_revenue: number
  avg_frequency: number
  avg_recency: number
}

interface Analytics {
  total_revenue: number
  total_orders: number
  unique_clients: number
  average_check: number
  top_products: Array<{ product: string; revenue: number; quantity: number }>
  daily_revenue: Array<{ date: string; revenue: number }>
}

interface UploadResponse {
  success: boolean
  filename: string
  records_count: number
  column_mapping?: {
    original_columns: string[]
    recognized: {
      date: boolean
      product: boolean
      quantity: boolean
      price: boolean
      client_id: boolean
    }
    data_quality?: {
      data_quality_score: number
      valid_rows: number
      original_rows: number
      removed_rows: number
    }
  }
  analytics: Analytics
  ai_insights: {
    insights: AIInsight[]
    total_insights: number
    critical_count: number
    high_count: number
  }
  forecast: ForecastData
  ltv: any
  churn: any
  rfm: {
    success: boolean
    segments: RFMSegment[]
    total_customers: number
    total_revenue: number
    summary: string
  }
  notifications: {
    items: Notification[]
    summary: any
  }
  ab_test?: any
  raw_data?: any[]
  // NEW! v2.0 - AI Trust Score
  ai_trust_score?: {
    overall_score: number
    data_score: number
    math_score: number
    insights_score: number
    recommendation: string
    breakdown?: {
      high_confidence_metrics: number
      medium_confidence_metrics: number
      total_metrics: number
    }
  }
  metrics_confidence?: Record<string, {
    level: string
    reason: string
    can_calculate: boolean
  }>
  assumptions?: Array<{
    metric: string
    assumption: string
    impact: string
  }>
}

// Color palette
const COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'],
  gradients: {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-rose-500'
  }
}

// ============================================
// 📊 METRIC CARD COMPONENT - With Explanations
// ============================================
interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down' | 'stable'
    label: string
  }
  explanation: {
    what: string
    why: string
    how: string
  }
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  onClick?: () => void
}

const MetricCard = ({ title, value, subtitle, icon, trend, explanation, color }: MetricCardProps) => {
  const [showDetails, setShowDetails] = useState(false)
  
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 via-blue-500/10 to-cyan-500/20',
      border: 'border-blue-500/30 hover:border-blue-400/50',
      icon: 'bg-blue-500/20 text-blue-400',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    purple: {
      bg: 'from-purple-500/20 via-purple-500/10 to-pink-500/20',
      border: 'border-purple-500/30 hover:border-purple-400/50',
      icon: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    green: {
      bg: 'from-emerald-500/20 via-emerald-500/10 to-teal-500/20',
      border: 'border-emerald-500/30 hover:border-emerald-400/50',
      icon: 'bg-emerald-500/20 text-emerald-400',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20'
    },
    orange: {
      bg: 'from-orange-500/20 via-orange-500/10 to-amber-500/20',
      border: 'border-orange-500/30 hover:border-orange-400/50',
      icon: 'bg-orange-500/20 text-orange-400',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/20'
    },
    red: {
      bg: 'from-red-500/20 via-red-500/10 to-rose-500/20',
      border: 'border-red-500/30 hover:border-red-400/50',
      icon: 'bg-red-500/20 text-red-400',
      text: 'text-red-400',
      glow: 'shadow-red-500/20'
    }
  }
  
  const classes = colorClasses[color]
  
  return (
    <div 
      className={`relative group bg-gradient-to-br ${classes.bg} backdrop-blur-xl rounded-2xl border-2 ${classes.border} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${classes.glow} cursor-pointer`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${classes.icon}`}>
          {icon}
        </div>
        <button 
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails) }}
        >
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </button>
      </div>
      
      {/* Title */}
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      
      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        {subtitle && <span className="text-gray-500 text-sm">{subtitle}</span>}
      </div>
      
      {/* Trend */}
      {trend && (
        <div className={`flex items-center gap-2 text-sm ${
          trend.direction === 'up' ? 'text-emerald-400' :
          trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {trend.direction === 'up' ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : trend.direction === 'down' ? (
            <ArrowDownRight className="h-4 w-4" />
          ) : (
            <Minus className="h-4 w-4" />
          )}
          <span className="font-medium">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
      
      {/* Expandable explanation */}
      <div className={`overflow-hidden transition-all duration-300 ${showDetails ? 'max-h-96 mt-4 pt-4 border-t border-white/10' : 'max-h-0'}`}>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded bg-blue-500/20 mt-0.5">
              <Info className="h-3 w-3 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-400 mb-0.5">Что это значит?</p>
              <p className="text-xs text-gray-300">{explanation.what}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1 rounded bg-purple-500/20 mt-0.5">
              <Target className="h-3 w-3 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-400 mb-0.5">Почему это важно?</p>
              <p className="text-xs text-gray-300">{explanation.why}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="p-1 rounded bg-emerald-500/20 mt-0.5">
              <Lightbulb className="h-3 w-3 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-400 mb-0.5">Как улучшить?</p>
              <p className="text-xs text-gray-300">{explanation.how}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Click hint */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <MousePointer className="h-3 w-3" />
        Нажмите для деталей
      </div>
    </div>
  )
}

// ============================================
// 📈 INSIGHT CARD - Clear AI Recommendations
// ============================================
interface InsightCardProps {
  insight: AIInsight
  index: number
}

const InsightCard = ({ insight, index }: InsightCardProps) => {
  const [expanded, setExpanded] = useState(false)
  
  const priorityConfig = {
    critical: {
      bg: 'from-red-500/20 to-rose-500/20',
      border: 'border-red-500/50',
      badge: 'bg-red-500 text-white',
      icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
      label: '🚨 Критично'
    },
    high: {
      bg: 'from-orange-500/20 to-amber-500/20',
      border: 'border-orange-500/50',
      badge: 'bg-orange-500 text-white',
      icon: <AlertTriangle className="h-5 w-5 text-orange-400" />,
      label: '⚠️ Важно'
    },
    medium: {
      bg: 'from-yellow-500/20 to-amber-500/20',
      border: 'border-yellow-500/30',
      badge: 'bg-yellow-500 text-black',
      icon: <Info className="h-5 w-5 text-yellow-400" />,
      label: '💡 Рекомендация'
    },
    low: {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      badge: 'bg-blue-500 text-white',
      icon: <CheckCircle className="h-5 w-5 text-blue-400" />,
      label: '✅ Совет'
    }
  }
  
  // ✅ ИСПРАВЛЕНИЕ: Проверяем что priority существует, иначе используем 'medium' по умолчанию
  const priority = insight.priority || 'medium'
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
  
  return (
    <div 
      className={`bg-gradient-to-br ${config.bg} backdrop-blur-xl rounded-xl border ${config.border} overflow-hidden transition-all duration-300 hover:scale-[1.01] cursor-pointer animate-fade-in-up`}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 rounded-xl bg-white/10">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">{insight.category}</span>
            </div>
            <h3 className="text-white font-semibold text-lg leading-tight mb-2">
              {insight.title}
            </h3>
            <div 
              className="text-gray-300 text-sm leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: insight.message
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                  .replace(/\n/g, '<br/>')
              }}
            />
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
        
        {/* Expanded content */}
        <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 mt-4' : 'max-h-0'}`}>
          <div className="pt-4 border-t border-white/10 space-y-4">
            {/* Recommendation */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Что делать?</span>
              </div>
              <p className="text-white text-sm">{insight.recommendation}</p>
            </div>
            
            {/* Impact */}
            {insight.impact && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Ожидаемый результат</span>
                </div>
                <p className="text-gray-300 text-sm">{insight.impact}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// 📊 CHART SECTION - With Clear Labels
// ============================================
interface ChartSectionProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  explanation: string
  children: React.ReactNode
  actions?: React.ReactNode
}

const ChartSection = ({ title, subtitle, icon, explanation, children, actions }: ChartSectionProps) => {
  const [showInfo, setShowInfo] = useState(false)
  
  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              {icon}
            </div>
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                {title}
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500 hover:text-gray-300" />
                </button>
              </CardTitle>
              {subtitle && <CardDescription className="text-gray-400">{subtitle}</CardDescription>}
            </div>
          </div>
          {actions}
        </div>
        
        {/* Info tooltip */}
        {showInfo && (
          <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-fade-in">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-200">{explanation}</p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// ============================================
// 🎯 ONBOARDING STEPS
// ============================================
const OnboardingSteps = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { id: 1, title: 'Загрузите данные', description: 'CSV или Excel файл', icon: Upload },
    { id: 2, title: 'Автоанализ', description: 'AI обрабатывает данные', icon: Sparkles },
    { id: 3, title: 'Изучите метрики', description: 'Ключевые показатели', icon: BarChart3 },
    { id: 4, title: 'Действуйте', description: 'По рекомендациям AI', icon: Target }
  ]
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            currentStep >= step.id 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
              : 'bg-white/5 text-gray-500'
          }`}>
            <step.icon className="h-4 w-4" />
            <span className="text-sm font-medium hidden md:inline">{step.title}</span>
            <span className="text-sm font-medium md:hidden">{step.id}</span>
          </div>
          {index < steps.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-600 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================
// 🏠 MAIN DASHBOARD COMPONENT
// ============================================
export function DashboardPageNew() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { t } = useLanguage() // Добавляем хук для переводов
  
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning') || 'Доброе утро'
    if (hour < 18) return t('greeting.afternoon') || 'Добрый день'
    return t('greeting.evening') || 'Добрый вечер'
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [data, setData] = useState<UploadResponse | null>(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isDemoData, setIsDemoData] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [showWelcome, setShowWelcome] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setAnalytics = useAnalyticsStore((state) => state.setAnalytics)
  const setUploadData = useAnalyticsStore((state) => state.setUploadData)

  // Format helpers
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ₽`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K ₽`
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return new Intl.NumberFormat('ru-RU').format(value)
  }

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Восстанавливаем данные из store при монтировании
  useEffect(() => {
    if (!data) {
      const saved = useAnalyticsStore.getState().getUploadData('main')
      if (saved) {
        setData(saved)
        setShowWelcome(false)
      }
    }
    const hasVisited = localStorage.getItem('dashboard_visited')
    if (!hasVisited && !data) {
      localStorage.setItem('dashboard_visited', 'true')
    }
  }, [])

  // Load demo data
  const handleLoadDemoData = async () => {
    setIsUploading(true)
    setShowWelcome(false)
    try {
      const response = await fetch('/example_data.csv')
      if (!response.ok) {
        const response2 = await fetch('../example_data.csv')
        if (!response2.ok) throw new Error('Демо-файл не найден')
        const blob = await response2.blob()
        const file = new File([blob], 'example_data.csv', { type: 'text/csv' })
        await handleFileUpload(file, true)
        return
      }
      const blob = await response.blob()
      const file = new File([blob], 'example_data.csv', { type: 'text/csv' })
      await handleFileUpload(file, true)
    } catch (error) {
      console.error('Error loading demo data:', error)
      toast.error('Не удалось загрузить демо-данные')
      setIsUploading(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const handleFileUpload = async (file: File, isDemo: boolean = false) => {
    if (!file) return

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Поддерживаются только CSV и Excel файлы')
      return
    }

    setIsUploading(true)
    setShowWelcome(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Ошибка загрузки файла')
      }

      const result: UploadResponse = await response.json()
      setData(result)
      setIsDemoData(isDemo)
      
      // Сохраняем полный ответ в store (persisted в localStorage)
      setUploadData('main', result)
      if (result.analytics) {
        setAnalytics(result.analytics)
      }
      
      toast.success(
        isDemo 
          ? '🎉 Демо-данные загружены! Изучите возможности системы' 
          : '✅ Данные загружены и проанализированы!',
        { duration: 4000 }
      )
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки файла')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const unreadCount = data?.notifications?.items.filter(n => !n.read).length || 0

  // Navigation tabs for dashboard sections
  const navTabs = [
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Инсайты', icon: Sparkles, badge: data?.ai_insights?.total_insights },
    { id: 'products', label: 'Товары', icon: Package },
    { id: 'customers', label: 'Клиенты', icon: Users },
    { id: 'forecast', label: 'Прогноз', icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 md:block hidden">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Analitix AI
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                      PRO
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">{greeting}, {user?.email?.split('@')[0] || 'Пользователь'}!</p>
                </div>
              </div>
            </div>

            {/* Quick Navigation */}
            <QuickNavBar />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Переключатель языка - ЗДЕСЬ! 🌍 */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {data && (
                <Button
                  onClick={() => { setData(null); setIsDemoData(false); setShowWelcome(true) }}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Новые данные
                </Button>
              )}
              
              {data && <AlertsNotification />}
              
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              
              <Button
                onClick={() => navigate('/pricing')}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
              >
                <Crown className="h-4 w-4 mr-2" />
                Тарифы
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              
              {/* Переключатель языка для мобильных - в конце */}
              <div className="sm:hidden">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {/* UPLOAD STATE */}
        {!data && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Onboarding steps */}
            <OnboardingSteps currentStep={1} />
            
            {/* Welcome card */}
            {showWelcome && (
              <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                        <Sparkles className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Добро пожаловать в Analitix AI! 🚀
                      </h2>
                      <p className="text-gray-300 text-lg mb-4">
                        Загрузите данные о продажах — AI проанализирует их и даст конкретные рекомендации для роста вашего бизнеса.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Автоопределение колонок
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                          <CheckCircle className="h-4 w-4" />
                          AI-рекомендации
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Прогнозирование
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowWelcome(false)}
                      className="p-2 text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload area */}
            <Card 
              className={`border-2 border-dashed transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
              } backdrop-blur-xl`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
            >
              <CardContent className="p-12 text-center">
                <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                  isDragging 
                    ? 'bg-blue-500 scale-110' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600'
                } shadow-2xl shadow-blue-500/30`}>
                  <Upload className={`h-10 w-10 text-white ${isUploading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isUploading ? 'Анализируем данные...' : 'Загрузите ваши данные'}
                </h3>
                
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                  Перетащите файл сюда, или выберите файл. 
                  <br />
                  <span className="text-blue-400">Поддерживаем: Excel (XLSX, XLS), CSV, TSV, TXT</span>
                  <br />
                  <span className="text-green-400 text-sm">Автоматически определяем формат, разделитель и кодировку</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv,.txt"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 shadow-lg shadow-blue-500/30"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Выбрать файл
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleLoadDemoData}
                    disabled={isUploading}
                    size="lg"
                    variant="outline"
                    className="bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Попробовать демо
                  </Button>
                </div>

                {/* Supported formats */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-green-500" />
                    <span className="text-gray-300">CSV</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-300">Excel (XLSX, XLS)</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                    <span className="text-gray-300">TSV</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-300">TXT</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-cyan-500" />
                    <span className="text-gray-300">Любой разделитель</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-gray-300">Неограниченно колонок</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick tips */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: <FileSpreadsheet className="h-6 w-6 text-blue-400" />,
                  title: 'Любой формат',
                  description: 'Excel (XLSX, XLS), CSV, TSV, TXT — автоматическое определение'
                },
                {
                  icon: <Sparkles className="h-6 w-6 text-purple-400" />,
                  title: 'AI-анализ',
                  description: 'Получите инсайты и рекомендации за секунды'
                },
                {
                  icon: <Target className="h-6 w-6 text-emerald-400" />,
                  title: 'Действуйте',
                  description: 'Конкретные шаги для роста бизнеса'
                }
              ].map((tip, i) => (
                <Card key={i} className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2 rounded-xl bg-white/10">
                      {tip.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{tip.title}</h4>
                      <p className="text-gray-400 text-sm">{tip.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* INTEGRATIONS SECTION */}
            <Card className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#16213e]/80 backdrop-blur-xl border-white/10 overflow-hidden">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                      <Link className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Подключить источники данных</CardTitle>
                      <CardDescription className="text-gray-400">CRM, базы данных, таблицы — всё в одном месте</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { id: 'bitrix24', name: 'Bitrix24', icon: Cloud, color: 'from-blue-500 to-cyan-500', desc: 'CRM система' },
                    { id: '1c', name: '1С', icon: Database, color: 'from-yellow-500 to-orange-500', desc: 'Учёт и торговля' },
                    { id: 'google-sheets', name: 'Google Sheets', icon: FileSpreadsheet, color: 'from-green-500 to-emerald-500', desc: 'Онлайн таблицы' },
                    { id: 'postgresql', name: 'PostgreSQL', icon: Database, color: 'from-blue-600 to-indigo-600', desc: 'База данных' },
                    { id: 'clickhouse', name: 'ClickHouse', icon: Cpu, color: 'from-purple-500 to-pink-500', desc: 'Аналитика' },
                    { id: 'excel', name: 'Excel/CSV', icon: FileUp, color: 'from-green-600 to-teal-500', desc: 'Любые форматы' },
                  ].map((integration) => {
                    const Icon = integration.icon
                    return (
                      <button
                        key={integration.id}
                        onClick={() => navigate('/integrations')}
                        className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 text-left hover:scale-105"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="text-white font-semibold text-sm mb-1">{integration.name}</h4>
                        <p className="text-gray-500 text-xs">{integration.desc}</p>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-6 flex items-center justify-center">
                  <Button
                    onClick={() => navigate('/integrations')}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Все интеграции
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DASHBOARD STATE */}
        {data && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Demo banner */}
            {isDemoData && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <Gift className="h-6 w-6 text-amber-400" />
                  <div>
                    <p className="text-white font-medium">Вы просматриваете демо-данные</p>
                    <p className="text-amber-200 text-sm">Загрузите свои данные для реального анализа</p>
                  </div>
                </div>
                <Button
                  onClick={() => { setData(null); setIsDemoData(false) }}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Загрузить свои
                </Button>
              </div>
            )}

            {/* Navigation tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                    activeSection === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* OVERVIEW SECTION */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                  <MetricCard
                    title="Общая выручка"
                    value={formatCurrency(data.analytics.total_revenue)}
                    subtitle={formatFullCurrency(data.analytics.total_revenue)}
                    icon={<DollarSign className="h-6 w-6" />}
                    trend={data.forecast?.trend ? {
                      value: data.forecast.trend_percentage,
                      direction: data.forecast.trend === 'growing' ? 'up' : data.forecast.trend === 'declining' ? 'down' : 'stable',
                      label: 'vs прошлый период'
                    } : undefined}
                    explanation={{
                      what: 'Сумма всех продаж за выбранный период',
                      why: 'Главный показатель здоровья бизнеса. Рост выручки = рост бизнеса.',
                      how: 'Увеличьте средний чек, привлеките новых клиентов или повысьте частоту покупок'
                    }}
                    color="blue"
                  />
                  
                  <MetricCard
                    title="Количество заказов"
                    value={formatNumber(data.analytics.total_orders)}
                    icon={<ShoppingCart className="h-6 w-6" />}
                    explanation={{
                      what: 'Общее число транзакций/продаж',
                      why: 'Показывает активность покупателей и эффективность маркетинга',
                      how: 'Запустите акции, улучшите рекламу, добавьте программу лояльности'
                    }}
                    color="purple"
                  />
                  
                  <MetricCard
                    title="Уникальных клиентов"
                    value={formatNumber(data.analytics.unique_clients)}
                    icon={<Users className="h-6 w-6" />}
                    explanation={{
                      what: 'Количество разных покупателей',
                      why: 'Показывает размер клиентской базы и потенциал для повторных продаж',
                      how: 'Привлекайте новых через рекламу, удерживайте текущих через сервис'
                    }}
                    color="green"
                  />
                  
                  <MetricCard
                    title="Средний чек"
                    value={formatCurrency(data.analytics.average_check)}
                    subtitle={formatFullCurrency(data.analytics.average_check)}
                    icon={<Award className="h-6 w-6" />}
                    explanation={{
                      what: 'Средняя сумма одного заказа',
                      why: 'Увеличение среднего чека — самый быстрый способ поднять выручку',
                      how: 'Предлагайте комплекты, делайте upsell, добавьте бесплатную доставку от суммы'
                    }}
                    color="orange"
                  />
                </div>

                {/* Period Comparison - из реальных данных */}
                <PeriodComparison 
                  dailyRevenue={data.analytics.daily_revenue}
                  analytics={data.analytics}
                />

                {/* Revenue chart - Premium */}
                {data.analytics.daily_revenue && data.analytics.daily_revenue.length > 0 && (() => {
                  // Подготовка данных: факт + прогноз с разделением
                  const historyData = data.analytics.daily_revenue.map((d: any) => ({
                    date: d.date,
                    fact: d.revenue,
                    forecast: null as number | null,
                    forecastUpper: null as number | null,
                    forecastLower: null as number | null,
                  }))
                  
                  const forecastRaw = data.forecast?.forecast || []
                  const forecastData = forecastRaw.map((d: any) => ({
                    date: d.date,
                    fact: null as number | null,
                    forecast: d.revenue,
                    forecastUpper: d.revenue ? Math.round(d.revenue * 1.12) : null,
                    forecastLower: d.revenue ? Math.round(d.revenue * 0.88) : null,
                  }))

                  // Мост: последний факт = начало прогноза
                  if (historyData.length > 0 && forecastData.length > 0) {
                    const lastFact = historyData[historyData.length - 1]
                    forecastData[0] = {
                      ...forecastData[0],
                      fact: lastFact.fact,
                    }
                  }
                  
                  const chartData = [...historyData, ...forecastData]

                  // Форматирование даты для оси X
                  const formatDateShort = (dateStr: string) => {
                    try {
                      const d = new Date(dateStr)
                      if (isNaN(d.getTime())) return dateStr
                      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                    } catch { return dateStr }
                  }

                  // Форматирование даты для Tooltip
                  const formatDateFull = (dateStr: string) => {
                    try {
                      const d = new Date(dateStr)
                      if (isNaN(d.getTime())) return dateStr
                      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                    } catch { return dateStr }
                  }

                  return (
                  <ChartSection
                    title="Динамика выручки"
                    subtitle={forecastData.length > 0 ? `Факт + прогноз на ${forecastData.length} дней` : 'По загруженным данным'}
                    icon={<LineChartIcon className="h-5 w-5 text-blue-400" />}
                    explanation="Сплошная линия — фактическая выручка. Пунктирная зеленая — прогноз AI. Затемненная область — доверительный интервал."
                  >
                    <ResponsiveContainer width="100%" height={380}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35}/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02}/>
                          </linearGradient>
                          <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2}/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01}/>
                          </linearGradient>
                          <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08}/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...GRID_PROPS} vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          {...axisProps(palette)}
                          axisLine={{ stroke: '#333' }}
                          tickFormatter={formatDateShort}
                          interval="preserveStartEnd"
                          minTickGap={40}
                        />
                        <YAxis 
                          {...axisProps(palette)}
                          tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                            return value.toString()
                          }}
                          width={55}
                        />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: '#12121f', 
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '14px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                            padding: '14px 18px',
                          }}
                          labelFormatter={(label) => formatDateFull(String(label))}
                          labelStyle={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13, marginBottom: 8 }}
                          formatter={(value: any, name: string) => {
                            if (value === null || value === undefined) return [null, null]
                            const formatted = formatFullCurrency(value)
                            const label = name === 'fact' ? 'Факт' : name === 'forecast' ? 'Прогноз AI' : name === 'forecastUpper' ? 'Верх. граница' : 'Ниж. граница'
                            const color = name === 'fact' ? '#818cf8' : '#4ade80'
                            return [<span style={{ color }}>{formatted}</span>, label]
                          }}
                          wrapperStyle={{ zIndex: 100 }}
                        />
                        {/* Доверительный интервал прогноза */}
                        <Area 
                          type="monotone" 
                          dataKey="forecastUpper"
                          stroke="transparent"
                          fill="url(#gradCI)"
                          fillOpacity={1}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="forecastLower"
                          stroke="transparent"
                          fill="transparent"
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                        {/* Факт */}
                        <Area 
                          type="monotone" 
                          dataKey="fact" 
                          stroke="#818cf8" 
                          strokeWidth={2.5}
                          fill="url(#gradFact)"
                          fillOpacity={1}
                          dot={false}
                          activeDot={{ r: 5, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }}
                          connectNulls={false}
                          animationDuration={1200}
                          animationEasing="ease-out"
                        />
                        {/* Прогноз */}
                        <Area 
                          type="monotone" 
                          dataKey="forecast" 
                          stroke="#4ade80" 
                          strokeWidth={2.5}
                          strokeDasharray="8 4"
                          fill="url(#gradForecast)"
                          fillOpacity={1}
                          dot={{ r: 3, fill: '#4ade80', stroke: '#14532d', strokeWidth: 1.5 }}
                          activeDot={{ r: 6, fill: '#4ade80', stroke: '#14532d', strokeWidth: 2 }}
                          connectNulls={false}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    {/* Легенда */}
                    <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-0.5 bg-indigo-400 rounded" />
                        <span>Факт</span>
                      </div>
                      {forecastData.length > 0 && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-0.5 bg-green-400 rounded" style={{ borderTop: '2px dashed #4ade80' }} />
                            <span>Прогноз AI</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-green-500/10 rounded border border-green-500/20" />
                            <span>Доверительный интервал</span>
                          </div>
                        </>
                      )}
                    </div>
                  </ChartSection>
                  )
                })()}

                {/* Top products and pie chart */}
                {data.analytics.top_products && data.analytics.top_products.length > 0 && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ChartSection
                      title="ТОП-5 товаров"
                      subtitle="По выручке"
                      icon={<Award className="h-5 w-5 text-amber-400" />}
                      explanation="Товары, которые приносят больше всего денег. Сфокусируйтесь на их продвижении."
                    >
                      <div className="space-y-3">
                        {data.analytics.top_products.slice(0, 5).map((product, idx) => {
                          const percentage = (product.revenue / data.analytics.total_revenue) * 100
                          return (
                            <div key={idx} className="group">
                              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                                  style={{ backgroundColor: COLORS.primary[idx] }}
                                >
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{product.product}</p>
                                  <p className="text-gray-500 text-sm">{product.quantity} шт продано</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-bold">{formatCurrency(product.revenue)}</p>
                                  <p className="text-gray-500 text-sm">{percentage.toFixed(1)}% от общей</p>
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS.primary[idx]
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ChartSection>

                    <ChartSection
                      title="Распределение выручки"
                      subtitle="По категориям товаров"
                      icon={<PieChartIcon className="h-5 w-5 text-purple-400" />}
                      explanation="Показывает какие товары приносят какую долю выручки."
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={data.analytics.top_products.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="revenue"
                          >
                            {data.analytics.top_products.slice(0, 5).map((_, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS.primary[index]}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => formatFullCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: '#1a1a2e', 
                              border: '1px solid #333',
                              borderRadius: '12px'
                            }}
                          />
                          <Legend 
                            formatter={(_value, entry: any) => (
                              <span className="text-gray-300 text-sm">{entry.payload.product}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartSection>
                  </div>
                )}
              </div>
            )}

            {/* AI INSIGHTS SECTION */}
            {activeSection === 'insights' && (
              <div className="space-y-6">
                
                {/* Кнопка "Назад к обзору" */}
                <Button
                  onClick={() => setActiveSection('overview')}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Назад к обзору
                </Button>
                
                {/* Проверка наличия данных */}
                {!data.ai_insights?.insights || data.ai_insights.insights.length === 0 ? (
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-12 text-center">
                      <div className="mx-auto w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="h-10 w-10 text-yellow-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">AI Инсайты недоступны</h3>
                      <p className="text-gray-400 mb-4">
                        Загрузите данные о продажах, чтобы получить персонализированные рекомендации от AI
                      </p>
                      <Button
                        onClick={() => setActiveSection('overview')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      >
                        Вернуться к обзору
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                {/* 🎯 AI TRUST SCORE - NEW! v2.0 */}
                {data.ai_trust_score && (
                  <AITrustScore 
                    trustScore={data.ai_trust_score}
                    metricsConfidence={data.metrics_confidence}
                    assumptions={data.assumptions}
                  />
                )}
                
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-white">{data.ai_insights.total_insights}</p>
                      <p className="text-gray-400 text-sm">Всего инсайтов</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-red-400">{data.ai_insights.critical_count}</p>
                      <p className="text-red-300 text-sm">Критических</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-500/10 backdrop-blur-xl border-orange-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-orange-400">{data.ai_insights.high_count}</p>
                      <p className="text-orange-300 text-sm">Важных</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 backdrop-blur-xl border-green-500/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-green-400">
                        {(data.ai_insights as any).data_based_count || data.ai_insights.total_insights - data.ai_insights.critical_count - data.ai_insights.high_count}
                      </p>
                      <p className="text-green-300 text-sm">На основе данных</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights list */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    AI-рекомендации для вашего бизнеса
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.ai_insights.insights.map((insight, idx) => (
                      <InsightCard key={idx} insight={insight} index={idx} />
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>
            )}

            {/* CUSTOMERS SECTION */}
            {activeSection === 'customers' && data.rfm?.success && (
              <div className="space-y-6">
                
                {/* Кнопка "Назад к обзору" */}
                <Button
                  onClick={() => setActiveSection('overview')}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Назад к обзору
                </Button>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-400" />
                      RFM-сегментация клиентов
                    </h3>
                    <p className="text-gray-400 mt-1">{data.rfm.summary}</p>
                  </div>
                </div>

                {/* Explanation */}
                <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-200 font-medium mb-1">Что такое RFM?</p>
                        <p className="text-blue-100/70 text-sm">
                          <strong>R</strong>ecency (Давность) — когда клиент покупал последний раз<br/>
                          <strong>F</strong>requency (Частота) — как часто покупает<br/>
                          <strong>M</strong>onetary (Деньги) — сколько тратит<br/>
                          <br/>
                          Это помогает понять, на каких клиентов обратить внимание в первую очередь.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Segments */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.rfm.segments.map((segment, idx) => (
                    <Card 
                      key={idx}
                      className="bg-white/5 backdrop-blur-xl border-l-4 hover:bg-white/10 transition-all"
                      style={{ borderLeftColor: segment.color }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-white font-bold text-lg">{segment.name}</h4>
                            <p className="text-gray-400 text-sm">{segment.description}</p>
                          </div>
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: segment.color }}
                          >
                            {segment.count}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-500 text-xs">Клиентов</p>
                            <p className="text-white font-bold text-xl">{segment.count}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Выручка</p>
                            <p className="text-white font-bold">{formatCurrency(segment.total_revenue)}</p>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-200">{segment.action}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* FORECAST SECTION */}
            {activeSection === 'forecast' && data.forecast?.success && (
              <div className="space-y-6">
                {/* Back button */}
                <Button
                  onClick={() => setActiveSection('overview')}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Назад к обзору
                </Button>
                
                <ChartSection
                  title="Прогноз выручки"
                  subtitle="На ближайшие 7 дней"
                  icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
                  explanation="AI анализирует историю продаж и предсказывает будущую выручку. Точность зависит от количества данных."
                >
                  <div className="space-y-6">
                    {/* Forecast summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Прогноз на 7 дней</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(data.forecast.total_forecast)}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Тренд</p>
                        <p className={`text-2xl font-bold flex items-center gap-2 ${
                          data.forecast.trend === 'growing' ? 'text-emerald-400' :
                          data.forecast.trend === 'declining' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {data.forecast.trend === 'growing' ? <TrendingUp className="h-6 w-6" /> :
                           data.forecast.trend === 'declining' ? <TrendingDown className="h-6 w-6" /> :
                           <Minus className="h-6 w-6" />}
                          {data.forecast.trend_text}
                        </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-1">Достоверность</p>
                        <p className="text-2xl font-bold text-blue-400">{data.forecast.confidence}</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/30">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-emerald-300 font-medium mb-1">Рекомендация AI</p>
                          <p className="text-emerald-100">{data.forecast.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ChartSection>

                {/* LTV */}
                {data.ltv?.success && (
                  <ChartSection
                    title="Customer Lifetime Value (LTV)"
                    subtitle="Пожизненная ценность клиента"
                    icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
                    explanation="Сколько денег в среднем приносит один клиент за всё время. Чем выше — тем лучше."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
                        <p className="text-emerald-300 text-sm mb-2">LTV на клиента</p>
                        <p className="text-4xl font-bold text-white">{formatFullCurrency(data.ltv.ltv)}</p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-xl">
                        <p className="text-gray-400 text-sm mb-2">Годовой LTV (прогноз)</p>
                        <p className="text-4xl font-bold text-emerald-400">{formatFullCurrency(data.ltv.yearly_ltv)}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white/5 rounded-xl">
                      <p className="text-gray-300">{data.ltv.recommendation}</p>
                    </div>
                  </ChartSection>
                )}
              </div>
            )}

            {/* PRODUCTS SECTION */}
            {activeSection === 'products' && data.analytics.top_products && (
              <div className="space-y-6">
                {/* Back button */}
                <Button
                  onClick={() => setActiveSection('overview')}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                  Назад к обзору
                </Button>
                
                <ChartSection
                  title="Анализ товаров"
                  subtitle={`${data.analytics.top_products.length} товаров в базе`}
                  icon={<Package className="h-5 w-5 text-amber-400" />}
                  explanation="Полный список товаров с выручкой и количеством продаж."
                >
                  <div className="space-y-2">
                    {data.analytics.top_products.map((product, idx) => {
                      const percentage = (product.revenue / data.analytics.total_revenue) * 100
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg"
                            style={{ backgroundColor: COLORS.primary[idx % COLORS.primary.length] }}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{product.product}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-gray-500 text-sm">{product.quantity} продано</span>
                              <span className="text-gray-500 text-sm">{percentage.toFixed(1)}% выручки</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">{formatCurrency(product.revenue)}</p>
                            <p className="text-gray-500 text-sm">
                              ~{formatCurrency(product.revenue / product.quantity)} за шт
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ChartSection>
              </div>
            )}

            {/* Export section */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Экспорт данных</h3>
                    <p className="text-gray-400 text-sm">Скачайте отчет или поделитесь результатами</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => createAnalyticsReport(data)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF отчет
                    </Button>
                    <Button
                      onClick={() => exportToCSV(data.raw_data || [], `export-${Date.now()}.csv`)}
                      variant="outline"
                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <Card className="w-full max-w-2xl bg-[#1a1a2e] border-white/10 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                  Как пользоваться Analitix AI
                </CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-sm">1</span>
                  Загрузите данные
                </h4>
                <p className="text-gray-400 text-sm ml-8">
                  Перетащите файл с данными о продажах. Поддерживаем: <strong className="text-white">Excel (XLSX, XLS), CSV, TSV, TXT</strong>. 
                  Система автоматически определит формат, разделитель и кодировку. Неограниченное количество колонок.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm">2</span>
                  Изучите метрики
                </h4>
                <p className="text-gray-400 text-sm ml-8">
                  Нажмите на любую карточку с метрикой, чтобы увидеть объяснение и советы по улучшению.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-sm">3</span>
                  Следуйте рекомендациям AI
                </h4>
                <p className="text-gray-400 text-sm ml-8">
                  Во вкладке "AI Инсайты" вы найдете конкретные шаги для роста бизнеса.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-gray-500 text-sm text-center">
                  Нужна помощь? Напишите на support@analitix.ai
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
