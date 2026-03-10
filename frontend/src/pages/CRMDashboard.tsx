import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, UserCheck, UserX, DollarSign,
  BarChart3, ArrowLeft, Upload, RefreshCw, Lightbulb,
  HelpCircle, X,
  PlayCircle, Sparkles, AlertTriangle,
  Target, Star, Award, Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('crm')

// ============================================
// 👥 CRM DASHBOARD - Clients, Deals, LTV, Churn
// ============================================

interface Client {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
  last_order: string
  total_orders: number
  total_spent: number
  status: 'active' | 'inactive' | 'churned' | 'new'
  segment: string
  source: string
}

interface Deal {
  id: string
  client_id: string
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  value: number
  created_at: string
  closed_at?: string
}

interface CRMMetrics {
  totalClients: number
  activeClients: number
  newClients: number
  churnedClients: number
  churnRate: number
  avgLTV: number
  totalLTV: number
  avgOrderValue: number
  clientsBySegment: { name: string; value: number; color: string }[]
  clientsBySource: { name: string; value: number; color: string }[]
  funnel: { stage: string; value: number; fill: string }[]
  monthlyGrowth: { month: string; new: number; churned: number; net: number }[]
  topClients: { name: string; spent: number; orders: number; ltv: number }[]
  retentionByMonth: { month: string; rate: number }[]
}

const SEGMENT_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']
const SOURCE_COLORS = ['#06B6D4', '#14B8A6', '#22C55E', '#84CC16', '#EAB308', '#F97316']

