import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Megaphone, Eye, Phone, ShoppingCart,
  TrendingUp, Target, Award, PieChart,
  BarChart3, ArrowLeft, Upload, Download, RefreshCw,
  CheckCircle, Lightbulb,
  ArrowUpRight, ArrowDownRight, HelpCircle, X,
  FileSpreadsheet, PlayCircle, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

// ============================================
// 📢 AVITO DASHBOARD - Аналитика объявлений
// ============================================

interface AvitoAd {
  date: string
  ad_id: string
  title: string
  category: string
  price: number
  views: number
  calls: number
  messages: number
  favorites: number
  sales: number
  revenue: number
  promotion_cost: number
  status: string
}

interface AvitoMetrics {
  totalAds: number
  totalViews: number
  totalCalls: number
  totalMessages: number
  totalSales: number
  totalRevenue: number
  totalPromotionCost: number
  avgConversion: number
  romi: number
  topAds: AvitoAd[]
  categoryStats: { category: string; views: number; sales: number; revenue: number }[]
  dailyStats: { date: string; views: number; calls: number; sales: number; revenue: number }[]
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B']

export default function AvitoDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AvitoAd[] | null>(null)
  const [metrics, setMetrics] = useState<AvitoMetrics | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'ads' | 'analytics'>('overview')
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('avito')
  const palette = getPalette('avito')

