import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Megaphone, TrendingUp, DollarSign, Target, Users, PieChart,
  BarChart3, ArrowLeft, Upload, Download, RefreshCw, Lightbulb,
  HelpCircle, X, FileSpreadsheet, 
  PlayCircle, Sparkles, Eye, MousePointer, ShoppingCart, Zap,
  AlertTriangle, CheckCircle, XCircle, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart, Bar, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

// ============================================
// 🎯 MARKETING DASHBOARD - ROMI Analytics
// ============================================

interface CampaignRecord {
  date: string
  campaign_name: string
  channel: string
  impressions: number
  clicks: number
  cost: number
  leads: number
  sales: number
  revenue: number
}

interface MarketingMetrics {
  totalSpend: number
  totalRevenue: number
  totalROI: number
  totalImpressions: number
  totalClicks: number
  totalLeads: number
  totalSales: number
  avgCTR: number
  avgCPC: number
  avgCPL: number
  avgCAC: number
  channelPerformance: {
    channel: string
    spend: number
    revenue: number
    roi: number
    leads: number
    sales: number
    color: string
  }[]
  campaignPerformance: {
    campaign: string
    spend: number
    revenue: number
    roi: number
    status: 'excellent' | 'good' | 'poor' | 'negative'
  }[]
  dailyMetrics: {
    date: string
    spend: number
    revenue: number
    leads: number
  }[]
  funnelData: { stage: string; value: number; percent: number }[]
  bestCampaigns: { campaign: string; roi: number; revenue: number }[]
  worstCampaigns: { campaign: string; roi: number; loss: number }[]
}

const CHANNEL_COLORS: Record<string, string> = {
  'Яндекс.Директ': '#FF0000',
  'VK Реклама': '#0077FF',
  'Авито': '#00AAFF',
  'Telegram': '#229ED9',
  'Google Ads': '#34A853',
  'Email': '#EA4335',
  'SMS': '#9333EA',
  'Таргет ВК': '#4C75A3',
  'default': '#6366F1'
}

