import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, TrendingUp, TrendingDown, Users, AlertTriangle, 
  Target, Brain, Map, Activity, BarChart3, Zap, RefreshCw,
  ChevronRight, DollarSign, Clock
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, Legend, ComposedChart
} from 'recharts'
import { Heatmap, SalesHeatmap } from '@/components/charts/Heatmap'
import { FunnelChart, SalesFunnel, MarketingFunnel } from '@/components/charts/FunnelChart'
import { GeoMap, RussiaSalesMap } from '@/components/charts/GeoMap'
import { CohortHeatmap } from '@/components/CohortHeatmap'
import { AdvancedForecast } from '@/components/AdvancedForecast'

interface ForecastData {
  historical: Array<{ date: string; value: number; type: string }>
  forecast: Array<{ date: string; value: number; type: string }>
  confidence: {
    lower: Array<{ date: string; value: number }>
    upper: Array<{ date: string; value: number }>
  }
  metrics: {
    total_forecast: number
    average_daily: number
    growth_rate: number
    confidence_level: number
    model_accuracy: number
  }
  insights: string[]
}

interface ChurnCustomer {
  id: string
  name: string
  churn_probability: number
  risk_level: string
  ltv: number
  ltv_at_risk: number
  last_purchase_days: number
  risk_factors: string[]
  recommended_action: string
}

interface ChurnData {
  customers: ChurnCustomer[]
  summary: {
    total_analyzed: number
    high_risk_count: number
    medium_risk_count: number
    low_risk_count: number
    total_ltv_at_risk: number
    average_churn_probability: number
    model_accuracy: number
  }
  risk_distribution: {
    high: number
    medium: number
    low: number
  }
  recommendations: Array<{ priority: string; action: string; impact: string }>
  insights: string[]
}

