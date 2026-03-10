import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingDown, TrendingUp, RefreshCw, AlertTriangle, Award } from 'lucide-react'

interface CohortData {
  success: boolean
  cohorts: Array<{
    cohort: string
    size: number
    retention: number[]
    ltv: number
  }>
  heatmap: {
    data: number[][]
    row_labels: string[]
    col_labels: string[]
    max_period: number
  }
  summary: {
    avg_retention_m1: number
    avg_retention_m3: number
    best_cohort: string
    best_cohort_retention: number
    worst_cohort: string
    worst_cohort_retention: number
    avg_cohort_size: number
    avg_ltv: number
    total_cohorts: number
  }
  high_churn_cohorts: Array<{
    cohort: string
    size: number
    m1_retention: number
    churn_rate: number
    severity: string
  }>
  recommendations: string[]
  total_customers: number
  total_cohorts: number
}

const getRetentionColor = (value: number): string => {
  if (value >= 80) return 'bg-green-500'
  if (value >= 60) return 'bg-green-400'
  if (value >= 40) return 'bg-yellow-400'
  if (value >= 20) return 'bg-orange-400'
  if (value > 0) return 'bg-red-400'
  return 'bg-gray-700'
}

const getRetentionTextColor = (value: number): string => {
  if (value >= 40) return 'text-black'
  return 'text-white'
}

export function CohortHeatmap() {
  const [data, setData] = useState<CohortData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/advanced/cohorts/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading cohort data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
        <span className="ml-3 text-gray-400">Анализ когорт...</span>
      </div>
    )
  }

  if (!data || !data.success) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p>Нет данных для когортного анализа</p>
        <Button onClick={loadData} className="mt-4 bg-purple-500 hover:bg-purple-600">
          Загрузить демо-данные
        </Button>
      </div>
    )
  }

  const { heatmap, summary, cohorts, high_churn_cohorts, recommendations } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Всего клиентов</span>
            </div>
            <div className="text-2xl font-bold text-white">{data.total_customers}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Retention M1</span>
            </div>
            <div className={`text-2xl font-bold ${summary.avg_retention_m1 >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
              {summary.avg_retention_m1}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Award className="h-4 w-4" />
              <span className="text-sm">Лучшая когорта</span>
            </div>
            <div className="text-lg font-bold text-white">{summary.best_cohort}</div>
            <div className="text-sm text-green-400">{summary.best_cohort_retention}% retention</div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Худшая когорта</span>
            </div>
            <div className="text-lg font-bold text-white">{summary.worst_cohort}</div>
            <div className="text-sm text-red-400">{summary.worst_cohort_retention}% retention</div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Когортный Retention Heatmap
          </CardTitle>
          <Button onClick={loadData} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" /> Обновить
          </Button>
        </CardHeader>
        <CardContent>
          {heatmap && heatmap.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-sm font-semibold text-gray-400 sticky left-0 bg-[#0a0a0f] z-10">
                      Когорта
                    </th>
                    <th className="p-2 text-sm font-semibold text-gray-400 text-center">Размер</th>
                    {heatmap.col_labels.map((label, i) => (
                      <th key={i} className="p-2 text-sm font-semibold text-gray-400 text-center min-w-[70px]">
                        {label}
                      </th>
                    ))}
                    <th className="p-2 text-sm font-semibold text-gray-400 text-center">LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {heatmap.row_labels.map((row, rowIdx) => {
                    const cohort = cohorts.find(c => c.cohort === row)
                    return (
                      <tr key={rowIdx} className="border-t border-white/5">
                        <td className="p-2 text-sm font-medium text-white sticky left-0 bg-[#0a0a0f] z-10">
                          {row}
                        </td>
                        <td className="p-2 text-sm text-center text-gray-300">
                          {cohort?.size || 0}
                        </td>
                        {heatmap.data[rowIdx]?.map((value, colIdx) => (
                          <td key={colIdx} className="p-1 text-center">
                            {value > 0 ? (
                              <div
                                className={`
                                  rounded px-2 py-1.5 text-xs font-bold transition-all
                                  ${getRetentionColor(value)} ${getRetentionTextColor(value)}
                                `}
                                style={{ opacity: Math.max(0.4, value / 100) }}
                                title={`${row}, ${heatmap.col_labels[colIdx]}: ${value}%`}
                              >
                                {value}%
                              </div>
                            ) : (
                              <div className="text-gray-600 text-xs">-</div>
                            )}
                          </td>
                        ))}
                        <td className="p-2 text-sm text-center font-semibold text-purple-400">
                          {cohort?.ltv ? `${(cohort.ltv / 1000).toFixed(0)}K` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Нет данных для heatmap</p>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <span className="text-xs text-gray-400">Retention:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-red-400" />
              <span className="text-xs text-gray-500">0-20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-orange-400" />
              <span className="text-xs text-gray-500">20-40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-yellow-400" />
              <span className="text-xs text-gray-500">40-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-green-400" />
              <span className="text-xs text-gray-500">60-80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 rounded bg-green-500" />
              <span className="text-xs text-gray-500">80-100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Churn Cohorts */}
      {high_churn_cohorts && high_churn_cohorts.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Когорты с высоким оттоком
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {high_churn_cohorts.map((cohort, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <span className="font-semibold text-white">{cohort.cohort}</span>
                    <span className="text-sm text-gray-400 ml-3">{cohort.size} клиентов</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${cohort.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                      -{cohort.churn_rate}% отток
                    </span>
                    <span className="text-sm text-gray-400 ml-2">({cohort.m1_retention}% retention)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" />
              Рекомендации
            </h4>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                  <span className="text-purple-400 mt-0.5">&#8226;</span>
                  {rec}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
