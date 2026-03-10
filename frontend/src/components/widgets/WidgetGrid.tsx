/**
 * 🧩 WIDGET GRID - Drag & Drop система виджетов
 * 
 * Функции:
 * - Перетаскивание виджетов
 * - Изменение размера
 * - Добавление/удаление виджетов
 * - Сохранение конфигурации
 */
import { useState, useCallback } from 'react'
import { 
  DollarSign, ShoppingCart, Users, TrendingUp, Target, 
  BarChart3, PieChart, Activity, Package, Percent,
  GripVertical, X, Plus, Settings, Save, RotateCcw,
  Maximize2, Minimize2, Eye, EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, 
         AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ============================================
// 📦 ТИПЫ
// ============================================

export type WidgetType = 
  | 'metric' 
  | 'chart-line' 
  | 'chart-bar' 
  | 'chart-pie' 
  | 'chart-area'
  | 'kpi-progress'
  | 'top-products'
  | 'recent-orders'

export type WidgetSize = 'small' | 'medium' | 'large' | 'full'

export interface Widget {
  id: string
  type: WidgetType
  title: string
  size: WidgetSize
  position: number
  visible: boolean
  config?: {
    metric?: string
    dataKey?: string
    color?: string
    target?: number
    current?: number
  }
}

export interface WidgetData {
  [key: string]: any
}

// ============================================
// 🎨 КОНФИГУРАЦИЯ ВИДЖЕТОВ
// ============================================

const WIDGET_TEMPLATES: Omit<Widget, 'id' | 'position'>[] = [
  { type: 'metric', title: 'Выручка', size: 'small', visible: true, config: { metric: 'revenue', color: 'blue' } },
  { type: 'metric', title: 'Заказы', size: 'small', visible: true, config: { metric: 'orders', color: 'green' } },
  { type: 'metric', title: 'Клиенты', size: 'small', visible: true, config: { metric: 'customers', color: 'purple' } },
  { type: 'metric', title: 'Средний чек', size: 'small', visible: true, config: { metric: 'avgCheck', color: 'orange' } },
  { type: 'chart-area', title: 'Динамика продаж', size: 'large', visible: true, config: { dataKey: 'revenue' } },
  { type: 'chart-bar', title: 'Продажи по дням', size: 'medium', visible: true, config: { dataKey: 'daily' } },
  { type: 'chart-pie', title: 'Категории', size: 'medium', visible: true, config: { dataKey: 'categories' } },
  { type: 'kpi-progress', title: 'Цель месяца', size: 'medium', visible: true, config: { target: 5000000, current: 3750000 } },
  { type: 'top-products', title: 'Топ товары', size: 'medium', visible: true },
  { type: 'recent-orders', title: 'Последние заказы', size: 'medium', visible: true },
]

const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-2',
  large: 'col-span-3',
  full: 'col-span-4'
}

const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

// ============================================
// 🧩 КОМПОНЕНТЫ ВИДЖЕТОВ
// ============================================

interface WidgetProps {
  widget: Widget
  data: WidgetData
  onRemove: () => void
  onResize: (size: WidgetSize) => void
  onToggleVisibility: () => void
  isDragging?: boolean
}

