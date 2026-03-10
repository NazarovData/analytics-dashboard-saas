/**
 * 🏷️ Страница настроек White Label
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Palette, Globe, Mail, Phone, Save, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardSidebar } from '@/components/DashboardSidebar'

const API_BASE = 'http://localhost:8000/api/v1'

interface WhiteLabelSettings {
  company_name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  favicon_url?: string
  custom_domain?: string
  custom_email_from?: string
  custom_support_email?: string
  custom_support_phone?: string
  hide_analitix_branding: boolean
  custom_footer_text?: string
}

export default function WhiteLabelSettingsPage() {
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    company_name: 'Analitix AI',
    primary_color: '#06b6d4',
    secondary_color: '#8b5cf6',
    accent_color: '#f97316',
    hide_analitix_branding: false
  })
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/white-label/`)
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
          if (data.settings.logo_url) {
            setLogoPreview(data.settings.logo_url)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Только изображения разрешены')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_BASE}/white-label/upload-logo`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setLogoPreview(data.logo_url)
        setSettings(prev => ({ ...prev, logo_url: data.logo_url }))
        toast.success('Логотип загружен!')
      } else {
        toast.error('Ошибка загрузки логотипа')
      }
    } catch (error) {
      toast.error('Ошибка загрузки')
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/white-label/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Настройки сохранены!')
        // Применяем CSS переменные
        if (settings.primary_color) {
          document.documentElement.style.setProperty('--primary', settings.primary_color)
        }
        if (settings.secondary_color) {
          document.documentElement.style.setProperty('--secondary', settings.secondary_color)
        }
        if (settings.accent_color) {
          document.documentElement.style.setProperty('--accent', settings.accent_color)
        }
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch (error) {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <DashboardSidebar />
      
      <div className="flex-1 md:ml-64 p-4 md:p-8 max-w-6xl pt-16 md:pt-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🏷️ White Label</h1>
          <p className="text-gray-400">Настройте брендинг под вашу компанию</p>
        </div>

        <div className="space-y-6">
          {/* Основные настройки */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                Основные настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Название компании */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название компании
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Ваша компания"
                />
              </div>

              {/* Логотип */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Логотип
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="w-32 h-32 object-contain bg-gray-800 rounded-lg p-2" />
                      <button
                        onClick={() => {
                          setLogoPreview(null)
                          setSettings(prev => ({ ...prev, logo_url: undefined }))
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700">
                      <ImageIcon className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Загрузить логотип
                    </label>
                    <p className="text-xs text-gray-400 mt-2">PNG, JPG до 2MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Цвета */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Цветовая схема
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Основной цвет
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10 rounded-lg border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                      placeholder="#06b6d4"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Вторичный цвет
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10 rounded-lg border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Акцентный цвет
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-16 h-10 rounded-lg border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                      placeholder="#f97316"
                    />
                  </div>
                </div>
              </div>
              
              {/* Превью цветов */}
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Превью:</p>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-12 rounded-lg"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                  <div
                    className="flex-1 h-12 rounded-lg"
                    style={{ backgroundColor: settings.secondary_color }}
                  />
                  <div
                    className="flex-1 h-12 rounded-lg"
                    style={{ backgroundColor: settings.accent_color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Домен */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-400" />
                Кастомный домен
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Домен (например: analytics.ваша-компания.ru)
                </label>
                <input
                  type="text"
                  value={settings.custom_domain || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, custom_domain: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="analytics.example.com"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Укажите DNS A-запись на наш IP для активации
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Кнопка сохранения */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


