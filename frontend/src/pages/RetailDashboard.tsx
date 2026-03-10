import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Store, ShoppingCart, Receipt, DollarSign,
  BarChart3, ArrowLeft, Upload, RefreshCw, Lightbulb,
  HelpCircle, X,
  PlayCircle, Sparkles,
  Users, Clock, Package,
  Star, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('retail')

// ============================================
// 🏪 RETAIL DASHBOARD - Offline Stores
// ============================================

interface Transaction {
  id: string
  date: string
  time: string
  store: string
  cashier: string
  items: number
  amount: number
  payment_method: 'cash' | 'card' | 'qr'
  customer_type: 'new' | 'returning'
}

interface RetailMetrics {
  totalRevenue: number
  totalTransactions: number
  avgCheck: number
  itemsPerCheck: number
  conversionRate: number
  returningRate: number
  revenueByStore: { store: string; revenue: number; transactions: number }[]
  revenueByHour: { hour: string; revenue: number; transactions: number }[]
  paymentMethods: { name: string; value: number; color: string }[]
  topCashiers: { name: string; revenue: number; transactions: number; avgCheck: number }[]
  dailyStats: { date: string; revenue: number; transactions: number; avgCheck: number }[]
  weekdayStats: { day: string; revenue: number; transactions: number }[]
}


