/**
 * 📊 Компонент сравнения периодов
 * Использует РЕАЛЬНЫЕ данные из загруженного файла
 */

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, BarChart3, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyRevenue {
  date: string
  revenue: number
}

interface AnalyticsData {
  total_revenue?: number
  total_orders?: number
  unique_clients?: number
  average_check?: number
  daily_revenue?: DailyRevenue[]
  [key: string]: any
}

interface PeriodComparisonProps {
  dailyRevenue?: DailyRevenue[]
  analytics?: AnalyticsData
}

interface MetricRow {
  key: string
  label: string
  current: number
  previous: number
  format: 'currency' | 'number' | 'percent'
  invertPositive?: boolean // true = снижение — хорошо (например отток)
}

type PeriodType = 'week' | 'month' | 'quarter' | 'half'

const periodLabels: Record<PeriodType, string> = {
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  half: 'Полупериод',
}

// Русские названия месяцев
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

function formatPeriodLabel(dates: Date[], type: PeriodType): string {
  if (dates.length === 0) return '—'
  const first = dates[0]
  const last = dates[dates.length - 1]

  if (type === 'month') {
    return `${monthNames[first.getMonth()]} ${first.getFullYear()}`
  }
  if (type === 'quarter') {
    const q = Math.floor(first.getMonth() / 3) + 1
    return `Q${q} ${first.getFullYear()}`
  }

  // week / half — показываем диапазон
  const fmtShort = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${fmtShort(first)} – ${fmtShort(last)}`
}

export function PeriodComparison({ dailyRevenue, analytics }: PeriodComparisonProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('half')

  // Вычисляем всё из реальных данных
  const comparison = useMemo(() => {
    const dr = dailyRevenue || analytics?.daily_revenue
    if (!dr || dr.length < 2) return null

    // Парсим даты и сортируем
    const parsed = dr
      .map(d => ({ ...d, _date: new Date(d.date) }))
      .filter(d => !isNaN(d._date.getTime()))
      .sort((a, b) => a._date.getTime() - b._date.getTime())

    if (parsed.length < 2) return null

    // Разбиваем на 2 периода в зависимости от типа
    let currentItems: typeof parsed = []
    let previousItems: typeof parsed = []

    if (periodType === 'half') {
      // Просто пополам
      const mid = Math.floor(parsed.length / 2)
      previousItems = parsed.slice(0, mid)
      currentItems = parsed.slice(mid)
    } else if (periodType === 'week') {
      // Последние 7 дней vs предыдущие 7
      const last = parsed[parsed.length - 1]._date.getTime()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      currentItems = parsed.filter(d => last - d._date.getTime() < weekMs)
      previousItems = parsed.filter(d => {
        const diff = last - d._date.getTime()
        return diff >= weekMs && diff < weekMs * 2
      })
    } else if (periodType === 'month') {
      // Последний месяц данных vs предыдущий
      const lastDate = parsed[parsed.length - 1]._date
      const curMonth = lastDate.getMonth()
      const curYear = lastDate.getFullYear()
      const prevMonth = curMonth === 0 ? 11 : curMonth - 1
      const prevYear = curMonth === 0 ? curYear - 1 : curYear

      currentItems = parsed.filter(d => d._date.getMonth() === curMonth && d._date.getFullYear() === curYear)
      previousItems = parsed.filter(d => d._date.getMonth() === prevMonth && d._date.getFullYear() === prevYear)
    } else if (periodType === 'quarter') {
      // Последний квартал vs предыдущий
      const lastDate = parsed[parsed.length - 1]._date
      const curQ = Math.floor(lastDate.getMonth() / 3)
      const curYear = lastDate.getFullYear()
      const prevQ = curQ === 0 ? 3 : curQ - 1
      const prevYear = curQ === 0 ? curYear - 1 : curYear

      currentItems = parsed.filter(d => {
        const q = Math.floor(d._date.getMonth() / 3)
        return q === curQ && d._date.getFullYear() === curYear
      })
      previousItems = parsed.filter(d => {
        const q = Math.floor(d._date.getMonth() / 3)
        return q === prevQ && d._date.getFullYear() === prevYear
      })
    }

    if (currentItems.length === 0 || previousItems.length === 0) {
      // Fallback: пополам
      const mid = Math.floor(parsed.length / 2)
      previousItems = parsed.slice(0, mid)
      currentItems = parsed.slice(mid)
    }

    // Считаем метрики из daily_revenue
    const curRevenue = currentItems.reduce((s, d) => s + (d.revenue || 0), 0)
    const prevRevenue = previousItems.reduce((s, d) => s + (d.revenue || 0), 0)
    const curOrders = currentItems.length
    const prevOrders = previousItems.length
    const curAvg = curOrders > 0 ? curRevenue / curOrders : 0
    const prevAvg = prevOrders > 0 ? prevRevenue / prevOrders : 0
    // Среднедневная
    const curDaily = curOrders > 0 ? curRevenue / curOrders : 0
    const prevDaily = prevOrders > 0 ? prevRevenue / prevOrders : 0

    const metrics: MetricRow[] = [
      { key: 'revenue', label: 'Выручка', current: curRevenue, previous: prevRevenue, format: 'currency' },
      { key: 'days', label: 'Дней в периоде', current: curOrders, previous: prevOrders, format: 'number' },
      { key: 'daily_avg', label: 'Средняя за день', current: curDaily, previous: prevDaily, format: 'currency' },
    ]

    // Лейблы периодов
    const curDates = currentItems.map(d => d._date)
    const prevDates = previousItems.map(d => d._date)
    const curLabel = formatPeriodLabel(curDates, periodType)
    const prevLabel = formatPeriodLabel(prevDates, periodType)

    // Общий подсчёт
    const positiveCount = metrics.filter(m => {
      const change = m.current - m.previous
      return m.invertPositive ? change < 0 : change > 0
    }).length

    return {
      metrics,
      curLabel,
      prevLabel,
      positiveCount,
      totalMetrics: metrics.length,
      overallPositive: positiveCount > metrics.length / 2,
      dataRange: {
        from: parsed[0]._date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        to: parsed[parsed.length - 1]._date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
        totalDays: parsed.length,
      }
    }
  }, [dailyRevenue, analytics, periodType])

  // Форматирование
  const fmtCurrency = (v: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(v)
  const fmtNumber = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))
  const fmtPercent = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`

  const formatValue = (v: number, fmt: 'currency' | 'number' | 'percent') => {
    if (fmt === 'currency') return fmtCurrency(v)
    if (fmt === 'percent') return `${v.toFixed(1)}%`
    return fmtNumber(v)
  }

  // Нет данных
  if (!comparison) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-gray-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Для сравнения периодов загрузите файл с колонками "дата" и "выручка" (минимум 2 дня данных)</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Сравнение периодов
          </CardTitle>
          <div className="flex gap-1.5">
            {(Object.keys(periodLabels) as PeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  periodType === type
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {periodLabels[type]}
              </button>
            ))}
          </div>
        </div>
        
        {/* Реальные даты из файла */}
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-medium">{comparison.curLabel}</span>
            <span className="text-gray-600">vs</span>
            <span className="text-gray-400">{comparison.prevLabel}</span>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Данные: {comparison.dataRange.from} — {comparison.dataRange.to} ({comparison.dataRange.totalDays} дней)
          </p>
        </div>
      </CardHeader>

      <CardContent>
        {/* Общий тренд */}
        <div className="mb-5 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Общий тренд</p>
              <h3 className="text-xl font-bold text-white">{comparison.curLabel}</h3>
            </div>
            <div className="text-right">
              {comparison.overallPositive ? (
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-lg font-bold">
                    {comparison.positiveCount}/{comparison.totalMetrics} метрик ↗
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <TrendingDown className="w-5 h-5" />
                  <span className="text-lg font-bold">
                    {comparison.totalMetrics - comparison.positiveCount}/{comparison.totalMetrics} метрик ↘
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Метрики */}
        <div className="space-y-3">
          {comparison.metrics.map((metric) => {
            const change = metric.current - metric.previous
            const changePct = metric.previous !== 0
              ? (change / Math.abs(metric.previous)) * 100
              : metric.current > 0 ? 100 : 0
            const isPositive = metric.invertPositive ? change < 0 : change > 0

            return (
              <div
                key={metric.key}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/20 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white mb-1">{metric.label}</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Текущий:</span>
                        <span className="ml-1.5 text-white font-medium">{formatValue(metric.current, metric.format)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Предыдущий:</span>
                        <span className="ml-1.5 text-gray-400">{formatValue(metric.previous, metric.format)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-sm ${
                    isPositive
                      ? 'bg-green-500/15 text-green-400'
                      : changePct === 0
                      ? 'bg-white/5 text-gray-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : changePct !== 0 ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : null}
                    <span>{fmtPercent(changePct)}</span>
                  </div>
                </div>
                
                {/* Прогресс бар */}
                <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isPositive ? 'bg-gradient-to-r from-green-500 to-emerald-400' : changePct === 0 ? 'bg-gray-600' : 'bg-gradient-to-r from-red-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, Math.abs(changePct)))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Рекомендация */}
        <div className="mt-5 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/15 rounded-xl">
          <p className="text-sm text-blue-300">
            {(() => {
              const revMetric = comparison.metrics.find(m => m.key === 'revenue')
              if (!revMetric) return 'Загрузите данные с датами для детального анализа.'
              const revChange = revMetric.previous !== 0 ? ((revMetric.current - revMetric.previous) / Math.abs(revMetric.previous)) * 100 : 0
              if (revChange > 10) return `Отличный рост выручки на ${revChange.toFixed(1)}%! Продолжайте текущую стратегию.`
              if (revChange > 0) return `Выручка выросла на ${revChange.toFixed(1)}%. Стабильный рост, ищите точки масштабирования.`
              if (revChange > -10) return `Выручка снизилась на ${Math.abs(revChange).toFixed(1)}%. Проанализируйте причины и скорректируйте стратегию.`
              return `Выручка упала на ${Math.abs(revChange).toFixed(1)}%. Срочно: проверьте маркетинг, качество товара и конкурентов.`
            })()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
