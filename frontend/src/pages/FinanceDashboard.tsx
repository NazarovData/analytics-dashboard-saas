import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DollarSign, TrendingUp, Wallet, CreditCard,
  BarChart3, ArrowLeft, Upload, RefreshCw, Lightbulb,
  HelpCircle, X,
  PlayCircle, Sparkles, AlertTriangle, CheckCircle,
  PiggyBank, Receipt, ArrowUpRight, ArrowDownRight,
  Percent, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, Line
} from 'recharts'
import toast from 'react-hot-toast'
import { AnalyticsSection } from '@/components/AnalyticsWidgets'
import { useIndustryUpload } from '@/hooks/useIndustryUpload'
import { getPalette, CHART_COLORS, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { readFileUniversal, findColumn, getStr, getNum, getHeaders } from '@/lib/fileParser'

const palette = getPalette('finance')

// ============================================
// 💰 FINANCE DASHBOARD - P&L, Cash Flow
// ============================================

interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  account: string
}

interface FinanceMetrics {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  cashBalance: number
  monthlyTrend: { month: string; income: number; expenses: number; profit: number }[]
  expensesByCategory: { name: string; value: number; color: string }[]
  incomeByCategory: { name: string; value: number; color: string }[]
  dailyCashFlow: { date: string; inflow: number; outflow: number; balance: number }[]
  topExpenses: { category: string; amount: number; percent: number }[]
  accountBalances: { account: string; balance: number }[]
}

