import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, Boxes, TrendingUp, AlertTriangle, CheckCircle,
  BarChart3, ArrowLeft, Upload, Download, RefreshCw, Lightbulb,
  HelpCircle, X, FileSpreadsheet, 
  PlayCircle, Sparkles, AlertCircle,
  PackageX, PackageCheck, DollarSign, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  PieChart as RechartsPie, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('warehouse')

// ============================================
// 📦 WAREHOUSE DASHBOARD - Складской учёт
// ============================================

interface WarehouseItem {
  date: string
  sku: string
  product_name: string
  category: string
  stock_qty: number
  min_stock: number
  received: number
  sold: number
  written_off: number
  unit_cost: number
  unit_price: number
  warehouse: string
}

interface WarehouseMetrics {
  totalSKU: number
  totalStockValue: number
  totalPotentialRevenue: number
  lowStockItems: number
  overstockItems: number
  avgTurnover: number
  abcAnalysis: { category: 'A' | 'B' | 'C'; count: number; value: number; percent: number }[]
  categoryStock: { category: string; quantity: number; value: number }[]
  warehouseStock: { warehouse: string; items: number; value: number }[]
  criticalItems: WarehouseItem[]
  topMoving: { product: string; sold: number; turnover: number }[]
  deadStock: WarehouseItem[]
}

const COLORS = {
  A: '#10B981', // зелёный - лучшие
  B: '#F59E0B', // жёлтый - средние  
  C: '#EF4444', // красный - худшие
  primary: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']
}

