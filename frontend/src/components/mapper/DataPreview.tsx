import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, Eye } from 'lucide-react'
import type { MappedRow } from '@/lib/applyMapping'
import type { IndustryKey } from '@/lib/industries'
import { INDUSTRIES } from '@/lib/industries'
import { formatCurrency, type CountryCode } from '@/lib/currencies'

interface DataPreviewProps {
  industry: IndustryKey
  country: CountryCode
  rows: MappedRow[]
  maxRows?: number
}

export function DataPreview({ industry, country, rows, maxRows = 5 }: DataPreviewProps) {
  const config = INDUSTRIES[industry]
  const mappedFields = config.fields.filter((f) => {
    return rows.length > 0 && rows[0][f.key] !== undefined
  })

  if (rows.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center text-gray-500">
          Нет данных для отображения
        </CardContent>
      </Card>
    )
  }

  const previewRows = rows.slice(0, maxRows)

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-400" />
          Превью данных — первые {Math.min(maxRows, rows.length)} из {rows.length} строк
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase w-10">#</th>
                {mappedFields.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-left text-[10px] text-gray-500 uppercase whitespace-nowrap">
                    {f.label}
                    {f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-3 py-2 text-gray-600 text-xs">{idx + 1}</td>
                  {mappedFields.map((f) => {
                    const val = row[f.key]
                    return (
                      <td key={f.key} className="px-3 py-2 text-white whitespace-nowrap">
                        {formatCell(val, f.type, country)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function formatCell(
  value: string | number | Date | null,
  type: string,
  country: CountryCode,
): string {
  if (value == null) return '—'

  if (type === 'date' && value instanceof Date) {
    return value.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (type === 'number' && typeof value === 'number') {
    if (value === 0) return '0'
    if (Math.abs(value) >= 100) {
      return formatCurrency(value, country)
    }
    return value.toLocaleString('ru-RU', { maximumFractionDigits: 2 })
  }

  return String(value)
}