export default function AdvancedAnalyticsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'forecast' | 'advforecast' | 'cohorts' | 'churn' | 'heatmap' | 'funnel' | 'geo'>('advforecast')
  const [isLoading, setIsLoading] = useState(false)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [churnData, setChurnData] = useState<ChurnData | null>(null)

  useEffect(() => {
    if (activeTab === 'forecast' && !forecastData) {
      loadForecast()
    } else if (activeTab === 'churn' && !churnData) {
      loadChurn()
    }
  }, [activeTab])

  const loadForecast = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/advanced/ml/sales-forecast?days=30')
      if (res.ok) {
        const data = await res.json()
        setForecastData(data)
      }
    } catch (error) {
      console.error('Error loading forecast:', error)
      // Generate mock data for demo
      generateMockForecast()
    } finally {
      setIsLoading(false)
    }
  }

  const loadChurn = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/advanced/ml/churn-prediction')
      if (res.ok) {
        const data = await res.json()
        setChurnData(data)
      }
    } catch (error) {
      console.error('Error loading churn:', error)
      generateMockChurn()
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockForecast = () => {
    const historical = []
    const forecast = []
    let value = 150000
    
    for (let i = 30; i > 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      value = value * (0.97 + Math.random() * 0.06)
      historical.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        type: 'historical'
      })
    }
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      value = value * (0.98 + Math.random() * 0.05)
      forecast.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        type: 'forecast'
      })
    }
    
    setForecastData({
      historical,
      forecast,
      confidence: { lower: [], upper: [] },
      metrics: {
        total_forecast: forecast.reduce((a, b) => a + b.value, 0),
        average_daily: Math.round(value),
        growth_rate: 12.5,
        confidence_level: 95,
        model_accuracy: 87.5
      },
      insights: [
        '📈 Прогнозируемый рост: +12.5%',
        '💰 Ожидаемая выручка: 4,500,000 ₽',
        '📅 Пиковые дни: вторник-четверг'
      ]
    })
  }

  const generateMockChurn = () => {
    const customers: ChurnCustomer[] = [
      { id: 'C1001', name: 'ООО МегаТех', churn_probability: 85.2, risk_level: 'high', ltv: 450000, ltv_at_risk: 383400, last_purchase_days: 45, risk_factors: ['Снижение частоты покупок', 'Негативный отзыв'], recommended_action: '🚨 Срочно: персональный звонок' },
      { id: 'C1002', name: 'ИП Иванов А.А.', churn_probability: 72.8, risk_level: 'high', ltv: 280000, ltv_at_risk: 203840, last_purchase_days: 38, risk_factors: ['Уменьшение среднего чека'], recommended_action: '🚨 Срочно: персональный звонок' },
      { id: 'C1003', name: 'ООО Техника', churn_probability: 58.5, risk_level: 'medium', ltv: 320000, ltv_at_risk: 187200, last_purchase_days: 22, risk_factors: ['Давно не заходил на сайт'], recommended_action: '📧 Персональное предложение' },
    ]
    
    setChurnData({
      customers,
      summary: {
        total_analyzed: 150,
        high_risk_count: 12,
        medium_risk_count: 35,
        low_risk_count: 103,
        total_ltv_at_risk: 2850000,
        average_churn_probability: 32.5,
        model_accuracy: 82.3
      },
      risk_distribution: { high: 8, medium: 23.3, low: 68.7 },
      recommendations: [
        { priority: 'urgent', action: 'Персональные звонки VIP-клиентам', impact: 'Сохранение 2.5M ₽' },
        { priority: 'high', action: 'Email с персональными скидками', impact: 'Снижение оттока на 15%' }
      ],
      insights: ['⚠️ 12 клиентов требуют внимания', '💰 Потенциальные потери: 2,850,000 ₽']
    })
  }

  const tabs = [
    { id: 'advforecast', label: 'ARIMA Прогноз', icon: Brain },
    { id: 'cohorts', label: 'Когорты', icon: Users },
    { id: 'forecast', label: 'ML Прогноз', icon: TrendingUp },
    { id: 'churn', label: 'Churn (Отток)', icon: AlertTriangle },
    { id: 'heatmap', label: 'Тепловая карта', icon: Activity },
    { id: 'funnel', label: 'Воронка', icon: Target },
    { id: 'geo', label: 'Гео-карта', icon: Map },
  ]

  // Combine historical and forecast data for chart
  const chartData = forecastData ? [
    ...forecastData.historical.map(d => ({ ...d, forecast: null })),
    ...forecastData.forecast.map(d => ({ ...d, historical: null, forecast: d.value }))
  ] : []

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/industries')}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AI Аналитика</h1>
                  <p className="text-sm text-gray-400">ML-прогнозы и расширенные графики</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm">ML-модели активны</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'advforecast' && (
          <AdvancedForecast />
        )}

        {activeTab === 'cohorts' && (
          <CohortHeatmap />
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            {forecastData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Прогноз выручки</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {(forecastData.metrics.total_forecast / 1000000).toFixed(1)}M ₽
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Рост</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      +{forecastData.metrics.growth_rate}%
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="text-sm">Средний день</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {forecastData.metrics.average_daily.toLocaleString('ru-RU')} ₽
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Точность модели</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {forecastData.metrics.model_accuracy}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Chart */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-400" />
                  ML Прогноз продаж на 30 дней
                </CardTitle>
                <Button
                  onClick={loadForecast}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-2" />
                      <p className="text-gray-400">Обучение модели...</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData}>
                      <defs>
                        <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666"
                        tick={{ fill: '#888', fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fill: '#888' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString('ru-RU')} ₽`,
                          name === 'value' ? 'Факт' : 'Прогноз'
                        ]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU')}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        fill="url(#colorHistorical)"
                        name="Исторические данные"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Прогноз"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Insights */}
            {forecastData && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardContent className="p-4">
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    AI Инсайты
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {forecastData.insights.map((insight, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-300">
                        <ChevronRight className="h-4 w-4 text-purple-400" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'churn' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {churnData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Высокий риск</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      {churnData.summary.high_risk_count}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Средний риск</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {churnData.summary.medium_risk_count}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">LTV под угрозой</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {(churnData.summary.total_ltv_at_risk / 1000000).toFixed(1)}M ₽
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Точность модели</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {churnData.summary.model_accuracy}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Customers at Risk */}
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-red-400" />
                  Клиенты с риском оттока
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {churnData?.customers.map((customer) => (
                    <div 
                      key={customer.id}
                      className={`
                        p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer
                        ${customer.risk_level === 'high' 
                          ? 'bg-red-500/10 border-red-500/20' 
                          : customer.risk_level === 'medium'
                          ? 'bg-yellow-500/10 border-yellow-500/20'
                          : 'bg-white/5 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{customer.name}</h4>
                          <p className="text-sm text-gray-400">ID: {customer.id}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            customer.risk_level === 'high' ? 'text-red-400' : 
                            customer.risk_level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {customer.churn_probability}%
                          </div>
                          <div className="text-xs text-gray-500">вероятность ухода</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-400">LTV:</span>
                          <span className="ml-2 text-white">{customer.ltv.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Под угрозой:</span>
                          <span className="ml-2 text-red-400">{customer.ltv_at_risk.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Последняя покупка:</span>
                          <span className="ml-2 text-white">{customer.last_purchase_days} дн. назад</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {customer.risk_factors.map((factor, i) => (
                          <span key={i} className="px-2 py-1 bg-white/5 rounded-full text-xs text-gray-400">
                            {factor}
                          </span>
                        ))}
                      </div>
                      
                      <div className="pt-3 border-t border-white/10">
                        <span className="text-sm text-purple-400">{customer.recommended_action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <SalesHeatmap />
            </CardContent>
          </Card>
        )}

        {activeTab === 'funnel' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <SalesFunnel />
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <MarketingFunnel />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'geo' && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <RussiaSalesMap />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}














