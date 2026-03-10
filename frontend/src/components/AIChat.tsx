/**
 * 🤖 AI CHAT - Чат с AI для аналитики
 * 
 * Возможности:
 * - Задавать вопросы на русском языке
 * - Получать графики и данные
 * - История сообщений
 * - Быстрые команды
 */
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  Calendar,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Lightbulb,
  Mic,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

// Типы сообщений
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  chart?: {
    type: 'line' | 'bar' | 'pie' | 'area'
    data: any[]
    title?: string
  }
  data?: {
    label: string
    value: string | number
  }[]
  isLoading?: boolean
}

// Быстрые команды
const QUICK_COMMANDS = [
  { icon: TrendingUp, label: 'Покажи продажи за неделю', query: 'Покажи продажи за последнюю неделю' },
  { icon: ShoppingCart, label: 'Топ товары', query: 'Какие топ-5 товаров по выручке?' },
  { icon: Users, label: 'Анализ клиентов', query: 'Сколько у меня клиентов и какой средний чек?' },
  { icon: BarChart3, label: 'Сравни периоды', query: 'Сравни продажи этого и прошлого месяца' },
  { icon: Calendar, label: 'Прогноз', query: 'Какой прогноз продаж на следующую неделю?' },
  { icon: Lightbulb, label: 'Рекомендации', query: 'Дай рекомендации по увеличению продаж' },
]

// Цвета для графиков
const CHART_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444']

interface AIChatProps {
  analyticsData?: any  // Данные аналитики для контекста
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function AIChat({ analyticsData, isOpen = true, onClose, className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! 👋 Я AI-ассистент Analitix. Задайте мне вопрос о ваших данных, и я отвечу с графиками и аналитикой.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Фокус на input при открытии
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Обработка отправки сообщения
  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Добавляем loading сообщение
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    try {
      // Вызов реального API
      const apiResponse = await fetch('http://localhost:8000/api/v1/ai_chat/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: analyticsData?.analytics || analyticsData || {}  // Передаем данные аналитики
        })
      })

      if (!apiResponse.ok) {
        throw new Error('Ошибка API')
      }

      const result = await apiResponse.json()
      
