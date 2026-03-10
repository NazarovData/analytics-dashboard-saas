import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVMapper } from '@/components/mapper/CSVMapper'
import { useAnalyticsStore } from '@/store/analyticsStore'
import { mapperApi } from '@/lib/api'

const INDUSTRY_UPLOAD_KEYS: Record<string, string> = {
  ecommerce: 'main',
  avito: 'avito',
  warehouse: 'warehouse',
  logistics: 'logistics',
  cafe: 'cafe',
  beauty: 'beauty',
  retail: 'retail',
  marketing: 'marketing',
  crm: 'crm',
  finance: 'finance',
}

export default function CSVMapperPage() {
  const navigate = useNavigate()
  const { setUploadData } = useAnalyticsStore()

  const handleComplete = async (data: {
    industry: string
    country: string
    mapping: Record<string, string | null>
    rows: Record<string, any>[]
    rawFile: File
  }) => {
    const storeKey = INDUSTRY_UPLOAD_KEYS[data.industry] || data.industry

    setUploadData(storeKey, {
      industry: data.industry,
      country: data.country,
      mapping: data.mapping,
      rowCount: data.rows.length,
      mappedAt: new Date().toISOString(),
    })

    // Save transactions to backend (non-blocking)
    mapperApi
      .saveTransactions({
        industry: data.industry,
        country: data.country,
        rows: data.rows.slice(0, 5000),
      })
      .catch(() => {})

    // Send raw file to backend for AI analysis (non-blocking, no redirect)
    try {
      const formData = new FormData()
      formData.append('file', data.rawFile)

      const API_URL =
        (import.meta as any).env?.VITE_API_URL ||
        ((import.meta as any).env?.PROD
          ? '/api/v1'
          : 'http://localhost:8000/api/v1')

      const res = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const aiResult = await res.json()
        setUploadData(storeKey, {
          ...aiResult,
          industry: data.industry,
          country: data.country,
          mapping: data.mapping,
          rowCount: data.rows.length,
          mappedAt: new Date().toISOString(),
        })
      }
    } catch {
      // AI analysis is optional, dashboard is already showing
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-5xl mx-auto px-4 py-4 md:py-8 pb-24 md:pb-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/industries')}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              CSV Маппер
            </h1>
            <p className="text-gray-500 text-sm">
              Универсальная система загрузки данных для всех отраслей
            </p>
          </div>
        </div>

        <CSVMapper onComplete={handleComplete} />
      </div>
    </div>
  )
}