function MetricWidget({ widget, data }: { widget: Widget; data: WidgetData }) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'from-blue-500/20 to-cyan-500/20', text: 'text-blue-400', icon: 'bg-blue-500/20' },
    green: { bg: 'from-green-500/20 to-emerald-500/20', text: 'text-green-400', icon: 'bg-green-500/20' },
    purple: { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-400', icon: 'bg-purple-500/20' },
    orange: { bg: 'from-orange-500/20 to-amber-500/20', text: 'text-orange-400', icon: 'bg-orange-500/20' },
  }
  
  const color = colorMap[widget.config?.color || 'blue']
  const metric = widget.config?.metric
  
  const icons: Record<string, any> = {
    revenue: DollarSign,
    orders: ShoppingCart,
    customers: Users,
    avgCheck: Target,
  }
  
  const Icon = icons[metric || 'revenue'] || DollarSign
  
  const values: Record<string, { value: string; change: number }> = {
    revenue: { value: data.revenue?.toLocaleString('ru-RU') + ' ₽' || '0 ₽', change: 12.5 },
    orders: { value: data.orders?.toLocaleString('ru-RU') || '0', change: 8.3 },
    customers: { value: data.customers?.toLocaleString('ru-RU') || '0', change: 15.2 },
    avgCheck: { value: data.avgCheck?.toLocaleString('ru-RU') + ' ₽' || '0 ₽', change: 3.1 },
  }
  
  const metricData = values[metric || 'revenue']

  return (
    <div className={`h-full p-4 bg-gradient-to-br ${color.bg} rounded-xl`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color.icon}`}>
          <Icon className={`h-5 w-5 ${color.text}`} />
        </div>
        <span className={`text-xs font-medium ${metricData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {metricData.change >= 0 ? '↑' : '↓'} {Math.abs(metricData.change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{metricData.value}</p>
      <p className="text-sm text-gray-400">{widget.title}</p>
    </div>
  )
}

function ChartWidget({ widget, data }: { widget: Widget; data: WidgetData }) {
  const chartData = data.chartData || [
    { name: 'Пн', value: 4000 },
    { name: 'Вт', value: 3000 },
    { name: 'Ср', value: 5000 },
    { name: 'Чт', value: 4500 },
    { name: 'Пт', value: 6000 },
    { name: 'Сб', value: 5500 },
    { name: 'Вс', value: 4200 },
  ]

  return (
    <div className="h-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        {widget.type === 'chart-line' && (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
            <YAxis stroke="#9CA3AF" fontSize={10} />
            <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
          </LineChart>
        )}
        {widget.type === 'chart-bar' && (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
            <YAxis stroke="#9CA3AF" fontSize={10} />
            <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
        {widget.type === 'chart-area' && (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
            <YAxis stroke="#9CA3AF" fontSize={10} />
            <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="value" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        )}
        {widget.type === 'chart-pie' && (
          <RechartsPie>
            <Pie
              data={data.pieData || [
                { name: 'Электроника', value: 35 },
                { name: 'Одежда', value: 25 },
                { name: 'Продукты', value: 20 },
                { name: 'Другое', value: 20 },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              dataKey="value"
            >
              {(data.pieData || []).map((_: any, idx: number) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }} />
          </RechartsPie>
        )}
      </ResponsiveContainer>
    </div>
  )
}

function KPIProgressWidget({ widget, data }: { widget: Widget; data: WidgetData }) {
  const target = widget.config?.target || data.kpiTarget || 5000000
  const current = widget.config?.current || data.kpiCurrent || 3750000
  const progress = Math.min((current / target) * 100, 100)
  const remaining = target - current
  const daysLeft = 12 // Можно вычислять динамически
  
  const getProgressColor = (p: number) => {
    if (p >= 90) return 'from-green-500 to-emerald-500'
    if (p >= 70) return 'from-blue-500 to-cyan-500'
    if (p >= 50) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          <span className="text-sm text-gray-400">Прогресс к цели</span>
        </div>
        <span className="text-2xl font-bold text-white">{progress.toFixed(0)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div 
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(progress)} rounded-full transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow">{progress.toFixed(1)}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400">Текущая</p>
          <p className="text-lg font-bold text-white">{(current / 1000000).toFixed(2)}M ₽</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400">Цель</p>
          <p className="text-lg font-bold text-purple-400">{(target / 1000000).toFixed(2)}M ₽</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">Осталось: <span className="text-white font-medium">{(remaining / 1000000).toFixed(2)}M ₽</span></span>
        <span className="text-gray-400">Дней: <span className="text-orange-400 font-medium">{daysLeft}</span></span>
      </div>
    </div>
  )
}

function TopProductsWidget({ data }: { data: WidgetData }) {
  const products = data.topProducts || [
    { name: 'iPhone 15 Pro', sales: 156, revenue: 23400000 },
    { name: 'MacBook Air M2', sales: 89, revenue: 10680000 },
    { name: 'AirPods Pro', sales: 234, revenue: 7020000 },
    { name: 'iPad Pro 12.9', sales: 67, revenue: 8040000 },
    { name: 'Apple Watch', sales: 123, revenue: 6150000 },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="space-y-3">
        {products.map((product: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : idx === 2 ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'}
            `}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
              <p className="text-xs text-gray-400">{product.sales} продаж</p>
            </div>
            <p className="text-sm font-bold text-green-400">{(product.revenue / 1000000).toFixed(1)}M</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentOrdersWidget({ data }: { data: WidgetData }) {
  const orders = data.recentOrders || [
    { id: '#12847', customer: 'Иванов А.', amount: 45600, status: 'delivered' },
    { id: '#12846', customer: 'Петрова М.', amount: 23400, status: 'shipped' },
    { id: '#12845', customer: 'Сидоров К.', amount: 89000, status: 'processing' },
    { id: '#12844', customer: 'Козлова Е.', amount: 12300, status: 'delivered' },
    { id: '#12843', customer: 'Новиков Д.', amount: 67800, status: 'shipped' },
  ]

  const statusMap: Record<string, { label: string; color: string }> = {
    delivered: { label: 'Доставлен', color: 'bg-green-500/20 text-green-400' },
    shipped: { label: 'В пути', color: 'bg-blue-500/20 text-blue-400' },
    processing: { label: 'Обработка', color: 'bg-yellow-500/20 text-yellow-400' },
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="space-y-2">
        {orders.map((order: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <div>
              <p className="text-sm font-medium text-white">{order.id}</p>
              <p className="text-xs text-gray-400">{order.customer}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">{order.amount.toLocaleString('ru-RU')} ₽</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusMap[order.status]?.color}`}>
                {statusMap[order.status]?.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// 🎯 ГЛАВНЫЙ КОМПОНЕНТ ВИДЖЕТА
// ============================================

function WidgetCard({ widget, data, onRemove, onResize, onToggleVisibility, isDragging }: WidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const renderContent = () => {
    switch (widget.type) {
      case 'metric':
        return <MetricWidget widget={widget} data={data} />
      case 'chart-line':
      case 'chart-bar':
      case 'chart-area':
      case 'chart-pie':
        return <ChartWidget widget={widget} data={data} />
      case 'kpi-progress':
        return <KPIProgressWidget widget={widget} data={data} />
      case 'top-products':
        return <TopProductsWidget data={data} />
      case 'recent-orders':
        return <RecentOrdersWidget data={data} />
      default:
        return <div className="p-4 text-gray-400">Виджет не найден</div>
    }
  }

  const minHeight = widget.type === 'metric' ? 'h-32' : 'h-64'

  return (
    <Card 
      className={`
        ${SIZE_CLASSES[widget.size]} ${minHeight}
        bg-white/5 backdrop-blur-xl border-white/10 
        hover:border-white/20 transition-all duration-200
        ${isDragging ? 'ring-2 ring-purple-500 opacity-50' : ''}
        ${!widget.visible ? 'opacity-50' : ''}
        relative group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with controls */}
      <div className={`
        absolute top-0 left-0 right-0 z-10 
        flex items-center justify-between p-2
        bg-gradient-to-b from-black/50 to-transparent
        transition-opacity duration-200
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-300 font-medium">{widget.title}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
              <DropdownMenuItem onClick={() => onResize('small')} className="cursor-pointer hover:bg-gray-700">
                Маленький
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResize('medium')} className="cursor-pointer hover:bg-gray-700">
                Средний
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResize('large')} className="cursor-pointer hover:bg-gray-700">
                Большой
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResize('full')} className="cursor-pointer hover:bg-gray-700">
                Во всю ширину
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={onToggleVisibility} className="cursor-pointer hover:bg-gray-700">
                {widget.visible ? <><EyeOff className="h-3 w-3 mr-2" /> Скрыть</> : <><Eye className="h-3 w-3 mr-2" /> Показать</>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-red-400"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-0 h-full">
        {renderContent()}
      </CardContent>
    </Card>
  )
}

// ============================================
// 🧩 WIDGET GRID COMPONENT
// ============================================

interface WidgetGridProps {
  initialWidgets?: Widget[]
  data?: WidgetData
  onSave?: (widgets: Widget[]) => void
}

export function WidgetGrid({ initialWidgets, data = {}, onSave }: WidgetGridProps) {
  const [widgets, setWidgets] = useState<Widget[]>(() => 
    initialWidgets || WIDGET_TEMPLATES.map((w, idx) => ({
      ...w,
      id: `widget-${idx}`,
      position: idx
    }))
  )
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const handleDragStart = (id: string) => {
    setDraggedWidget(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedWidget || draggedWidget === targetId) return

    setWidgets(prev => {
      const newWidgets = [...prev]
      const draggedIdx = newWidgets.findIndex(w => w.id === draggedWidget)
      const targetIdx = newWidgets.findIndex(w => w.id === targetId)
      
      if (draggedIdx !== -1 && targetIdx !== -1) {
        const [removed] = newWidgets.splice(draggedIdx, 1)
        newWidgets.splice(targetIdx, 0, removed)
        return newWidgets.map((w, idx) => ({ ...w, position: idx }))
      }
      return prev
    })
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
  }

  const handleRemove = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const handleResize = (id: string, size: WidgetSize) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w))
  }

  const handleToggleVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  const handleAddWidget = (template: Omit<Widget, 'id' | 'position'>) => {
    const newWidget: Widget = {
      ...template,
      id: `widget-${Date.now()}`,
      position: widgets.length
    }
    setWidgets(prev => [...prev, newWidget])
  }

  const handleReset = () => {
    setWidgets(WIDGET_TEMPLATES.map((w, idx) => ({
      ...w,
      id: `widget-${idx}`,
      position: idx
    })))
  }

  const handleSave = () => {
    onSave?.(widgets)
    // Сохраняем в localStorage
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            Кастомный дашборд
          </h3>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {widgets.filter(w => w.visible).length} виджетов
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Add Widget */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Plus className="h-4 w-4 mr-1" /> Добавить
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white w-56">
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'metric', title: 'Новая метрика', size: 'small', visible: true, config: { metric: 'revenue', color: 'blue' } })} className="cursor-pointer hover:bg-gray-700">
                <DollarSign className="h-4 w-4 mr-2" /> Метрика
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'chart-area', title: 'График (Area)', size: 'large', visible: true })} className="cursor-pointer hover:bg-gray-700">
                <Activity className="h-4 w-4 mr-2" /> График Area
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'chart-bar', title: 'График (Bar)', size: 'medium', visible: true })} className="cursor-pointer hover:bg-gray-700">
                <BarChart3 className="h-4 w-4 mr-2" /> График Bar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'chart-pie', title: 'Pie Chart', size: 'medium', visible: true })} className="cursor-pointer hover:bg-gray-700">
                <PieChart className="h-4 w-4 mr-2" /> Pie Chart
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'kpi-progress', title: 'KPI Прогресс', size: 'medium', visible: true, config: { target: 1000000, current: 0 } })} className="cursor-pointer hover:bg-gray-700">
                <Target className="h-4 w-4 mr-2" /> KPI Прогресс
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'top-products', title: 'Топ товары', size: 'medium', visible: true })} className="cursor-pointer hover:bg-gray-700">
                <Package className="h-4 w-4 mr-2" /> Топ товары
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddWidget({ type: 'recent-orders', title: 'Заказы', size: 'medium', visible: true })} className="cursor-pointer hover:bg-gray-700">
                <ShoppingCart className="h-4 w-4 mr-2" /> Последние заказы
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Сбросить
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            <Save className="h-4 w-4 mr-1" /> Сохранить
          </Button>
        </div>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-min">
        {widgets
          .filter(w => w.visible)
          .sort((a, b) => a.position - b.position)
          .map(widget => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={SIZE_CLASSES[widget.size]}
            >
              <WidgetCard
                widget={widget}
                data={data}
                onRemove={() => handleRemove(widget.id)}
                onResize={(size) => handleResize(widget.id, size)}
                onToggleVisibility={() => handleToggleVisibility(widget.id)}
                isDragging={draggedWidget === widget.id}
              />
            </div>
          ))}
      </div>
    </div>
  )
}

export default WidgetGrid













