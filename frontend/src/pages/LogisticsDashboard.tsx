import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Truck, DollarSign, 
  BarChart3, ArrowLeft, Upload, RefreshCw, Lightbulb,
  HelpCircle, X, FileSpreadsheet, 
  PlayCircle, Sparkles, AlertTriangle, CheckCircle,
  Users, Route, Fuel, Timer, Star,
  PackageCheck, Navigation
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('logistics')

// ============================================
// 🚚 LOGISTICS DASHBOARD
// ============================================

interface Delivery {
  id: string
  date: string
  driver: string
  route: string
  distance_km: number
  duration_min: number
  fuel_cost: number
  delivery_cost: number
  packages: number
  status: 'delivered' | 'in_transit' | 'delayed' | 'failed'
  customer_rating: number
  vehicle: string
}

interface LogisticsMetrics {
  totalDeliveries: number
  successRate: number
  avgDeliveryTime: number
  totalDistance: number
  totalFuelCost: number
  totalRevenue: number
  avgRating: number
  onTimeRate: number
  driverStats: { name: string; deliveries: number; rating: number; onTime: number }[]
  routeStats: { route: string; deliveries: number; avgTime: number; revenue: number }[]
  statusDistribution: { name: string; value: number; color: string }[]
  dailyStats: { date: string; deliveries: number; revenue: number; distance: number }[]
  vehicleStats: { vehicle: string; trips: number; fuel: number; efficiency: number }[]
}


