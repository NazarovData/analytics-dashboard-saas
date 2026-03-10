import { Check, X, AlertTriangle, ChevronDown } from 'lucide-react'
import type { MappingSuggestion } from '@/lib/applyMapping'

interface MappingTableProps {
  suggestions: MappingSuggestion[]
  csvHeaders: string[]
  onChangeMapping: (fieldKey: string, csvColumn: string | null) => void
}

export function MappingTable({ suggestions, csvHeaders, onChangeMapping }: MappingTableProps) {
  const usedColumns = new Set(
    suggestions.filter((s) => s.csvColumn).map((s) => s.csvColumn!),
  )

  return (
    <div className="space-y-2">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[200px_40px_1fr_80px] gap-2 px-3 py-2 text-xs text-gray-500 uppercase">
        <span>Поле системы</span>
        <span></span>
        <span>Колонка CSV</span>
        <span className="text-center">Статус</span>
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 text-xs text-gray-500 uppercase">
        <span>Поле → Колонка CSV</span>
        <span>Статус</span>
      </div>

      {suggestions.map((s) => {
        const available = csvHeaders.filter(
          (h) => !usedColumns.has(h) || h === s.csvColumn,
        )

        const statusEl = (
          <div className="flex justify-end md:justify-center">
            {s.csvColumn && s.confidence === 'exact' && (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <Check className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Точно</span>
              </span>
            )}
            {s.csvColumn && s.confidence === 'partial' && (
              <span className="flex items-center gap-1 text-yellow-400 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Похоже</span>
              </span>
            )}
            {!s.csvColumn && s.required && (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <X className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Нужно</span>
              </span>
            )}
            {!s.csvColumn && !s.required && (
              <span className="text-gray-600 text-xs">—</span>
            )}
          </div>
        )

        return (
          <div
            key={s.fieldKey}
            className={`
              rounded-lg border transition-colors
              ${!s.csvColumn && s.required
                ? 'bg-red-500/5 border-red-500/30'
                : s.csvColumn
                ? 'bg-white/5 border-white/10'
                : 'bg-white/[0.02] border-white/5'
              }
            `}
          >
            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-[200px_40px_1fr_80px] gap-2 items-center px-3 py-2.5">
              <div>
                <span className="text-white text-sm font-medium">{s.fieldLabel}</span>
                {s.required && <span className="text-red-400 ml-1">*</span>}
                <div className="text-[10px] text-gray-600 font-mono">{s.fieldKey}</div>
              </div>
              <div className="text-gray-600 text-center">→</div>
              <div className="relative">
                <select
                  value={s.csvColumn || ''}
                  onChange={(e) => onChangeMapping(s.fieldKey, e.target.value || null)}
                  className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-gray-900">— Не привязано —</option>
                  {available.map((h) => (
                    <option key={h} value={h} className="bg-gray-900">{h}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
              {statusEl}
            </div>

            {/* Mobile layout — stacked */}
            <div className="md:hidden px-3 py-2.5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-white text-sm font-medium">{s.fieldLabel}</span>
                  {s.required && <span className="text-red-400 ml-1 text-xs">*обязательно</span>}
                </div>
                {statusEl}
              </div>
              <div className="relative">
                <select
                  value={s.csvColumn || ''}
                  onChange={(e) => onChangeMapping(s.fieldKey, e.target.value || null)}
                  className="w-full appearance-none bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-gray-900">— Выберите колонку —</option>
                  {available.map((h) => (
                    <option key={h} value={h} className="bg-gray-900">{h}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