export default function RetailDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Transaction[] | null>(null)
  const [metrics, setMetrics] = useState<RetailMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'cashiers' | 'time'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('retail')

  const calculateMetrics = (transactions: Transaction[]): RetailMetrics => {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalTransactions = transactions.length
    const avgCheck = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const totalItems = transactions.reduce((sum, t) => sum + t.items, 0)
    const itemsPerCheck = totalTransactions > 0 ? totalItems / totalTransactions : 0
    
    const returningCustomers = transactions.filter(t => t.customer_type === 'returning').length
    const returningRate = totalTransactions > 0 ? (returningCustomers / totalTransactions) * 100 : 0
    const conversionRate = 65 + Math.random() * 20 // Simulated

    // Revenue by store
    const storeMap = new Map<string, { revenue: number; transactions: number }>()
    transactions.forEach(t => {
      const existing = storeMap.get(t.store) || { revenue: 0, transactions: 0 }
      existing.revenue += t.amount
      existing.transactions++
      storeMap.set(t.store, existing)
    })
    const revenueByStore = Array.from(storeMap.entries())
      .map(([store, data]) => ({ store, ...data }))
      .sort((a, b) => b.revenue - a.revenue)

    // Revenue by hour
    const hourMap = new Map<string, { revenue: number; transactions: number }>()
    transactions.forEach(t => {
      const hour = t.time.substring(0, 2) + ':00'
      const existing = hourMap.get(hour) || { revenue: 0, transactions: 0 }
      existing.revenue += t.amount
      existing.transactions++
      hourMap.set(hour, existing)
    })
    const revenueByHour = Array.from(hourMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .sort((a, b) => a.hour.localeCompare(b.hour))

    // Payment methods
    const paymentMap = { cash: 0, card: 0, qr: 0 }
    transactions.forEach(t => paymentMap[t.payment_method]++)
    const paymentMethods = [
      { name: 'Наличные', value: paymentMap.cash, color: '#10B981' },
      { name: 'Карта', value: paymentMap.card, color: '#3B82F6' },
      { name: 'QR-код', value: paymentMap.qr, color: '#8B5CF6' }
    ]

    // Top cashiers
    const cashierMap = new Map<string, { revenue: number; transactions: number }>()
    transactions.forEach(t => {
      const existing = cashierMap.get(t.cashier) || { revenue: 0, transactions: 0 }
      existing.revenue += t.amount
      existing.transactions++
      cashierMap.set(t.cashier, existing)
    })
    const topCashiers = Array.from(cashierMap.entries())
      .map(([name, data]) => ({ name, ...data, avgCheck: data.revenue / data.transactions }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Daily stats
    const dailyMap = new Map<string, { revenue: number; transactions: number }>()
    transactions.forEach(t => {
      const existing = dailyMap.get(t.date) || { revenue: 0, transactions: 0 }
      existing.revenue += t.amount
      existing.transactions++
      dailyMap.set(t.date, existing)
    })
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data, avgCheck: data.revenue / data.transactions }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)

    // Weekday stats
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const weekdayMap = new Map<number, { revenue: number; transactions: number }>()
    transactions.forEach(t => {
      const day = new Date(t.date).getDay()
      const existing = weekdayMap.get(day) || { revenue: 0, transactions: 0 }
      existing.revenue += t.amount
      existing.transactions++
      weekdayMap.set(day, existing)
    })
    const weekdayStats = Array.from(weekdayMap.entries())
      .map(([day, data]) => ({ day: weekdays[day], ...data }))
      .sort((a, b) => weekdays.indexOf(a.day) - weekdays.indexOf(b.day))

    return {
      totalRevenue,
      totalTransactions,
      avgCheck,
      itemsPerCheck,
      conversionRate,
      returningRate,
      revenueByStore,
      revenueByHour,
      paymentMethods,
      topCashiers,
      dailyStats,
      weekdayStats
    }
  }

  const rowsToTransactions = (rows: Record<string, string>[]): Transaction[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const idCol = findColumn(h, ['id', 'transaction_id', 'заказ', 'номер', 'чек'])
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
    const timeCol = findColumn(h, ['time', 'время', 'час', 'vaqt'])
    const storeCol = findColumn(h, ['store', 'магазин', 'точка', 'склад', 'dokon'])
    const cashierCol = findColumn(h, ['cashier', 'кассир', 'продавец', 'staff', 'kassir', 'sotuvchi'])
    const itemsCol = findColumn(h, ['items', 'товары', 'количество', 'qty', 'quantity', 'miqdor'])
    const amountCol = findColumn(h, ['amount', 'сумма', 'цена', 'price', 'total', 'итого', 'summa', 'narx'])
    const paymentCol = findColumn(h, ['payment_method', 'payment', 'оплата', 'способ', 'тип оплаты'])
    const customerCol = findColumn(h, ['customer_type', 'customer', 'клиент', 'тип_клиента'])

    return rows.map((row, i) => {
      const pv = getStr(row, paymentCol, 'card').toLowerCase()
      const pm: Transaction['payment_method'] = pv.includes('cash') || pv.includes('налич') ? 'cash' : pv.includes('qr') ? 'qr' : 'card'
      const cv = getStr(row, customerCol, 'new').toLowerCase()
      const ct: Transaction['customer_type'] = cv.includes('return') || cv.includes('постоян') ? 'returning' : 'new'
      return {
        id: getStr(row, idCol, `TXN-${i + 1}`),
        date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
        time: getStr(row, timeCol, '12:00'),
        store: getStr(row, storeCol, 'Магазин'),
        cashier: getStr(row, cashierCol, 'Кассир'),
        items: getNum(row, itemsCol, 1),
        amount: getNum(row, amountCol),
        payment_method: pm,
        customer_type: ct,
      }
    })
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const transactions = rowsToTransactions(rows)
      if (transactions.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(transactions)
      setMetrics(calculateMetrics(transactions))
      toast.success(`🏪 Загружено ${transactions.length} транзакций из ${file.name}`)
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
      const stores = ['ТЦ Мега', 'ТЦ Европейский', 'Центральный', 'Южный', 'Северный']
      const cashiers = ['Анна К.', 'Мария С.', 'Елена П.', 'Ольга В.', 'Наталья М.', 'Светлана Д.']
      const paymentMethods: Transaction['payment_method'][] = ['card', 'card', 'card', 'cash', 'qr']
      const customerTypes: Transaction['customer_type'][] = ['returning', 'returning', 'new']
      
      const demoTransactions: Transaction[] = []
      const today = new Date()
      
      for (let i = 0; i < 500; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        const hour = 9 + Math.floor(Math.random() * 12)
        const minute = Math.floor(Math.random() * 60)
        
        demoTransactions.push({
          id: `TXN-${10000 + i}`,
          date: date.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          store: stores[Math.floor(Math.random() * stores.length)],
          cashier: cashiers[Math.floor(Math.random() * cashiers.length)],
          items: 1 + Math.floor(Math.random() * 8),
          amount: 500 + Math.floor(Math.random() * 9500),
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          customer_type: customerTypes[Math.floor(Math.random() * customerTypes.length)]
        })
      }

      setData(demoTransactions)
      setMetrics(calculateMetrics(demoTransactions))
      toast.success('Данные розницы загружены!')
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }

  const getAIInsights = () => {
    if (!metrics) return []
    const insights = []

    if (metrics.avgCheck > 3000) {
      insights.push({ type: 'success', icon: ShoppingCart, title: 'Высокий средний чек!', message: `${formatCurrency(metrics.avgCheck)} — выше среднего по рынку.` })
    }

    if (metrics.returningRate > 50) {
      insights.push({ type: 'success', icon: Users, title: 'Лояльные клиенты', message: `${metrics.returningRate.toFixed(0)}% покупателей возвращаются.` })
    }

    if (metrics.revenueByHour.length > 0) {
      const peakHour = metrics.revenueByHour.reduce((max, h) => h.revenue > max.revenue ? h : max)
      insights.push({ type: 'info', icon: Clock, title: 'Час пик', message: `Максимум продаж в ${peakHour.hour} — ${formatCurrency(peakHour.revenue)}.` })
    }

    if (metrics.topCashiers.length > 0) {
      insights.push({ type: 'info', icon: Star, title: 'Лучший кассир', message: `${metrics.topCashiers[0].name} — ${formatCurrency(metrics.topCashiers[0].revenue)} выручки.` })
    }

    if (metrics.revenueByStore.length > 0) {
      insights.push({ type: 'info', icon: Store, title: 'Топ магазин', message: `${metrics.revenueByStore[0].store} — ${formatCurrency(metrics.revenueByStore[0].revenue)}.` })
    }

    return insights
  }

  return (
    <div className="min-h-screen" style={{ background: palette.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/industries')} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Розница</h1>
                  <p className="text-xs text-gray-400">Офлайн магазины</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data && (
                <Button onClick={() => { setData(null); setMetrics(null) }} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <RefreshCw className="h-4 w-4 mr-2" />Сбросить
                </Button>
              )}
              <button onClick={() => setShowHelp(!showHelp)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {!data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl w-fit mb-4">
                  <Store className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Аналитика розницы</CardTitle>
                <CardDescription className="text-gray-400">Кассовые данные, средний чек, конверсия</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".csv,.xlsx" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
                <Button onClick={loadDemoData} disabled={isLoading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-6">
                  <PlayCircle className="h-5 w-5 mr-2" />{isLoading ? 'Загрузка...' : 'Загрузить демо-данные'}
                </Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-400">или</span></div></div>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading} className="w-full border-white/20 text-white hover:bg-white/10 py-6">
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Загрузить CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : metrics && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'stores', label: 'Магазины', icon: MapPin },
                { id: 'cashiers', label: 'Кассиры', icon: Users },
                { id: 'time', label: 'По времени', icon: Clock }
              ].map(tab => (
                <Button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  className={activeTab === tab.id ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}>
                  <tab.icon className="h-4 w-4 mr-2" />{tab.label}
                </Button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg"><DollarSign className="h-5 w-5 text-green-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Выручка</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Receipt className="h-5 w-5 text-blue-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Чеков</p>
                          <p className="text-xl font-bold text-white">{metrics.totalTransactions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg"><ShoppingCart className="h-5 w-5 text-purple-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Средний чек</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(metrics.avgCheck)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg"><Package className="h-5 w-5 text-amber-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Товаров/чек</p>
                          <p className="text-xl font-bold text-white">{metrics.itemsPerCheck.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-400" />AI-Аналитика розницы</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {getAIInsights().map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl ${insight.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                          <div className="flex items-start gap-3">
                            <insight.icon className={`h-5 w-5 mt-0.5 ${insight.type === 'success' ? 'text-green-400' : 'text-blue-400'}`} />
                            <div><h4 className="font-medium text-white">{insight.title}</h4><p className="text-sm text-gray-400 mt-1">{insight.message}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader><CardTitle className="text-white">Способы оплаты</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie data={metrics.paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {metrics.paymentMethods.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader><CardTitle className="text-white">Динамика продаж</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.dailyStats}>
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis dataKey="date" {...axisProps(palette)} />
                            <YAxis {...axisProps(palette)} />
                            <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value)} />
                            <Area type="monotone" dataKey="revenue" stroke="#F97316" fill="#F97316" fillOpacity={0.3} name="Выручка" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'stores' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-400" />Выручка по магазинам</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.revenueByStore}>
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis dataKey="store" {...axisProps(palette)} />
                        <YAxis {...axisProps(palette)} />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#F97316" name="Выручка" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'cashiers' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Star className="h-5 w-5 text-amber-400" />Рейтинг кассиров</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topCashiers.map((cashier, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' : 'bg-gray-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{cashier.name}</p>
                            <p className="text-sm text-gray-400">{cashier.transactions} чеков</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Выручка</p>
                            <p className="font-bold text-green-400">{formatCurrency(cashier.revenue)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Ср. чек</p>
                            <p className="font-bold text-blue-400">{formatCurrency(cashier.avgCheck)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'time' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Продажи по часам</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={metrics.revenueByHour}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="hour" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Legend />
                          <Bar dataKey="transactions" fill="#3B82F6" name="Чеков" />
                          <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} name="Выручка" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">По дням недели</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.weekdayStats}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="day" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} />
                          <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="revenue" fill="#10B981" name="Выручка" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Analytics Section */}
            <AnalyticsSection industry="retail" aiData={aiData} />
          </div>
        )}
      </main>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <Card className="w-full max-w-lg bg-gray-900 border-white/20" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-400" />Как использовать</CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div><h4 className="font-medium text-white mb-1">📊 Обзор</h4><p className="text-sm">Выручка, чеки, средний чек, товаров в чеке.</p></div>
              <div><h4 className="font-medium text-white mb-1">📍 Магазины</h4><p className="text-sm">Сравнение выручки по точкам продаж.</p></div>
              <div><h4 className="font-medium text-white mb-1">👥 Кассиры</h4><p className="text-sm">Рейтинг продавцов по выручке и среднему чеку.</p></div>
              <div><h4 className="font-medium text-white mb-1">⏰ По времени</h4><p className="text-sm">Анализ продаж по часам и дням недели.</p></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