export default function LogisticsDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Delivery[] | null>(null)
  const [metrics, setMetrics] = useState<LogisticsMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'routes' | 'vehicles'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('logistics')

  const calculateMetrics = (deliveries: Delivery[]): LogisticsMetrics => {
    const totalDeliveries = deliveries.length
    const successfulDeliveries = deliveries.filter(d => d.status === 'delivered').length
    const successRate = (successfulDeliveries / totalDeliveries) * 100
    
    const avgDeliveryTime = deliveries.reduce((sum, d) => sum + d.duration_min, 0) / totalDeliveries
    const totalDistance = deliveries.reduce((sum, d) => sum + d.distance_km, 0)
    const totalFuelCost = deliveries.reduce((sum, d) => sum + d.fuel_cost, 0)
    const totalRevenue = deliveries.reduce((sum, d) => sum + d.delivery_cost, 0)
    const avgRating = deliveries.reduce((sum, d) => sum + d.customer_rating, 0) / totalDeliveries
    
    // On-time calculation (assuming < 60 min is on time)
    const onTimeDeliveries = deliveries.filter(d => d.duration_min <= 60 && d.status === 'delivered').length
    const onTimeRate = (onTimeDeliveries / successfulDeliveries) * 100

    // Driver stats
    const driverMap = new Map<string, { deliveries: number; totalRating: number; onTime: number }>()
    deliveries.forEach(d => {
      const existing = driverMap.get(d.driver) || { deliveries: 0, totalRating: 0, onTime: 0 }
      existing.deliveries++
      existing.totalRating += d.customer_rating
      if (d.duration_min <= 60 && d.status === 'delivered') existing.onTime++
      driverMap.set(d.driver, existing)
    })
    const driverStats = Array.from(driverMap.entries())
      .map(([name, stats]) => ({
        name,
        deliveries: stats.deliveries,
        rating: stats.totalRating / stats.deliveries,
        onTime: (stats.onTime / stats.deliveries) * 100
      }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 10)

    // Route stats
    const routeMap = new Map<string, { deliveries: number; totalTime: number; revenue: number }>()
    deliveries.forEach(d => {
      const existing = routeMap.get(d.route) || { deliveries: 0, totalTime: 0, revenue: 0 }
      existing.deliveries++
      existing.totalTime += d.duration_min
      existing.revenue += d.delivery_cost
      routeMap.set(d.route, existing)
    })
    const routeStats = Array.from(routeMap.entries())
      .map(([route, stats]) => ({
        route,
        deliveries: stats.deliveries,
        avgTime: stats.totalTime / stats.deliveries,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 8)

    // Status distribution
    const statusCounts = {
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      in_transit: deliveries.filter(d => d.status === 'in_transit').length,
      delayed: deliveries.filter(d => d.status === 'delayed').length,
      failed: deliveries.filter(d => d.status === 'failed').length
    }
    const statusDistribution = [
      { name: 'Доставлено', value: statusCounts.delivered, color: '#10B981' },
      { name: 'В пути', value: statusCounts.in_transit, color: '#3B82F6' },
      { name: 'Задержка', value: statusCounts.delayed, color: '#F59E0B' },
      { name: 'Не доставлено', value: statusCounts.failed, color: '#EF4444' }
    ]

    // Daily stats
    const dailyMap = new Map<string, { deliveries: number; revenue: number; distance: number }>()
    deliveries.forEach(d => {
      const existing = dailyMap.get(d.date) || { deliveries: 0, revenue: 0, distance: 0 }
      existing.deliveries++
      existing.revenue += d.delivery_cost
      existing.distance += d.distance_km
      dailyMap.set(d.date, existing)
    })
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)

    // Vehicle stats
    const vehicleMap = new Map<string, { trips: number; fuel: number; distance: number }>()
    deliveries.forEach(d => {
      const existing = vehicleMap.get(d.vehicle) || { trips: 0, fuel: 0, distance: 0 }
      existing.trips++
      existing.fuel += d.fuel_cost
      existing.distance += d.distance_km
      vehicleMap.set(d.vehicle, existing)
    })
    const vehicleStats = Array.from(vehicleMap.entries())
      .map(([vehicle, stats]) => ({
        vehicle,
        trips: stats.trips,
        fuel: stats.fuel,
        efficiency: stats.distance / stats.fuel // km per ruble
      }))
      .sort((a, b) => b.trips - a.trips)

    return {
      totalDeliveries,
      successRate,
      avgDeliveryTime,
      totalDistance,
      totalFuelCost,
      totalRevenue,
      avgRating,
      onTimeRate,
      driverStats,
      routeStats,
      statusDistribution,
      dailyStats,
      vehicleStats
    }
  }

  const loadDemoData = async () => {
    setIsLoading(true)
    try {
      // Generate demo data
      const drivers = ['Иванов А.', 'Петров С.', 'Сидоров В.', 'Козлов Д.', 'Николаев М.']
      const routes = ['Центр-Север', 'Центр-Юг', 'Запад-Восток', 'Пригород', 'Экспресс']
      const vehicles = ['Газель', 'Sprinter', 'Transit', 'Daily', 'Ducato']
      const statuses: Delivery['status'][] = ['delivered', 'delivered', 'delivered', 'delivered', 'in_transit', 'delayed', 'failed']
      
      const demoDeliveries: Delivery[] = []
      const today = new Date()
      
      for (let i = 0; i < 200; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        
        demoDeliveries.push({
          id: `DEL-${1000 + i}`,
          date: date.toISOString().split('T')[0],
          driver: drivers[Math.floor(Math.random() * drivers.length)],
          route: routes[Math.floor(Math.random() * routes.length)],
          distance_km: 5 + Math.floor(Math.random() * 45),
          duration_min: 20 + Math.floor(Math.random() * 80),
          fuel_cost: 100 + Math.floor(Math.random() * 400),
          delivery_cost: 300 + Math.floor(Math.random() * 700),
          packages: 1 + Math.floor(Math.random() * 5),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          customer_rating: 3 + Math.random() * 2,
          vehicle: vehicles[Math.floor(Math.random() * vehicles.length)]
        })
      }

      setData(demoDeliveries)
      setMetrics(calculateMetrics(demoDeliveries))
      toast.success('Демо-данные логистики загружены!')
    } catch (error) {
      toast.error('Ошибка загрузки данных')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      if (rows.length === 0) { toast.error('Файл пуст'); return }
      const h = getHeaders(rows)
      const idCol = findColumn(h, ['id', 'delivery_id', 'номер', 'заказ'])
      const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
      const driverCol = findColumn(h, ['driver', 'водитель', 'курьер', 'haydovchi'])
      const routeCol = findColumn(h, ['route', 'маршрут', 'направление'])
      const distCol = findColumn(h, ['distance', 'distance_km', 'расстояние', 'км'])
      const durCol = findColumn(h, ['duration', 'duration_min', 'время', 'длительность'])
      const fuelCol = findColumn(h, ['fuel_cost', 'fuel', 'топливо', 'бензин'])
      const costCol = findColumn(h, ['delivery_cost', 'cost', 'стоимость', 'цена', 'сумма', 'narx'])
      const pkgCol = findColumn(h, ['packages', 'посылки', 'грузы', 'количество'])
      const statusCol = findColumn(h, ['status', 'статус', 'state'])
      const ratingCol = findColumn(h, ['rating', 'customer_rating', 'рейтинг', 'оценка'])
      const vehicleCol = findColumn(h, ['vehicle', 'авто', 'транспорт', 'машина'])

      const deliveries: Delivery[] = rows.map((row, i) => ({
        id: getStr(row, idCol, `DEL-${i + 1}`),
        date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
        driver: getStr(row, driverCol, 'Водитель'),
        route: getStr(row, routeCol, 'Маршрут'),
        distance_km: getNum(row, distCol),
        duration_min: getNum(row, durCol),
        fuel_cost: getNum(row, fuelCol),
        delivery_cost: getNum(row, costCol),
        packages: getNum(row, pkgCol, 1),
        status: (getStr(row, statusCol, 'delivered') as Delivery['status']),
        customer_rating: getNum(row, ratingCol, 5),
        vehicle: getStr(row, vehicleCol, 'Авто'),
      }))

      setData(deliveries)
      setMetrics(calculateMetrics(deliveries))
      toast.success(`Загружено ${deliveries.length} доставок`)
      uploadForAI(file)
    } catch (error) {
      toast.error('Ошибка обработки файла')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(value))
  }

  // AI Insights
  const getAIInsights = () => {
    if (!metrics) return []
    
    const insights = []
    
    if (metrics.successRate >= 95) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Отличная доставляемость!',
        message: `${metrics.successRate.toFixed(1)}% доставок успешны. Ваша логистика работает на высшем уровне.`
      })
    } else if (metrics.successRate < 90) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Проблемы с доставкой',
        message: `Только ${metrics.successRate.toFixed(1)}% успешных доставок. Проанализируйте причины сбоев.`
      })
    }

    if (metrics.onTimeRate >= 90) {
      insights.push({
        type: 'success',
        icon: Timer,
        title: 'Пунктуальность на высоте',
        message: `${metrics.onTimeRate.toFixed(1)}% доставок вовремя. Клиенты довольны!`
      })
    }

    if (metrics.avgRating >= 4.5) {
      insights.push({
        type: 'success',
        icon: Star,
        title: 'Высокий рейтинг',
        message: `Средняя оценка ${metrics.avgRating.toFixed(1)} ⭐ — клиенты ценят ваш сервис.`
      })
    }

    // Best driver
    if (metrics.driverStats.length > 0) {
      const bestDriver = metrics.driverStats.reduce((best, d) => d.rating > best.rating ? d : best)
      insights.push({
        type: 'info',
        icon: Users,
        title: 'Лучший водитель',
        message: `${bestDriver.name} — рейтинг ${bestDriver.rating.toFixed(1)} ⭐, ${bestDriver.deliveries} доставок.`
      })
    }

    // Fuel efficiency
    if (metrics.vehicleStats.length > 0) {
      const mostEfficient = metrics.vehicleStats.reduce((best, v) => v.efficiency > best.efficiency ? v : best)
      insights.push({
        type: 'info',
        icon: Fuel,
        title: 'Самый экономичный транспорт',
        message: `${mostEfficient.vehicle} — ${mostEfficient.efficiency.toFixed(2)} км/₽ топлива.`
      })
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
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Логистика</h1>
                  <p className="text-xs text-gray-400">Доставки и маршруты</p>
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
                  Сбросить
                </Button>
              )}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {!data ? (
          /* Upload Section */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl w-fit mb-4">
                  <Truck className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Аналитика логистики</CardTitle>
                <CardDescription className="text-gray-400">
                  Загрузите данные о доставках или используйте демо-данные
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button
                  onClick={loadDemoData}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-6"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  {isLoading ? 'Загрузка...' : 'Загрузить демо-данные'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">или</span>
                  </div>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full border-white/20 text-white hover:bg-white/10 py-6"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Загрузить свой CSV файл
                </Button>

                <div className="mt-6 p-4 bg-white/5 rounded-xl">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Формат CSV файла:
                  </h4>
                  <code className="text-xs text-gray-400 block">
                    id, date, driver, route, distance_km, duration_min, fuel_cost, delivery_cost, packages, status, rating, vehicle
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'drivers', label: 'Водители', icon: Users },
                { id: 'routes', label: 'Маршруты', icon: Route },
                { id: 'vehicles', label: 'Транспорт', icon: Truck }
              ].map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  className={activeTab === tab.id 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <PackageCheck className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Доставлено</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalDeliveries)}</p>
                          <p className="text-xs text-green-400">{metrics.successRate.toFixed(1)}% успех</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Timer className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Среднее время</p>
                          <p className="text-2xl font-bold text-white">{metrics.avgDeliveryTime.toFixed(0)} мин</p>
                          <p className="text-xs text-blue-400">{metrics.onTimeRate.toFixed(1)}% вовремя</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Navigation className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Пройдено км</p>
                          <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalDistance)}</p>
                          <p className="text-xs text-purple-400">всего</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <DollarSign className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Выручка</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
                          <p className="text-xs text-amber-400">топливо: {formatCurrency(metrics.totalFuelCost)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orange-400" />
                      AI-Аналитика логистики
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {getAIInsights().map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl ${
                          insight.type === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                          insight.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                          'bg-blue-500/10 border border-blue-500/30'
                        }`}>
                          <div className="flex items-start gap-3">
                            <insight.icon className={`h-5 w-5 mt-0.5 ${
                              insight.type === 'success' ? 'text-green-400' :
                              insight.type === 'warning' ? 'text-amber-400' :
                              'text-blue-400'
                            }`} />
                            <div>
                              <h4 className="font-medium text-white">{insight.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">{insight.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Статусы доставок</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={metrics.statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {metrics.statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daily Stats */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Динамика доставок</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.dailyStats}>
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis dataKey="date" {...axisProps(palette)} />
                            <YAxis {...axisProps(palette)} />
                            <Tooltip 
                              {...TOOLTIP_STYLE}
                              labelStyle={{ color: '#F3F4F6' }}
                            />
                            <Area type="monotone" dataKey="deliveries" stroke="#F97316" fill="#F97316" fillOpacity={0.3} name="Доставки" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && metrics && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-400" />
                    Рейтинг водителей
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.driverStats.map((driver, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                            idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                            idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' :
                            'bg-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{driver.name}</p>
                            <p className="text-sm text-gray-400">{driver.deliveries} доставок</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Рейтинг</p>
                            <p className="font-bold text-amber-400 flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {driver.rating.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Вовремя</p>
                            <p className={`font-bold ${driver.onTime >= 90 ? 'text-green-400' : driver.onTime >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                              {driver.onTime.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Routes Tab */}
            {activeTab === 'routes' && metrics && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Route className="h-5 w-5 text-blue-400" />
                    Эффективность маршрутов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={metrics.routeStats} layout="vertical">
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis type="number" {...axisProps(palette)} />
                        <YAxis dataKey="route" type="category" {...axisProps(palette)} width={100} />
                        <Tooltip 
                          {...TOOLTIP_STYLE}
                          formatter={(value: any, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : value,
                            name === 'revenue' ? 'Выручка' : name === 'deliveries' ? 'Доставки' : 'Ср. время'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="deliveries" fill="#3B82F6" name="Доставки" />
                        <Line type="monotone" dataKey="avgTime" stroke="#F97316" strokeWidth={2} name="Ср. время (мин)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && metrics && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-400" />
                    Статистика транспорта
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {metrics.vehicleStats.map((vehicle, idx) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Truck className="h-5 w-5 text-purple-400" />
                          </div>
                          <h4 className="font-bold text-white">{vehicle.vehicle}</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Рейсов:</span>
                            <span className="text-white font-medium">{vehicle.trips}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Топливо:</span>
                            <span className="text-white font-medium">{formatCurrency(vehicle.fuel)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Эффективность:</span>
                            <span className={`font-medium ${vehicle.efficiency >= 0.1 ? 'text-green-400' : 'text-amber-400'}`}>
                              {vehicle.efficiency.toFixed(2)} км/₽
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analytics Section */}
            <AnalyticsSection industry="logistics" aiData={aiData} />
          </div>
        )}
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <Card className="w-full max-w-lg bg-gray-900 border-white/20" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  Как использовать
                </CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-1">📊 Обзор</h4>
                <p className="text-sm">Ключевые метрики: доставляемость, время, выручка, расходы на топливо.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">👥 Водители</h4>
                <p className="text-sm">Рейтинг водителей по доставкам, оценкам клиентов и пунктуальности.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">🛤️ Маршруты</h4>
                <p className="text-sm">Анализ эффективности маршрутов: время, выручка, количество доставок.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">🚚 Транспорт</h4>
                <p className="text-sm">Статистика по автомобилям: рейсы, расход топлива, эффективность.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

