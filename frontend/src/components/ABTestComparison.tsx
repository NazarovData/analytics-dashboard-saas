import { useState } from 'react'
import { TrendingUp, TrendingDown, Award, Users, DollarSign, Percent, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'

interface ABTestResult {
  variant: string
  name: string
  color: string
  metrics: {
    revenue: number
    orders: number
    conversion?: number
    avgCheck: number
    customers: number
  }
}

interface ABTestComparisonProps {
  testName: string
  description: string
  variantA: ABTestResult
  variantB: ABTestResult
  statistical_significance?: number
  winner?: 'A' | 'B' | 'tie'
  recommendation: string
}

export function ABTestComparison({
  testName,
  description,
  variantA,
  variantB,
  statistical_significance = 0,
  winner,
  recommendation
}: ABTestComparisonProps) {
  const [showDetails, setShowDetails] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value)
  }

  const calculateDifference = (metricA: number, metricB: number): { value: number; percentage: number; isPositive: boolean } => {
    const diff = metricB - metricA
    const percentage = metricA > 0 ? (diff / metricA) * 100 : 0
    return {
      value: diff,
      percentage,
      isPositive: diff > 0
    }
  }

  const revenueDiff = calculateDifference(variantA.metrics.revenue, variantB.metrics.revenue)
  const ordersDiff = calculateDifference(variantA.metrics.orders, variantB.metrics.orders)
  const avgCheckDiff = calculateDifference(variantA.metrics.avgCheck, variantB.metrics.avgCheck)
  const conversionDiff = variantA.metrics.conversion && variantB.metrics.conversion 
    ? calculateDifference(variantA.metrics.conversion, variantB.metrics.conversion)
    : null

  const getSignificanceStatus = () => {
    if (statistical_significance >= 95) return { color: 'text-green-400', icon: <CheckCircle className="h-5 w-5" />, text: 'Достоверно' }
    if (statistical_significance >= 80) return { color: 'text-yellow-400', icon: <AlertTriangle className="h-5 w-5" />, text: 'Вероятно' }
    return { color: 'text-gray-400', icon: <Info className="h-5 w-5" />, text: 'Недостаточно данных' }
  }

  const significanceStatus = getSignificanceStatus()

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-lg border-purple-500/30 animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-purple-400" />
                </div>
                {testName}
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2">{description}</CardDescription>
            </div>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              {showDetails ? 'Скрыть детали' : 'Показать детали'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Variant A */}
        <Card className={`backdrop-blur-lg border-2 transition-all ${
          winner === 'A' 
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 scale-105' 
            : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30'
        } card-hover animate-fade-in-up`}>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${variantA.color}`}></div>
                {variantA.name}
              </div>
              {winner === 'A' && (
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Победитель
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <MetricRow
                icon={<DollarSign className="h-5 w-5 text-blue-400" />}
                label="Выручка"
                value={formatCurrency(variantA.metrics.revenue)}
              />
              <MetricRow
                icon={<Users className="h-5 w-5 text-purple-400" />}
                label="Заказов"
                value={variantA.metrics.orders.toString()}
              />
              <MetricRow
                icon={<DollarSign className="h-5 w-5 text-green-400" />}
                label="Средний чек"
                value={formatCurrency(variantA.metrics.avgCheck)}
              />
              {variantA.metrics.conversion !== undefined && (
                <MetricRow
                  icon={<Percent className="h-5 w-5 text-yellow-400" />}
                  label="Конверсия"
                  value={`${variantA.metrics.conversion.toFixed(1)}%`}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Variant B */}
        <Card className={`backdrop-blur-lg border-2 transition-all ${
          winner === 'B' 
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50 scale-105' 
            : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30'
        } card-hover animate-fade-in-up`} style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${variantB.color}`}></div>
                {variantB.name}
              </div>
              {winner === 'B' && (
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30 flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  Победитель
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <MetricRow
                icon={<DollarSign className="h-5 w-5 text-blue-400" />}
                label="Выручка"
                value={formatCurrency(variantB.metrics.revenue)}
                diff={revenueDiff}
              />
              <MetricRow
                icon={<Users className="h-5 w-5 text-purple-400" />}
                label="Заказов"
                value={variantB.metrics.orders.toString()}
                diff={ordersDiff}
              />
              <MetricRow
                icon={<DollarSign className="h-5 w-5 text-green-400" />}
                label="Средний чек"
                value={formatCurrency(variantB.metrics.avgCheck)}
                diff={avgCheckDiff}
              />
              {variantB.metrics.conversion !== undefined && conversionDiff && (
                <MetricRow
                  icon={<Percent className="h-5 w-5 text-yellow-400" />}
                  label="Конверсия"
                  value={`${variantB.metrics.conversion.toFixed(1)}%`}
                  diff={conversionDiff}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg border-blue-500/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {significanceStatus.icon}
              <div>
                <p className="text-white font-semibold">Статистическая значимость: {statistical_significance.toFixed(0)}%</p>
                <p className={`text-sm ${significanceStatus.color}`}>{significanceStatus.text}</p>
              </div>
            </div>
            <div className="text-right">
              {statistical_significance >= 95 ? (
                <p className="text-green-300 text-sm">✅ Можно доверять результатам</p>
              ) : statistical_significance >= 80 ? (
                <p className="text-yellow-300 text-sm">⚠️ Нужно больше данных</p>
              ) : (
                <p className="text-gray-400 text-sm">⏳ Продолжайте тестирование</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      {showDetails && (
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 backdrop-blur-lg border-gray-500/30 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-white">Детальное сравнение</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-400">Метрика</th>
                    <th className="text-right py-3 px-4 text-gray-400">{variantA.name}</th>
                    <th className="text-right py-3 px-4 text-gray-400">{variantB.name}</th>
                    <th className="text-right py-3 px-4 text-gray-400">Разница</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Выручка</td>
                    <td className="text-right py-3 px-4">{formatCurrency(variantA.metrics.revenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(variantB.metrics.revenue)}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${revenueDiff.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {revenueDiff.isPositive ? '+' : ''}{revenueDiff.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Заказов</td>
                    <td className="text-right py-3 px-4">{variantA.metrics.orders}</td>
                    <td className="text-right py-3 px-4">{variantB.metrics.orders}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${ordersDiff.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {ordersDiff.isPositive ? '+' : ''}{ordersDiff.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4">Средний чек</td>
                    <td className="text-right py-3 px-4">{formatCurrency(variantA.metrics.avgCheck)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(variantB.metrics.avgCheck)}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${avgCheckDiff.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {avgCheckDiff.isPositive ? '+' : ''}{avgCheckDiff.percentage.toFixed(1)}%
                    </td>
                  </tr>
                  {conversionDiff && (
                    <tr>
                      <td className="py-3 px-4">Конверсия</td>
                      <td className="text-right py-3 px-4">{variantA.metrics.conversion?.toFixed(1)}%</td>
                      <td className="text-right py-3 px-4">{variantB.metrics.conversion?.toFixed(1)}%</td>
                      <td className={`text-right py-3 px-4 font-semibold ${conversionDiff.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {conversionDiff.isPositive ? '+' : ''}{conversionDiff.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-lg border-green-500/30 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">✅ Рекомендация:</h4>
              <p className="text-gray-300 leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricRow({ 
  icon, 
  label, 
  value, 
  diff 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  diff?: { value: number; percentage: number; isPositive: boolean }
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-lg">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-gray-300 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold">{value}</span>
        {diff && Math.abs(diff.percentage) > 0.1 && (
          <span className={`text-xs font-medium flex items-center gap-1 ${
            diff.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {diff.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(diff.percentage).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  )
}

// Утилита для анализа A/B тестов из данных
export function analyzeABTest(data: any, variantColumn: string = 'variant'): ABTestComparisonProps | null {
  if (!data || !Array.isArray(data)) return null

  // Группируем данные по вариантам
  const variantA = data.filter(row => row[variantColumn] === 'A')
  const variantB = data.filter(row => row[variantColumn] === 'B')

  if (variantA.length === 0 || variantB.length === 0) return null

  // Рассчитываем метрики для варианта A
  const metricsA = {
    revenue: variantA.reduce((sum, row) => sum + (row.revenue || row.amount || 0), 0),
    orders: variantA.length,
    customers: new Set(variantA.map(row => row.customer || row.client_id)).size,
    avgCheck: 0
  }
  metricsA.avgCheck = metricsA.revenue / metricsA.orders

  // Рассчитываем метрики для варианта B
  const metricsB = {
    revenue: variantB.reduce((sum, row) => sum + (row.revenue || row.amount || 0), 0),
    orders: variantB.length,
    customers: new Set(variantB.map(row => row.customer || row.client_id)).size,
    avgCheck: 0
  }
  metricsB.avgCheck = metricsB.revenue / metricsB.orders

  // Определяем победителя
  const winner = metricsB.revenue > metricsA.revenue ? 'B' : metricsA.revenue > metricsB.revenue ? 'A' : 'tie'

  // Рассчитываем статистическую значимость (упрощенно)
  const totalSamples = variantA.length + variantB.length
  const minSampleSize = 100
  const significance = Math.min(95, (totalSamples / minSampleSize) * 95)

  // Формируем рекомендацию
  let recommendation = ''
  if (significance < 80) {
    recommendation = `Недостаточно данных для уверенных выводов. Продолжайте тестирование еще ${minSampleSize - totalSamples} транзакций.`
  } else {
    const revenueDiff = ((metricsB.revenue - metricsA.revenue) / metricsA.revenue) * 100
    if (winner === 'B') {
      recommendation = `Вариант B показал лучший результат с выручкой на ${Math.abs(revenueDiff).toFixed(1)}% выше. Рекомендуем использовать вариант B для всех клиентов.`
    } else if (winner === 'A') {
      recommendation = `Вариант A показал лучший результат с выручкой на ${Math.abs(revenueDiff).toFixed(1)}% выше. Рекомендуем остаться на варианте A.`
    } else {
      recommendation = `Оба варианта показали одинаковые результаты. Можете выбрать любой или продолжить тестирование для большей уверенности.`
    }
  }

  return {
    testName: 'A/B Тест',
    description: 'Сравнение двух вариантов для определения наиболее эффективного',
    variantA: {
      variant: 'A',
      name: 'Вариант A',
      color: 'bg-blue-500',
      metrics: metricsA
    },
    variantB: {
      variant: 'B',
      name: 'Вариант B',
      color: 'bg-purple-500',
      metrics: metricsB
    },
    statistical_significance: significance,
    winner: winner as 'A' | 'B' | 'tie',
    recommendation
  }
}