const EXPENSE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E']
const INCOME_COLORS = ['#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1']

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Transaction[] | null>(null)
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'pnl' | 'cashflow' | 'accounts'>('overview')
  const [showHelp, setShowHelp] = useState(false)
  const { aiData, isUploading: isAiUploading, uploadFile: uploadForAI } = useIndustryUpload('finance')

  const calculateMetrics = (transactions: Transaction[]): FinanceMetrics => {
    const income = transactions.filter(t => t.type === 'income')
    const expenses = transactions.filter(t => t.type === 'expense')
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    const netProfit = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Monthly trend
    const monthlyMap = new Map<string, { income: number; expenses: number }>()
    transactions.forEach(t => {
      const month = t.date.substring(0, 7)
      const existing = monthlyMap.get(month) || { income: 0, expenses: 0 }
      if (t.type === 'income') existing.income += t.amount
      else existing.expenses += t.amount
      monthlyMap.set(month, existing)
    })
    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data, profit: data.income - data.expenses }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)

    // Expenses by category
    const expenseCatMap = new Map<string, number>()
    expenses.forEach(t => {
      expenseCatMap.set(t.category, (expenseCatMap.get(t.category) || 0) + t.amount)
    })
    const expensesByCategory = Array.from(expenseCatMap.entries())
      .map(([name, value], idx) => ({ name, value, color: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }))
      .sort((a, b) => b.value - a.value)

    // Income by category
    const incomeCatMap = new Map<string, number>()
    income.forEach(t => {
      incomeCatMap.set(t.category, (incomeCatMap.get(t.category) || 0) + t.amount)
    })
    const incomeByCategory = Array.from(incomeCatMap.entries())
      .map(([name, value], idx) => ({ name, value, color: INCOME_COLORS[idx % INCOME_COLORS.length] }))
      .sort((a, b) => b.value - a.value)

    // Daily cash flow
    const dailyMap = new Map<string, { inflow: number; outflow: number }>()
    transactions.forEach(t => {
      const existing = dailyMap.get(t.date) || { inflow: 0, outflow: 0 }
      if (t.type === 'income') existing.inflow += t.amount
      else existing.outflow += t.amount
      dailyMap.set(t.date, existing)
    })
    let runningBalance = 0
    const dailyCashFlow = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => {
        runningBalance += data.inflow - data.outflow
        return { date, ...data, balance: runningBalance }
      })
      .slice(-30)

    // Top expenses
    const topExpenses = expensesByCategory.slice(0, 5).map(cat => ({
      category: cat.name,
      amount: cat.value,
      percent: (cat.value / totalExpenses) * 100
    }))

    // Account balances
    const accountMap = new Map<string, number>()
    transactions.forEach(t => {
      const current = accountMap.get(t.account) || 0
      accountMap.set(t.account, current + (t.type === 'income' ? t.amount : -t.amount))
    })
    const accountBalances = Array.from(accountMap.entries())
      .map(([account, balance]) => ({ account, balance }))

    const cashBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0)

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin,
      cashBalance,
      monthlyTrend,
      expensesByCategory,
      incomeByCategory,
      dailyCashFlow,
      topExpenses,
      accountBalances
    }
  }

  const loadDemoData = async () => {
    setIsLoading(true)
    try {
      const incomeCategories = ['Продажи', 'Услуги', 'Подписки', 'Консалтинг', 'Комиссии']
      const expenseCategories = ['Зарплаты', 'Аренда', 'Маркетинг', 'Оборудование', 'Налоги', 'Коммунальные']
      const accounts = ['Расчётный счёт', 'Касса', 'Карта компании']
      
      const demoTransactions: Transaction[] = []
      const today = new Date()
      
      for (let i = 0; i < 300; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - Math.floor(Math.random() * 90))
        const isIncome = Math.random() > 0.4
        
        demoTransactions.push({
          id: `TXN-${1000 + i}`,
          date: date.toISOString().split('T')[0],
          type: isIncome ? 'income' : 'expense',
          category: isIncome 
            ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
            : expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          amount: isIncome 
            ? 5000 + Math.floor(Math.random() * 95000)
            : 1000 + Math.floor(Math.random() * 49000),
          description: isIncome ? 'Поступление' : 'Оплата',
          account: accounts[Math.floor(Math.random() * accounts.length)]
        })
      }

      setData(demoTransactions)
      setMetrics(calculateMetrics(demoTransactions))
      toast.success('Финансовые данные загружены!')
    } catch (error) {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const rows = await readFileUniversal(file)
      if (rows.length === 0) { toast.error('Файл пуст'); return }
      const h = getHeaders(rows)
      const idCol = findColumn(h, ['id', 'номер', 'transaction_id', 'документ'])
      const dateCol = findColumn(h, ['date', 'дата', 'день', 'период', 'sana'])
      const typeCol = findColumn(h, ['type', 'тип', 'вид', 'операция', 'turi'])
      const categoryCol = findColumn(h, ['category', 'категория', 'статья', 'группа'])
      const amountCol = findColumn(h, ['amount', 'сумма', 'итого', 'значение', 'summa', 'маблағ'])
      const descCol = findColumn(h, ['description', 'описание', 'назначение', 'комментарий', 'примечание'])
      const accountCol = findColumn(h, ['account', 'счёт', 'счет', 'кошелёк', 'кошелек', 'банк', 'hisob'])

      const transactions: Transaction[] = rows.map((row, idx) => {
        const typeVal = getStr(row, typeCol, 'expense').toLowerCase()
        const tp: 'income' | 'expense' =
          typeVal.includes('income') || typeVal.includes('доход') || typeVal.includes('приход') || typeVal.includes('поступ')
            ? 'income' : 'expense'
        return {
          id: getStr(row, idCol, `TXN-${idx + 1}`),
          date: getStr(row, dateCol, new Date().toISOString().split('T')[0]),
          type: tp,
          category: getStr(row, categoryCol, 'Прочее'),
          amount: Math.abs(getNum(row, amountCol)),
          description: getStr(row, descCol, ''),
          account: getStr(row, accountCol, 'Основной'),
        }
      })

      setData(transactions)
      setMetrics(calculateMetrics(transactions))
      toast.success(`Загружено ${transactions.length} транзакций`)
      if (file) uploadForAI(file)
    } catch (error) {
      toast.error('Ошибка обработки файла')
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

    if (metrics.profitMargin >= 20) {
      insights.push({
        type: 'success', icon: CheckCircle,
        title: 'Отличная маржинальность!',
        message: `Рентабельность ${metrics.profitMargin.toFixed(1)}% — выше среднерыночной.`
      })
    } else if (metrics.profitMargin < 10) {
      insights.push({
        type: 'warning', icon: AlertTriangle,
        title: 'Низкая маржа',
        message: `Рентабельность всего ${metrics.profitMargin.toFixed(1)}%. Оптимизируйте расходы.`
      })
    }

    if (metrics.topExpenses.length > 0 && metrics.topExpenses[0].percent > 40) {
      insights.push({
        type: 'warning', icon: AlertTriangle,
        title: 'Концентрация расходов',
        message: `${metrics.topExpenses[0].category} — ${metrics.topExpenses[0].percent.toFixed(0)}% всех расходов. Диверсифицируйте.`
      })
    }

    if (metrics.cashBalance > 0) {
      insights.push({
        type: 'success', icon: Wallet,
        title: 'Положительный баланс',
        message: `На счетах ${formatCurrency(metrics.cashBalance)}. Финансовая подушка в норме.`
      })
    }

    if (metrics.monthlyTrend.length >= 2) {
      const last = metrics.monthlyTrend[metrics.monthlyTrend.length - 1]
      const prev = metrics.monthlyTrend[metrics.monthlyTrend.length - 2]
      const growth = ((last.profit - prev.profit) / Math.abs(prev.profit)) * 100
      if (growth > 10) {
        insights.push({
          type: 'success', icon: TrendingUp,
          title: 'Рост прибыли',
          message: `Прибыль выросла на ${growth.toFixed(0)}% по сравнению с прошлым месяцем!`
        })
      }
    }

    return insights
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900/20 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/industries')} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />Назад
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Финансы</h1>
                  <p className="text-xs text-gray-400">P&L, кэшфлоу, учёт</p>
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
                <div className="mx-auto p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl w-fit mb-4">
                  <DollarSign className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Финансовая аналитика</CardTitle>
                <CardDescription className="text-gray-400">P&L, доходы/расходы, кэшфлоу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" />
                <Button onClick={loadDemoData} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6">
                  <PlayCircle className="h-5 w-5 mr-2" />{isLoading ? 'Загрузка...' : 'Загрузить демо-данные'}
                </Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-400">или</span></div></div>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isLoading} className="w-full border-white/20 text-white hover:bg-white/10 py-6">
                  <Upload className="h-5 w-5 mr-2" />Загрузить CSV
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
                { id: 'pnl', label: 'P&L', icon: Receipt },
                { id: 'cashflow', label: 'Кэшфлоу', icon: Wallet },
                { id: 'accounts', label: 'Счета', icon: CreditCard }
              ].map(tab => (
                <Button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  className={activeTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}>
                  <tab.icon className="h-4 w-4 mr-2" />{tab.label}
                </Button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg"><ArrowUpRight className="h-5 w-5 text-green-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Доходы</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(metrics.totalIncome)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg"><ArrowDownRight className="h-5 w-5 text-red-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Расходы</p>
                          <p className="text-xl font-bold text-white">{formatCurrency(metrics.totalExpenses)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`bg-gradient-to-br ${metrics.netProfit >= 0 ? 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30' : 'from-red-500/20 to-pink-500/10 border-red-500/30'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${metrics.netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                          <PiggyBank className={`h-5 w-5 ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Прибыль</p>
                          <p className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(metrics.netProfit)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Percent className="h-5 w-5 text-blue-400" /></div>
                        <div>
                          <p className="text-xs text-gray-400">Маржа</p>
                          <p className="text-xl font-bold text-white">{metrics.profitMargin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Insights */}
                <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
                  <CardHeader><CardTitle className="text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-400" />AI-Финансовый анализ</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {getAIInsights().map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl ${insight.type === 'success' ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                          <div className="flex items-start gap-3">
                            <insight.icon className={`h-5 w-5 mt-0.5 ${insight.type === 'success' ? 'text-green-400' : 'text-amber-400'}`} />
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
                    <CardHeader><CardTitle className="text-white">Динамика P&L</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={metrics.monthlyTrend}>
                            <CartesianGrid {...GRID_PROPS} />
                            <XAxis dataKey="month" {...axisProps(palette)} />
                            <YAxis {...axisProps(palette)} />
                            <Tooltip {...TOOLTIP_STYLE} />
                            <Legend />
                            <Bar dataKey="income" fill="#10B981" name="Доходы" />
                            <Bar dataKey="expenses" fill="#EF4444" name="Расходы" />
                            <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} name="Прибыль" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader><CardTitle className="text-white">Структура расходов</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie data={metrics.expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {metrics.expensesByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'pnl' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white text-green-400">📈 Доходы по категориям</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.incomeByCategory.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                          <span className="text-white">{cat.name}</span>
                          <span className="text-green-400 font-bold">{formatCurrency(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-white text-red-400">📉 Расходы по категориям</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.topExpenses.map((exp, idx) => (
                        <div key={idx} className="p-3 bg-red-500/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white">{exp.category}</span>
                            <span className="text-red-400 font-bold">{formatCurrency(exp.amount)}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${exp.percent}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{exp.percent.toFixed(1)}% от всех расходов</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'cashflow' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white">Движение денежных средств</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.dailyCashFlow}>
                        <CartesianGrid {...GRID_PROPS} />
                        <XAxis dataKey="date" {...axisProps(palette)} />
                        <YAxis {...axisProps(palette)} />
                        <Tooltip {...TOOLTIP_STYLE} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="inflow" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Поступления" />
                        <Area type="monotone" dataKey="outflow" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="Списания" />
                        <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} name="Баланс" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'accounts' && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><CreditCard className="h-5 w-5" />Балансы счетов</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {metrics.accountBalances.map((acc, idx) => (
                      <div key={idx} className={`p-6 rounded-xl border ${acc.balance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <Building2 className={`h-6 w-6 ${acc.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                          <h4 className="font-medium text-white">{acc.account}</h4>
                        </div>
                        <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(acc.balance)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Общий баланс:</span>
                      <span className={`text-2xl font-bold ${metrics.cashBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(metrics.cashBalance)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analytics Section */}
            <AnalyticsSection industry="finance" aiData={aiData} />
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
              <div><h4 className="font-medium text-white mb-1">📊 Обзор</h4><p className="text-sm">Ключевые показатели: доходы, расходы, прибыль, маржа.</p></div>
              <div><h4 className="font-medium text-white mb-1">📈 P&L</h4><p className="text-sm">Детальная разбивка доходов и расходов по категориям.</p></div>
              <div><h4 className="font-medium text-white mb-1">💰 Кэшфлоу</h4><p className="text-sm">Движение денег: поступления, списания, баланс.</p></div>
              <div><h4 className="font-medium text-white mb-1">🏦 Счета</h4><p className="text-sm">Балансы по всем счетам компании.</p></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

