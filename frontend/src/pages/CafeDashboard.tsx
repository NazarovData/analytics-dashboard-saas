import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Coffee, UtensilsCrossed, Clock, Users, DollarSign, PieChart,
  BarChart3, ArrowLeft, Upload, 
  Download, RefreshCw, AlertTriangle, Lightbulb,
  FileSpreadsheet, 
  PlayCircle, Sparkles, Flame, Percent, Award, ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('cafe')

// ============================================
// ☕ CAFE/RESTAURANT DASHBOARD
// ============================================

interface CafeOrder {
  date: string
  time: string
  order_id: string
  item: string
  category: string
  quantity: number
  price: number
  cost: number
  table_number: number
  waiter: string
  payment_method: string
}

interface CafeMetrics {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgCheck: number
  totalCost: number
  grossMargin: number
  topItems: { item: string; quantity: number; revenue: number; margin: number }[]
  categoryStats: { category: string; revenue: number; quantity: number; margin: number }[]
  hourlyStats: { hour: string; orders: number; revenue: number }[]
  waiterStats: { waiter: string; orders: number; revenue: number }[]
  dailyStats: { date: string; revenue: number; orders: number; avgCheck: number }[]
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#EF4444']

export default function CafeDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<CafeOrder[] | null>(null)
  const [metrics, setMetrics] = useState<CafeMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'staff'>('overview')
  const [_showHelp, _setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('cafe')

  const calculateMetrics = (orders: CafeOrder[]): CafeMetrics => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)
    const totalCost = orders.reduce((sum, o) => sum + (o.cost * o.quantity), 0)
    const totalItems = orders.reduce((sum, o) => sum + o.quantity, 0)
    const uniqueOrders = new Set(orders.map(o => o.order_id)).size
    const avgCheck = totalRevenue / uniqueOrders
    const grossMargin = ((totalRevenue - totalCost) / totalRevenue) * 100

