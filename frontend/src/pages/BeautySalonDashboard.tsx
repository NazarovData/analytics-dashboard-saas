import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Scissors, Heart, Star, TrendingUp, Users, Calendar,
  BarChart3, ArrowLeft, Upload, Download, RefreshCw,
  ArrowUpRight, HelpCircle, X, FileSpreadsheet, 
  PlayCircle, Sparkles, Clock, DollarSign,
  Percent, AlertCircle, Crown, Gift
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('beauty')

// ============================================
// 💇 BEAUTY SALON DASHBOARD
// ============================================

interface SalonRecord {
  date: string
  time: string
  client_name: string
  client_phone: string
  service: string
  master: string
  duration: number
  price: number
  tips: number
  is_new_client: string
  rating: number
}

interface SalonMetrics {
  totalRevenue: number
  totalClients: number
  newClients: number
  returningClients: number
  avgCheck: number
  avgRating: number
  totalTips: number
  occupancy: number
  topServices: { service: string; count: number; revenue: number }[]
  topMasters: { master: string; clients: number; revenue: number; rating: number }[]
  hourlyLoad: { hour: string; count: number }[]
  dailyRevenue: { date: string; revenue: number; clients: number }[]
  clientRetention: number
  revenueByService: { service: string; revenue: number; percent: number }[]
}

const COLORS = ['#EC4899', '#F472B6', '#8B5CF6', '#A78BFA', '#06B6D4', '#22D3EE', '#10B981', '#34D399']

