/**
 * 🎯 KPI TRACKER - Отслеживание целей с прогрессом
 * 
 * Функции:
 * - Создание и редактирование целей
 * - Визуализация прогресса
 * - История достижений
 * - Категории целей
 */
import { useState, useEffect } from 'react'
import { 
  Target, Plus, Edit2, Trash2, Check, X, TrendingUp, TrendingDown,
  Calendar, DollarSign, Users, ShoppingCart, Percent, Award,
  ChevronRight, Sparkles, Clock, CheckCircle, AlertTriangle,
  BarChart3, Zap, Star, Trophy, Flag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================
// 📦 ТИПЫ
// ============================================

export type KPICategory = 'revenue' | 'orders' | 'customers' | 'conversion' | 'other'
export type KPIPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type KPIStatus = 'on_track' | 'at_risk' | 'behind' | 'completed' | 'exceeded'

export interface KPIGoal {
  id: string
  title: string
  description?: string
  category: KPICategory
  period: KPIPeriod
  targetValue: number
  currentValue: number
  startValue: number
  unit: string
  startDate: string
  endDate: string
  status: KPIStatus
  milestones?: {
    value: number
    label: string
    achieved: boolean
  }[]
  history?: {
    date: string
    value: number
  }[]
  createdAt: string
}

// ============================================
// 🎨 КОНФИГУРАЦИЯ
// ============================================

const CATEGORY_CONFIG: Record<KPICategory, { label: string; icon: any; color: string; bgColor: string }> = {
  revenue: { label: 'Выручка', icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  orders: { label: 'Заказы', icon: ShoppingCart, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  customers: { label: 'Клиенты', icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  conversion: { label: 'Конверсия', icon: Percent, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  other: { label: 'Другое', icon: Target, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
}

const PERIOD_CONFIG: Record<KPIPeriod, string> = {
  daily: 'День',
  weekly: 'Неделя',
  monthly: 'Месяц',
  quarterly: 'Квартал',
  yearly: 'Год',
}

const STATUS_CONFIG: Record<KPIStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  on_track: { label: 'В графике', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: CheckCircle },
  at_risk: { label: 'Под угрозой', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: AlertTriangle },
  behind: { label: 'Отстаёт', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: TrendingDown },
  completed: { label: 'Выполнено', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: Check },
  exceeded: { label: 'Превышено', color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: Trophy },
}

// Демо данные
const DEMO_GOALS: KPIGoal[] = [
  {
    id: '1',
    title: 'Выручка за месяц',
    description: 'Достичь 5 млн рублей выручки',
    category: 'revenue',
    period: 'monthly',
    targetValue: 5000000,
    currentValue: 3750000,
    startValue: 0,
    unit: '₽',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'on_track',
    milestones: [
      { value: 1000000, label: '1M', achieved: true },
      { value: 2500000, label: '2.5M', achieved: true },
      { value: 4000000, label: '4M', achieved: false },
      { value: 5000000, label: '5M', achieved: false },
    ],
    history: [
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-07', value: 850000 },
      { date: '2024-01-14', value: 1900000 },
      { date: '2024-01-21', value: 2800000 },
      { date: '2024-01-28', value: 3750000 },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    title: 'Новые клиенты',
    description: 'Привлечь 500 новых клиентов',
    category: 'customers',
    period: 'monthly',
    targetValue: 500,
    currentValue: 312,
    startValue: 0,
    unit: 'клиентов',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'at_risk',
    milestones: [
      { value: 100, label: '100', achieved: true },
      { value: 250, label: '250', achieved: true },
      { value: 400, label: '400', achieved: false },
      { value: 500, label: '500', achieved: false },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: '3',
    title: 'Конверсия сайта',
    description: 'Увеличить конверсию до 3.5%',
    category: 'conversion',
    period: 'quarterly',
    targetValue: 3.5,
    currentValue: 2.8,
    startValue: 2.1,
    unit: '%',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'on_track',
    createdAt: '2024-01-01',
  },
  {
    id: '4',
    title: 'Заказы в день',
    description: 'Достичь 100 заказов в день',
    category: 'orders',
    period: 'daily',
    targetValue: 100,
    currentValue: 127,
    startValue: 75,
    unit: 'заказов',
    startDate: '2024-01-28',
    endDate: '2024-01-28',
    status: 'exceeded',
    createdAt: '2024-01-28',
  },
]

// ============================================
// 🧩 КОМПОНЕНТЫ
// ============================================

interface KPICardProps {
  goal: KPIGoal
  onEdit: () => void
  onDelete: () => void
  onUpdateProgress: (value: number) => void
}

function KPICard({ goal, onEdit, onDelete, onUpdateProgress }: KPICardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
  const categoryConfig = CATEGORY_CONFIG[goal.category]
  const statusConfig = STATUS_CONFIG[goal.status]
  const CategoryIcon = categoryConfig.icon
  const StatusIcon = statusConfig.icon

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-gradient-to-r from-purple-500 to-pink-500'
    if (progress >= 75) return 'bg-gradient-to-r from-green-500 to-emerald-500'
    if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500'
    if (progress >= 25) return 'bg-gradient-to-r from-yellow-500 to-orange-500'
    return 'bg-gradient-to-r from-red-500 to-pink-500'
  }

  const formatValue = (value: number) => {
    if (goal.unit === '₽') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
      return value.toLocaleString('ru-RU')
    }
    if (goal.unit === '%') return value.toFixed(1)
    return value.toLocaleString('ru-RU')
  }

  const daysRemaining = () => {
    const end = new Date(goal.endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group">
      {/* Progress Bar Top */}
      <div className="h-1 bg-gray-700">
        <div 
          className={`h-full ${getProgressColor()} transition-all duration-500`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${categoryConfig.bgColor}`}>
              <CategoryIcon className={`h-5 w-5 ${categoryConfig.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
                <span className="text-xs text-gray-500">{PERIOD_CONFIG[goal.period]}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-3xl font-bold text-white">{formatValue(goal.currentValue)}</span>
              <span className="text-gray-400 ml-1">{goal.unit !== '₽' && goal.unit !== '%' ? goal.unit : ''}</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-400">из </span>
              <span className="text-lg font-semibold text-gray-300">{formatValue(goal.targetValue)}</span>
              <span className="text-gray-400 ml-1">{goal.unit}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 ${getProgressColor()} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
            {/* Milestones */}
            {goal.milestones?.map((milestone, idx) => {
              const pos = (milestone.value / goal.targetValue) * 100
              return (
                <div 
                  key={idx}
                  className={`absolute top-1/2 -translate-y-1/2 w-1 h-4 rounded ${milestone.achieved ? 'bg-white' : 'bg-gray-500'}`}
                  style={{ left: `${pos}%` }}
                />
              )
            })}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className={`text-2xl font-bold ${progress >= 100 ? 'text-purple-400' : 'text-white'}`}>
              {progress.toFixed(0)}%
            </span>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Clock className="h-4 w-4" />
              <span>{daysRemaining()} дней осталось</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-gray-400 mb-4">{goal.description}</p>
        )}

        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {goal.milestones.map((milestone, idx) => (
              <span 
                key={idx}
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1
                  ${milestone.achieved 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                  }
                `}
              >
                {milestone.achieved && <Check className="h-3 w-3" />}
                {milestone.label}
              </span>
            ))}
          </div>
        )}

        {/* Quick Update */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Обновить прогресс..."
              className="flex-1 bg-white/5 border-white/10 text-white h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat((e.target as HTMLInputElement).value)
                  if (!isNaN(value)) {
                    onUpdateProgress(value);
                    (e.target as HTMLInputElement).value = ''
                  }
                }
              }}
            />
            <Button size="sm" className="bg-purple-500 hover:bg-purple-600 h-9">
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// 📊 SUMMARY CARDS
// ============================================

function KPISummary({ goals }: { goals: KPIGoal[] }) {
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'exceeded').length
  const atRiskGoals = goals.filter(g => g.status === 'at_risk' || g.status === 'behind').length
  const avgProgress = goals.reduce((sum, g) => sum + (g.currentValue / g.targetValue) * 100, 0) / totalGoals

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalGoals}</p>
              <p className="text-sm text-blue-300">Всего целей</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Trophy className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{completedGoals}</p>
              <p className="text-sm text-green-300">Выполнено</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{atRiskGoals}</p>
              <p className="text-sm text-yellow-300">Под угрозой</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{avgProgress.toFixed(0)}%</p>
              <p className="text-sm text-purple-300">Средний прогресс</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// 🎯 ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

interface KPITrackerProps {
  onGoalsChange?: (goals: KPIGoal[]) => void
}

export function KPITracker({ onGoalsChange }: KPITrackerProps) {
  const [goals, setGoals] = useState<KPIGoal[]>(DEMO_GOALS)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<KPIGoal | null>(null)
  const [filter, setFilter] = useState<KPICategory | 'all'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'revenue' as KPICategory,
    period: 'monthly' as KPIPeriod,
    targetValue: '',
    currentValue: '',
    unit: '₽',
    endDate: '',
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'revenue',
      period: 'monthly',
      targetValue: '',
      currentValue: '',
      unit: '₽',
      endDate: '',
    })
    setEditingGoal(null)
  }

  const handleOpenDialog = (goal?: KPIGoal) => {
    if (goal) {
      setEditingGoal(goal)
      setFormData({
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        period: goal.period,
        targetValue: goal.targetValue.toString(),
        currentValue: goal.currentValue.toString(),
        unit: goal.unit,
        endDate: goal.endDate,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    const target = parseFloat(formData.targetValue)
    const current = parseFloat(formData.currentValue) || 0
    const progress = (current / target) * 100

    let status: KPIStatus = 'on_track'
    if (progress >= 100) status = 'exceeded'
    else if (progress >= 90) status = 'completed'
    else if (progress < 50) status = 'at_risk'
    else if (progress < 25) status = 'behind'

    const newGoal: KPIGoal = {
      id: editingGoal?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      period: formData.period,
      targetValue: target,
      currentValue: current,
      startValue: editingGoal?.startValue || 0,
      unit: formData.unit,
      startDate: editingGoal?.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      status,
      milestones: editingGoal?.milestones,
      history: editingGoal?.history,
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
    }

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? newGoal : g))
    } else {
      setGoals(prev => [...prev, newGoal])
    }

    setIsDialogOpen(false)
    resetForm()
    onGoalsChange?.(goals)
  }

  const handleDelete = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const handleUpdateProgress = (id: string, value: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g
      
      const newCurrent = g.currentValue + value
      const progress = (newCurrent / g.targetValue) * 100

      let status: KPIStatus = g.status
      if (progress >= 100) status = 'exceeded'
      else if (progress >= 90) status = 'completed'
      else if (progress >= 75) status = 'on_track'
      else if (progress >= 50) status = 'at_risk'
      else status = 'behind'

      return { ...g, currentValue: newCurrent, status }
    }))
  }

  const filteredGoals = filter === 'all' 
    ? goals 
    : goals.filter(g => g.category === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="h-7 w-7 text-purple-400" />
            KPI Трекер
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-sm font-medium rounded-full">
              {goals.length} целей
            </span>
          </h2>
          <p className="text-gray-400 mt-1">Отслеживайте прогресс и достигайте целей</p>
        </div>

        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" /> Новая цель
        </Button>
      </div>

      {/* Summary */}
      <KPISummary goals={goals} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-purple-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
        >
          Все
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key as KPICategory)}
            className={filter === key ? 'bg-purple-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}
          >
            <config.icon className="h-4 w-4 mr-1" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map(goal => (
          <KPICard
            key={goal.id}
            goal={goal}
            onEdit={() => handleOpenDialog(goal)}
            onDelete={() => handleDelete(goal.id)}
            onUpdateProgress={(value) => handleUpdateProgress(goal.id, value)}
          />
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/20">
          <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Нет целей</h3>
          <p className="text-gray-400 mb-4">Создайте первую цель для отслеживания</p>
          <Button onClick={() => handleOpenDialog()} className="bg-purple-500 hover:bg-purple-600">
            <Plus className="h-4 w-4 mr-2" /> Создать цель
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              {editingGoal ? 'Редактировать цель' : 'Новая цель'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Название</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Например: Выручка за месяц"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div>
              <Label>Описание (опционально)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Краткое описание цели"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Категория</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as KPICategory }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Период</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, period: v as KPIPeriod }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {Object.entries(PERIOD_CONFIG).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Целевое значение</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                  placeholder="5000000"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>

              <div>
                <Label>Текущее значение</Label>
                <Input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: e.target.value }))}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Единица измерения</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="₽" className="text-white hover:bg-gray-700">₽ (Рубли)</SelectItem>
                    <SelectItem value="%" className="text-white hover:bg-gray-700">% (Проценты)</SelectItem>
                    <SelectItem value="шт" className="text-white hover:bg-gray-700">шт (Штуки)</SelectItem>
                    <SelectItem value="заказов" className="text-white hover:bg-gray-700">Заказов</SelectItem>
                    <SelectItem value="клиентов" className="text-white hover:bg-gray-700">Клиентов</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Дата окончания</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-white/5 border-white/10 text-white">
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-purple-500 hover:bg-purple-600">
              {editingGoal ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KPITracker