    // Top items
    const itemMap = new Map<string, { quantity: number; revenue: number; cost: number }>()
    orders.forEach(o => {
      const existing = itemMap.get(o.item) || { quantity: 0, revenue: 0, cost: 0 }
      itemMap.set(o.item, {
        quantity: existing.quantity + o.quantity,
        revenue: existing.revenue + (o.price * o.quantity),
        cost: existing.cost + (o.cost * o.quantity)
      })
    })
    const topItems = Array.from(itemMap.entries())
      .map(([item, stats]) => ({
        item,
        quantity: stats.quantity,
        revenue: stats.revenue,
        margin: ((stats.revenue - stats.cost) / stats.revenue) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Category stats
    const categoryMap = new Map<string, { revenue: number; quantity: number; cost: number }>()
    orders.forEach(o => {
      const existing = categoryMap.get(o.category) || { revenue: 0, quantity: 0, cost: 0 }
      categoryMap.set(o.category, {
        revenue: existing.revenue + (o.price * o.quantity),
        quantity: existing.quantity + o.quantity,
        cost: existing.cost + (o.cost * o.quantity)
      })
    })
    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        revenue: stats.revenue,
        quantity: stats.quantity,
        margin: ((stats.revenue - stats.cost) / stats.revenue) * 100
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Hourly stats
    const hourMap = new Map<string, { orders: Set<string>; revenue: number }>()
    orders.forEach(o => {
      const hour = o.time.split(':')[0] + ':00'
      const existing = hourMap.get(hour) || { orders: new Set(), revenue: 0 }
      existing.orders.add(o.order_id)
      existing.revenue += o.price * o.quantity
      hourMap.set(hour, existing)
    })
    const hourlyStats = Array.from(hourMap.entries())
      .map(([hour, stats]) => ({
        hour,
        orders: stats.orders.size,
        revenue: stats.revenue
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    // Waiter stats
    const waiterMap = new Map<string, { orders: Set<string>; revenue: number }>()
    orders.forEach(o => {
      const existing = waiterMap.get(o.waiter) || { orders: new Set(), revenue: 0 }
      existing.orders.add(o.order_id)
      existing.revenue += o.price * o.quantity
      waiterMap.set(o.waiter, existing)
    })
    const waiterStats = Array.from(waiterMap.entries())
      .map(([waiter, stats]) => ({
        waiter,
        orders: stats.orders.size,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)

    // Daily stats
    const dailyMap = new Map<string, { orders: Set<string>; revenue: number }>()
    orders.forEach(o => {
      const existing = dailyMap.get(o.date) || { orders: new Set(), revenue: 0 }
      existing.orders.add(o.order_id)
      existing.revenue += o.price * o.quantity
      dailyMap.set(o.date, existing)
    })
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        orders: stats.orders.size,
        revenue: stats.revenue,
        avgCheck: stats.revenue / stats.orders.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalRevenue,
      totalOrders: uniqueOrders,
      totalItems,
      avgCheck,
      totalCost,
      grossMargin,
      topItems,
      categoryStats,
      hourlyStats,
      waiterStats,
      dailyStats
    }
  }

  // Convert universal parsed rows to CafeOrder[]
  const rowsToOrders = (rows: Record<string, string>[]): CafeOrder[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'дата продажи', 'sana'])
    const timeCol = findColumn(h, ['time', 'время', 'час', 'vaqt'])
    const orderIdCol = findColumn(h, ['order_id', 'order', 'заказ', 'id', 'номер'])
    const itemCol = findColumn(h, ['item', 'товар', 'блюдо', 'product', 'name', 'название', 'dish', 'позиция', 'mahsulot', 'nomi'])
    const categoryCol = findColumn(h, ['category', 'категория', 'cat', 'тип', 'группа'])
    const quantityCol = findColumn(h, ['quantity', 'количество', 'qty', 'кол-во', 'кол', 'miqdor', 'dona', 'soni'])
    const priceCol = findColumn(h, ['price', 'цена', 'стоимость', 'narx', 'bahosi', 'нарх'])
    const costCol = findColumn(h, ['cost', 'себестоимость', 'закупка', 'food_cost', 'фудкост'])
    const tableCol = findColumn(h, ['table_number', 'table', 'стол', 'номер_стола'])
    const waiterCol = findColumn(h, ['waiter', 'официант', 'staff', 'персонал', 'сотрудник'])
    const paymentCol = findColumn(h, ['payment_method', 'payment', 'оплата', 'способ', 'тип оплаты'])
    const totalCol = findColumn(h, ['total', 'сумма', 'итого', 'summa', 'jami'])

    return rows.map((row, i) => {
      const price = getNum(row, priceCol)
      const qty = getNum(row, quantityCol, 1)
      const total = getNum(row, totalCol)
      const effectivePrice = price || (total && qty ? Math.round(total / qty) : 0)

      return {
        date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
        time: getStr(row, timeCol, '12:00'),
        order_id: getStr(row, orderIdCol, `ORDER${i + 1}`),
        item: getStr(row, itemCol, 'Блюдо'),
        category: getStr(row, categoryCol, 'Другое'),
        quantity: qty,
        price: effectivePrice,
        cost: getNum(row, costCol),
        table_number: getNum(row, tableCol, 1),
        waiter: getStr(row, waiterCol, 'Официант'),
        payment_method: getStr(row, paymentCol, 'Наличные'),
      }
    })
  }

  // Handle file upload (Excel + CSV)
  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const orders = rowsToOrders(rows)
      if (orders.length === 0) {
        toast.error('Файл пуст или неверный формат')
        return
      }
      setData(orders)
      setMetrics(calculateMetrics(orders))
      toast.success(`☕ Загружено ${orders.length} записей из ${file.name}`)
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
      const response = await fetch('/demo_data/cafe_sales.csv')
      const blob = await response.blob()
      const demoFile = new File([blob], 'cafe_sales.csv', { type: 'text/csv' })
      const rows = await readFileUniversal(demoFile)
      const orders = rowsToOrders(rows)
      setData(orders)
      setMetrics(calculateMetrics(orders))
      toast.success('☕ Демо-данные кафе загружены!')
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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl" />
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
                <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl shadow-lg shadow-amber-500/20">
                  <Coffee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Кафе & Ресторан
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full">
                      HoReCa
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Меню, заказы, фудкост</p>
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
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {!data && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Hero */}
            <Card className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-orange-500/20 backdrop-blur-xl border-amber-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <UtensilsCrossed className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Аналитика для общепита ☕🍽️
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Загрузите данные о продажах — узнайте какие блюда приносят больше прибыли
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-sm">
                        <Flame className="h-4 w-4" />
                        Фудкост
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm">
                        <Percent className="h-4 w-4" />
                        Маржинальность
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                        <Clock className="h-4 w-4" />
                        Часы пик
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-2 border-dashed border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/30">
                  <Upload className={`h-10 w-10 text-white ${isLoading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Загрузите данные о продажах
                </h3>
                <p className="text-gray-400 mb-8">
                  Экспортируйте из кассы или R-Keeper
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
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold px-8"
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
          </div>
        )}

        {data && metrics && (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6 animate-fade-in-up">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'menu', label: 'Меню', icon: UtensilsCrossed },
                { id: 'staff', label: 'Персонал', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
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
                  <Card className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border-amber-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                          <DollarSign className="h-6 w-6 text-amber-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Выручка</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-blue-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <ShoppingBag className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Заказов</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalOrders}</p>
                      <p className="text-blue-400 text-sm mt-2">{metrics.totalItems} позиций</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-purple-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                          <Award className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Средний чек</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(metrics.avgCheck)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-green-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-500/20">
                          <Percent className="h-6 w-6 text-green-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Маржа</p>
                      <p className="text-3xl font-bold text-white">{metrics.grossMargin.toFixed(1)}%</p>
                      <p className="text-green-400 text-sm mt-2">
                        Прибыль: {formatCurrency(metrics.totalRevenue - metrics.totalCost)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Hourly stats */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-400" />
                        Загрузка по часам
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.hourlyStats}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="hour" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Bar dataKey="orders" fill="#F59E0B" name="Заказы" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category pie */}
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
                            data={metrics.categoryStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="revenue"
                            nameKey="category"
                          >
                            {metrics.categoryStats.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} {...TOOLTIP_STYLE} />
                          <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top items */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-400" />
                      ТОП-10 позиций меню
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {metrics.topItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          >
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{item.item}</p>
                            <p className="text-gray-500 text-sm">{item.quantity} шт</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatCurrency(item.revenue)}</p>
                            <p className={`text-sm ${item.margin > 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                              Маржа {item.margin.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-xl border-amber-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      AI-рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics.grossMargin < 60 && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-300 font-medium">Низкая маржинальность</p>
                          <p className="text-gray-400 text-sm">
                            Маржа {metrics.grossMargin.toFixed(1)}% ниже нормы (60-70%). Пересмотрите цены или поставщиков.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <Lightbulb className="h-5 w-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-green-300 font-medium">Лучшая категория</p>
                        <p className="text-gray-400 text-sm">
                          "{metrics.categoryStats[0]?.category}" приносит больше всего выручки. Расширьте ассортимент!
                        </p>
                      </div>
                    </div>

                    {metrics.hourlyStats.length > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-blue-300 font-medium">Часы пик</p>
                          <p className="text-gray-400 text-sm">
                            Больше всего заказов в {metrics.hourlyStats.reduce((max, h) => h.orders > max.orders ? h : max).hour}. Убедитесь что персонала достаточно!
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'menu' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Анализ меню</CardTitle>
                  <CardDescription className="text-gray-400">
                    Все позиции с маржинальностью
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Позиция</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Продано</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Выручка</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Маржа</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.topItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4 text-white font-medium">{item.item}</td>
                            <td className="py-3 px-4 text-center text-gray-300">{item.quantity} шт</td>
                            <td className="py-3 px-4 text-center text-white">{formatCurrency(item.revenue)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                                item.margin > 70 ? 'bg-green-500/20 text-green-400' :
                                item.margin > 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {item.margin.toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'staff' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    Эффективность персонала
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.waiterStats.map((waiter, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        >
                          {waiter.waiter.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{waiter.waiter}</p>
                          <p className="text-gray-500 text-sm">{waiter.orders} заказов</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-xl">{formatCurrency(waiter.revenue)}</p>
                          <p className="text-gray-500 text-sm">
                            Ср. чек: {formatCurrency(waiter.revenue / waiter.orders)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analytics Section */}
            <AnalyticsSection industry="cafe" aiData={aiData} />

            {/* Export */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Экспорт отчёта</h3>
                    <p className="text-gray-400 text-sm">Скачайте аналитику</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
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
          </div>
          </main>
        )}
      </main>
    </div>
  )
}

