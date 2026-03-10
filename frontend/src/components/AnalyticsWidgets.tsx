import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, TrendingUp, TrendingDown, Users, AlertTriangle, 
  Activity, Target, Map, RefreshCw, ChevronRight, Zap,
  BarChart3, Clock
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts'

// ============================================
// 🔥 HEATMAP WIDGET
// ============================================
interface HeatmapData {
  x: string
  y: string
  value: number
}

interface HeatmapWidgetProps {
  title?: string
  data?: HeatmapData[]
  xLabels?: string[]
  yLabels?: string[]
}

export function HeatmapWidget({ 
  title = "Активность по часам",
  data,
  xLabels = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  yLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
}: HeatmapWidgetProps) {
  // Generate sample data if not provided
  const heatmapData = data || generateSampleHeatmapData(xLabels, yLabels)
  
  const maxValue = Math.max(...heatmapData.map(d => d.value))
  const minValue = Math.min(...heatmapData.map(d => d.value))

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue || 1)
    if (normalized > 0.8) return 'bg-orange-400'
    if (normalized > 0.6) return 'bg-orange-500/70'
    if (normalized > 0.4) return 'bg-orange-600/50'
    if (normalized > 0.2) return 'bg-orange-700/30'
    return 'bg-orange-900/20'
  }

  const matrix: number[][] = []
  yLabels.forEach((y, yi) => {
    matrix[yi] = []
    xLabels.forEach((x) => {
      const item = heatmapData.find(d => d.x === x && d.y === y)
      matrix[yi].push(item?.value ?? 0)
    })
  })

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-orange-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* X labels */}
            <div className="flex ml-8 mb-1">
              {xLabels.map((label, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-gray-500">
                  {label}
                </div>
              ))}
            </div>
            {/* Matrix */}
            {yLabels.map((yLabel, yi) => (
              <div key={yi} className="flex items-center gap-1 mb-1">
                <div className="w-8 text-right text-[10px] text-gray-500 pr-1">{yLabel}</div>
                <div className="flex flex-1 gap-0.5">
                  {matrix[yi].map((value, xi) => (
                    <div
                      key={xi}
                      className={`flex-1 h-6 rounded ${getColor(value)} flex items-center justify-center group relative cursor-pointer`}
                    >
                      <span className="text-[9px] text-white/70">{value}</span>
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 px-2 py-1 bg-gray-900 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {yLabel} {xLabels[xi]}: {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function generateSampleHeatmapData(xLabels: string[], yLabels: string[]): HeatmapData[] {
  const data: HeatmapData[] = []
  yLabels.forEach(y => {
    xLabels.forEach(x => {
      const isPeak = x.includes('12') || x.includes('13') || x.includes('18') || x.includes('19')
      const isWeekend = y === 'Сб' || y === 'Вс'
      const base = isWeekend ? 20 : 40
      const peak = isPeak ? 30 : 0
      data.push({ x, y, value: Math.round(base + peak + Math.random() * 20) })
    })
  })
  return data
}

// ============================================
// 📊 FUNNEL WIDGET
// ============================================
interface FunnelStage {
  name: string
  value: number
  color?: string
}

interface FunnelWidgetProps {
  title?: string
  stages?: FunnelStage[]
}

export function FunnelWidget({ 
  title = "Воронка продаж",
  stages
}: FunnelWidgetProps) {
  const defaultStages: FunnelStage[] = [
    { name: 'Посетители', value: 1000 },
    { name: 'Просмотры', value: 650 },
    { name: 'В корзину', value: 320 },
    { name: 'Оформление', value: 180 },
    { name: 'Покупка', value: 95 },
  ]

  const data = stages || defaultStages
  const maxValue = data[0]?.value || 1

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((stage, index) => {
            const width = (stage.value / maxValue) * 100
            const conversion = index > 0 
              ? ((stage.value / data[index - 1].value) * 100).toFixed(1)
              : '100'
            
            const colors = [
              'from-blue-500 to-blue-600',
              'from-purple-500 to-purple-600',
              'from-pink-500 to-pink-600',
              'from-orange-500 to-orange-600',
              'from-green-500 to-green-600',
            ]

            return (
              <div key={index} className="relative">
                {index > 0 && (
                  <div className="absolute -top-1 right-2 text-[10px] text-gray-500">
                    ↓ {conversion}%
                  </div>
                )}
                <div 
                  className={`h-8 rounded-lg bg-gradient-to-r ${colors[index % colors.length]} flex items-center px-3 justify-between transition-all`}
                  style={{ width: `${Math.max(width, 30)}%` }}
                >
                  <span className="text-white text-xs font-medium truncate">{stage.name}</span>
                  <span className="text-white text-xs font-bold">{stage.value}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
          <span className="text-gray-400">Общая конверсия:</span>
          <span className="text-green-400 font-bold">
            {((data[data.length - 1]?.value / data[0]?.value) * 100).toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// 🤖 ML FORECAST WIDGET
// ============================================
interface ForecastWidgetProps {
  title?: string
  historicalData?: { date: string; value: number }[]
  metric?: string
}

export function ForecastWidget({ 
  title = "ML Прогноз",
  historicalData,
  metric = "продаж"
}: ForecastWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  // Generate sample data
  const data = historicalData || generateForecastData()
  
  const historicalPart = data.slice(0, 14)
  const forecastPart = data.slice(14)
  
  const totalForecast = forecastPart.reduce((sum, d) => sum + d.value, 0)
  const avgHistorical = historicalPart.reduce((sum, d) => sum + d.value, 0) / historicalPart.length
  const growth = ((forecastPart[forecastPart.length - 1]?.value || 0) / (historicalPart[historicalPart.length - 1]?.value || 1) - 1) * 100

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500">Точность:</span>
            <span className="text-green-400 font-medium">87%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
                tickFormatter={(v) => v.split('-').slice(1).join('/')}
              />
              <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="url(#colorHistorical)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <div className="text-[10px] text-gray-500">Прогноз</div>
            <div className="text-sm font-bold text-white">{(totalForecast / 1000).toFixed(0)}K</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500">Рост</div>
            <div className={`text-sm font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500">Тренд</div>
            <div className="text-sm font-bold text-purple-400">↗ Рост</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function generateForecastData() {
  const data = []
  let value = 50000
  const today = new Date()
  
  for (let i = 20; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    value = value * (0.97 + Math.random() * 0.08)
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      type: i > 6 ? 'historical' : 'forecast'
    })
  }
  return data
}

// ============================================
// ⚠️ CHURN WIDGET
// ============================================
interface ChurnCustomer {
  name: string
  risk: number
  ltv: number
  lastPurchase: number
}

interface ChurnWidgetProps {
  title?: string
  customers?: ChurnCustomer[]
}

export function ChurnWidget({ 
  title = "Риск оттока клиентов",
  customers
}: ChurnWidgetProps) {
  const defaultCustomers: ChurnCustomer[] = [
    { name: 'ООО МегаТех', risk: 85, ltv: 450000, lastPurchase: 45 },
    { name: 'ИП Иванов', risk: 72, ltv: 280000, lastPurchase: 38 },
    { name: 'ООО Техника', risk: 58, ltv: 320000, lastPurchase: 22 },
  ]

  const data = customers || defaultCustomers
  const highRisk = data.filter(c => c.risk > 70).length
  const totalLtvAtRisk = data.reduce((sum, c) => sum + (c.ltv * c.risk / 100), 0)

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            {title}
          </CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
            {highRisk} критичных
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.slice(0, 3).map((customer, idx) => (
            <div 
              key={idx}
              className={`p-2 rounded-lg border ${
                customer.risk > 70 
                  ? 'bg-red-500/10 border-red-500/20' 
                  : customer.risk > 50 
                  ? 'bg-yellow-500/10 border-yellow-500/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-xs font-medium truncate flex-1">{customer.name}</span>
                <span className={`text-sm font-bold ${
                  customer.risk > 70 ? 'text-red-400' : customer.risk > 50 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {customer.risk}%
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>LTV: {(customer.ltv / 1000).toFixed(0)}K ₽</span>
                <span>{customer.lastPurchase} дн. назад</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs">
          <span className="text-gray-400">LTV под угрозой:</span>
          <span className="text-red-400 font-bold">{(totalLtvAtRisk / 1000000).toFixed(1)}M ₽</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// 🎯 AI INSIGHTS PANEL (реальные данные)
// ============================================
interface AIInsight {
  type: string
  title: string
  message: string
  severity?: string
  confidence?: number
}

interface AIInsightsPanelProps {
  insights: AIInsight[]
}

function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  if (!insights || insights.length === 0) return null

  const severityConfig: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <AlertTriangle className="h-4 w-4 text-red-400" /> },
    high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <Zap className="h-4 w-4 text-orange-400" /> },
    medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: <TrendingUp className="h-4 w-4 text-blue-400" /> },
    low: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <Activity className="h-4 w-4 text-green-400" /> },
    success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <TrendingUp className="h-4 w-4 text-green-400" /> },
    info: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: <BarChart3 className="h-4 w-4 text-gray-400" /> },
  }

  return (
    <div className="space-y-2">
      {insights.slice(0, 6).map((insight, idx) => {
        const config = severityConfig[insight.severity || 'info'] || severityConfig.info
        return (
          <div key={idx} className={`p-3 rounded-lg border ${config.bg} ${config.border}`}>
            <div className="flex items-start gap-2">
              {config.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">{insight.title}</span>
                  {insight.confidence && (
                    <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// 🎯 COMBINED ANALYTICS SECTION
// ============================================
interface AnalyticsSectionProps {
  industry?: string
  aiData?: any | null
}

export function AnalyticsSection({ industry, aiData }: AnalyticsSectionProps) {
  const hasRealData = !!(aiData && aiData.ai_insights)
  const insights = aiData?.ai_insights?.insights || []
  const analytics = aiData?.analytics || null
  const forecast = aiData?.forecast || null
  const trustScore = aiData?.ai_trust_score || null

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-400" />
          AI Аналитика
          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
            {hasRealData ? 'LIVE' : 'DEMO'}
          </span>
        </h3>
        {trustScore && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Доверие к данным:</span>
            <span className={`font-bold ${
              trustScore.overall_score >= 80 ? 'text-green-400' :
              trustScore.overall_score >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {trustScore.overall_score}%
            </span>
          </div>
        )}
      </div>

      {/* Реальные AI инсайты */}
      {hasRealData && insights.length > 0 && (
        <AIInsightsPanel insights={insights} />
      )}

      {/* Карточки метрик из бэкенда */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {analytics.total_revenue != null && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-[10px] text-gray-500 uppercase">Выручка</div>
              <div className="text-lg font-bold text-white">
                {(analytics.total_revenue / 1000).toFixed(0)}K ₽
              </div>
            </div>
          )}
          {analytics.total_orders != null && analytics.total_orders > 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="text-[10px] text-gray-500 uppercase">Заказы</div>
              <div className="text-lg font-bold text-white">
                {analytics.total_orders.toLocaleString('ru-RU')}
              </div>
            </div>
          )}
          {analytics.unique_clients != null && analytics.unique_clients > 0 && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-[10px] text-gray-500 uppercase">Клиенты</div>
              <div className="text-lg font-bold text-white">
                {analytics.unique_clients.toLocaleString('ru-RU')}
              </div>
            </div>
          )}
          {analytics.average_check != null && analytics.average_check > 0 && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="text-[10px] text-gray-500 uppercase">Средний чек</div>
              <div className="text-lg font-bold text-white">
                {analytics.average_check.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          )}
        </div>
      )}

      {/* Виджеты */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ForecastWidget
          historicalData={
            forecast?.historical
              ? forecast.historical.map((d: any) => ({ date: d.date, value: d.value || d.revenue }))
              : undefined
          }
        />
        <ChurnWidget />
        <HeatmapWidget />
        <FunnelWidget />
      </div>
    </div>
  )
}

export default AnalyticsSection














