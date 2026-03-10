/**
 * 🔔 Компонент алертов и уведомлений Analitix AI
 * Показывает критические события, падения KPI, неактивных клиентов
 */

import { useState, useEffect } from 'react'
import { Bell, BellDot, X, AlertTriangle, TrendingDown, UserX, Target, AlertCircle, CheckCircle, Info } from 'lucide-react'
import toast from 'react-hot-toast'

interface Alert {
  id: string
  type: 'revenue_drop' | 'revenue_spike' | 'inactive_client' | 'kpi_miss' | 'high_churn' | 'anomaly'
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'active' | 'read' | 'resolved' | 'dismissed'
  title: string
  message: string
  data: Record<string, any>
  created_at: string
  read_at?: string | null
  resolved_at?: string | null
}

const API_BASE = 'http://localhost:8000/api/v1'

export function AlertsNotification() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [criticalCount, setCriticalCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Загрузка алертов
  useEffect(() => {
    fetchAlerts()
    // Обновление каждые 30 секунд
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts/`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      
      const data = await response.json()
      setAlerts(data.alerts || [])
      setUnreadCount(data.unread || 0)
      setCriticalCount(data.critical || 0)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/read`, {
        method: 'PUT'
      })
      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'read' as const, read_at: new Date().toISOString() } : a))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'PUT'
      })
      if (response.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved' as const, resolved_at: new Date().toISOString() } : a))
        toast.success('Алерт решён')
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Ошибка при решении алерта')
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE}/alerts/${alertId}/dismiss`, {
        method: 'PUT'
      })
      if (response.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId))
        if (unreadCount > 0) setUnreadCount(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'revenue_drop': return <TrendingDown className="w-5 h-5" />
      case 'inactive_client': return <UserX className="w-5 h-5" />
      case 'kpi_miss': return <Target className="w-5 h-5" />
      case 'high_churn': return <AlertCircle className="w-5 h-5" />
      case 'revenue_spike': return <TrendingDown className="w-5 h-5 rotate-180" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`
    return date.toLocaleDateString('ru-RU')
  }

  const activeAlerts = alerts.filter(a => a.status === 'active').slice(0, 10)

  return (
    <div className="relative">
      {/* Кнопка с бейджем */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700/50"
      >
        {unreadCount > 0 ? (
          <BellDot className="w-5 h-5 text-orange-500" />
        ) : (
          <Bell className="w-5 h-5 text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {criticalCount > 0 && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Панель алертов */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-50 w-96 max-h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Заголовок */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">🔔 Уведомления</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
                  {criticalCount > 0 && ` • ${criticalCount} критических`}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-700 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Список алертов */}
            <div className="overflow-y-auto max-h-[500px]">
              {activeAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-400">Нет активных уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 hover:bg-gray-800/50 transition-colors border-l-4 ${
                        alert.priority === 'critical' ? 'border-red-500' :
                        alert.priority === 'high' ? 'border-orange-500' :
                        alert.priority === 'medium' ? 'border-yellow-500' :
                        'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(alert.priority)}`}>
                          {getIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-white text-sm">{alert.title}</h4>
                            {alert.priority === 'critical' && (
                              <span className="px-2 py-0.5 text-xs font-bold text-red-500 bg-red-500/10 rounded">
                                КРИТИЧНО
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{alert.message}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDate(alert.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="px-3 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              Прочитано
                            </button>
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="px-3 py-1 text-xs font-medium text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                            >
                              Решено
                            </button>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                            >
                              Отклонить
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Футер */}
            {activeAlerts.length > 0 && (
              <div className="p-3 border-t border-gray-700 bg-gray-800/50">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE}/alerts/mark-all-read`, { method: 'PUT' })
                      if (response.ok) {
                        setUnreadCount(0)
                        setAlerts(prev => prev.map(a => ({ ...a, status: 'read' as const })))
                        toast.success('Все уведомления прочитаны')
                      }
                    } catch (error) {
                      toast.error('Ошибка')
                    }
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  Пометить все как прочитанные
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}


