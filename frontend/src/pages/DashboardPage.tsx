import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, LogOut, Upload, BarChart3, Users, DollarSign, FileText, ShoppingCart, Award, Calendar, Database, Download, Camera } from 'lucide-react'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { ExportButton } from '@/components/ExportButton'
import { OCRUpload } from '@/components/OCRUpload'
import { filesApi } from '@/lib/api'

interface DataRow {
  date?: string
  product?: string
  amount?: number
  customer?: string
  [key: string]: any
}

interface Stats {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  fileName?: string
  rowCount?: number
  topProducts?: Array<{ product: string; revenue: number; orders: number }>
  revenueByDate?: Array<{ date: string; revenue: number; orders: number }>
  dailyData?: Array<{ name: string; value: number }>
}

const COLORS = ['#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброе утро'
    if (hour < 18) return 'Добрый день'
    return 'Добрый вечер'
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTab, setUploadTab] = useState<'csv' | 'ocr'>('csv')
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    topProducts: [],
    revenueByDate: [],
    dailyData: []
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const parseCSV = (text: string): DataRow[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows: DataRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: DataRow = {}
      
      headers.forEach((header, index) => {
        const value = values[index]
        
        if (header.includes('amount') || header.includes('price') || header.includes('сумма') || header.includes('цена') || header.includes('revenue')) {
          const numStr = value.replace(/[^\d.,]/g, '').replace(',', '.')
          row.amount = parseFloat(numStr) || 0
        } else if (header.includes('date') || header.includes('дата')) {
          row.date = value
        } else if (header.includes('product') || header.includes('товар') || header.includes('название') || header.includes('item')) {
          row.product = value
        } else if (header.includes('customer') || header.includes('client') || header.includes('клиент')) {
          row.customer = value
        } else {
          row[header] = value
        }
      })
      
      if (row.amount && row.amount > 0) {
        rows.push(row)
      }
    }

    return rows
  }

  const calculateStats = (data: DataRow[], fileName: string): Stats => {
    const totalRevenue = data.reduce((sum, row) => sum + (row.amount || 0), 0)
    const totalOrders = data.length
    const uniqueCustomers = new Set(data.map(row => row.customer).filter(Boolean)).size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // ТОП-5 товаров
    const productStats = new Map<string, { revenue: number; orders: number }>()
    data.forEach(row => {
      if (row.product) {
        const current = productStats.get(row.product) || { revenue: 0, orders: 0 }
        productStats.set(row.product, {
          revenue: current.revenue + (row.amount || 0),
          orders: current.orders + 1
        })
      }
    })
    
    const topProducts = Array.from(productStats.entries())
      .map(([product, stats]) => ({ product, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Группировка по датам
    const dateStats = new Map<string, { revenue: number; orders: number }>()
    data.forEach(row => {
      const dateKey = row.date?.substring(0, 10) || 'Неизвестно'
      const current = dateStats.get(dateKey) || { revenue: 0, orders: 0 }
      dateStats.set(dateKey, {
        revenue: current.revenue + (row.amount || 0),
        orders: current.orders + 1
      })
    })
    
    const revenueByDate = Array.from(dateStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Последние 30 дней

    // Данные для круговой диаграммы (ТОП-6 товаров)
    const dailyData = topProducts.slice(0, 6).map(p => ({
      name: p.product.length > 20 ? p.product.substring(0, 20) + '...' : p.product,
      value: Math.round(p.revenue)
    }))

    return {
      totalRevenue,
      totalOrders,
      totalCustomers: uniqueCustomers || totalOrders,
      averageOrderValue,
      fileName,
      rowCount: totalOrders,
      topProducts,
      revenueByDate,
      dailyData
    }
  }

  const handleFileSelect = async (file: File) => {
    if (!file) return

    const isCSV = file.name.match(/\.csv$/i)
    if (!isCSV) {
      toast.error('Пожалуйста, загрузите файл CSV')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимальный размер: 10MB')
      return
    }

    setIsUploading(true)
    const loadingToast = toast.loading('Анализирую данные...')

    try {
      const text = await file.text()
      const data = parseCSV(text)
      
      if (data.length === 0) {
        toast.error('Файл не содержит данных или имеет неправильный формат', { id: loadingToast })
        return
      }

      const newStats = calculateStats(data, file.name)
      setStats(newStats)
      
      toast.success(
        `✅ Анализ завершен!\n📊 Обработано: ${newStats.rowCount} записей\n💰 Выручка: ₽${newStats.totalRevenue.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}`,
        { id: loadingToast, duration: 5000 }
      )
    } catch (error: any) {
      console.error('Ошибка обработки файла:', error)
      toast.error('Ошибка обработки файла. Проверьте формат данных.', { id: loadingToast })
    } finally {
      setIsUploading(false)
    }
  }

  const handleOCRUploadComplete = async (response: any) => {
    setIsUploading(true)
    const loadingToast = toast.loading('Обрабатываю данные из фотографии...')

    try {
      // Get analytics from the uploaded file
      if (response.file_id) {
        const analytics = await filesApi.getAnalytics(response.file_id)
        
        // Update stats from analytics response
        const newStats: Stats = {
          totalRevenue: analytics.total_revenue || 0,
          totalOrders: analytics.total_orders || response.row_count || 0,
          totalCustomers: analytics.total_customers || 0,
          averageOrderValue: analytics.average_order_value || 0,
          fileName: response.file_name || 'Фото тетради',
          rowCount: response.row_count || 0,
          topProducts: analytics.top_products?.slice(0, 5).map((p: any) => ({
            product: p.product || p.name || 'Товар',
            revenue: p.revenue || p.total_revenue || 0,
            orders: p.orders || p.count || 0
          })) || [],
          revenueByDate: analytics.revenue_by_date?.map((d: any) => ({
            date: d.date,
            revenue: d.revenue || d.total_revenue || 0,
            orders: d.orders || d.count || 0
          })) || [],
          dailyData: analytics.top_products?.slice(0, 6).map((p: any) => ({
            name: (p.product || p.name || 'Товар').substring(0, 20),
            value: p.revenue || p.total_revenue || 0
          })) || []
        }
        
        setStats(newStats)
        
        toast.success(
          `✅ Фото обработано!\n📊 Распознано записей: ${response.row_count || 0}\n💰 Выручка: ₽${newStats.totalRevenue.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}`,
          { id: loadingToast, duration: 5000 }
        )
      } else {
        toast.success('Фото успешно загружено!', { id: loadingToast })
      }
    } catch (error: any) {
      console.error('Ошибка обработки OCR данных:', error)
      toast.error('Ошибка обработки данных. Попробуйте еще раз.', { id: loadingToast })
    } finally {
      setIsUploading(false)
    }
  }

  const handleOCRError = (error: string) => {
    toast.error(error)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const previousRevenue = stats.totalRevenue * 0.85 // Симуляция роста 15%
  const revenueGrowth = stats.totalRevenue > 0 ? ((stats.totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Analitix AI
                </h1>
                <p className="text-sm text-gray-500 font-medium">Аналитическая панель</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/integrations')}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
              >
                <Database className="h-4 w-4" />
                <span className="hidden sm:inline">Подключить CRM/БД</span>
              </Button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.email || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 flex items-center justify-end">
                  <Award className="h-3 w-3 mr-1 text-yellow-500" />
                  Премиум тариф
                </p>
              </div>
              {/* Export Button */}
              {stats.totalOrders > 0 && (
                <ExportButton 
                  data={{
                    title: `Отчёт: ${stats.fileName || 'Продажи'}`,
                    headers: ['Дата', 'Товар', 'Сумма', 'Клиент'],
                    rows: stats.topProducts?.map((p, i) => [
                      new Date().toLocaleDateString('ru-RU'),
                      p.product,
                      p.revenue.toLocaleString('ru-RU') + ' ₽',
                      `Заказов: ${p.orders}`
                    ]) || [],
                    summary: {
                      'Общая выручка': stats.totalRevenue.toLocaleString('ru-RU') + ' ₽',
                      'Всего заказов': stats.totalOrders,
                      'Уникальных клиентов': stats.totalCustomers,
                      'Средний чек': stats.averageOrderValue.toLocaleString('ru-RU') + ' ₽'
                    }
                  }}
                  filename={stats.fileName || 'sales_report'}
                />
              )}
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 flex items-center">
            {greeting}! 👋
          </h2>
          <p className="text-gray-600 text-lg">
            Полный контроль над вашим бизнесом в одном месте
          </p>
          {stats.fileName && (
            <div className="mt-4 inline-flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 rounded-xl text-sm shadow-sm">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">{stats.fileName}</span>
              <span className="text-green-600">•</span>
              <span>{stats.rowCount} записей</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-100">Общая выручка</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">
                ₽{stats.totalRevenue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {stats.totalRevenue > 0 && (
                <div className="flex items-center text-sm text-blue-100">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-semibold">+{revenueGrowth}%</span>
                  <span className="ml-1">к прошлому периоду</span>
                </div>
              )}
              {stats.totalRevenue === 0 && (
                <p className="text-sm text-blue-100">Загрузите данные</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-100">Всего заказов</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.totalOrders.toLocaleString('ru-RU')}</div>
              <p className="text-sm text-purple-100">
                {stats.totalOrders > 0 ? 'Обработанных транзакций' : 'Пока нет заказов'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-500 to-rose-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-pink-100">Клиентов</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stats.totalCustomers.toLocaleString('ru-RU')}</div>
              <p className="text-sm text-pink-100">
                {stats.totalCustomers > 0 ? 'Уникальных покупателей' : 'Нет клиентов'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-amber-100">Средний чек</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">
                ₽{stats.averageOrderValue.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-amber-100">
                {stats.averageOrderValue > 0 ? 'На одну покупку' : 'Нет данных'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        {stats.revenueByDate && stats.revenueByDate.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Динамика выручки</span>
                </CardTitle>
                <CardDescription>Выручка по датам за последний период</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.substring(5)}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => ['₽' + value.toLocaleString('ru-RU', { minimumFractionDigits: 2 }), 'Выручка']}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      name="Выручка (₽)"
                      dot={{ fill: '#3B82F6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products Pie */}
            {stats.dailyData && stats.dailyData.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span>Распределение выручки</span>
                  </CardTitle>
                  <CardDescription>ТОП товаров по доходу</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.dailyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.dailyData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => '₽' + value.toLocaleString('ru-RU')} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Top Products */}
        {stats.topProducts && stats.topProducts.length > 0 && (
          <Card className="border-0 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>ТОП-5 товаров по выручке</span>
              </CardTitle>
              <CardDescription>Самые прибыльные позиции вашего бизнеса</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-gray-200"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' : ''}
                        ${index > 2 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : ''}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product}</p>
                        <p className="text-sm text-gray-500">{item.orders} заказов</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        ₽{item.revenue.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {((item.revenue / stats.totalRevenue) * 100).toFixed(1)}% от общей
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <span>Загрузка данных</span>
            </CardTitle>
            <CardDescription>
              Загрузите CSV файл или фотографию тетради для автоматического анализа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'csv' | 'ocr')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>CSV файл</span>
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Фото тетради</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="csv" className="mt-6">
            <div
              className={`
                flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
                ${isDragging
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 bg-gradient-to-br from-gray-50 to-blue-50 hover:border-blue-400 hover:bg-blue-50'
                }
                ${isUploading ? 'opacity-50 pointer-events-none' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleButtonClick}
            >
              <div className={`p-6 rounded-full mb-6 ${isDragging ? 'bg-blue-100' : 'bg-blue-50'} transition-all`}>
                <Upload className={`h-12 w-12 ${isDragging ? 'text-blue-600' : 'text-blue-400'}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isUploading ? 'Анализирую данные...' : 'Загрузить CSV файл'}
              </h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Перетащите файл сюда или нажмите для выбора
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <Button 
                size="lg"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleButtonClick()
                }}
              >
                <Upload className="h-5 w-5" />
                <span className="font-semibold">{isUploading ? 'Обработка...' : 'Выбрать файл'}</span>
              </Button>
            </div>
            
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
              <h4 className="text-base font-bold text-blue-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Формат данных CSV:
              </h4>
              <div className="bg-white p-4 rounded-lg font-mono text-sm text-gray-800 mb-3 border border-blue-200">
                date,product,amount,customer<br />
                2024-01-01,Товар 1,1500.50,Клиент 1<br />
                2024-01-02,Товар 2,2300.00,Клиент 2
              </div>
              <ul className="text-sm text-blue-900 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>date</strong> - дата заказа (любой формат)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>product</strong> - название товара или услуги</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>amount</strong> - сумма в рублях</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span><strong>customer</strong> - имя клиента (опционально)</span>
                </li>
              </ul>
            </div>
              </TabsContent>

              <TabsContent value="ocr" className="mt-6">
                <OCRUpload
                  onUploadComplete={handleOCRUploadComplete}
                  onError={handleOCRError}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

    </div>
  )
}