      // Преобразуем ответ API в формат Message
      const response: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.message || 'Ответ получен',
        timestamp: new Date(),
        chart: result.chart ? {
          type: result.chart.type,
          data: result.chart.data,
          title: result.chart.title
        } : undefined,
        data: result.data ? result.data.map((item: any) => ({
          label: item.label,
          value: item.value
        })) : undefined
      }
      
      // Убираем loading и добавляем ответ
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isLoading)
        return [...filtered, response]
      })
    } catch (error) {
      console.error('AI Chat error:', error)
      // Fallback на локальную обработку при ошибке API
      try {
        const response = await processQuery(input, analyticsData)
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isLoading)
          return [...filtered, response]
        })
      } catch (fallbackError) {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isLoading)
          return [...filtered, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Извините, произошла ошибка. Попробуйте ещё раз.',
            timestamp: new Date()
          }]
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Копирование сообщения
  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Быстрая команда
  const handleQuickCommand = (query: string) => {
    setInput(query)
    inputRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <Card className={`
      ${isExpanded ? 'fixed inset-4 z-50' : 'w-full max-w-2xl'}
      bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800
      border-purple-500/30 shadow-2xl shadow-purple-500/10
      flex flex-col
      ${className}
    `}>
      {/* Header */}
      <CardHeader className="border-b border-white/10 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                AI Ассистент
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                  GPT
                </span>
              </CardTitle>
              <p className="text-xs text-gray-500">Задавайте вопросы о ваших данных</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Quick Commands */}
        <div className="p-3 border-b border-white/5 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_COMMANDS.map((cmd, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickCommand(cmd.query)}
                className="flex-shrink-0 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white text-xs"
              >
                <cmd.icon className="h-3 w-3 mr-1" />
                {cmd.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`
                max-w-[80%] rounded-2xl p-4
                ${message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-white/5 border border-white/10 text-gray-200'}
              `}>
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-400">Анализирую данные...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Данные */}
                    {message.data && message.data.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {message.data.map((item, idx) => (
                          <div key={idx} className="bg-white/10 rounded-lg p-2">
                            <div className="text-xs text-gray-400">{item.label}</div>
                            <div className="text-sm font-bold text-white">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* График */}
                    {message.chart && (
                      <div className="mt-4 bg-white/5 rounded-xl p-4">
                        {message.chart.title && (
                          <h4 className="text-sm font-semibold text-white mb-3">{message.chart.title}</h4>
                        )}
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            {message.chart.type === 'line' && (
                              <LineChart data={message.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                                  labelStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6' }} />
                              </LineChart>
                            )}
                            {message.chart.type === 'bar' && (
                              <BarChart data={message.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                                  labelStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                            {message.chart.type === 'area' && (
                              <AreaChart data={message.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                                <YAxis stroke="#9CA3AF" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                                  labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                              </AreaChart>
                            )}
                            {message.chart.type === 'pie' && (
                              <PieChart>
                                <Pie
                                  data={message.chart.data}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  labelLine={false}
                                >
                                  {message.chart.data.map((_, idx) => (
                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                                />
                              </PieChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    {message.role === 'assistant' && !message.isLoading && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.id, message.content)}
                          className="h-6 px-2 text-xs text-gray-500 hover:text-white"
                        >
                          {copiedId === message.id ? (
                            <><Check className="h-3 w-3 mr-1" /> Скопировано</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" /> Копировать</>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Спросите что-нибудь о ваших данных..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 Совет: Попробуйте "Покажи топ-5 товаров" или "Какой прогноз на неделю?"
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Обработка запроса пользователя
 * В реальном приложении это будет вызов API
 */
async function processQuery(query: string, analyticsData?: any): Promise<Message> {
  // Имитация задержки API
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
  
  const queryLower = query.toLowerCase()
  
  // Парсим запрос и генерируем ответ
  
  // 📊 Продажи / Выручка
  if (queryLower.includes('продаж') || queryLower.includes('выручк') || queryLower.includes('доход')) {
    const hasWeek = queryLower.includes('недел')
    const hasMonth = queryLower.includes('месяц')
    
    // Используем реальные данные из analyticsData, если они есть
    const dailyRevenue = analyticsData?.daily_revenue || analyticsData?.analytics?.daily_revenue || []
    const totalRevenue = analyticsData?.total_revenue || analyticsData?.analytics?.total_revenue || 0
    const totalOrders = analyticsData?.total_orders || analyticsData?.analytics?.total_orders || 0
    
    let chartData: Array<{name: string, value: number}>
    let total: number
    let avg: number
    let trend: string
    let content: string
    
    if (dailyRevenue && dailyRevenue.length > 0) {
      // Используем реальные данные
      chartData = dailyRevenue.slice(-30).map((item: any) => {
        const dateStr = item.date || item.name || ''
        try {
          const date = new Date(dateStr)
          const dayName = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
          return { name: dayName, value: item.revenue || item.value || 0 }
        } catch {
          return { name: dateStr.substring(0, 10), value: item.revenue || item.value || 0 }
        }
      })
      
      total = totalRevenue || chartData.reduce((sum, d) => sum + d.value, 0)
      avg = chartData.length > 0 ? total / chartData.length : 0
      trend = chartData.length > 1 && chartData[chartData.length - 1].value > chartData[0].value ? 'растёт' : 'снижается'
      
      content = `📊 Анализ продаж ${hasWeek ? 'за неделю' : hasMonth ? 'за месяц' : ''}:\n\nОбщая выручка: ${formatCurrency(total)}\nСредний день: ${formatCurrency(avg)}\nЗаказов: ${totalOrders.toLocaleString()}\nТренд: ${trend === 'растёт' ? '📈 Растёт' : '📉 Снижается'}`
      
      // Добавляем информацию о прибыли, если доступна
      const totalProfit = analyticsData?.total_profit || analyticsData?.analytics?.total_profit
      const marginPercent = analyticsData?.margin_percent || analyticsData?.analytics?.margin_percent
      if (totalProfit !== undefined && totalProfit !== null) {
        content += `\n\n💰 Прибыль: ${formatCurrency(totalProfit)}`
        if (marginPercent !== undefined && marginPercent !== null) {
          content += `\n📊 Маржинальность: ${marginPercent.toFixed(1)}%`
        }
      }
    } else {
      // Демо-данные
      chartData = hasWeek 
        ? generateWeekData()
        : hasMonth 
          ? generateMonthData()
          : generateWeekData()
      
      total = chartData.reduce((sum, d) => sum + d.value, 0)
      avg = total / chartData.length
      trend = chartData[chartData.length - 1].value > chartData[0].value ? 'растёт' : 'снижается'
      
      content = `📊 Анализ продаж ${hasWeek ? 'за неделю' : hasMonth ? 'за месяц' : ''}:\n\nОбщая выручка: ${formatCurrency(total)}\nСредний день: ${formatCurrency(avg)}\nТренд: ${trend === 'растёт' ? '📈 Растёт' : '📉 Снижается'}\n\n⚠️ *Это демо-данные. Загрузите файл с данными для реального анализа.*`
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      data: [
        { label: 'Выручка', value: total >= 1000000 ? `${(total/1000000).toFixed(2)}M ₽` : formatCurrency(total) },
        { label: 'Средняя', value: avg >= 1000 ? `${(avg/1000).toFixed(0)}K ₽` : formatCurrency(avg) },
        { label: 'Тренд', value: trend === 'растёт' ? '↑ Рост' : '↓ Снижение' },
        { label: 'Дней', value: chartData.length.toString() }
      ],
      chart: {
        type: 'area',
        data: chartData,
        title: `Динамика продаж ${hasWeek ? '(неделя)' : hasMonth ? '(месяц)' : ''}`
      }
    }
  }
  
  // 💰 Товар с самой высокой маржой
  if ((queryLower.includes('товар') || queryLower.includes('product')) && 
      (queryLower.includes('маржа') || queryLower.includes('margin')) &&
      (queryLower.includes('высок') || queryLower.includes('сам') || queryLower.includes('high'))) {
    const topProducts = analyticsData?.top_products || analyticsData?.analytics?.top_products || []
    const hasProfitData = analyticsData?.has_profit_data || analyticsData?.analytics?.has_profit_data || false
    
    if (!hasProfitData) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Данные о марже недоступны**\n\nДля анализа маржинальности нужна колонка с себестоимостью (cost) в ваш CSV файл.',
        timestamp: new Date()
      }
    }
    
    const productsWithMargin = topProducts.filter((p: any) => p.margin_percent !== undefined && p.margin_percent !== null)
    
    if (productsWithMargin.length === 0) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ В данных нет товаров с информацией о марже. Проверьте наличие колонки с себестоимостью.',
        timestamp: new Date()
      }
    }
    
    // Сортируем по марже
    const sortedByMargin = [...productsWithMargin].sort((a: any, b: any) => (b.margin_percent || 0) - (a.margin_percent || 0))
    const topMarginProduct = sortedByMargin[0]
    
    let content = `💰 **Товар с самой высокой маржинальностью:**

🏆 **${topMarginProduct.product || topMarginProduct.name}**
• Маржа: **${topMarginProduct.margin_percent.toFixed(1)}%**
• Прибыль: ${formatCurrency(topMarginProduct.profit || 0)}
• Выручка: ${formatCurrency(topMarginProduct.revenue || 0)}
${topMarginProduct.quantity ? `• Продано: ${topMarginProduct.quantity} шт` : ''}

`
    
    // Топ-5 по марже
    content += `📊 **Топ-5 товаров по маржинальности:**\n\n`
    sortedByMargin.slice(0, 5).forEach((p: any, i: number) => {
      content += `${i + 1}. ${p.product || p.name} — ${p.margin_percent.toFixed(1)}% маржа (прибыль: ${formatCurrency(p.profit || 0)})\n`
    })
    
    content += `\n💡 **Рекомендация:** Увеличьте продвижение товаров с высокой маржой — они приносят больше прибыли на каждый рубль выручки!`
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      chart: {
        type: 'bar',
        data: sortedByMargin.slice(0, 5).map((p: any) => ({
          name: p.product || p.name,
          value: p.margin_percent || 0
        })),
        title: 'Топ-5 товаров по маржинальности'
      }
    }
  }
  
  // 💰 Топ товары по ПРИБЫЛИ (не по выручке!)
  if ((queryLower.includes('топ') || queryLower.includes('лучш')) && 
      (queryLower.includes('прибыл') || queryLower.includes('маржа') || queryLower.includes('рентабел'))) {
    const topProducts = analyticsData?.top_products || analyticsData?.analytics?.top_products || []
    const hasProfitData = analyticsData?.has_profit_data || analyticsData?.analytics?.has_profit_data || false
    
    if (!hasProfitData) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Данные о прибыли недоступны**\n\nДля анализа прибыли по товарам нужно добавить колонку с себестоимостью (cost) в ваш CSV файл.',
        timestamp: new Date()
      }
    }
    
    const productsWithProfit = topProducts.filter((p: any) => p.profit !== undefined && p.profit !== null)
    
    if (productsWithProfit.length === 0) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ В данных нет товаров с информацией о прибыли. Проверьте наличие колонки с себестоимостью.',
        timestamp: new Date()
      }
    }
    
    // Сортируем по ПРИБЫЛИ, а не по выручке!
    const sortedByProfit = [...productsWithProfit].sort((a: any, b: any) => (b.profit || 0) - (a.profit || 0)).slice(0, 5)
    const totalProfit = sortedByProfit.reduce((sum: number, p: any) => sum + (p.profit || 0), 0)
    
    let content = '💰 **Топ-5 товаров по ПРИБЫЛИ:**\n\n'
    
    sortedByProfit.forEach((p: any, i: number) => {
      const profitShare = totalProfit > 0 ? (p.profit / totalProfit * 100) : 0
      const marginText = p.margin_percent !== undefined ? ` | Маржа: ${p.margin_percent.toFixed(1)}%` : ''
      content += `${i + 1}. **${p.product || p.name}**\n`
      content += `   💰 Прибыль: ${formatCurrency(p.profit)} (${profitShare.toFixed(1)}%)\n`
      content += `   📊 Выручка: ${formatCurrency(p.revenue)}${marginText}\n\n`
    })
    
    // Убыточные товары
    const unprofitable = topProducts.filter((p: any) => p.profit !== undefined && p.profit < 0)
    if (unprofitable.length > 0) {
      content += `🚨 **Убыточные товары (${unprofitable.length}):**\n\n`
      unprofitable.slice(0, 5).forEach((p: any) => {
        content += `• ${p.product || p.name} — убыток ${formatCurrency(Math.abs(p.profit))}\n`
      })
      content += '\n💡 **Рекомендация:** Пересмотрите цены или исключите из ассортимента.\n'
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      chart: {
        type: 'bar',
        data: sortedByProfit.map((p: any) => ({
          name: p.product || p.name,
          value: p.profit || 0
        })),
        title: 'Топ-5 товаров по прибыли'
      }
    }
  }
  
  // 🏆 Топ товары по выручке
  if (queryLower.includes('топ') || queryLower.includes('лучш') || queryLower.includes('популярн')) {
    // Используем реальные данные из analyticsData, если они есть
    const topProducts = analyticsData?.top_products || analyticsData?.analytics?.top_products || []
    
    let products: Array<{name: string, value: number}>
    let content: string
    
    if (topProducts && topProducts.length > 0) {
      // Используем реальные данные
      products = topProducts.slice(0, 5).map((p: any) => ({
        name: p.product || p.name || 'Товар',
        value: p.revenue || p.value || 0
      }))
      
      const total = products.reduce((sum, p) => sum + p.value, 0)
      const totalRevenue = analyticsData?.total_revenue || analyticsData?.analytics?.total_revenue || total
      
      content = '🏆 Топ-5 товаров по выручке:\n\n' + products.map((p, i) => {
        const share = totalRevenue > 0 ? (p.value / totalRevenue * 100) : 0
        const profitInfo = topProducts[i]?.profit !== undefined ? ` | Прибыль: ${formatCurrency(topProducts[i].profit)}` : ''
        const marginInfo = topProducts[i]?.margin_percent !== undefined ? ` | Маржа: ${topProducts[i].margin_percent.toFixed(1)}%` : ''
        return `${i + 1}. ${p.name} — ${formatCurrency(p.value)} (${share.toFixed(1)}%)${profitInfo}${marginInfo}`
      }).join('\n')
      
      if (totalRevenue > 0) {
        content += `\n\n💡 Топ-5 товаров дают ${formatCurrency(total)} выручки (${(total/totalRevenue*100).toFixed(1)}% от общей)`
      }
    } else {
      // Демо-данные
      products = [
        { name: 'iPhone 15 Pro', value: 2850000 },
        { name: 'MacBook Air', value: 1920000 },
        { name: 'AirPods Pro', value: 890000 },
        { name: 'iPad Pro', value: 750000 },
        { name: 'Apple Watch', value: 620000 }
      ]
      
      content = '🏆 Топ-5 товаров по выручке:\n\n' + products.map((p, i) => 
        `${i + 1}. ${p.name} — ${formatCurrency(p.value)}`
      ).join('\n')
      
      content += '\n\n⚠️ *Это демо-данные. Загрузите файл с данными для реального анализа.*'
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      chart: {
        type: 'bar',
        data: products,
        title: 'Топ товары по выручке'
      }
    }
  }
  
  // 💰 Клиенты по прибыли
  if ((queryLower.includes('клиент') || queryLower.includes('покупател')) && 
      (queryLower.includes('прибыл') || queryLower.includes('принес'))) {
    const uniqueClients = analyticsData?.unique_clients || analyticsData?.analytics?.unique_clients
    
    if (!uniqueClients) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Данные о клиентах недоступны**\n\nВ вашем файле нет колонки с идентификацией клиентов (client_id). Добавьте колонку `client_id` для анализа клиентов по прибыли.',
        timestamp: new Date()
      }
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `💰 **Топ клиентов по прибыли:**

Для точного анализа нужны данные с колонкой \`client_id\` и \`cost\` (себестоимость).

**Что я могу показать сейчас:**
• Уникальных клиентов: ${uniqueClients.toLocaleString()}
• Общая прибыль: ${analyticsData?.total_profit ? formatCurrency(analyticsData.total_profit) : 'N/A'}

**Чтобы увидеть топ клиентов:**
1. Добавьте колонку \`client_id\` в CSV
2. Добавьте колонку \`cost\` (себестоимость)
3. Загрузите файл заново`,
      timestamp: new Date()
    }
  }
  
  // 📈 Динамика прибыли
  if (queryLower.includes('динамик') && queryLower.includes('прибыл')) {
    const hasProfitData = analyticsData?.has_profit_data || analyticsData?.analytics?.has_profit_data || false
    const dailyRevenue = analyticsData?.daily_revenue || analyticsData?.analytics?.daily_revenue || []
    
    if (!hasProfitData) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Динамика прибыли недоступна**\n\nДля анализа динамики прибыли нужна колонка с себестоимостью (cost).',
        timestamp: new Date()
      }
    }
    
    if (dailyRevenue.length === 0) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Нет данных по датам. Добавьте колонку `date` в ваш CSV файл.',
        timestamp: new Date()
      }
    }
    
    const chartData = dailyRevenue.slice(-30).map((item: any) => ({
      name: item.date?.substring(0, 10) || item.name,
      value: item.revenue || item.value || 0
    }))
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `📈 **Динамика прибыли по месяцам:**

Для точного анализа динамики прибыли нужны данные с колонкой \`cost\`.

**Что я могу показать сейчас:**
• Динамика выручки (график ниже)
• Общая прибыль: ${analyticsData?.total_profit ? formatCurrency(analyticsData.total_profit) : 'N/A'}
• Маржинальность: ${analyticsData?.margin_percent ? `${analyticsData.margin_percent.toFixed(1)}%` : 'N/A'}

**Чтобы увидеть динамику прибыли:**
1. Добавьте колонку \`cost\` в CSV
2. Загрузите файл заново`,
      timestamp: new Date(),
      chart: {
        type: 'area',
        data: chartData,
        title: 'Динамика выручки (прибыль будет после добавления cost)'
      }
    }
  }
  
  // 💰 Средняя прибыль с заказа
  if ((queryLower.includes('средн') || queryLower.includes('avg')) && 
      (queryLower.includes('прибыл') || queryLower.includes('заказ'))) {
    const hasProfitData = analyticsData?.has_profit_data || analyticsData?.analytics?.has_profit_data || false
    const totalProfit = analyticsData?.total_profit || analyticsData?.analytics?.total_profit
    const totalOrders = analyticsData?.total_orders || analyticsData?.analytics?.total_orders || 0
    
    if (!hasProfitData || totalProfit === undefined || totalProfit === null) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Средняя прибыль недоступна**\n\nДля расчета нужна колонка с себестоимостью (cost).',
        timestamp: new Date()
      }
    }
    
    const avgProfit = totalOrders > 0 ? totalProfit / totalOrders : 0
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `💰 **Средняя прибыль с одного заказа:**

📊 **Расчет:**
Средняя прибыль = Общая прибыль ÷ Количество заказов
${formatCurrency(totalProfit)} ÷ ${totalOrders} заказов = **${formatCurrency(avgProfit)}**

📈 **Дополнительно:**
• Общая прибыль: ${formatCurrency(totalProfit)}
• Маржинальность: ${analyticsData?.margin_percent ? `${analyticsData.margin_percent.toFixed(1)}%` : 'N/A'}
• Рентабельность: ${analyticsData?.profitability_percent ? `${analyticsData.profitability_percent.toFixed(1)}%` : 'N/A'}

${avgProfit > 20000 ? '✅ Отличная средняя прибыль!' : avgProfit > 10000 ? '📊 Хорошая средняя прибыль.' : avgProfit > 0 ? '⚠️ Низкая средняя прибыль.' : '🚨 Отрицательная прибыль!'}`,
      timestamp: new Date(),
      data: [
        { label: 'Ср. прибыль/заказ', value: formatCurrency(avgProfit) },
        { label: 'Общая прибыль', value: formatCurrency(totalProfit) },
        { label: 'Маржинальность', value: analyticsData?.margin_percent ? `${analyticsData.margin_percent.toFixed(1)}%` : 'N/A' },
        { label: 'Рентабельность', value: analyticsData?.profitability_percent ? `${analyticsData.profitability_percent.toFixed(1)}%` : 'N/A' }
      ]
    }
  }
  
  // 👥 Клиенты с одним заказом
  if (queryLower.includes('один') && (queryLower.includes('заказ') || queryLower.includes('покупк'))) {
    const uniqueClients = analyticsData?.unique_clients || analyticsData?.analytics?.unique_clients
    const totalOrders = analyticsData?.total_orders || analyticsData?.analytics?.total_orders || 0
    
    if (!uniqueClients) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **Анализ недоступен**\n\nВ вашем файле нет колонки с идентификацией клиентов (client_id).',
        timestamp: new Date()
      }
    }
    
    const avgOrdersPerClient = uniqueClients > 0 ? totalOrders / uniqueClients : 0
    const singleOrderClients = avgOrdersPerClient === 1 ? uniqueClients : null
    
    let content = `👥 **Анализ повторных покупок:**

📊 **Статистика:**
• Всего уникальных клиентов: ${uniqueClients.toLocaleString()}
• Всего заказов: ${totalOrders.toLocaleString()}
• Среднее заказов на клиента: ${avgOrdersPerClient.toFixed(2)}

`
    
    if (singleOrderClients) {
      content += `🚨 **Клиенты с одним заказом:**
• Количество: ${singleOrderClients.toLocaleString()} клиентов
• Процент: 100%

💡 **Рекомендация:**
Все ваши клиенты сделали только один заказ. Это большой потенциал для роста!

**Что делать:**
1. Отправьте email с персональным предложением
2. Предложите скидку 10-15% на следующую покупку
3. Запустите программу лояльности`
    } else {
      const repeatRate = uniqueClients > 0 ? ((totalOrders - uniqueClients) / totalOrders * 100) : 0
      content += `✅ **Повторные покупки:**
• Процент повторных: ${repeatRate.toFixed(1)}%
• Клиентов с повторными: ${(totalOrders - uniqueClients).toLocaleString()}

💡 **Рекомендация:**
Ваш процент повторных покупок ${repeatRate > 30 ? 'отличный' : repeatRate > 20 ? 'хороший' : 'можно улучшить'}.`
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      data: [
        { label: 'Клиентов', value: uniqueClients.toLocaleString() },
        { label: 'Заказов', value: totalOrders.toLocaleString() },
        { label: 'Ср. заказов/клиент', value: avgOrdersPerClient.toFixed(2) },
        { label: 'Повторные', value: uniqueClients > 0 ? `${((totalOrders - uniqueClients) / totalOrders * 100).toFixed(1)}%` : '0%' }
      ]
    }
  }
  
  // 👥 Клиенты
  if (queryLower.includes('клиент') || queryLower.includes('покупател') || queryLower.includes('чек')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: '👥 Анализ клиентов:\n\nВсего уникальных клиентов: 1,247\nНовых за месяц: 312\nСредний чек: 8,450 ₽\nПовторные покупки: 34%',
      timestamp: new Date(),
      data: [
        { label: 'Клиентов', value: '1,247' },
        { label: 'Новых', value: '312' },
        { label: 'Ср. чек', value: '8,450 ₽' },
        { label: 'Повторные', value: '34%' }
      ],
      chart: {
        type: 'pie',
        data: [
          { name: 'Новые', value: 312 },
          { name: 'Вернулись', value: 425 },
          { name: 'VIP', value: 89 },
          { name: 'Редкие', value: 421 }
        ],
        title: 'Сегменты клиентов'
      }
    }
  }
  
  // 📈 Прогноз
  if (queryLower.includes('прогноз') || queryLower.includes('предсказ') || queryLower.includes('будет')) {
    const forecastData = generateForecastData()
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: '📈 Прогноз продаж на 7 дней:\n\nОжидаемая выручка: 4,250,000 ₽\nТренд: Рост +12%\nУверенность: 87%\n\n💡 Рекомендация: Подготовьте запасы популярных товаров!',
      timestamp: new Date(),
      data: [
        { label: 'Прогноз', value: '4.25M ₽' },
        { label: 'Рост', value: '+12%' },
        { label: 'Точность', value: '87%' },
        { label: 'Период', value: '7 дней' }
      ],
      chart: {
        type: 'line',
        data: forecastData,
        title: 'Прогноз выручки'
      }
    }
  }
  
  // 💡 Рекомендации
  if (queryLower.includes('рекоменд') || queryLower.includes('совет') || queryLower.includes('улучш')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `💡 AI Рекомендации для роста продаж:

1. 🎯 **Фокус на топ товарах**
   iPhone 15 Pro даёт 28% выручки — убедитесь в наличии!

2. 📧 **Email кампания**
   421 клиент не покупал > 60 дней. Отправьте персональное предложение.

3. ⬆️ **Апсейл**
   Средний чек 8,450 ₽. Добавьте рекомендации "С этим покупают" (+15-20% к чеку).

4. 📱 **Рекламный бюджет**
   Пятница и суббота — пиковые дни. Увеличьте рекламу в эти дни.

5. 🎁 **Программа лояльности**
   Только 34% возвращаются. Запустите бонусы за повторные покупки.`,
      timestamp: new Date()
    }
  }
  
  // 📊 Сравнение периодов (включая полугодия)
  if (queryLower.includes('сравн') || queryLower.includes('прошл') || queryLower.includes('полугоди')) {
    const dailyRevenue = analyticsData?.daily_revenue || analyticsData?.analytics?.daily_revenue || []
    const totalRevenue = analyticsData?.total_revenue || analyticsData?.analytics?.total_revenue || 0
    const hasProfitData = analyticsData?.has_profit_data || analyticsData?.analytics?.has_profit_data || false
    const totalProfit = analyticsData?.total_profit || analyticsData?.analytics?.total_profit
    
    if (dailyRevenue.length > 7) {
      // Разделяем на первую и вторую половину
      const midPoint = Math.floor(dailyRevenue.length / 2)
      const firstHalf = dailyRevenue.slice(0, midPoint)
      const secondHalf = dailyRevenue.slice(midPoint)
      
      const firstHalfRevenue = firstHalf.reduce((sum: number, item: any) => sum + (item.revenue || item.value || 0), 0)
      const secondHalfRevenue = secondHalf.reduce((sum: number, item: any) => sum + (item.revenue || item.value || 0), 0)
      
      const diff = secondHalfRevenue - firstHalfRevenue
      const growth = firstHalfRevenue > 0 ? (diff / firstHalfRevenue * 100) : 0
      
      const isHalfYear = queryLower.includes('полугоди') || queryLower.includes('half')
      const periodName = isHalfYear ? 'полугодия' : 'периода'
      
      let content = `📊 **Сравнение ${periodName}:**

📅 Первая половина: **${formatCurrency(firstHalfRevenue)}**
📅 Вторая половина: **${formatCurrency(secondHalfRevenue)}**
📈 Разница: **${diff >= 0 ? '+' : ''}${formatCurrency(diff)}** (${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%)

${growth > 0 ? '✅ Рост!' : '⚠️ Снижение'}

`
      
      if (hasProfitData && totalProfit !== undefined && totalProfit !== null) {
        const firstHalfProfit = totalRevenue > 0 ? (totalProfit * firstHalfRevenue / totalRevenue) : 0
        const secondHalfProfit = totalRevenue > 0 ? (totalProfit * secondHalfRevenue / totalRevenue) : 0
        const profitDiff = secondHalfProfit - firstHalfProfit
        
        content += `💰 **Прибыль по периодам:**

📅 Первая половина: **${formatCurrency(firstHalfProfit)}**
📅 Вторая половина: **${formatCurrency(secondHalfProfit)}**
📈 Разница прибыли: **${profitDiff >= 0 ? '+' : ''}${formatCurrency(profitDiff)}**

`
      }
      
      content += growth > 10 ? '🎉 Отличная динамика! Продолжайте в том же духе.' : '💡 Проанализируйте причины и примите меры.'
      
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        chart: {
          type: 'bar',
          data: [
            { name: 'Первая половина', value: firstHalfRevenue },
            { name: 'Вторая половина', value: secondHalfRevenue }
          ],
          title: `Сравнение ${periodName}`
        },
        data: [
          { label: 'Первая половина', value: formatCurrency(firstHalfRevenue) },
          { label: 'Вторая половина', value: formatCurrency(secondHalfRevenue) },
          { label: 'Разница', value: `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}` },
          { label: 'Рост', value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` }
        ]
      }
    }
  }
  
  // 📊 Сравнение периодов (общее)
  if (queryLower.includes('сравн') || queryLower.includes('прошл')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: '📊 Сравнение периодов:\n\nЭтот месяц: 12,450,000 ₽\nПрошлый месяц: 10,890,000 ₽\nРост: +14.3%\n\n✅ Продажи растут! Основной драйвер — новая коллекция iPhone.',
      timestamp: new Date(),
      data: [
        { label: 'Текущий', value: '12.45M ₽' },
        { label: 'Прошлый', value: '10.89M ₽' },
        { label: 'Разница', value: '+1.56M ₽' },
        { label: 'Рост', value: '+14.3%' }
      ],
      chart: {
        type: 'bar',
        data: [
          { name: 'Прошлый месяц', value: 10890000 },
          { name: 'Текущий месяц', value: 12450000 }
        ],
        title: 'Сравнение выручки'
      }
    }
  }
  
  // Дефолтный ответ
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: `Я понял ваш вопрос: "${query}"

Вот что я могу показать:
• 📊 Продажи и выручка
• 🏆 Топ товары
• 👥 Анализ клиентов
• 📈 Прогнозы
• 💡 Рекомендации

Попробуйте спросить конкретнее, например:
"Покажи продажи за неделю"
"Какие топ-5 товаров?"`,
    timestamp: new Date()
  }
}

// Вспомогательные функции
function generateWeekData() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return days.map(day => ({
    name: day,
    value: Math.floor(300000 + Math.random() * 500000)
  }))
}

function generateMonthData() {
  return Array.from({ length: 30 }, (_, i) => ({
    name: `${i + 1}`,
    value: Math.floor(200000 + Math.random() * 600000)
  }))
}

function generateForecastData() {
  const today = new Date()
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - 7 + i)
    return {
      name: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      value: Math.floor(400000 + Math.random() * 300000 + (i > 7 ? i * 20000 : 0)),
      forecast: i >= 7
    }
  })
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M ₽`
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value)
}

export default AIChat