export default function WarehouseDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<WarehouseItem[] | null>(null)
  const [metrics, setMetrics] = useState<WarehouseMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'abc'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('warehouse')

  const calculateMetrics = (items: WarehouseItem[]): WarehouseMetrics => {
    // Уникальные SKU (последние данные по каждому)
    const skuMap = new Map<string, WarehouseItem>()
    items.forEach(item => {
      const existing = skuMap.get(item.sku)
      if (!existing || item.date > existing.date) {
        skuMap.set(item.sku, item)
      }
    })
    const latestItems = Array.from(skuMap.values())

    const totalSKU = latestItems.length
    const totalStockValue = latestItems.reduce((sum, i) => sum + (i.stock_qty * i.unit_cost), 0)
    const totalPotentialRevenue = latestItems.reduce((sum, i) => sum + (i.stock_qty * i.unit_price), 0)
    
    // Критические остатки
    const lowStockItems = latestItems.filter(i => i.stock_qty <= i.min_stock && i.stock_qty > 0).length
    const overstockItems = latestItems.filter(i => i.stock_qty > i.min_stock * 5).length
    
    // Оборачиваемость
    const totalSold = items.reduce((sum, i) => sum + i.sold, 0)
    const avgStock = latestItems.reduce((sum, i) => sum + i.stock_qty, 0) / latestItems.length
    const avgTurnover = avgStock > 0 ? (totalSold / avgStock) : 0

    // ABC анализ по выручке
    const itemRevenue = latestItems.map(i => ({
      ...i,
      revenue: i.sold * i.unit_price
    })).sort((a, b) => b.revenue - a.revenue)
    
    const totalRevenue = itemRevenue.reduce((sum, i) => sum + i.revenue, 0)
    let cumulative = 0
    const abcItems = itemRevenue.map(item => {
      cumulative += item.revenue
      const percent = (cumulative / totalRevenue) * 100
      return {
        ...item,
        abc: percent <= 80 ? 'A' : percent <= 95 ? 'B' : 'C' as 'A' | 'B' | 'C'
      }
    })

    const abcAnalysis = [
      { category: 'A' as const, count: abcItems.filter(i => i.abc === 'A').length, value: 0, percent: 80 },
      { category: 'B' as const, count: abcItems.filter(i => i.abc === 'B').length, value: 0, percent: 15 },
      { category: 'C' as const, count: abcItems.filter(i => i.abc === 'C').length, value: 0, percent: 5 }
    ]
    abcAnalysis[0].value = abcItems.filter(i => i.abc === 'A').reduce((s, i) => s + i.revenue, 0)
    abcAnalysis[1].value = abcItems.filter(i => i.abc === 'B').reduce((s, i) => s + i.revenue, 0)
    abcAnalysis[2].value = abcItems.filter(i => i.abc === 'C').reduce((s, i) => s + i.revenue, 0)

    // По категориям
    const categoryMap = new Map<string, { quantity: number; value: number }>()
    latestItems.forEach(i => {
      const existing = categoryMap.get(i.category) || { quantity: 0, value: 0 }
      categoryMap.set(i.category, {
        quantity: existing.quantity + i.stock_qty,
        value: existing.value + (i.stock_qty * i.unit_cost)
      })
    })
    const categoryStock = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.value - a.value)

    // По складам
    const warehouseMap = new Map<string, { items: number; value: number }>()
    latestItems.forEach(i => {
      const existing = warehouseMap.get(i.warehouse) || { items: 0, value: 0 }
      warehouseMap.set(i.warehouse, {
        items: existing.items + 1,
        value: existing.value + (i.stock_qty * i.unit_cost)
      })
    })
    const warehouseStock = Array.from(warehouseMap.entries())
      .map(([warehouse, stats]) => ({ warehouse, ...stats }))

    // Критические товары (мало на складе)
    const criticalItems = latestItems
      .filter(i => i.stock_qty <= i.min_stock)
      .sort((a, b) => a.stock_qty - b.stock_qty)
      .slice(0, 10)

    // Топ продаваемых
    const topMoving = items
      .reduce((acc, i) => {
        const existing = acc.find(x => x.product === i.product_name)
        if (existing) {
          existing.sold += i.sold
        } else {
          acc.push({ product: i.product_name, sold: i.sold, turnover: 0 })
        }
        return acc
      }, [] as { product: string; sold: number; turnover: number }[])
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)

    // Неликвиды (нет продаж)
    const deadStock = latestItems
      .filter(i => i.sold === 0 && i.stock_qty > 0)
      .sort((a, b) => (b.stock_qty * b.unit_cost) - (a.stock_qty * a.unit_cost))
      .slice(0, 10)

    return {
      totalSKU,
      totalStockValue,
      totalPotentialRevenue,
      lowStockItems,
      overstockItems,
      avgTurnover,
      abcAnalysis,
      categoryStock,
      warehouseStock,
      criticalItems,
      topMoving,
      deadStock
    }
  }

  const rowsToItems = (rows: Record<string, string>[]): WarehouseItem[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
    const skuCol = findColumn(h, ['sku', 'артикул', 'код', 'id'])
    const nameCol = findColumn(h, ['product_name', 'name', 'товар', 'название', 'product', 'mahsulot', 'nomi'])
    const categoryCol = findColumn(h, ['category', 'категория', 'cat', 'группа'])
    const stockCol = findColumn(h, ['stock_qty', 'stock', 'остаток', 'количество', 'quantity', 'qty', 'miqdor'])
    const minStockCol = findColumn(h, ['min_stock', 'min', 'мин', 'минимум'])
    const receivedCol = findColumn(h, ['received', 'приход', 'поступление'])
    const soldCol = findColumn(h, ['sold', 'продано', 'продажи', 'sales'])
    const writtenOffCol = findColumn(h, ['written_off', 'списано', 'списание'])
    const costCol = findColumn(h, ['unit_cost', 'cost', 'себестоимость', 'закупка'])
    const priceCol = findColumn(h, ['unit_price', 'price', 'цена', 'продажа', 'narx'])
    const warehouseCol = findColumn(h, ['warehouse', 'склад'])

    return rows.map((row, i) => ({
      date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
      sku: getStr(row, skuCol, `SKU${i + 1}`),
      product_name: getStr(row, nameCol, 'Товар'),
      category: getStr(row, categoryCol, 'Другое'),
      stock_qty: getNum(row, stockCol),
      min_stock: getNum(row, minStockCol),
      received: getNum(row, receivedCol),
      sold: getNum(row, soldCol),
      written_off: getNum(row, writtenOffCol),
      unit_cost: getNum(row, costCol),
      unit_price: getNum(row, priceCol),
      warehouse: getStr(row, warehouseCol, 'Основной'),
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const items = rowsToItems(rows)
      if (items.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(items)
      setMetrics(calculateMetrics(items))
      toast.success(`📦 Загружено ${items.length} записей из ${file.name}`)
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
      const response = await fetch('/demo_data/warehouse_stock.csv')
      const blob = await response.blob()
      const demoFile = new File([blob], 'warehouse_stock.csv', { type: 'text/csv' })
      const rows = await readFileUniversal(demoFile)
      const items = rowsToItems(rows)

      setData(items)
      setMetrics(calculateMetrics(items))
      toast.success('📦 Демо-данные склада загружены!')
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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl" />
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
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Склад
                    <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full">
                      ABC
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Остатки, оборачиваемость, неликвиды</p>
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
            <Card className="bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 backdrop-blur-xl border-emerald-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <Boxes className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Складская аналитика 📦
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Загрузите данные об остатках — узнайте что залёживается и что заканчивается
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">
                        <PackageCheck className="h-4 w-4" />
                        Остатки
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                        <TrendingUp className="h-4 w-4" />
                        Оборачиваемость
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                        <Target className="h-4 w-4" />
                        ABC-анализ
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm">
                        <PackageX className="h-4 w-4" />
                        Неликвиды
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30">
                  <Upload className={`h-10 w-10 text-white ${isLoading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Загрузите данные склада
                </h3>
                <p className="text-gray-400 mb-8">
                  Экспортируйте из 1С, МойСклад или Excel
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
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold px-8"
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

            {/* What is ABC */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                  Что такое ABC-анализ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">A</div>
                      <span className="text-emerald-400 font-bold">Категория A</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>20% товаров = 80% выручки.</strong> Самые важные! Всегда держите в наличии.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">B</div>
                      <span className="text-amber-400 font-bold">Категория B</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>30% товаров = 15% выручки.</strong> Средняя важность. Контролируйте остатки.
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">C</div>
                      <span className="text-red-400 font-bold">Категория C</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      <strong>50% товаров = 5% выручки.</strong> Можно сократить ассортимент.
                    </p>
                  </div>
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
                { id: 'stock', label: 'Остатки', icon: Package },
                { id: 'abc', label: 'ABC-анализ', icon: Target }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
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
                  <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border-emerald-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                          <Package className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Товаров на складе</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalSKU}</p>
                      <p className="text-emerald-400 text-sm mt-2">SKU позиций</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-blue-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <DollarSign className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Стоимость остатков</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalStockValue)}</p>
                      <p className="text-blue-400 text-sm mt-2">
                        Потенциал: {formatCurrency(metrics.totalPotentialRevenue)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl border-red-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-red-500/20">
                          <AlertTriangle className="h-6 w-6 text-red-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Заканчивается</p>
                      <p className="text-3xl font-bold text-red-400">{metrics.lowStockItems}</p>
                      <p className="text-red-400 text-sm mt-2">Нужно заказать!</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border-purple-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                          <PackageX className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Неликвиды</p>
                      <p className="text-3xl font-bold text-white">{metrics.deadStock.length}</p>
                      <p className="text-purple-400 text-sm mt-2">Без продаж</p>
                    </CardContent>
                  </Card>
                </div>

                {/* ABC Chart */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-400" />
                        ABC-анализ
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Распределение товаров по важности
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics.abcAnalysis.map((abc) => (
                          <div key={abc.category}>
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: COLORS[abc.category] }}
                                >
                                  {abc.category}
                                </div>
                                <span className="text-white font-medium">
                                  Категория {abc.category}
                                </span>
                              </div>
                              <span className="text-gray-400">
                                {abc.count} товаров • {formatCurrency(abc.value)}
                              </span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${abc.percent}%`,
                                  backgroundColor: COLORS[abc.category]
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Category Stock */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Boxes className="h-5 w-5 text-blue-400" />
                        Остатки по категориям
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RechartsPie>
                          <Pie
                            data={metrics.categoryStock}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="category"
                          >
                            {metrics.categoryStock.map((_, index) => (
                              <Cell key={index} fill={COLORS.primary[index % COLORS.primary.length]} />
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

                {/* Critical Items */}
                {metrics.criticalItems.length > 0 && (
                  <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                        ⚠️ Критические остатки — нужно заказать!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {metrics.criticalItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                              <AlertCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{item.product_name}</p>
                              <p className="text-gray-500 text-sm">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-400 font-bold text-xl">{item.stock_qty} шт</p>
                              <p className="text-gray-500 text-sm">мин: {item.min_stock}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dead Stock */}
                {metrics.deadStock.length > 0 && (
                  <Card className="bg-purple-500/10 backdrop-blur-xl border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PackageX className="h-5 w-5 text-purple-400" />
                        Неликвиды — нет продаж
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Рекомендуем сделать скидку или списать
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {metrics.deadStock.slice(0, 6).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{item.product_name}</p>
                              <p className="text-gray-500 text-sm">{item.stock_qty} шт на складе</p>
                            </div>
                            <div className="text-right">
                              <p className="text-purple-400 font-bold">{formatCurrency(item.stock_qty * item.unit_cost)}</p>
                              <p className="text-gray-500 text-sm">заморожено</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Recommendations */}
                <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border-emerald-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      AI-рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics.lowStockItems > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-300 font-medium">Срочно закажите товары!</p>
                          <p className="text-gray-400 text-sm">
                            {metrics.lowStockItems} позиций заканчивается. Сделайте заказ поставщикам сегодня.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {metrics.deadStock.length > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                        <Lightbulb className="h-5 w-5 text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-purple-300 font-medium">Избавьтесь от неликвидов</p>
                          <p className="text-gray-400 text-sm">
                            {metrics.deadStock.length} товаров без продаж. Сделайте распродажу со скидкой 30-50%.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-emerald-300 font-medium">Фокус на категории A</p>
                        <p className="text-gray-400 text-sm">
                          {metrics.abcAnalysis[0].count} товаров приносят 80% выручки. Никогда не допускайте их отсутствия!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'stock' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Все товары на складе</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Товар</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Категория</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Остаток</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Мин. остаток</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Статус</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Стоимость</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 20).map((item, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">{item.product_name}</p>
                              <p className="text-gray-500 text-sm">{item.sku}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-sm">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-white font-medium">{item.stock_qty}</td>
                            <td className="py-3 px-4 text-center text-gray-400">{item.min_stock}</td>
                            <td className="py-3 px-4 text-center">
                              {item.stock_qty <= item.min_stock ? (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">Мало!</span>
                              ) : item.stock_qty > item.min_stock * 5 ? (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">Много</span>
                              ) : (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">OK</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-white">{formatCurrency(item.stock_qty * item.unit_cost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'abc' && (
              <div className="space-y-6">
                {/* ABC Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  {metrics.abcAnalysis.map((abc) => (
                    <Card 
                      key={abc.category}
                      className="backdrop-blur-xl border-2"
                      style={{ 
                        backgroundColor: `${COLORS[abc.category]}10`,
                        borderColor: `${COLORS[abc.category]}50`
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
                          style={{ backgroundColor: COLORS[abc.category] }}
                        >
                          {abc.category}
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{abc.count}</p>
                        <p className="text-gray-400 text-sm mb-2">товаров</p>
                        <p className="text-xl font-bold" style={{ color: COLORS[abc.category] }}>
                          {formatCurrency(abc.value)}
                        </p>
                        <p className="text-gray-500 text-sm">{abc.percent}% выручки</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Explanation */}
                <Card className="bg-blue-500/10 backdrop-blur-xl border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-medium mb-2">Как использовать ABC-анализ?</p>
                        <ul className="text-gray-400 text-sm space-y-1">
                          <li>• <strong className="text-emerald-400">A-товары:</strong> Всегда держите в наличии, следите за остатками ежедневно</li>
                          <li>• <strong className="text-amber-400">B-товары:</strong> Заказывайте регулярно, проверяйте еженедельно</li>
                          <li>• <strong className="text-red-400">C-товары:</strong> Сократите ассортимент, заказывайте реже</li>
                        </ul>
                      </div>
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
                    <p className="text-gray-400 text-sm">Скачайте складскую аналитику</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
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
            <AnalyticsSection industry="warehouse" aiData={aiData} />
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
                Загрузите данные об остатках товаров. Система автоматически:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>✅ Найдёт товары которые заканчиваются</li>
                <li>✅ Выявит неликвиды без продаж</li>
                <li>✅ Проведёт ABC-анализ</li>
                <li>✅ Даст рекомендации по закупкам</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
