import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface Anomaly {
  type: 'spike' | 'drop' | 'inactive_client' | 'price_variance' | 'unusual_pattern'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  recommendation: string
  value?: string
  icon?: React.ReactNode
}

interface AnomalyDetectorProps {
  anomalies: Anomaly[]
}

export function AnomalyDetector({ anomalies }: AnomalyDetectorProps) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg border-green-500/30 animate-fade-in-up">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Все в норме!</h3>
              <p className="text-sm text-gray-300">Аномалий в данных не обнаружено</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-500/10 to-pink-500/10 border-red-500/30'
      case 'warning':
        return 'from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
      default:
        return 'from-blue-500/10 to-cyan-500/10 border-blue-500/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'warning':
        return '🟡'
      default:
        return '🔵'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return <TrendingUp className="h-5 w-5 text-green-400" />
      case 'drop':
        return <TrendingDown className="h-5 w-5 text-red-400" />
      case 'inactive_client':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'price_variance':
        return <DollarSign className="h-5 w-5 text-purple-400" />
      default:
        return <AlertTriangle className="h-5 w-5 text-blue-400" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-lg border-orange-500/30 animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-400 animate-pulse-slow" />
              Обнаружены аномалии
            </CardTitle>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm font-medium border border-orange-500/30">
              {anomalies.length} {anomalies.length === 1 ? 'аномалия' : anomalies.length < 5 ? 'аномалии' : 'аномалий'}
            </span>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            AI обнаружил необычные паттерны в ваших данных. Рекомендуем обратить внимание:
          </p>
        </CardHeader>
      </Card>

      {/* Список аномалий */}
      <div className="space-y-3">
        {anomalies.map((anomaly, index) => (
          <Card 
            key={index}
            className={`bg-gradient-to-br ${getSeverityStyles(anomaly.severity)} backdrop-blur-lg animate-fade-in-up hover:scale-[1.02] transition-all cursor-pointer`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Иконка */}
                <div className={`p-3 rounded-full ${
                  anomaly.severity === 'critical' ? 'bg-red-500/20' :
                  anomaly.severity === 'warning' ? 'bg-yellow-500/20' :
                  'bg-blue-500/20'
                } flex-shrink-0`}>
                  {getTypeIcon(anomaly.type)}
                </div>

                {/* Контент */}
                <div className="flex-1 space-y-2">
                  {/* Заголовок */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      {getSeverityIcon(anomaly.severity)} {anomaly.title}
                    </h4>
                    {anomaly.value && (
                      <span className={`text-sm font-mono px-2 py-1 rounded ${
                        anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        anomaly.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {anomaly.value}
                      </span>
                    )}
                  </div>

                  {/* Описание */}
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {anomaly.description}
                  </p>

                  {/* Рекомендация */}
                  <div className={`mt-3 p-3 rounded-lg ${
                    anomaly.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
                    anomaly.severity === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                    'bg-blue-500/10 border border-blue-500/20'
                  }`}>
                    <p className={`text-xs font-medium mb-1 ${
                      anomaly.severity === 'critical' ? 'text-red-300' :
                      anomaly.severity === 'warning' ? 'text-yellow-300' :
                      'text-blue-300'
                    }`}>
                      💡 Рекомендация:
                    </p>
                    <p className="text-gray-300 text-sm">
                      {anomaly.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Футер с призывом к действию */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-lg border-purple-500/30 animate-fade-in-up">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Info className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                Хотите глубокий анализ причин аномалий?
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Свяжитесь с нашими аналитиками для детального разбора
              </p>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all text-sm font-medium">
              Связаться
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Утилита для генерации аномалий из данных
export function detectAnomalies(data: any): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (!data || !data.analytics) return anomalies

  const { daily_revenue, total_revenue, total_orders, unique_clients } = data.analytics

  // Проверка резких скачков выручки
  if (daily_revenue && daily_revenue.length > 1) {
    for (let i = 1; i < daily_revenue.length; i++) {
      const prev = daily_revenue[i - 1].revenue
      const curr = daily_revenue[i].revenue
      const change = ((curr - prev) / prev) * 100

      if (Math.abs(change) > 200 && curr > 0) {
        anomalies.push({
          type: change > 0 ? 'spike' : 'drop',
          severity: 'warning',
          title: `Резкий ${change > 0 ? 'рост' : 'падение'} выручки ${daily_revenue[i].date}`,
          description: `Выручка ${change > 0 ? 'выросла' : 'упала'} на ${Math.abs(change).toFixed(0)}% по сравнению с предыдущим днем. Это может быть крупная сделка, ошибка в данных или сезонный фактор.`,
          recommendation: `Проверьте заказы за ${daily_revenue[i].date}. Если это крупная сделка - отлично! Если ошибка - исправьте данные.`,
          value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
        })
      }
    }
  }

  // Проверка низкой выручки
  if (total_revenue < 10000) {
    anomalies.push({
      type: 'drop',
      severity: 'critical',
      title: 'Низкая общая выручка',
      description: `Общая выручка составляет всего ${total_revenue.toLocaleString('ru-RU')}₽. Это критически мало для здорового бизнеса.`,
      recommendation: 'Увеличьте маркетинговый бюджет, запустите акции, проверьте качество товара и сервиса.',
      value: `${total_revenue.toLocaleString('ru-RU')}₽`
    })
  }

  // Проверка малого количества клиентов
  if (unique_clients < 5) {
    anomalies.push({
      type: 'inactive_client',
      severity: 'critical',
      title: 'Мало уникальных клиентов',
      description: `Всего ${unique_clients} уникальных клиентов. Для стабильного бизнеса нужна более широкая клиентская база.`,
      recommendation: 'Запустите таргетированную рекламу, реферальную программу, улучшите видимость в поисковиках.',
      value: `${unique_clients} клиентов`
    })
  }

  // Проверка среднего чека
  const avgCheck = total_revenue / total_orders
  if (avgCheck < 500) {
    anomalies.push({
      type: 'price_variance',
      severity: 'warning',
      title: 'Низкий средний чек',
      description: `Средний чек ${avgCheck.toLocaleString('ru-RU')}₽ - это довольно мало. Есть потенциал для роста.`,
      recommendation: 'Попробуйте upsell, cross-sell, bundle предложения. Повысьте ценность покупки.',
      value: `${avgCheck.toLocaleString('ru-RU')}₽`
    })
  }

  // Проверка частоты заказов
  const ordersPerClient = total_orders / unique_clients
  if (ordersPerClient < 1.5) {
    anomalies.push({
      type: 'inactive_client',
      severity: 'warning',
      title: 'Низкая частота повторных покупок',
      description: `В среднем ${ordersPerClient.toFixed(1)} заказа на клиента. Клиенты не возвращаются за повторными покупками.`,
      recommendation: 'Запустите программу лояльности, email-маркетинг, push-уведомления. Работайте над retention.',
      value: `${ordersPerClient.toFixed(1)}x`
    })
  }

  return anomalies
}

