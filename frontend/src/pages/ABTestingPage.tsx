import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, Plus, Play, Pause, Square, Trash2, TrendingUp, TrendingDown,
  Users, Target, Zap, CheckCircle, XCircle, Clock, BarChart3, 
  ChevronRight, Calculator, Beaker, Trophy, AlertTriangle, RefreshCw
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import toast from 'react-hot-toast'

interface ABTest {
  id: string
  name: string
  description?: string
  hypothesis?: string
  metric: string
  status: string
  created_at: string
  started_at?: string
  traffic_split: number
  min_sample_size: number
  confidence_level: number
  winner?: string
  variants: {
    control: { name: string; visitors: number; conversions: number; revenue: number }
    variant: { name: string; visitors: number; conversions: number; revenue: number }
  }
  stats?: {
    control_rate: number
    variant_rate: number
    lift: number
    p_value: number
    is_significant: boolean
    total_visitors: number
    days_running: number
  }
}

interface TestDetails extends ABTest {
  detailed_stats: {
    control: { rate: number; ci_lower: number; ci_upper: number; visitors: number; conversions: number }
    variant: { rate: number; ci_lower: number; ci_upper: number; visitors: number; conversions: number }
    comparison: {
      lift: number
      p_value: number
      is_significant: boolean
      confidence_level: number
      winner: string | null
    }
    progress: {
      current_sample: number
      needed_sample: number
      progress_percent: number
      days_running: number
      estimated_days_to_completion: number
    }
  }
  daily_data: Array<{
    day: number
    date: string
    control_rate: number
    variant_rate: number
  }>
  recommendations: Array<{
    type: string
    icon: string
    text: string
  }>
}