  // Calculate metrics from data
  const calculateMetrics = (ads: AvitoAd[]): AvitoMetrics => {
    const totalAds = new Set(ads.map(a => a.ad_id)).size
    const totalViews = ads.reduce((sum, a) => sum + a.views, 0)
    const totalCalls = ads.reduce((sum, a) => sum + a.calls, 0)
    const totalMessages = ads.reduce((sum, a) => sum + a.messages, 0)
    const totalSales = ads.reduce((sum, a) => sum + a.sales, 0)
    const totalRevenue = ads.reduce((sum, a) => sum + a.revenue, 0)
    const totalPromotionCost = ads.reduce((sum, a) => sum + a.promotion_cost, 0)
    const avgConversion = totalViews > 0 ? (totalSales / totalViews) * 100 : 0
    const romi = totalPromotionCost > 0 ? ((totalRevenue - totalPromotionCost) / totalPromotionCost) * 100 : 0

    // Top ads by revenue
    const adsByRevenue = [...ads].sort((a, b) => b.revenue - a.revenue)
    const topAds = adsByRevenue.slice(0, 5)

    // Category stats
    const categoryMap = new Map<string, { views: number; sales: number; revenue: number }>()
    ads.forEach(ad => {
      const existing = categoryMap.get(ad.category) || { views: 0, sales: 0, revenue: 0 }
      categoryMap.set(ad.category, {
        views: existing.views + ad.views,
        sales: existing.sales + ad.sales,
        revenue: existing.revenue + ad.revenue
      })
    })
    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats
    })).sort((a, b) => b.revenue - a.revenue)

    // Daily stats
    const dailyMap = new Map<string, { views: number; calls: number; sales: number; revenue: number }>()
    ads.forEach(ad => {
      const existing = dailyMap.get(ad.date) || { views: 0, calls: 0, sales: 0, revenue: 0 }
      dailyMap.set(ad.date, {
        views: existing.views + ad.views,
        calls: existing.calls + ad.calls,
        sales: existing.sales + ad.sales,
        revenue: existing.revenue + ad.revenue
      })
    })
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalAds,
      totalViews,
      totalCalls,
      totalMessages,
      totalSales,
      totalRevenue,
      totalPromotionCost,
      avgConversion,
      romi,
      topAds,
      categoryStats,
      dailyStats
    }
  }

  const rowsToAds = (rows: Record<string, string>[]): AvitoAd[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
    const adIdCol = findColumn(h, ['ad_id', 'adid', 'id', 'объявление', 'номер'])
    const titleCol = findColumn(h, ['title', 'название', 'name', 'заголовок', 'nomi'])
    const categoryCol = findColumn(h, ['category', 'категория', 'cat', 'тип', 'группа'])
    const priceCol = findColumn(h, ['price', 'цена', 'стоимость', 'narx'])
    const viewsCol = findColumn(h, ['views', 'просмотры', 'показы', 'impressions'])
    const callsCol = findColumn(h, ['calls', 'звонки', 'телефон'])
    const messagesCol = findColumn(h, ['messages', 'сообщения', 'message'])
    const favoritesCol = findColumn(h, ['favorites', 'избранное', 'favorite'])
    const salesCol = findColumn(h, ['sales', 'продажи', 'sold', 'deals'])
    const revenueCol = findColumn(h, ['revenue', 'выручка', 'доход', 'income'])
    const costCol = findColumn(h, ['promotion_cost', 'cost', 'расход', 'затраты', 'реклама'])
    const statusCol = findColumn(h, ['status', 'статус', 'state'])

    return rows.map((row, i) => ({
      date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
      ad_id: getStr(row, adIdCol, `AD${i + 1}`),
      title: getStr(row, titleCol, 'Объявление'),
      category: getStr(row, categoryCol, 'Другое'),
      price: getNum(row, priceCol),
      views: getNum(row, viewsCol),
      calls: getNum(row, callsCol),
      messages: getNum(row, messagesCol),
      favorites: getNum(row, favoritesCol),
      sales: getNum(row, salesCol),
      revenue: getNum(row, revenueCol),
      promotion_cost: getNum(row, costCol),
      status: getStr(row, statusCol, 'active'),
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const ads = rowsToAds(rows)
      if (ads.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(ads)
      setMetrics(calculateMetrics(ads))
      toast.success(`📢 Загружено ${ads.length} записей из ${file.name}`)
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
      const response = await fetch('/demo_data/avito_ads.csv')
      const blob = await response.blob()
      const demoFile = new File([blob], 'avito_ads.csv', { type: 'text/csv' })
      const rows = await readFileUniversal(demoFile)
      const ads = rowsToAds(rows)

      setData(ads)
      setMetrics(calculateMetrics(ads))
      toast.success('📢 Демо-данные Авито загружены!')
      uploadForAI(demoFile)
    } catch (error) {
      toast.error('Ошибка загрузки демо-данных')
    } finally {
      setIsLoading(false)
    }
  }

  // Format helpers
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₽`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₽`
    return `${value.toLocaleString('ru-RU')} ₽`
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString('ru-RU')
  }

  return (
    <div className="min-h-screen" style={{ background: palette.bg }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl" />
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
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Авито Аналитика
                    <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full">
                      PRO
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Объявления, звонки, продажи</p>
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
        {/* Upload state */}
        {!data && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Hero */}
            <Card className="bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-yellow-500/20 backdrop-blur-xl border-orange-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
                    <Megaphone className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Аналитика Авито объявлений 📢
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Загрузите статистику объявлений — узнайте какие работают лучше всего
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-300 rounded-lg text-sm">
                        <Eye className="h-4 w-4" />
                        Просмотры
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm">
                        <Phone className="h-4 w-4" />
                        Звонки
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                        <ShoppingCart className="h-4 w-4" />
                        Продажи
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                        <Target className="h-4 w-4" />
                        ROMI
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload area */}
            <Card className="border-2 border-dashed border-orange-500/30 bg-orange-500/5 backdrop-blur-xl hover:border-orange-400/50 transition-all">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/30">
                  <Upload className={`h-10 w-10 text-white ${isLoading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Загрузите статистику Авито
                </h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                  Экспортируйте данные из личного кабинета Авито или используйте демо
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
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-8"
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

            {/* What we analyze */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { icon: Eye, title: 'Просмотры', desc: 'Сколько людей видят объявления', color: 'orange' },
                { icon: Phone, title: 'Звонки', desc: 'Конверсия в обращения', color: 'green' },
                { icon: ShoppingCart, title: 'Продажи', desc: 'Реальные сделки', color: 'blue' },
                { icon: Target, title: 'ROMI', desc: 'Окупаемость продвижения', color: 'purple' }
              ].map((item, i) => (
                <Card key={i} className={`bg-${item.color}-500/10 backdrop-blur-xl border-${item.color}-500/20`}>
                  <CardContent className="p-5">
                    <item.icon className={`h-8 w-8 text-${item.color}-400 mb-3`} />
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard state */}
        {data && metrics && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6 animate-fade-in-up">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'ads', label: 'Объявления', icon: Megaphone },
                { id: 'analytics', label: 'Аналитика', icon: PieChart }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Total Views */}
                  <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl border-orange-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-orange-500/20">
                          <Eye className="h-6 w-6 text-orange-400" />
                        </div>
                        <span className="text-xs text-gray-500">Всего</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Просмотры</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(metrics.totalViews)}</p>
                      <p className="text-orange-400 text-sm mt-2">
                        {metrics.totalAds} объявлений
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Calls */}
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-green-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-500/20">
                          <Phone className="h-6 w-6 text-green-400" />
                        </div>
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {((metrics.totalCalls / metrics.totalViews) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Звонки</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(metrics.totalCalls)}</p>
                      <p className="text-green-400 text-sm mt-2">
                        + {formatNumber(metrics.totalMessages)} сообщений
                      </p>
                    </CardContent>
                  </Card>

                  {/* Total Sales */}
                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-blue-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <ShoppingCart className="h-6 w-6 text-blue-400" />
                        </div>
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          {metrics.avgConversion.toFixed(1)}% конв.
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Продажи</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalSales}</p>
                      <p className="text-blue-400 text-sm mt-2">
                        {formatCurrency(metrics.totalRevenue)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* ROMI */}
                  <Card className={`bg-gradient-to-br backdrop-blur-xl ${
                    metrics.romi > 0 
                      ? 'from-purple-500/20 to-pink-500/20 border-purple-500/30' 
                      : 'from-red-500/20 to-rose-500/20 border-red-500/30'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${metrics.romi > 0 ? 'bg-purple-500/20' : 'bg-red-500/20'}`}>
                          <Target className={`h-6 w-6 ${metrics.romi > 0 ? 'text-purple-400' : 'text-red-400'}`} />
                        </div>
                        <span className={`text-xs flex items-center gap-1 ${metrics.romi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {metrics.romi > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {metrics.romi > 0 ? 'Прибыльно' : 'Убыточно'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">ROMI продвижения</p>
                      <p className={`text-3xl font-bold ${metrics.romi > 0 ? 'text-white' : 'text-red-400'}`}>
                        {metrics.romi.toFixed(0)}%
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Потрачено: {formatCurrency(metrics.totalPromotionCost)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Daily stats chart */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-400" />
                        Динамика по дням
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={metrics.dailyStats}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="date" {...axisProps(palette)} />
                          <YAxis yAxisId="left" {...axisProps(palette)} />
                          <YAxis yAxisId="right" orientation="right" {...axisProps(palette)} />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="views" fill="#F97316" name="Просмотры" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={3} name="Продажи" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category pie chart */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-400" />
                        Выручка по категориям
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPie>
                          <Pie
                            data={metrics.categoryStats.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="revenue"
                            nameKey="category"
                          >
                            {metrics.categoryStats.slice(0, 6).map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            {...TOOLTIP_STYLE}
                          />
                          <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top ads */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-400" />
                      ТОП-5 объявлений по выручке
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Самые прибыльные объявления
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.topAds.map((ad, idx) => (
                        <div 
                          key={ad.ad_id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: COLORS[idx] }}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{ad.title}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {formatNumber(ad.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {ad.calls}
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" /> {ad.sales}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatCurrency(ad.revenue)}</p>
                            <p className="text-gray-500 text-sm">{ad.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 backdrop-blur-xl border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-400" />
                      AI-рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics.romi > 500 && (
                      <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-green-300 font-medium">Отличный ROMI!</p>
                          <p className="text-gray-400 text-sm">
                            Ваше продвижение окупается в {(metrics.romi / 100).toFixed(0)}x раз. Рекомендуем увеличить бюджет на ТОП объявления.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                      <Lightbulb className="h-5 w-5 text-orange-400 mt-0.5" />
                      <div>
                        <p className="text-orange-300 font-medium">Повысьте конверсию</p>
                        <p className="text-gray-400 text-sm">
                          Конверсия {metrics.avgConversion.toFixed(2)}% — попробуйте обновить фото и описания объявлений с низкой конверсией.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Target className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-medium">Фокус на лучших категориях</p>
                        <p className="text-gray-400 text-sm">
                          Категория "{metrics.categoryStats[0]?.category}" приносит больше всего выручки. Добавьте больше товаров в этой категории.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ads Tab */}
            {activeTab === 'ads' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Все объявления</CardTitle>
                  <CardDescription className="text-gray-400">
                    {data.length} записей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Объявление</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Категория</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Просмотры</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Звонки</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Продажи</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Выручка</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 20).map((ad, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <p className="text-white font-medium truncate max-w-[200px]">{ad.title}</p>
                              <p className="text-gray-500 text-sm">{ad.date}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-sm">
                                {ad.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{formatNumber(ad.views)}</td>
                            <td className="py-3 px-4 text-center text-green-400">{ad.calls}</td>
                            <td className="py-3 px-4 text-center text-blue-400">{ad.sales}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(ad.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Conversion funnel */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-400" />
                      Воронка конверсии
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'Просмотры', value: metrics.totalViews, percent: 100, color: 'orange' },
                      { label: 'В избранное', value: data.reduce((s, a) => s + a.favorites, 0), percent: (data.reduce((s, a) => s + a.favorites, 0) / metrics.totalViews) * 100, color: 'pink' },
                      { label: 'Звонки + сообщения', value: metrics.totalCalls + metrics.totalMessages, percent: ((metrics.totalCalls + metrics.totalMessages) / metrics.totalViews) * 100, color: 'green' },
                      { label: 'Продажи', value: metrics.totalSales, percent: (metrics.totalSales / metrics.totalViews) * 100, color: 'blue' }
                    ].map((step, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">{step.label}</span>
                          <span className="text-white font-medium">{formatNumber(step.value)} ({step.percent.toFixed(1)}%)</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${step.color}-500 rounded-full transition-all duration-500`}
                            style={{ width: `${step.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Category performance */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      Эффективность категорий
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.categoryStats.slice(0, 6)} layout="vertical">
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis type="number" {...axisProps(palette)} />
                        <YAxis type="category" dataKey="category" {...axisProps(palette)} width={100} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          {...TOOLTIP_STYLE}
                        />
                        <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
                    <p className="text-gray-400 text-sm">Скачайте аналитику по объявлениям</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                      <Download className="mr-2 h-4 w-4" />
                      PDF отчёт
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
            <AnalyticsSection industry="avito" aiData={aiData} />
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
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-orange-400" />
                  Как использовать
                </CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">📤 Загрузка данных</h4>
                <p className="text-gray-400 text-sm">
                  Экспортируйте статистику из личного кабинета Авито в CSV формате и загрузите сюда.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">📊 Метрики</h4>
                <p className="text-gray-400 text-sm">
                  <strong>ROMI</strong> — окупаемость продвижения. Если &gt; 0%, продвижение прибыльно.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">💡 Рекомендации</h4>
                <p className="text-gray-400 text-sm">
                  AI анализирует ваши объявления и даёт советы по улучшению конверсии.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

