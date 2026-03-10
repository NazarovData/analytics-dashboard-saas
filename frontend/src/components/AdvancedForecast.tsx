import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Brain, RefreshCw, TrendingUp, TrendingDown, BarChart3, Zap,
  ChevronRight, DollarSign, Calendar, Activity
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

interface ForecastResult {
  success: boolean
  method: string
  horizon: number
  forecast: Array<{ date: string; value: number; lower: number; upper: number }>
  seasonality: { detected: boolean; period: number; strength: number; type?: string }
  accuracy: { mape: number; mae: number; rmse: number; r2: number }
  trend: { direction: string; label: string; current_change_pct: number; forecast_change_pct: number }
  confidence: number
  historical_summary: { min: number; max: number; mean: number; std: number; data_points: number }
  recommendations: string[]
}

export function AdvancedForecast() {
  const [data, setData] = useState<ForecastResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [horizon, setHorizon] = useState(30)
  const [method, setMethod] = useState('auto')

  useEffect(() => {
    loadForecast()
  }, [])

  const loadForecast = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/advanced/ml/advanced-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horizon, method, confidence: 0.95 })
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error loading forecast:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare chart data
  const chartData = data?.forecast?.map(f => ({
    date: f.date,
    value: f.value,
    lower: f.lower,
    upper: f.upper,
    range: [f.lower, f.upper]
  })) || []

  const methodLabels: Record<string, string> = {
    auto: 'Автоматический',
    arima: 'ARIMA',
    exponential: 'Экспоненциальное сглаживание',
    linear: 'Линейная регрессия'
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Горизонт:</span>
          {[7, 14, 30, 60].map(d => (
            <button
              key={d}
              onClick={() => { setHorizon(d); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                horizon === d
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {d} дн.
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Метод:</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="auto">Авто</option>
            <option value="arima">ARIMA</option>
            <option value="exponential">Экспоненциальное</option>
            <option value="linear">Линейная</option>
          </select>
        </div>

        <Button
          onClick={loadForecast}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Прогноз
        </Button>
      </div>

      {/* Metrics */}
      {data?.success && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Brain className="h-3.5 w-3.5" />
                <span className="text-xs">Метод</span>
              </div>
              <div className="text-sm font-bold text-purple-400">
                {methodLabels[data.method] || data.method}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs">MAPE</span>
              </div>
              <div className={`text-lg font-bold ${data.accuracy.mape < 10 ? 'text-green-400' : data.accuracy.mape < 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                {data.accuracy.mape}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                {data.trend.direction === 'growing' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span className="text-xs">Тренд</span>
              </div>
              <div className={`text-lg font-bold ${data.trend.direction === 'growing' ? 'text-green-400' : data.trend.direction === 'declining' ? 'text-red-400' : 'text-gray-300'}`}>
                {data.trend.forecast_change_pct > 0 ? '+' : ''}{data.trend.forecast_change_pct}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs">Сезонность</span>
              </div>
              <div className="text-sm font-bold text-white">
                {data.seasonality.detected
                  ? `${data.seasonality.type === 'weekly' ? 'Недельная' : data.seasonality.type === 'monthly' ? 'Месячная' : `${data.seasonality.period} дн.`} (${Math.round(data.seasonality.strength * 100)}%)`
                  : 'Не обнаружена'
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs">R²</span>
              </div>
              <div className="text-lg font-bold text-white">
                {data.accuracy.r2}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Прогноз на {horizon} дней
            {data?.success && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({methodLabels[data.method] || data.method}, {Math.round(data.confidence * 100)}% доверие)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <span className="ml-3 text-gray-400">Обучение модели...</span>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorForecastAdv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: '#888', fontSize: 10 }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                  stroke="#666"
                  tick={{ fill: '#888' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    const label = name === 'value' ? 'Прогноз' : name === 'upper' ? 'Верхняя граница' : 'Нижняя граница'
                    return [`${value.toLocaleString('ru-RU')} ₽`, label]
                  }}
                  labelFormatter={(l) => new Date(l).toLocaleDateString('ru-RU')}
                />
                <Legend />
                <Area type="monotone" dataKey="upper" stroke="transparent" fill="url(#colorCI)" name="Верх. граница" />
                <Area type="monotone" dataKey="lower" stroke="transparent" fill="transparent" name="Ниж. граница" />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorForecastAdv)" name="Прогноз" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400">
              Нажмите "Прогноз" для генерации
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data?.success && data.recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              AI Рекомендации
            </h4>
            <div className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                  <ChevronRight className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
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