export default function MarketingDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<CampaignRecord[] | null>(null)
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'campaigns'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('marketing')
  const palette = getPalette('marketing')

  const calculateMetrics = (records: CampaignRecord[]): MarketingMetrics => {
    const totalSpend = records.reduce((sum, r) => sum + r.cost, 0)
    const totalRevenue = records.reduce((sum, r) => sum + r.revenue, 0)
    const totalROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
    const totalImpressions = records.reduce((sum, r) => sum + r.impressions, 0)
    const totalClicks = records.reduce((sum, r) => sum + r.clicks, 0)
    const totalLeads = records.reduce((sum, r) => sum + r.leads, 0)
    const totalSales = records.reduce((sum, r) => sum + r.sales, 0)
    
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0
    const avgCPL = totalLeads > 0 ? totalSpend / totalLeads : 0
    const avgCAC = totalSales > 0 ? totalSpend / totalSales : 0

    // По каналам
    const channelMap = new Map<string, { spend: number; revenue: number; leads: number; sales: number }>()
    records.forEach(r => {
      const existing = channelMap.get(r.channel) || { spend: 0, revenue: 0, leads: 0, sales: 0 }
      channelMap.set(r.channel, {
        spend: existing.spend + r.cost,
        revenue: existing.revenue + r.revenue,
        leads: existing.leads + r.leads,
        sales: existing.sales + r.sales
      })
    })
    const channelPerformance = Array.from(channelMap.entries())
      .map(([channel, stats]) => ({
        channel,
        ...stats,
        roi: stats.spend > 0 ? ((stats.revenue - stats.spend) / stats.spend) * 100 : 0,
        color: CHANNEL_COLORS[channel] || CHANNEL_COLORS.default
      }))
      .sort((a, b) => b.roi - a.roi)

    // По кампаниям
    const campaignMap = new Map<string, { spend: number; revenue: number }>()
    records.forEach(r => {
      const existing = campaignMap.get(r.campaign_name) || { spend: 0, revenue: 0 }
      campaignMap.set(r.campaign_name, {
        spend: existing.spend + r.cost,
        revenue: existing.revenue + r.revenue
      })
    })
    const campaignPerformance = Array.from(campaignMap.entries())
      .map(([campaign, stats]) => {
        const roi = stats.spend > 0 ? ((stats.revenue - stats.spend) / stats.spend) * 100 : 0
        return {
          campaign,
          ...stats,
          roi,
          status: roi >= 200 ? 'excellent' as const : 
                  roi >= 100 ? 'good' as const : 
                  roi >= 0 ? 'poor' as const : 'negative' as const
        }
      })
      .sort((a, b) => b.roi - a.roi)

    // По дням
    const dayMap = new Map<string, { spend: number; revenue: number; leads: number }>()
    records.forEach(r => {
      const existing = dayMap.get(r.date) || { spend: 0, revenue: 0, leads: 0 }
      dayMap.set(r.date, {
        spend: existing.spend + r.cost,
        revenue: existing.revenue + r.revenue,
        leads: existing.leads + r.leads
      })
    })
    const dailyMetrics = Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Воронка
    const funnelData = [
      { stage: 'Показы', value: totalImpressions, percent: 100 },
      { stage: 'Клики', value: totalClicks, percent: (totalClicks / totalImpressions) * 100 },
      { stage: 'Лиды', value: totalLeads, percent: (totalLeads / totalImpressions) * 100 },
      { stage: 'Продажи', value: totalSales, percent: (totalSales / totalImpressions) * 100 }
    ]

    // Лучшие и худшие кампании
    const bestCampaigns = campaignPerformance
      .filter(c => c.roi > 0)
      .slice(0, 5)
      .map(c => ({ campaign: c.campaign, roi: c.roi, revenue: c.revenue }))

    const worstCampaigns = campaignPerformance
      .filter(c => c.roi < 0)
      .slice(-5)
      .reverse()
      .map(c => ({ campaign: c.campaign, roi: c.roi, loss: c.spend - c.revenue }))

    return {
      totalSpend,
      totalRevenue,
      totalROI,
      totalImpressions,
      totalClicks,
      totalLeads,
      totalSales,
      avgCTR,
      avgCPC,
      avgCPL,
      avgCAC,
      channelPerformance,
      campaignPerformance,
      dailyMetrics,
      funnelData,
      bestCampaigns,
      worstCampaigns
    }
  }

  const rowsToCampaigns = (rows: Record<string, string>[]): CampaignRecord[] => {
    if (rows.length === 0) return []
    const h = getHeaders(rows)
    const dateCol = findColumn(h, ['date', 'дата', 'день', 'sana'])
    const campaignCol = findColumn(h, ['campaign_name', 'campaign', 'кампания', 'название', 'nomi'])
    const channelCol = findColumn(h, ['channel', 'канал', 'источник', 'source', 'manba'])
    const impCol = findColumn(h, ['impressions', 'показы', 'просмотры', 'views'])
    const clicksCol = findColumn(h, ['clicks', 'клики', 'переходы'])
    const costCol = findColumn(h, ['cost', 'расход', 'затраты', 'spend', 'бюджет', 'xarajat'])
    const leadsCol = findColumn(h, ['leads', 'лиды', 'заявки', 'обращения'])
    const salesCol = findColumn(h, ['sales', 'продажи', 'сделки', 'deals'])
    const revenueCol = findColumn(h, ['revenue', 'выручка', 'доход', 'income', 'tushum'])

    return rows.map((row) => ({
      date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
      campaign_name: getStr(row, campaignCol, 'Кампания'),
      channel: getStr(row, channelCol, 'Другое'),
      impressions: getNum(row, impCol),
      clicks: getNum(row, clicksCol),
      cost: getNum(row, costCol),
      leads: getNum(row, leadsCol),
      sales: getNum(row, salesCol),
      revenue: getNum(row, revenueCol),
    }))
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      const records = rowsToCampaigns(rows)
      if (records.length === 0) { toast.error('Файл пуст или неверный формат'); return }
      setData(records)
      setMetrics(calculateMetrics(records))
      toast.success(`🎯 Загружено ${records.length} записей из ${file.name}`)
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
      const response = await fetch('/demo_data/marketing_campaigns.csv')
      const blob = await response.blob()
      const demoFile = new File([blob], 'marketing_campaigns.csv', { type: 'text/csv' })
      const rows = await readFileUniversal(demoFile)
      const records = rowsToCampaigns(rows)

      setData(records)
      setMetrics(calculateMetrics(records))
      toast.success('🎯 Демо-данные маркетинга загружены!')
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

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const getROIColor = (roi: number) => {
    if (roi >= 200) return 'text-emerald-400'
    if (roi >= 100) return 'text-green-400'
    if (roi >= 0) return 'text-amber-400'
    return 'text-red-400'
  }

  const getROIBg = (roi: number) => {
    if (roi >= 200) return 'bg-emerald-500/20 border-emerald-500/30'
    if (roi >= 100) return 'bg-green-500/20 border-green-500/30'
    if (roi >= 0) return 'bg-amber-500/20 border-amber-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  return (
    <div className="min-h-screen" style={{ background: palette.bg }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
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
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    Маркетинг
                    <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs font-bold rounded-full">
                      ROMI
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Рекламные кампании и ROI</p>
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
            <Card className="bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-cyan-500/20 backdrop-blur-xl border-indigo-500/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <Megaphone className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Маркетинговая аналитика 🎯
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Загрузите данные о рекламе — узнайте какие каналы приносят прибыль
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm">
                        <DollarSign className="h-4 w-4" />
                        ROMI
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
                        <Activity className="h-4 w-4" />
                        CTR / CPC
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm">
                        <Users className="h-4 w-4" />
                        CAC / LTV
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                        <PieChart className="h-4 w-4" />
                        Воронка
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
                  <Upload className={`h-10 w-10 text-white ${isLoading ? 'animate-bounce' : ''}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  Загрузите данные рекламы
                </h3>
                <p className="text-gray-400 mb-8">
                  Экспортируйте из Яндекс.Директ, VK Ads или Excel
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
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold px-8"
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

            {/* What is ROMI */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                  Что такое ROMI?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 mb-4">
                      <strong className="text-white">ROMI</strong> (Return on Marketing Investment) — 
                      возврат инвестиций в маркетинг.
                    </p>
                    <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <p className="text-indigo-300 font-mono text-center text-lg">
                        ROMI = (Выручка - Затраты) / Затраты × 100%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span className="text-gray-300"><strong className="text-emerald-400">ROMI &gt; 100%</strong> — реклама окупается</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                      <span className="text-gray-300"><strong className="text-amber-400">ROMI 0-100%</strong> — частичная окупаемость</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span className="text-gray-300"><strong className="text-red-400">ROMI &lt; 0%</strong> — убыточная реклама</span>
                    </div>
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
                { id: 'channels', label: 'Каналы', icon: Megaphone },
                { id: 'campaigns', label: 'Кампании', icon: Target }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg'
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
                {/* Main ROMI Card */}
                <Card className={`backdrop-blur-xl border-2 ${getROIBg(metrics.totalROI)}`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-lg mb-2">Общий ROMI</p>
                        <p className={`text-6xl font-bold ${getROIColor(metrics.totalROI)}`}>
                          {metrics.totalROI.toFixed(0)}%
                        </p>
                        <p className="text-gray-400 mt-2">
                          {metrics.totalROI >= 100 
                            ? '✅ Реклама окупается!' 
                            : metrics.totalROI >= 0 
                              ? '⚠️ Частичная окупаемость' 
                              : '❌ Убыточная реклама'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="mb-4">
                          <p className="text-gray-500 text-sm">Потрачено</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalSpend)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-sm">Заработано</p>
                          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20">
                          <Eye className="h-6 w-6 text-blue-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Показы</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalImpressions)}</p>
                      <p className="text-blue-400 text-sm mt-2">CTR: {metrics.avgCTR.toFixed(2)}%</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                          <MousePointer className="h-6 w-6 text-purple-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Клики</p>
                      <p className="text-2xl font-bold text-white">{formatNumber(metrics.totalClicks)}</p>
                      <p className="text-purple-400 text-sm mt-2">CPC: {formatCurrency(metrics.avgCPC)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-cyan-500/20">
                          <Users className="h-6 w-6 text-cyan-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Лиды</p>
                      <p className="text-2xl font-bold text-white">{metrics.totalLeads}</p>
                      <p className="text-cyan-400 text-sm mt-2">CPL: {formatCurrency(metrics.avgCPL)}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/20">
                          <ShoppingCart className="h-6 w-6 text-emerald-400" />
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Продажи</p>
                      <p className="text-2xl font-bold text-white">{metrics.totalSales}</p>
                      <p className="text-emerald-400 text-sm mt-2">CAC: {formatCurrency(metrics.avgCAC)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Daily metrics */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-400" />
                        Расходы vs Доходы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <ComposedChart data={metrics.dailyMetrics}>
                          <CartesianGrid {...GRID_PROPS} />
                          <XAxis dataKey="date" {...axisProps(palette)} />
                          <YAxis {...axisProps(palette)} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            {...TOOLTIP_STYLE}
                          />
                          <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                          <Bar dataKey="spend" fill="#EF4444" name="Расходы" radius={[4, 4, 0, 0]} />
                          <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Доходы" dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Funnel */}
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-400" />
                        Воронка конверсий
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {metrics.funnelData.map((stage, idx) => (
                          <div key={idx}>
                            <div className="flex justify-between mb-2">
                              <span className="text-white font-medium">{stage.stage}</span>
                              <span className="text-gray-400">{formatNumber(stage.value)}</span>
                            </div>
                            <div className="h-8 bg-white/10 rounded-lg overflow-hidden relative">
                              <div 
                                className="h-full rounded-lg transition-all duration-500"
                                style={{ 
                                  width: `${stage.percent}%`,
                                  background: `linear-gradient(90deg, #6366F1, #8B5CF6)`
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                                {stage.percent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Best & Worst */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Best campaigns */}
                  <Card className="bg-emerald-500/10 backdrop-blur-xl border-emerald-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                        🏆 Лучшие кампании
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {metrics.bestCampaigns.map((c, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{c.campaign}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-emerald-400 font-bold">+{c.roi.toFixed(0)}%</p>
                              <p className="text-gray-500 text-sm">{formatCurrency(c.revenue)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Worst campaigns */}
                  {metrics.worstCampaigns.length > 0 && (
                    <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/30">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-400" />
                          ⚠️ Убыточные кампании
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Рекомендуем отключить или оптимизировать
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metrics.worstCampaigns.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                                <XCircle className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{c.campaign}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-red-400 font-bold">{c.roi.toFixed(0)}%</p>
                                <p className="text-gray-500 text-sm">-{formatCurrency(c.loss)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-indigo-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      AI-рекомендации
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics.channelPerformance[0] && (
                      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Zap className="h-5 w-5 text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-emerald-300 font-medium">Масштабируйте лучший канал!</p>
                          <p className="text-gray-400 text-sm">
                            <strong>{metrics.channelPerformance[0].channel}</strong> показывает ROMI {metrics.channelPerformance[0].roi.toFixed(0)}%. 
                            Увеличьте бюджет на 30-50%.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {metrics.worstCampaigns.length > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-red-300 font-medium">Остановите убыточные кампании!</p>
                          <p className="text-gray-400 text-sm">
                            {metrics.worstCampaigns.length} кампаний приносят убытки. 
                            Отключите их и перенаправьте бюджет.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-300 font-medium">Оптимизируйте воронку</p>
                        <p className="text-gray-400 text-sm">
                          Конверсия из клика в лид: {((metrics.totalLeads / metrics.totalClicks) * 100).toFixed(1)}%. 
                          Улучшите посадочные страницы для роста до 5-7%.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="space-y-6">
                {/* Channel cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {metrics.channelPerformance.map((channel, idx) => (
                    <Card 
                      key={idx}
                      className={`backdrop-blur-xl border transition-all hover:scale-[1.02] ${getROIBg(channel.roi)}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${channel.color}20` }}
                          >
                            <Megaphone className="h-5 w-5" style={{ color: channel.color }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold">{channel.channel}</h3>
                          </div>
                          <span className={`text-xl font-bold ${getROIColor(channel.roi)}`}>
                            {channel.roi >= 0 ? '+' : ''}{channel.roi.toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Потрачено</p>
                            <p className="text-white font-medium">{formatCurrency(channel.spend)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Заработано</p>
                            <p className="text-emerald-400 font-medium">{formatCurrency(channel.revenue)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Лиды</p>
                            <p className="text-white font-medium">{channel.leads}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Продажи</p>
                            <p className="text-white font-medium">{channel.sales}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Channel comparison chart */}
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">ROMI по каналам</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.channelPerformance} layout="vertical">
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis type="number" {...axisProps(palette)} />
                        <YAxis type="category" dataKey="channel" {...axisProps(palette)} width={100} />
                        <Tooltip 
                          formatter={(value: number) => `${value.toFixed(0)}%`}
                          {...TOOLTIP_STYLE}
                        />
                        <Bar dataKey="roi" name="ROMI">
                          {metrics.channelPerformance.map((entry, index) => (
                            <Cell 
                              key={index} 
                              fill={entry.roi >= 100 ? '#10B981' : entry.roi >= 0 ? '#F59E0B' : '#EF4444'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Все рекламные кампании</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Кампания</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Расход</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Доход</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">ROMI</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.campaignPerformance.map((campaign, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 px-4">
                              <p className="text-white font-medium">{campaign.campaign}</p>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{formatCurrency(campaign.spend)}</td>
                            <td className="py-3 px-4 text-center text-emerald-400">{formatCurrency(campaign.revenue)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-bold ${getROIColor(campaign.roi)}`}>
                                {campaign.roi >= 0 ? '+' : ''}{campaign.roi.toFixed(0)}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {campaign.status === 'excellent' && (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">🚀 Отлично</span>
                              )}
                              {campaign.status === 'good' && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">✅ Хорошо</span>
                              )}
                              {campaign.status === 'poor' && (
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">⚠️ Слабо</span>
                              )}
                              {campaign.status === 'negative' && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">❌ Убыток</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Экспорт отчёта</h3>
                    <p className="text-gray-400 text-sm">Скачайте маркетинговую аналитику</p>
                  </div>
                  <div className="flex gap-3">
                    <Button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
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
            <AnalyticsSection industry="marketing" aiData={aiData} />
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
                Загрузите данные о рекламных кампаниях. Система рассчитает:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>✅ ROMI каждого канала</li>
                <li>✅ CTR, CPC, CPL, CAC</li>
                <li>✅ Воронку конверсий</li>
                <li>✅ Лучшие и худшие кампании</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