export default function BeautySalonDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<SalonRecord[] | null>(null)
  const [metrics, setMetrics] = useState<SalonMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'masters' | 'services'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('beauty')

  const calculateMetrics = (records: SalonRecord[]): SalonMetrics => {
    const totalRevenue = records.reduce((sum, r) => sum + r.price, 0)
    const totalTips = records.reduce((sum, r) => sum + r.tips, 0)
    
    // Уникальные клиенты
    const uniqueClients = new Set(records.map(r => r.client_phone))
    const totalClients = uniqueClients.size
    
    const newClients = records.filter(r => r.is_new_client === 'да').length
    const returningClients = totalClients - newClients
    
    const avgCheck = totalRevenue / records.length
    const avgRating = records.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / 
                      records.filter(r => r.rating > 0).length

    // Топ услуги
    const serviceMap = new Map<string, { count: number; revenue: number }>()
    records.forEach(r => {
      const existing = serviceMap.get(r.service) || { count: 0, revenue: 0 }
      serviceMap.set(r.service, {
        count: existing.count + 1,
        revenue: existing.revenue + r.price
      })
    })
    const topServices = Array.from(serviceMap.entries())
      .map(([service, stats]) => ({ service, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Топ мастера
    const masterMap = new Map<string, { clients: number; revenue: number; ratings: number[]; }>()
    records.forEach(r => {
      const existing = masterMap.get(r.master) || { clients: 0, revenue: 0, ratings: [] }
      existing.clients++
      existing.revenue += r.price
      if (r.rating > 0) existing.ratings.push(r.rating)
      masterMap.set(r.master, existing)
    })
    const topMasters = Array.from(masterMap.entries())
      .map(([master, stats]) => ({
        master,
        clients: stats.clients,
        revenue: stats.revenue,
        rating: stats.ratings.length > 0 
          ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length 
          : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Загрузка по часам
    const hourMap = new Map<string, number>()
    records.forEach(r => {
      const hour = r.time.split(':')[0] + ':00'
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1)
    })
    const hourlyLoad = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    // Выручка по дням
    const dayMap = new Map<string, { revenue: number; clients: Set<string> }>()
    records.forEach(r => {
      const existing = dayMap.get(r.date) || { revenue: 0, clients: new Set() }
      existing.revenue += r.price
      existing.clients.add(r.client_phone)
      dayMap.set(r.date, existing)
    })
    const dailyRevenue = Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, revenue: stats.revenue, clients: stats.clients.size }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Возвращаемость
    const clientRetention = totalClients > 0 ? (returningClients / totalClients) * 100 : 0

    // Выручка по услугам (для pie chart)
    const totalServiceRevenue = topServices.reduce((sum, s) => sum + s.revenue, 0)
    const revenueByService = topServices.map(s => ({
      service: s.service,
      revenue: s.revenue,
      percent: (s.revenue / totalServiceRevenue) * 100
    }))

    // Загрузка салона (примерно)
    const workingHours = 10 // часов в день
    const daysInData = dayMap.size
    const totalSlots = daysInData * workingHours * topMasters.length
    const occupancy = totalSlots > 0 ? (records.length / totalSlots) * 100 : 0

    return {
      totalRevenue,
      totalClients,
      newClients,
      returningClients,
      avgCheck,
      avgRating,
      totalTips,
      occupancy: Math.min(occupancy, 100),
      topServices,
      topMasters,
      hourlyLoad,
      dailyRevenue,
      clientRetention,
      revenueByService
    }
  }

  const rowsToRecords = (rows: Record<string, string>[]): SalonRecord[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
    const timeCol = findColumn(h, ['time', 'время', 'час', 'vaqt'])
    const clientCol = findColumn(h, ['client_name', 'client', 'клиент', 'имя', 'name', 'mijoz'])
    const phoneCol = findColumn(h, ['client_phone', 'phone', 'телефон', 'тел'])
    const serviceCol = findColumn(h, ['service', 'услуга', 'service_name', 'xizmat'])
    const masterCol = findColumn(h, ['master', 'мастер', 'staff', 'персонал', 'usta'])
    const durationCol = findColumn(h, ['duration', 'длительность', 'время_услуги', 'davomiylik'])
    const priceCol = findColumn(h, ['price', 'цена', 'стоимость', 'narx', 'сумма', 'total'])
    const tipsCol = findColumn(h, ['tips', 'чаевые', 'tip'])
    const newClientCol = findColumn(h, ['is_new_client', 'new_client', 'новый', 'new'])
    const ratingCol = findColumn(h, ['rating', 'рейтинг', 'оценка'])

    return rows.map((row) => ({
      date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
      time: getStr(row, timeCol, '12:00'),
      client_name: getStr(row, clientCol, 'Клиент'),
      client_phone: getStr(row, phoneCol, ''),
      service: getStr(row, serviceCol, 'Услуга'),
      master: getStr(row, masterCol, 'Мастер'),
      duration: getNum(row, durationCol, 60),
      price: getNum(row, priceCol),
      tips: getNum(row, tipsCol),
      is_new_client: getStr(row, newClientCol, 'нет'),
      rating: getNum(row, ratingCol),
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const records = rowsToRecords(rows)
      if (records.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(records)
      setMetrics(calculateMetrics(records))
      toast.success(`💇 Загружено ${records.length} записей из ${file.name}`)
      uploadForAI(file)
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Ошибка обработки файла')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemoData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/demo_data/beauty_salon.csv')
      const blob = await response.blob()
      const demoFile = new File([blob], 'beauty_salon.csv', { type: 'text/csv' })
      const rows = await readFileUniversal(demoFile)
      const records = rowsToRecords(rows)

      setData(records)
      setMetrics(calculateMetrics(records))
      toast.success('💇 Демо-данные салона загружены!')
      uploadForAI(demoFile)
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₽`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₽`
    return `${value.toLocaleString('ru-RU')} ₽`
  }

  return (
    <div className="min-h-screen" style={{ background: palette.bg }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/industries')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl shadow-lg shadow-pink-500/20">
                  <Scissors className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Салон красоты
                    <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full">
                      BEAUTY
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Записи, мастера, услуги</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data && (
                <Button
                  onClick={() => { setData(null); setMetrics(null) }}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Новые данные
                </Button>
              )}
              <Button
                onClick={() => setShowHelp(true)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {!data && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Hero */}
            <Card className="bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-fuchsia-500/20 backdrop-blur-xl border-pink-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-pink-500/30">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Аналитика салона красоты 💇‍♀️
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Загрузите журнал записей — узнайте кто ваши лучшие мастера и популярные услуги
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-lg text-sm">
                        <Users className="h-4 w-4" />
                        Клиенты
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                        <Crown className="h-4 w-4" />
                        Мастера
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/20 text-fuchsia-300 rounded-lg text-sm">
                        <Star className="h-4 w-4" />
                        Рейтинги
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm">
                        <Calendar className="h-4 w-4" />
                        Загрузка
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-2 border-dashed border-pink-500/30 bg-pink-500/5 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-pink-500/30">
                  <Upload className={`h-10 w-10 text-white ${isLoading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Загрузите журнал записей
                </h3>
                <p className="text-gray-400 mb-8">
                  Экспортируйте из YCLIENTS, Арника или Excel
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold px-8"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Загрузить файл
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={loadDemoData}
                    disabled={isLoading}
                    size="lg"
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Демо-данные
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-6 w-6 text-pink-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Рейтинг мастеров</h3>
                  <p className="text-gray-400 text-sm">
                    Узнайте кто приносит больше выручки и получает лучшие отзывы
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Часы пик</h3>
                  <p className="text-gray-400 text-sm">
                    Определите когда салон загружен больше всего
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-fuchsia-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-fuchsia-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Возвращаемость</h3>
                  <p className="text-gray-400 text-sm">
                    Сколько клиентов приходят повторно
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {data && metrics && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6 animate-fade-in-up">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'masters', label: 'Мастера', icon: Crown },
                { id: 'services', label: 'Услуги', icon: Scissors }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-xl border-pink-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-pink-500/20">
                          <DollarSign className="h-6 w-6 text-pink-400" />
                        </div>
                        <span className="flex items-center text-emerald-400 text-sm">
                          <ArrowUpRight className="h-4 w-4" />
                          +12%
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Выручка</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
                      <p className="text-pink-400 text-sm mt-2">
                        + {formatCurrency(metrics.totalTips)} чаевые
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 backdrop-blur-xl border-purple-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                          <Users className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Клиенты</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalClients}</p>
                      <p className="text-purple-400 text-sm mt-2">
                        {metrics.newClients} новых • {metrics.returningClients} постоянных
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-amber-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                          <Star className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Средний рейтинг</p>
                      <p className="text-3xl font-bold text-white">{metrics.avgRating.toFixed(1)}</p>
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= Math.round(metrics.avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 backdrop-blur-xl border-cyan-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                          <Percent className="h-6 w-6 text-cyan-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Загрузка салона</p>
                      <p className="text-3xl font-bold text-white">{metrics.occupancy.toFixed(0)}%</p>
                      <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                          style={{ width: `${metrics.occupancy}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue by day */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-pink-400" />
                        Выручка по дням
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={metrics.dailyRevenue}>
                          <defs>
                            <linearGradient id="colorRevenueSalon" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="date" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            {...TOOLTIP_STYLE}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#EC4899" 
                            strokeWidth={2}
                            fill="url(#colorRevenueSalon)" 
                            name="Выручка"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Hourly load */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-400" />
                        Загрузка по часам
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Когда больше всего записей
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={metrics.hourlyLoad}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="hour" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} />
                          <Tooltip 
                            {...TOOLTIP_STYLE}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill="url(#gradientPink)" 
                            radius={[4, 4, 0, 0]}
                            name="Записей"
                          >
                            {metrics.hourlyLoad.map((entry, index) => (
                              <Cell key={index} fill={entry.count > 15 ? '#EC4899' : '#8B5CF6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Services pie */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Scissors className="h-5 w-5 text-fuchsia-400" />
                      Выручка по услугам
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie
                            data={metrics.revenueByService}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="revenue"
                            nameKey="service"
                          >
                            {metrics.revenueByService.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            {...TOOLTIP_STYLE}
                          />
                        </RechartsPie>
                      </ResponsiveContainer>
                      
                      <div className="space-y-3">
                        {metrics.revenueByService.slice(0, 6).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-gray-300 flex-1 truncate">{item.service}</span>
                            <span className="text-white font-medium">{item.percent.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Retention */}
                <Card className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl border-pink-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 relative">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="#333"
                            strokeWidth="8"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="url(#gradientRetention)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${metrics.clientRetention * 2.51} 251`}
                          />
                          <defs>
                            <linearGradient id="gradientRetention" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#EC4899" />
                              <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{metrics.clientRetention.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Возвращаемость клиентов</h3>
                        <p className="text-gray-400">
                          {metrics.returningClients} из {metrics.totalClients} клиентов приходят повторно
                        </p>
                        {metrics.clientRetention < 50 && (
                          <p className="text-amber-400 text-sm mt-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Рекомендуем программу лояльности
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-fuchsia-500/10 backdrop-blur-xl border-pink-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-pink-400" />
                      AI-рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-pink-500/10 rounded-xl border border-pink-500/20">
                      <Gift className="h-5 w-5 text-pink-400 mt-0.5" />
                      <div>
                        <p className="text-pink-300 font-medium">Увеличьте средний чек</p>
                        <p className="text-gray-400 text-sm">
                          Предлагайте комплексные услуги. Например, "Стрижка + Укладка" со скидкой 10%.
                        </p>
                      </div>
                    </div>
                    
                    {metrics.hourlyLoad.some(h => h.count < 5) && (
                      <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-purple-300 font-medium">Заполните "мёртвые" часы</p>
                          <p className="text-gray-400 text-sm">
                            Сделайте скидку 15% на записи до 12:00 — увеличите загрузку.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20">
                      <Heart className="h-5 w-5 text-fuchsia-400 mt-0.5" />
                      <div>
                        <p className="text-fuchsia-300 font-medium">Верните "спящих" клиентов</p>
                        <p className="text-gray-400 text-sm">
                          Отправьте SMS с персональным предложением клиентам, которые не были 60+ дней.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'masters' && (
              <div className="space-y-6">
                {/* Masters ranking */}
                <div className="grid gap-4">
                  {metrics.topMasters.map((master, idx) => (
                    <Card 
                      key={idx}
                      className={`backdrop-blur-xl border transition-all hover:scale-[1.01] ${
                        idx === 0 
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30' 
                          : idx === 1 
                            ? 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-400/30'
                            : idx === 2
                              ? 'bg-gradient-to-r from-orange-700/20 to-orange-600/20 border-orange-700/30'
                              : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            idx === 0 ? 'bg-amber-500 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            idx === 2 ? 'bg-orange-700 text-white' :
                            'bg-white/10 text-gray-400'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">{master.master}</h3>
                            <p className="text-gray-400 text-sm">{master.clients} записей</p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-2xl font-bold text-white">{formatCurrency(master.revenue)}</p>
                            <p className="text-gray-500 text-sm">выручка</p>
                          </div>
                          <div className="text-center px-4 border-l border-white/10">
                            <div className="flex items-center gap-1 justify-center">
                              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                              <span className="text-xl font-bold text-white">{master.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-gray-500 text-sm">рейтинг</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Services table */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Популярные услуги</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.topServices.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="w-8 text-center">
                            <span className={`text-lg font-bold ${idx < 3 ? 'text-pink-400' : 'text-gray-500'}`}>
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{service.service}</p>
                            <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                                style={{ width: `${(service.revenue / metrics.topServices[0].revenue) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatCurrency(service.revenue)}</p>
                            <p className="text-gray-500 text-sm">{service.count} записей</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Export */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Экспорт отчёта</h3>
                    <p className="text-gray-400 text-sm">Скачайте аналитику салона</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analytics Section */}
            <AnalyticsSection industry="beauty" aiData={aiData} />
          </div>
          </main>
        )}
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <Card className="w-full max-w-lg bg-[#1a1a2e] border-white/10" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Как использовать</CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Загрузите журнал записей из вашей CRM. Система покажет:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>✅ Рейтинг мастеров по выручке</li>
                <li>✅ Популярные услуги</li>
                <li>✅ Часы пик и загрузку</li>
                <li>✅ Возвращаемость клиентов</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