export default function ABTestingPage() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<TestDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  
  // Form state
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    hypothesis: '',
    metric: 'conversion',
    control_name: 'Контроль (A)',
    variant_name: 'Вариант (B)',
    traffic_split: 50,
    min_sample_size: 1000
  })

  // Calculator state
  const [calcInput, setCalcInput] = useState({
    baseline_rate: 10,
    minimum_effect: 10,
    power: 80,
    significance: 5
  })
  const [calcResult, setCalcResult] = useState<any>(null)

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:8000/api/v1/ab/tests')
      if (res.ok) {
        const data = await res.json()
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Error loading tests:', error)
      // Mock data for demo
      setTests([
        {
          id: 'test_1',
          name: 'Новая кнопка CTA',
          description: 'Тестируем зелёную кнопку vs синюю',
          metric: 'conversion',
          status: 'running',
          created_at: '2024-12-15',
          traffic_split: 50,
          min_sample_size: 1000,
          confidence_level: 0.95,
          variants: {
            control: { name: 'Синяя (A)', visitors: 2847, conversions: 342, revenue: 1520000 },
            variant: { name: 'Зелёная (B)', visitors: 2853, conversions: 399, revenue: 1780000 }
          },
          stats: { control_rate: 12.01, variant_rate: 13.98, lift: 16.4, p_value: 0.0234, is_significant: true, total_visitors: 5700, days_running: 10 }
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTestDetails = async (testId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/ab/tests/${testId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedTest(data)
      }
    } catch (error) {
      console.error('Error loading test details:', error)
    }
  }

  const createTest = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/ab/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTest)
      })
      if (res.ok) {
        toast.success('Тест создан!')
        setShowCreateModal(false)
        loadTests()
        setNewTest({
          name: '', description: '', hypothesis: '', metric: 'conversion',
          control_name: 'Контроль (A)', variant_name: 'Вариант (B)',
          traffic_split: 50, min_sample_size: 1000
        })
      }
    } catch (error) {
      toast.error('Ошибка создания теста')
    }
  }

  const startTest = async (testId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/ab/tests/${testId}/start`, { method: 'POST' })
      if (res.ok) {
        toast.success('Тест запущен!')
        loadTests()
      }
    } catch (error) {
      toast.error('Ошибка запуска')
    }
  }

  const stopTest = async (testId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/ab/tests/${testId}/stop`, { method: 'POST' })
      if (res.ok) {
        toast.success('Тест остановлен!')
        loadTests()
      }
    } catch (error) {
      toast.error('Ошибка остановки')
    }
  }

  const calculateSampleSize = async () => {
    try {
      const params = new URLSearchParams({
        baseline_rate: (calcInput.baseline_rate / 100).toString(),
        minimum_effect: (calcInput.minimum_effect / 100).toString(),
        power: (calcInput.power / 100).toString(),
        significance: (calcInput.significance / 100).toString()
      })
      const res = await fetch(`http://localhost:8000/api/v1/ab/calculator?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCalcResult(data)
      }
    } catch (error) {
      // Mock calculation
      const n = Math.ceil(16 * 0.1 * 0.9 / Math.pow(calcInput.minimum_effect / 100 * 0.1, 2))
      setCalcResult({
        result: {
          sample_size_per_variant: n,
          total_sample_size: n * 2,
          estimated_days: {
            at_100_visitors_per_day: Math.ceil(n * 2 / 100),
            at_500_visitors_per_day: Math.ceil(n * 2 / 500),
            at_1000_visitors_per_day: Math.ceil(n * 2 / 1000)
          }
        }
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'completed': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'draft': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/industries')} variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <Beaker className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">A/B Тестирование</h1>
                  <p className="text-sm text-gray-400">Эксперименты и оптимизация</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCalculator(true)}
                variant="outline"
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Калькулятор
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Новый тест
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Beaker className="h-4 w-4" />
                <span className="text-sm">Всего тестов</span>
              </div>
              <div className="text-2xl font-bold text-white">{tests.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Play className="h-4 w-4" />
                <span className="text-sm">Активных</span>
              </div>
              <div className="text-2xl font-bold text-green-400">
                {tests.filter(t => t.status === 'running').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">С победителем</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {tests.filter(t => t.stats?.is_significant).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Участников</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {tests.reduce((sum, t) => sum + (t.stats?.total_visitors || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-orange-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Загрузка тестов...</p>
            </div>
          ) : tests.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-12 text-center">
                <Beaker className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Нет активных тестов</h3>
                <p className="text-gray-400 mb-4">Создайте первый A/B тест для оптимизации конверсии</p>
                <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-orange-500 to-red-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать тест
                </Button>
              </CardContent>
            </Card>
          ) : (
            tests.map(test => (
              <Card 
                key={test.id} 
                className="bg-white/5 border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => loadTestDetails(test.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(test.status)}`}>
                          {getStatusIcon(test.status)}
                          {test.status === 'running' ? 'Активен' : 
                           test.status === 'paused' ? 'Пауза' : 
                           test.status === 'completed' ? 'Завершён' : 'Черновик'}
                        </span>
                        {test.stats?.is_significant && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Есть победитель
                          </span>
                        )}
                      </div>
                      {test.description && (
                        <p className="text-gray-400 text-sm mb-3">{test.description}</p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => startTest(test.id)} className="bg-green-500 hover:bg-green-600">
                          <Play className="h-4 w-4 mr-1" />
                          Запустить
                        </Button>
                      )}
                      {test.status === 'running' && (
                        <Button size="sm" onClick={() => stopTest(test.id)} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                          <Square className="h-4 w-4 mr-1" />
                          Стоп
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Variants Comparison */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Control */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-400 text-sm font-medium">{test.variants.control.name}</span>
                        <span className="text-gray-500 text-xs">Контроль</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-bold text-white">{test.stats?.control_rate || 0}%</div>
                          <div className="text-xs text-gray-500">конверсия</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-400">{test.variants.control.visitors.toLocaleString()} визитов</div>
                          <div className="text-gray-400">{test.variants.control.conversions.toLocaleString()} конверсий</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Variant */}
                    <div className={`p-4 rounded-xl ${test.stats?.lift && test.stats.lift > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${test.stats?.lift && test.stats.lift > 0 ? 'text-green-400' : 'text-orange-400'}`}>
                          {test.variants.variant.name}
                        </span>
                        <span className="text-gray-500 text-xs">Вариант</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-bold text-white">{test.stats?.variant_rate || 0}%</div>
                          <div className="text-xs text-gray-500">конверсия</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-400">{test.variants.variant.visitors.toLocaleString()} визитов</div>
                          <div className="text-gray-400">{test.variants.variant.conversions.toLocaleString()} конверсий</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        {test.stats?.lift !== undefined && test.stats.lift > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span className={`font-semibold ${test.stats?.lift && test.stats.lift > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {test.stats?.lift ? `${test.stats.lift > 0 ? '+' : ''}${test.stats.lift.toFixed(1)}%` : '—'}
                        </span>
                        <span className="text-gray-500 text-sm">lift</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${test.stats?.p_value && test.stats.p_value < 0.05 ? 'text-green-400' : 'text-gray-400'}`}>
                          p = {test.stats?.p_value?.toFixed(4) || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="h-4 w-4" />
                        {test.stats?.days_running || 0} дн.
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Создать A/B тест</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Название теста *</label>
                <Input
                  value={newTest.name}
                  onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="Например: Новый дизайн кнопки"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Описание</label>
                <Input
                  value={newTest.description}
                  onChange={e => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Что тестируем?"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Гипотеза</label>
                <Input
                  value={newTest.hypothesis}
                  onChange={e => setNewTest({ ...newTest, hypothesis: e.target.value })}
                  placeholder="Мы ожидаем, что..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Контроль (A)</label>
                  <Input
                    value={newTest.control_name}
                    onChange={e => setNewTest({ ...newTest, control_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Вариант (B)</label>
                  <Input
                    value={newTest.variant_name}
                    onChange={e => setNewTest({ ...newTest, variant_name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Трафик на B (%)</label>
                  <Input
                    type="number"
                    value={newTest.traffic_split}
                    onChange={e => setNewTest({ ...newTest, traffic_split: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Мин. выборка</label>
                  <Input
                    type="number"
                    value={newTest.min_sample_size}
                    onChange={e => setNewTest({ ...newTest, min_sample_size: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-gray-400">
                Отмена
              </Button>
              <Button onClick={createTest} className="bg-gradient-to-r from-orange-500 to-red-500">
                Создать
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-400" />
                Калькулятор выборки
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Базовая конверсия (%)</label>
                  <Input
                    type="number"
                    value={calcInput.baseline_rate}
                    onChange={e => setCalcInput({ ...calcInput, baseline_rate: parseFloat(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Мин. эффект (%)</label>
                  <Input
                    type="number"
                    value={calcInput.minimum_effect}
                    onChange={e => setCalcInput({ ...calcInput, minimum_effect: parseFloat(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Мощность (%)</label>
                  <Input
                    type="number"
                    value={calcInput.power}
                    onChange={e => setCalcInput({ ...calcInput, power: parseFloat(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Значимость (%)</label>
                  <Input
                    type="number"
                    value={calcInput.significance}
                    onChange={e => setCalcInput({ ...calcInput, significance: parseFloat(e.target.value) })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <Button onClick={calculateSampleSize} className="w-full bg-gradient-to-r from-orange-500 to-red-500">
                Рассчитать
              </Button>
              
              {calcResult && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white font-semibold mb-3">Результат:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">На вариант:</span>
                      <span className="text-white font-medium">{calcResult.result.sample_size_per_variant.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Всего:</span>
                      <span className="text-white font-bold">{calcResult.result.total_sample_size.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 mt-2">
                      <div className="text-gray-400 mb-1">Примерное время:</div>
                      <div className="text-xs text-gray-500">
                        При 100 визитов/день: {calcResult.result.estimated_days.at_100_visitors_per_day} дней
                      </div>
                      <div className="text-xs text-gray-500">
                        При 500 визитов/день: {calcResult.result.estimated_days.at_500_visitors_per_day} дней
                      </div>
                      <div className="text-xs text-gray-500">
                        При 1000 визитов/день: {calcResult.result.estimated_days.at_1000_visitors_per_day} дней
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end">
              <Button variant="ghost" onClick={() => setShowCalculator(false)} className="text-gray-400">
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-auto">
          <div className="w-full max-w-4xl bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTest.name}</h2>
                <p className="text-gray-400 text-sm">{selectedTest.description}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTest(null)} className="text-gray-400">
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-auto">
              {/* Progress */}
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Прогресс выборки</span>
                  <span className="text-white font-medium">
                    {selectedTest.detailed_stats?.progress.progress_percent}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                    style={{ width: `${selectedTest.detailed_stats?.progress.progress_percent || 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{selectedTest.detailed_stats?.progress.current_sample.toLocaleString()} / {selectedTest.detailed_stats?.progress.needed_sample.toLocaleString()}</span>
                  <span>~{selectedTest.detailed_stats?.progress.estimated_days_to_completion} дней до завершения</span>
                </div>
              </div>
              
              {/* Chart */}
              {selectedTest.daily_data && selectedTest.daily_data.length > 0 && (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedTest.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                      <YAxis stroke="#666" tick={{ fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="control_rate" name="Контроль" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="variant_rate" name="Вариант" stroke="#22c55e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Recommendations */}
              {selectedTest.recommendations && (
                <div className="space-y-2">
                  <h4 className="text-white font-semibold">Рекомендации:</h4>
                  {selectedTest.recommendations.map((rec, i) => (
                    <div key={i} className={`p-3 rounded-lg flex items-start gap-2 ${
                      rec.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                      rec.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                      'bg-white/5 border border-white/10'
                    }`}>
                      <span>{rec.icon}</span>
                      <span className="text-gray-300 text-sm">{rec.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}














