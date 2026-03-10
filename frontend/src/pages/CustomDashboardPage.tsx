/**
 * 📊 CUSTOM DASHBOARD PAGE
 * Страница с Drag & Drop виджетами и KPI трекером
 * Показывает РЕАЛЬНЫЕ данные из загруженного файла
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Target, Settings, Save, RotateCcw, 
  ArrowLeft, Sparkles, Grid3X3, List, Download,
  Plus, Eye, EyeOff, Palette, Upload, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardSidebar } from '@/components/DashboardSidebar'
import { WidgetGrid, Widget } from '@/components/widgets/WidgetGrid'
import { KPITracker, KPIGoal } from '@/components/KPITracker'
import { useAnalyticsStore } from '@/store/analyticsStore'
import toast from 'react-hot-toast'

function buildWidgetData(analytics: any) {
  const topProducts = (analytics.top_products || []).map((p: any) => ({
    name: p.product || p.name,
    sales: p.quantity || 0,
    revenue: p.revenue || 0,
  }))

  const chartData = (analytics.daily_revenue || []).map((d: any) => ({
    name: d.date?.slice(5) || d.date,
    value: d.revenue || 0,
  }))

  const pieData = topProducts.slice(0, 5).map((p: any) => ({
    name: p.name,
    value: p.revenue,
  }))

  return {
    revenue: analytics.total_revenue || 0,
    orders: analytics.total_orders || 0,
    customers: analytics.unique_clients || 0,
    avgCheck: analytics.average_check || 0,
    chartData: chartData.length > 0 ? chartData : undefined,
    pieData: pieData.length > 0 ? pieData : undefined,
    kpiTarget: analytics.total_revenue ? Math.round(analytics.total_revenue * 1.2) : 5000000,
    kpiCurrent: analytics.total_revenue || 0,
    topProducts: topProducts.length > 0 ? topProducts : undefined,
    recentOrders: undefined,
  }
}

export default function CustomDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('widgets')
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [kpiGoals, setKpiGoals] = useState<KPIGoal[]>([])
  const analytics = useAnalyticsStore((state) => state.analytics)

  const hasRealData = !!analytics
  const widgetData = useMemo(() => {
    if (analytics) return buildWidgetData(analytics)
    return {
      revenue: 0, orders: 0, customers: 0, avgCheck: 0,
      kpiTarget: 0, kpiCurrent: 0,
    }
  }, [analytics])

  // Load saved config
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets')
    const savedGoals = localStorage.getItem('kpi-goals')
    
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets))
      } catch (e) {
        console.error('Error loading widgets:', e)
      }
    }
    
    if (savedGoals) {
      try {
        setKpiGoals(JSON.parse(savedGoals))
      } catch (e) {
        console.error('Error loading KPI goals:', e)
      }
    }
  }, [])

  const handleSaveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets)
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets))
    toast.success('Конфигурация дашборда сохранена!')
  }

  const handleSaveGoals = (goals: KPIGoal[]) => {
    setKpiGoals(goals)
    localStorage.setItem('kpi-goals', JSON.stringify(goals))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <DashboardSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto pt-16 md:pt-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-purple-400" />
                Кастомный дашборд
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
                  PRO
                </span>
              </h1>
              <p className="text-gray-400 mt-1">
                Настройте дашборд под себя с помощью Drag & Drop
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Назад
              </Button>
            </div>
          </div>

          {/* Data status banner */}
          {!hasRealData ? (
            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 mb-6">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Нет загруженных данных</h3>
                    <p className="text-gray-400 text-sm">
                      Загрузите файл на главной странице — виджеты покажут вашу реальную аналитику
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
                >
                  <Upload className="h-4 w-4 mr-2" /> Загрузить данные
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 mb-6">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Данные загружены</h3>
                  <p className="text-gray-400 text-sm">
                    • Перетаскивайте виджеты для изменения порядка &nbsp;
                    • Наведите на виджет для изменения размера &nbsp;
                    • Добавляйте KPI цели для отслеживания прогресса
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger 
                value="widgets" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Виджеты
              </TabsTrigger>
              <TabsTrigger 
                value="kpi" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                <Target className="h-4 w-4 mr-2" />
                KPI & Цели
              </TabsTrigger>
            </TabsList>

            {/* Widgets Tab */}
            <TabsContent value="widgets" className="mt-6">
              <WidgetGrid 
                initialWidgets={widgets.length > 0 ? widgets : undefined}
                data={widgetData}
                onSave={handleSaveWidgets}
              />
            </TabsContent>

            {/* KPI Tab */}
            <TabsContent value="kpi" className="mt-6">
              <KPITracker onGoalsChange={handleSaveGoals} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}