export default function CRMDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<{ clients: Client[]; deals: Deal[] } | null>(null)
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'funnel' | 'retention'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('crm')

  const calculateMetrics = (clients: Client[], deals: Deal[]): CRMMetrics => {
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === 'active').length
    const newClients = clients.filter(c => c.status === 'new').length
    const churnedClients = clients.filter(c => c.status === 'churned').length
    const churnRate = totalClients > 0 ? (churnedClients / totalClients) * 100 : 0

    const totalSpent = clients.reduce((sum, c) => sum + c.total_spent, 0)
    const totalOrders = clients.reduce((sum, c) => sum + c.total_orders, 0)
    const avgLTV = totalClients > 0 ? totalSpent / totalClients : 0
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    // Clients by segment
    const segmentMap = new Map<string, number>()
    clients.forEach(c => segmentMap.set(c.segment, (segmentMap.get(c.segment) || 0) + 1))
    const clientsBySegment = Array.from(segmentMap.entries())
      .map(([name, value], idx) => ({ name, value, color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length] }))
      .sort((a, b) => b.value - a.value)

    // Clients by source
    const sourceMap = new Map<string, number>()
    clients.forEach(c => sourceMap.set(c.source, (sourceMap.get(c.source) || 0) + 1))
    const clientsBySource = Array.from(sourceMap.entries())
      .map(([name, value], idx) => ({ name, value, color: SOURCE_COLORS[idx % SOURCE_COLORS.length] }))
      .sort((a, b) => b.value - a.value)

    // Sales funnel
    const stageCounts = {
      lead: deals.filter(d => d.stage === 'lead').length,
      qualified: deals.filter(d => d.stage === 'qualified').length,
      proposal: deals.filter(d => d.stage === 'proposal').length,
      negotiation: deals.filter(d => d.stage === 'negotiation').length,
      won: deals.filter(d => d.stage === 'won').length
    }
    const funnel = [
      { stage: 'Лиды', value: stageCounts.lead, fill: '#3B82F6' },
      { stage: 'Квалификация', value: stageCounts.qualified, fill: '#8B5CF6' },
      { stage: 'Предложение', value: stageCounts.proposal, fill: '#F59E0B' },
      { stage: 'Переговоры', value: stageCounts.negotiation, fill: '#F97316' },
      { stage: 'Сделка', value: stageCounts.won, fill: '#10B981' }
    ]

    // Monthly growth
    const monthlyMap = new Map<string, { new: number; churned: number }>()
    clients.forEach(c => {
      const month = c.created_at.substring(0, 7)
      const existing = monthlyMap.get(month) || { new: 0, churned: 0 }
      if (c.status === 'new' || c.status === 'active') existing.new++
      if (c.status === 'churned') existing.churned++
      monthlyMap.set(month, existing)
    })
    const monthlyGrowth = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data, net: data.new - data.churned }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)

    // Top clients by LTV
    const topClients = [...clients]
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)
      .map(c => ({ name: c.name, spent: c.total_spent, orders: c.total_orders, ltv: c.total_spent }))

    // Retention by month (simplified)
    const retentionByMonth = monthlyGrowth.map(m => ({
      month: m.month,
      rate: m.new > 0 ? Math.max(0, 100 - (m.churned / m.new) * 100) : 100
    }))

    return {
      totalClients,
      activeClients,
      newClients,
      churnedClients,
      churnRate,
      avgLTV,
      totalLTV: totalSpent,
      avgOrderValue,
      clientsBySegment,
      clientsBySource,
      funnel,
      monthlyGrowth,
      topClients,
      retentionByMonth
    }
  }

  const rowsToClients = (rows: Record<string, string>[]): { clients: Client[]; deals: Deal[] } => {
    if (rows.length === 0) return { clients: [], deals: [] }
    const h = getHeaders(rows)
    const idCol = findColumn(h, ['id', 'client_id', 'клиент_id', 'номер'])
    const nameCol = findColumn(h, ['name', 'client_name', 'имя', 'клиент', 'ФИО', 'mijoz'])
    const emailCol = findColumn(h, ['email', 'почта', 'e-mail'])
    const phoneCol = findColumn(h, ['phone', 'телефон', 'тел'])
    const createdCol = findColumn(h, ['created_at', 'created', 'дата_создания', 'created_date', 'дата'])
    const lastOrderCol = findColumn(h, ['last_order', 'last_order_date', 'последний_заказ'])
    const ordersCol = findColumn(h, ['total_orders', 'orders', 'заказы', 'количество_заказов'])
    const spentCol = findColumn(h, ['total_spent', 'spent', 'потрачено', 'ltv', 'выручка', 'сумма'])
    const statusCol = findColumn(h, ['status', 'статус', 'state'])
    const segmentCol = findColumn(h, ['segment', 'сегмент', 'группа'])
    const sourceCol = findColumn(h, ['source', 'источник', 'откуда', 'manba'])

    const clients: Client[] = rows.map((row, i) => ({
      id: getStr(row, idCol, `CLT-${i + 1}`),
      name: getStr(row, nameCol, 'Клиент'),
      email: getStr(row, emailCol, ''),
      phone: getStr(row, phoneCol, ''),
      created_at: getStr(row, createdCol, new Date().toISOString().split('T')[0]),
      last_order: getStr(row, lastOrderCol, new Date().toISOString().split('T')[0]),
      total_orders: getNum(row, ordersCol),
      total_spent: getNum(row, spentCol),
      status: (getStr(row, statusCol, 'active') as Client['status']),
      segment: getStr(row, segmentCol, 'Новичок'),
      source: getStr(row, sourceCol, 'Сайт'),
    }))
    return { clients, deals: [] }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const parsed = rowsToClients(rows)
      if (parsed.clients.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(parsed)
      setMetrics(calculateMetrics(parsed.clients, parsed.deals))
      toast.success(`👥 Загружено ${parsed.clients.length} клиентов из ${file.name}`)
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
      const segments = ['VIP', 'Постоянный', 'Новичок', 'Спящий', 'Ушедший']
      const sources = ['Сайт', 'Реклама', 'Рекомендация', 'Соцсети', 'Холодные звонки']
      const statuses: Client['status'][] = ['active', 'active', 'active', 'new', 'inactive', 'churned']
      const stages: Deal['stage'][] = ['lead', 'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
      
      const names = ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Козлов К.К.', 'Николаев Н.Н.',
        'Смирнов А.А.', 'Кузнецов В.В.', 'Попов Д.Д.', 'Васильев Е.Е.', 'Михайлов М.М.']
      
      const demoClients: Client[] = []
      const demoDeals: Deal[] = []
      const today = new Date()
      
      for (let i = 0; i < 150; i++) {
        const createdDate = new Date(today)
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 365))
        const lastOrderDate = new Date(createdDate)
        lastOrderDate.setDate(lastOrderDate.getDate() + Math.floor(Math.random() * 180))
        
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const totalOrders = status === 'churned' ? Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 20)
        
        demoClients.push({
          id: `CLT-${1000 + i}`,
          name: names[Math.floor(Math.random() * names.length)] + ` ${i}`,
          email: `client${i}@example.com`,
          phone: `+7 (9${Math.floor(Math.random() * 100)}) ${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 100)}`,
          created_at: createdDate.toISOString().split('T')[0],
          last_order: lastOrderDate.toISOString().split('T')[0],
          total_orders: totalOrders,
          total_spent: totalOrders * (2000 + Math.floor(Math.random() * 18000)),
          status,
          segment: segments[Math.floor(Math.random() * segments.length)],
          source: sources[Math.floor(Math.random() * sources.length)]
        })
      }

      for (let i = 0; i < 80; i++) {
        const createdDate = new Date(today)
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 90))
        const stage = stages[Math.floor(Math.random() * stages.length)]
        
        demoDeals.push({
          id: `DEAL-${1000 + i}`,
          client_id: demoClients[Math.floor(Math.random() * demoClients.length)].id,
          stage,
          value: 10000 + Math.floor(Math.random() * 190000),
          created_at: createdDate.toISOString().split('T')[0],
          closed_at: stage === 'won' || stage === 'lost' ? today.toISOString().split('T')[0] : undefined
        })
      }

      setData({ clients: demoClients, deals: demoDeals })
      setMetrics(calculateMetrics(demoClients, demoDeals))
      toast.success('CRM данные загружены!')
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value)
  }

  const getAIInsights = () => {
    if (!metrics) return []
    const insights = []

    if (metrics.churnRate < 5) {
      insights.push({ type: 'success', icon: Heart, title: 'Отличное удержание!', message: `Отток всего ${metrics.churnRate.toFixed(1)}% — клиенты лояльны.` })
    } else if (metrics.churnRate > 15) {
      insights.push({ type: 'warning', icon: UserX, title: 'Высокий отток', message: `${metrics.churnRate.toFixed(1)}% клиентов ушли. Запустите программу возврата.` })
    }

    if (metrics.avgLTV > 50000) {
      insights.push({ type: 'success', icon: Award, title: 'Высокий LTV', message: `Средний LTV ${formatCurrency(metrics.avgLTV)} — клиенты приносят хорошую выручку.` })
    }

    if (metrics.funnel.length > 0) {
      const conversionRate = metrics.funnel[4].value / metrics.funnel[0].value * 100
      if (conversionRate > 20) {
        insights.push({ type: 'success', icon: Target, title: 'Отличная конверсия', message: `${conversionRate.toFixed(1)}% лидов становятся клиентами!` })
      } else if (conversionRate < 10) {
        insights.push({ type: 'warning', icon: AlertTriangle, title: 'Низкая конверсия', message: `Только ${conversionRate.toFixed(1)}% лидов конвертируются. Оптимизируйте воронку.` })
      }
    }

    if (metrics.topClients.length > 0) {
      insights.push({ type: 'info', icon: Star, title: 'Топ клиент', message: `${metrics.topClients[0].name} — ${formatCurrency(metrics.topClients[0].spent)} за ${metrics.topClients[0].orders} заказов.` })
    }

    return insights
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900/20 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/industries')} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">CRM</h1>
                  <p className="text-xs text-gray-400">Клиенты, сделки, LTV</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data && (
                <Button onClick={() => { setData(null); setMetrics(null) }} variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  <RefreshCw className="h-4 w-4 mr-2" />Сбросить
                </Button>
              )}
              <button onClick={() => setShowHelp(!showHelp)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
        {!data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-2xl bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl w-fit mb-4">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">CRM Аналитика</CardTitle>
                <CardDescription className="text-gray-400">Клиенты, воронка продаж, LTV, Churn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".csv,.xlsx" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
                <Button onClick={loadDemoData} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-6">
                  <PlayCircle className="h-5 w-5 mr-2" />{isLoading ? 'Загрузка...' : 'Загрузить демо-данные'}
                </Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-400">или</span></div></div>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading} className="w-full border-white/20 text-white hover:bg-white/10 py-6">
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Загрузить CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : metrics && (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Обзор', icon: BarChart3 },
                { id: 'clients', label: 'Клиенты', icon: Users },
                { id: 'funnel', label: 'Воронка', icon: Target },
                { id: 'retention', label: 'Удержание', icon: Heart }
              ].map(tab => (
                <Button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  className={activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}>
                  <tab.icon className="h-4 w-4 mr-2" />{tab.label}
                </Button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Users className="h-5 w-5 text-blue-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Всего клиентов</p>
                          <p className="text-2xl font-bold text-white">{metrics.totalClients}</p>
                          <p className="text-xs text-green-400">+{metrics.newClients} новых</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg"><UserCheck className="h-5 w-5 text-green-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Активных</p>
                          <p className="text-2xl font-bold text-white">{metrics.activeClients}</p>
                          <p className="text-xs text-green-400">{((metrics.activeClients / metrics.totalClients) * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg"><DollarSign className="h-5 w-5 text-purple-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Средний LTV</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(metrics.avgLTV)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`bg-gradient-to-br ${metrics.churnRate < 10 ? 'from-green-500/20 to-teal-500/10 border-green-500/30' : 'from-red-500/20 to-orange-500/10 border-red-500/30'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${metrics.churnRate < 10 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          <UserX className={`h-5 w-5 ${metrics.churnRate < 10 ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Отток (Churn)</p>
                          <p className={`text-2xl font-bold ${metrics.churnRate < 10 ? 'text-green-400' : 'text-red-400'}`}>{metrics.churnRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-400" />AI CRM-Аналитика</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {getAIInsights().map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl ${insight.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : insight.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                          <div className="flex items-start gap-3">
                            <insight.icon className={`h-5 w-5 mt-0.5 ${insight.type === 'success' ? 'text-green-400' : insight.type === 'warning' ? 'text-amber-400' : 'text-blue-400'}`} />
                            <div><h4 className="font-medium text-white">{insight.title}</h4><p className="text-sm text-gray-400 mt-1">{insight.message}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader><CardTitle className="text-white">Сегменты клиентов</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie data={metrics.clientsBySegment} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {metrics.clientsBySegment.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader><CardTitle className="text-white">Источники клиентов</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.clientsBySource} layout="vertical">
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis type="number" {...axisProps(palette)} />
                            <YAxis dataKey="name" type="category" {...axisProps(palette)} width={100} />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Bar dataKey="value" fill="#6366F1" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'clients' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Star className="h-5 w-5 text-amber-400" />Топ клиенты по LTV</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.topClients.map((client, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : idx === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800' : 'bg-gray-600'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{client.name}</p>
                            <p className="text-sm text-gray-400">{client.orders} заказов</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">{formatCurrency(client.spent)}</p>
                          <p className="text-xs text-gray-400">LTV</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'funnel' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Target className="h-5 w-5 text-blue-400" />Воронка продаж</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.funnel.map((stage, idx) => {
                      const maxValue = metrics.funnel[0].value
                      const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
                      return (
                        <div key={idx} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-medium">{stage.stage}</span>
                            <span className="text-gray-400">{stage.value}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-8">
                            <div className="h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all" style={{ width: `${width}%`, backgroundColor: stage.fill }}>
                              {width > 20 && `${width.toFixed(0)}%`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-white font-medium">Общая конверсия воронки:</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {metrics.funnel[0].value > 0 ? ((metrics.funnel[4].value / metrics.funnel[0].value) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'retention' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Динамика клиентов</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.monthlyGrowth}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="month" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Legend />
                          <Area type="monotone" dataKey="new" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Новые" />
                          <Area type="monotone" dataKey="churned" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Ушедшие" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white">Retention Rate</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.retentionByMonth}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="month" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} domain={[0, 100]} />
                          <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => `${value.toFixed(1)}%`} />
                          <Area type="monotone" dataKey="rate" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Удержание" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Analytics Section */}
            <AnalyticsSection industry="crm" aiData={aiData} />
          </div>
        )}
      </main>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <Card className="w-full max-w-lg bg-gray-900 border-white/20" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-400" />Как использовать</CardTitle>
                <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <div><h4 className="font-medium text-white mb-1">📊 Обзор</h4><p className="text-sm">Общая статистика: клиенты, LTV, отток, сегменты.</p></div>
              <div><h4 className="font-medium text-white mb-1">👥 Клиенты</h4><p className="text-sm">Топ клиентов по LTV и количеству заказов.</p></div>
              <div><h4 className="font-medium text-white mb-1">🎯 Воронка</h4><p className="text-sm">Воронка продаж: от лида до сделки.</p></div>
              <div><h4 className="font-medium text-white mb-1">❤️ Удержание</h4><p className="text-sm">Retention rate и динамика оттока.</p></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
