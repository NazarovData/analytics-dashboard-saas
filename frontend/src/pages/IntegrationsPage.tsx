/**
 * 🔗 REAL-TIME SYNC - Страница интеграций
 * Прямое подключение к 1C, Bitrix24, Google Sheets, МойСклад
 * 
 * Уникальная функция для СНГ рынка!
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { 
  Link2, 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle, 
  Clock,
  Zap,
  Database,
  FileSpreadsheet,
  Building2,
  Package,
  Webhook,
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  History
} from 'lucide-react'
import toast from 'react-hot-toast'

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Типы
interface Integration {
  id: string
  type: string
  name: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending'
  last_sync: string | null
  records_synced: number
  created_at: string
  webhook_url?: string
  errors: Array<{ error: string; timestamp: string }>
}

interface AvailableIntegration {
  type: string
  name: string
  icon: string
  description: string
  features: string[]
  auth_type: string
  popular: boolean
  region: string
}

interface SyncLog {
  integration_id: string
  success: boolean
  records: number
  message: string
  timestamp: string
}

// Иконки для интеграций
const integrationIcons: Record<string, React.ReactNode> = {
  bitrix24: <Building2 className="h-8 w-8" />,
  '1c': <Database className="h-8 w-8" />,
  google_sheets: <FileSpreadsheet className="h-8 w-8" />,
  excel_online: <FileSpreadsheet className="h-8 w-8" />,
  amocrm: <Building2 className="h-8 w-8" />,
  moysklad: <Package className="h-8 w-8" />,
  webhook: <Webhook className="h-8 w-8" />,
  postgresql: <Database className="h-8 w-8" />,
  wildberries: <Package className="h-8 w-8" />,
  ozon: <Package className="h-8 w-8" />,
  yandex_direct: <Zap className="h-8 w-8" />
}

// Цвета для интеграций
const integrationColors: Record<string, string> = {
  bitrix24: 'from-blue-500 to-cyan-500',
  '1c': 'from-yellow-500 to-orange-500',
  google_sheets: 'from-green-500 to-emerald-500',
  excel_online: 'from-green-600 to-teal-500',
  amocrm: 'from-blue-600 to-indigo-600',
  moysklad: 'from-purple-500 to-pink-500',
  webhook: 'from-gray-500 to-slate-600',
  postgresql: 'from-indigo-600 to-purple-600',
  wildberries: 'from-purple-600 to-violet-600',
  ozon: 'from-blue-500 to-blue-700',
  yandex_direct: 'from-red-500 to-orange-500'
}

export default function IntegrationsPage() {
  const navigate = useNavigate()
  const [availableIntegrations, setAvailableIntegrations] = useState<AvailableIntegration[]>([])
  const [activeIntegrations, setActiveIntegrations] = useState<Integration[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedType, setSelectedType] = useState<AvailableIntegration | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [selectedIntegrationData, setSelectedIntegrationData] = useState<any>(null)
  const [integrationData, setIntegrationData] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Форма подключения
  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    base_url: '',
    username: '',
    password: '',
    spreadsheet_id: '',
    sheet_name: '',
    connection_string: '',
    host: '',
    port: '5432',
    db_name: '',
    table_name: '',
    api_key: '',
    client_id: '',
    oauth_token: '',
    sync_frequency: '1hour',
    auto_sync: true
  })

  // Загрузка данных
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Загружаем доступные интеграции
      const availableRes = await fetch(`${API_URL}/api/v1/sync/available`)
      if (availableRes.ok) {
        const data = await availableRes.json()
        setAvailableIntegrations(data.integrations || [])
      }
      
      // Загружаем активные интеграции
      const activeRes = await fetch(`${API_URL}/api/v1/sync/list`)
      if (activeRes.ok) {
        const data = await activeRes.json()
        setActiveIntegrations(data.integrations || [])
      }
      
      // Загружаем логи
      const logsRes = await fetch(`${API_URL}/api/v1/sync/logs/all?limit=20`)
      if (logsRes.ok) {
        const data = await logsRes.json()
        setSyncLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Подключение интеграции
  const handleConnect = async () => {
    if (!selectedType) return
    
    setIsConnecting(true)
    try {
      const payload: any = {
        type: selectedType.type,
        name: formData.name || selectedType.name,
        sync_frequency: formData.sync_frequency,
        auto_sync: formData.auto_sync
      }
      
      // Добавляем специфичные поля
      if (selectedType.type === 'bitrix24' || selectedType.type === 'moysklad') {
        payload.webhook_url = formData.webhook_url
      } else if (selectedType.type === '1c') {
        payload.base_url = formData.base_url
        payload.username = formData.username
        payload.password = formData.password
      } else if (selectedType.type === 'google_sheets') {
        payload.spreadsheet_id = formData.spreadsheet_id
        payload.sheet_name = formData.sheet_name
      } else if (selectedType.type === 'postgresql') {
        if (formData.connection_string) {
          payload.connection_string = formData.connection_string
        } else {
          payload.host = formData.host
          payload.port = parseInt(formData.port) || 5432
          payload.username = formData.username
          payload.password = formData.password
          payload.db_name = formData.db_name
        }
        payload.table_name = formData.table_name
      } else if (selectedType.type === 'wildberries') {
        payload.api_key = formData.api_key
      } else if (selectedType.type === 'ozon') {
        payload.client_id = formData.client_id
        payload.api_key = formData.api_key
      } else if (selectedType.type === 'yandex_direct') {
        payload.oauth_token = formData.oauth_token
      }
      
      const res = await fetch(`${API_URL}/api/v1/sync/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Подключено!')
        setShowConnectModal(false)
        setSelectedType(null)
        setFormData({
          name: '',
          webhook_url: '',
          base_url: '',
          username: '',
          password: '',
          spreadsheet_id: '',
          sheet_name: '',
          connection_string: '',
          host: '',
          port: '5432',
          db_name: '',
          table_name: '',
          api_key: '',
          client_id: '',
          oauth_token: '',
          sync_frequency: '1hour',
          auto_sync: true
        })
        loadData()
      } else {
        toast.error(data.detail || 'Ошибка подключения')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setIsConnecting(false)
    }
  }

  // Синхронизация
  const handleSync = async (integrationId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/sync/${integrationId}/sync`, {
        method: 'POST'
      })
      
      if (res.ok) {
        toast.success('Синхронизация запущена!')
        // Обновляем статус
        setActiveIntegrations(prev => 
          prev.map(i => i.id === integrationId ? { ...i, status: 'syncing' } : i)
        )
        // Через 3 секунды обновляем данные
        setTimeout(loadData, 3000)
      }
    } catch (error) {
      toast.error('Ошибка синхронизации')
    }
  }

  // Удаление
  const handleDelete = async (integrationId: string) => {
    if (!confirm('Удалить интеграцию?')) return
    
    try {
      const res = await fetch(`${API_URL}/api/v1/sync/${integrationId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Интеграция удалена')
        loadData()
      }
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  // Просмотр данных
  const handleViewData = async (integration: Integration) => {
    setSelectedIntegrationData(integration)
    setShowDataModal(true)
    setIsLoadingData(true)
    
    try {
      const res = await fetch(`${API_URL}/api/v1/sync/${integration.id}/data?limit=100`)
      if (res.ok) {
        const data = await res.json()
        setIntegrationData(data.data || [])
      } else {
        toast.error('Ошибка загрузки данных')
        setIntegrationData([])
      }
    } catch (error) {
      toast.error('Ошибка сети')
      setIntegrationData([])
    } finally {
      setIsLoadingData(false)
    }
  }

  // Статус бейдж
  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
      connected: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: <CheckCircle2 className="h-3 w-3" />, text: 'Подключено' },
      disconnected: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <XCircle className="h-3 w-3" />, text: 'Отключено' },
      error: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <AlertCircle className="h-3 w-3" />, text: 'Ошибка' },
      syncing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Loader2 className="h-3 w-3 animate-spin" />, text: 'Синхронизация...' },
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock className="h-3 w-3" />, text: 'Ожидание' }
    }
    
    const { color, icon, text } = config[status] || config.pending
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        {icon}
        {text}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <DashboardSidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-auto pt-16 md:pt-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl">
                  <Link2 className="h-8 w-8" />
                </div>
                Real-time Sync
                <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-full animate-pulse">
                  PREMIUM
                </span>
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Прямое подключение к 1C, Bitrix24, Google Sheets и другим системам
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" /> Назад
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm">Подключено</p>
                    <p className="text-3xl font-bold text-white">
                      {activeIntegrations.filter(i => i.status === 'connected').length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm">Синхронизаций</p>
                    <p className="text-3xl font-bold text-white">
                      {syncLogs.length}
                    </p>
                  </div>
                  <RefreshCw className="h-10 w-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Записей</p>
                    <p className="text-3xl font-bold text-white">
                      {activeIntegrations.reduce((sum, i) => sum + i.records_synced, 0).toLocaleString()}
                    </p>
                  </div>
                  <Database className="h-10 w-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-300 text-sm">Real-time</p>
                    <p className="text-3xl font-bold text-white">
                      <Zap className="h-8 w-8 inline text-yellow-400" />
                    </p>
                  </div>
                  <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded">LIVE</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Integrations */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Активные подключения
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowLogsModal(true)} 
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <History className="h-4 w-4 mr-2" /> Логи
                </Button>
                <Button 
                  onClick={() => setShowConnectModal(true)} 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" /> Добавить
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              ) : activeIntegrations.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-4">Нет активных интеграций</p>
                  <Button 
                    onClick={() => setShowConnectModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
                  >
                    Подключить первую систему
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeIntegrations.map((integration) => (
                    <div 
                      key={integration.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${integrationColors[integration.type] || 'from-gray-500 to-slate-600'}`}>
                          {integrationIcons[integration.type] || <Database className="h-8 w-8" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{integration.name}</h3>
                          <p className="text-sm text-gray-400">
                            {integration.records_synced.toLocaleString()} записей
                            {integration.last_sync && (
                              <> • Синхр: {new Date(integration.last_sync).toLocaleString('ru-RU')}</>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <StatusBadge status={integration.status} />
                        
                        <Button
                          onClick={() => handleViewData(integration)}
                          variant="outline"
                          size="sm"
                          className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          Данные
                        </Button>
                        
                        <Button
                          onClick={() => handleSync(integration.id)}
                          variant="outline"
                          size="sm"
                          disabled={integration.status === 'syncing'}
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <RefreshCw className={`h-4 w-4 ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                        </Button>
                        
                        <Button
                          onClick={() => handleDelete(integration.id)}
                          variant="outline"
                          size="sm"
                          className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Integrations */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                Доступные интеграции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableIntegrations.map((integration) => (
                  <div
                    key={integration.type}
                    onClick={() => {
                      setSelectedType(integration)
                      setFormData(prev => ({ ...prev, name: integration.name }))
                      setShowConnectModal(true)
                    }}
                    className={`
                      relative p-6 rounded-xl border cursor-pointer
                      bg-gradient-to-br ${integrationColors[integration.type] || 'from-gray-500/20 to-slate-600/20'}
                      border-white/10 hover:border-white/30
                      transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                      group
                    `}
                  >
                    {integration.popular && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded">
                        ПОПУЛЯРНО
                      </span>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        {integrationIcons[integration.type] || <Database className="h-8 w-8" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg">{integration.name}</h3>
                        <p className="text-white/70 text-sm mt-1">{integration.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {integration.features.slice(0, 3).map((feature, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/20 rounded text-xs text-white/80">
                              {feature}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xs text-white/50">{integration.region}</span>
                          <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Connect Modal */}
      {showConnectModal && selectedType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${integrationColors[selectedType.type]}`}>
                  {integrationIcons[selectedType.type]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Подключить {selectedType.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedType.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Название подключения</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={selectedType.name}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              {/* Bitrix24 / МойСклад / amoCRM */}
              {['bitrix24', 'moysklad', 'amocrm'].includes(selectedType.type) && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {selectedType.type === 'bitrix24' ? 'Webhook URL' : 'API Token'}
                  </label>
                  <Input
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder={selectedType.type === 'bitrix24' ? 'https://your-domain.bitrix24.ru/rest/...' : 'Ваш API токен'}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedType.type === 'bitrix24' && 'Создайте входящий webhook в Bitrix24 → Разработчикам → Входящие вебхуки'}
                    {selectedType.type === 'moysklad' && 'Токен в настройках МойСклад → Настройки → Пользователи → API'}
                  </p>
                </div>
              )}
              
              {/* 1C */}
              {selectedType.type === '1c' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">URL сервера 1C</label>
                    <Input
                      value={formData.base_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
                      placeholder="http://server:8080/base/odata/standard.odata"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Логин</label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Администратор"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Пароль</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Google Sheets */}
              {selectedType.type === 'google_sheets' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">ID таблицы</label>
                    <Input
                      value={formData.spreadsheet_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, spreadsheet_id: e.target.value }))}
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Найдите ID в URL таблицы: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Название листа</label>
                    <Input
                      value={formData.sheet_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, sheet_name: e.target.value }))}
                      placeholder="Sheet1"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </>
              )}
              
              {/* PostgreSQL */}
              {selectedType.type === 'postgresql' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Connection String (опционально)</label>
                    <Input
                      value={formData.connection_string}
                      onChange={(e) => setFormData(prev => ({ ...prev, connection_string: e.target.value }))}
                      placeholder="postgresql://user:password@localhost:5432/database"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Или заполните поля ниже отдельно
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Host</label>
                      <Input
                        value={formData.host}
                        onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                        placeholder="localhost"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Port</label>
                      <Input
                        value={formData.port}
                        onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                        placeholder="5432"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Имя базы данных</label>
                    <Input
                      value={formData.db_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, db_name: e.target.value }))}
                      placeholder="mydb"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Логин</label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="postgres"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Пароль</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Название таблицы</label>
                    <Input
                      value={formData.table_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, table_name: e.target.value }))}
                      placeholder="sales"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Таблица для синхронизации данных
                    </p>
                  </div>
                </>
              )}
              
              {/* Wildberries */}
              {selectedType.type === 'wildberries' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">API Ключ Wildberries</label>
                  <Input
                    value={formData.api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Ваш API ключ из личного кабинета WB"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Получите ключ: WB Партнёры - Настройки - Доступ к API
                  </p>
                </div>
              )}

              {/* Ozon */}
              {selectedType.type === 'ozon' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Client-Id</label>
                    <Input
                      value={formData.client_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                      placeholder="Client-Id от Ozon Seller API"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Api-Key</label>
                    <Input
                      value={formData.api_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Api-Key от Ozon Seller API"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Ozon Seller - Настройки - API ключи
                  </p>
                </>
              )}

              {/* Яндекс.Директ */}
              {selectedType.type === 'yandex_direct' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">OAuth Токен</label>
                  <Input
                    value={formData.oauth_token}
                    onChange={(e) => setFormData(prev => ({ ...prev, oauth_token: e.target.value }))}
                    placeholder="OAuth токен Яндекс.Директ"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Получите токен: oauth.yandex.ru
                  </p>
                </div>
              )}

              {/* Частота синхронизации */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Частота синхронизации</label>
                <select
                  value={formData.sync_frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, sync_frequency: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
                >
                  <option value="realtime">⚡ Real-time (Webhook)</option>
                  <option value="5min">Каждые 5 минут</option>
                  <option value="15min">Каждые 15 минут</option>
                  <option value="1hour">Каждый час</option>
                  <option value="daily">Раз в день</option>
                  <option value="manual">Вручную</option>
                </select>
              </div>
              
              {/* Auto-sync */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.auto_sync}
                  onChange={(e) => setFormData(prev => ({ ...prev, auto_sync: e.target.checked }))}
                  className="w-5 h-5 rounded bg-white/10 border-white/20"
                />
                <span className="text-white">Автоматическая синхронизация</span>
              </label>
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 flex-shrink-0 bg-[#1a1a2e]">
              <Button
                onClick={() => {
                  setShowConnectModal(false)
                  setSelectedType(null)
                }}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Отмена
              </Button>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Подключение...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Подключить
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Логи синхронизации
              </h2>
              <Button
                onClick={() => setShowLogsModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {syncLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Нет логов</p>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log, i) => (
                    <div 
                      key={i}
                      className={`p-4 rounded-lg border ${
                        log.success 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${log.success ? 'text-green-400' : 'text-red-400'}`}>
                          {log.success ? '✅ Успешно' : '❌ Ошибка'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{log.message}</p>
                      {log.records > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Записей: {log.records.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Modal */}
      {showDataModal && selectedIntegrationData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${integrationColors[selectedIntegrationData.type]}`}>
                    {integrationIcons[selectedIntegrationData.type]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Данные: {selectedIntegrationData.name}</h2>
                    <p className="text-gray-400 text-sm">
                      {integrationData.length} записей
                      {selectedIntegrationData.last_sync && (
                        <> • Синхр: {new Date(selectedIntegrationData.last_sync).toLocaleString('ru-RU')}</>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowDataModal(false)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              ) : integrationData.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Нет данных</p>
                  <p className="text-gray-500 text-sm mt-2">Запустите синхронизацию</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Таблица данных */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          {Object.keys(integrationData[0] || {}).map((key) => (
                            <th key={key} className="text-left p-3 text-sm font-semibold text-gray-400 uppercase">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {integrationData.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="p-3 text-sm text-gray-300">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Кнопка загрузки в дашборд */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => {
                        navigate('/dashboard')
                        toast.success('Данные готовы к анализу!')
                      }}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Открыть в дашборде
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

