// ============================================
// 🗺️ CSV MAPPER — 5-шаговый визард
// Шаг 1: Выбор отрасли
// Шаг 2: Загрузка CSV
// Шаг 3: Маппинг колонок
// Шаг 4: Превью данных
// Шаг 5: Сохранение шаблона
// ============================================

import { useState, useCallback } from 'react'
import {
  Upload, ArrowLeft, ArrowRight, Save, Check,
  FileSpreadsheet, AlertCircle, Sparkles, RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

import type { IndustryKey } from '@/lib/industries'
import { INDUSTRIES } from '@/lib/industries'
import type { CountryCode } from '@/lib/currencies'
import { COUNTRIES } from '@/lib/currencies'
import { parseFileToCSV, type ParseCSVResult } from '@/lib/parseCSV'
import {
  autoMapColumns,
  suggestionsToMapping,
  validateMapping,
  applyMapping,
  saveTemplate,
  tryApplyTemplate,
  type MappingSuggestion,
  type ColumnMapping,
  type MappedRow,
} from '@/lib/applyMapping'

import { StepIndicator } from './StepIndicator'
import { IndustryGrid } from './IndustryGrid'
import { MappingTable } from './MappingTable'
import { DataPreview } from './DataPreview'
import { MapperDashboard } from './MapperDashboard'

// ─── Типы ─────────────────────────────────────

interface CSVMapperProps {
  defaultIndustry?: IndustryKey
  defaultCountry?: CountryCode
  onComplete?: (data: {
    industry: IndustryKey
    country: CountryCode
    mapping: ColumnMapping
    rows: MappedRow[]
    rawFile: File
  }) => void
}

const STEPS = [
  { label: 'Отрасль' },
  { label: 'Загрузка' },
  { label: 'Маппинг' },
  { label: 'Превью' },
  { label: 'Готово' },
]

// ─── Компонент ────────────────────────────────

export function CSVMapper({ defaultIndustry, defaultCountry, onComplete }: CSVMapperProps) {
  const [step, setStep] = useState(defaultIndustry ? 1 : 0)
  const [industry, setIndustry] = useState<IndustryKey | null>(defaultIndustry || null)
  const [country, setCountry] = useState<CountryCode>(defaultCountry || 'RU')
  const [file, setFile] = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState<ParseCSVResult | null>(null)
  const [suggestions, setSuggestions] = useState<MappingSuggestion[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [templateApplied, setTemplateApplied] = useState(false)

  // ─── Шаг 1: Выбор отрасли ───────────────────

  const handleIndustrySelect = (key: IndustryKey) => {
    setIndustry(key)
  }

  // ─── Шаг 2: Загрузка CSV ───────────────────

  const handleFile = useCallback(async (f: File) => {
    if (!industry) return
    setFile(f)
    setIsProcessing(true)

    try {
      const result = await parseFileToCSV(f, { maxRows: 10000 })

      if (result.rows.length === 0) {
        toast.error('Файл пуст или формат не распознан')
        setIsProcessing(false)
        return
      }

      setCsvResult(result)
      toast.success(
        `Файл прочитан: ${result.totalRows} строк, ${result.headers.length} колонок (разделитель: ${
          result.detectedDelimiter === ';' ? 'точка с запятой' :
          result.detectedDelimiter === '\t' ? 'табуляция' : 'запятая'
        })`,
      )

      // Пробуем применить сохранённый шаблон
      const savedMapping = tryApplyTemplate(industry, result.headers)
      if (savedMapping) {
        setMapping(savedMapping)
        setTemplateApplied(true)
        toast.success('Шаблон применён автоматически ✓', { icon: '🔄' })

        // Строим suggestions из сохранённого маппинга
        const autoSuggestions = autoMapColumns(industry, result.headers)
        for (const s of autoSuggestions) {
          if (savedMapping[s.fieldKey]) {
            s.csvColumn = savedMapping[s.fieldKey]!
            s.confidence = 'exact'
          }
        }
        setSuggestions(autoSuggestions)

        // Применяем маппинг и сразу на превью
        const rows = applyMapping(industry, savedMapping, result.rows)
        setMappedRows(rows)
        setStep(3) // сразу на превью
      } else {
        // Авто-маппинг через aliases
        const autoSuggestions = autoMapColumns(industry, result.headers)
        setSuggestions(autoSuggestions)
        setMapping(suggestionsToMapping(autoSuggestions))
        setTemplateApplied(false)
        setStep(2) // на маппинг
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка чтения файла')
    } finally {
      setIsProcessing(false)
    }
  }, [industry])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // ─── Шаг 3: Маппинг ────────────────────────

  const handleChangeMapping = (fieldKey: string, csvColumn: string | null) => {
    const newMapping = { ...mapping, [fieldKey]: csvColumn }
    setMapping(newMapping)

    // Обновляем suggestions
    setSuggestions((prev) =>
      prev.map((s) =>
        s.fieldKey === fieldKey
          ? { ...s, csvColumn, confidence: csvColumn ? 'exact' : 'none' }
          : s,
      ),
    )
  }

  const handleGoToPreview = () => {
    if (!industry || !csvResult) return

    const validation = validateMapping(industry, mapping)
    if (!validation.valid) {
      toast.error(`Не привязаны обязательные поля: ${validation.unmappedRequired.length}`)
      return
    }

    const rows = applyMapping(industry, mapping, csvResult.rows)
    setMappedRows(rows)
    setStep(3)
  }

  // ─── Шаг 4/5: Сохранение ───────────────────

  const handleSaveTemplate = () => {
    if (!industry) return
    saveTemplate(industry, country, mapping)
    toast.success('Шаблон сохранён!', { icon: '💾' })
    setStep(4)

    if (onComplete && file) {
      onComplete({
        industry,
        country,
        mapping,
        rows: mappedRows,
        rawFile: file,
      })
    }
  }

  // ─── Рендер ─────────────────────────────────

  return (
    <div className="space-y-6">
      <StepIndicator steps={STEPS} current={step} />

      {/* ШАГ 0: Выбор отрасли */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Выберите отрасль</h2>
          <p className="text-gray-400 text-sm">
            Маппинг колонок настраивается один раз — все последующие загрузки автоматические
          </p>

          <IndustryGrid selected={industry} onSelect={handleIndustrySelect} />

          {/* Выбор страны */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-gray-400 text-sm">Страна:</span>
            {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => (
              <button
                key={code}
                onClick={() => setCountry(code)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${country === code
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {COUNTRIES[code].name} ({COUNTRIES[code].currency.symbol})
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              disabled={!industry}
              onClick={() => setStep(1)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Далее <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ШАГ 1: Загрузка CSV */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Назад
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">
                Загрузите CSV — {industry && INDUSTRIES[industry].name}
              </h2>
              <p className="text-gray-400 text-sm">
                Поддерживаем: CSV, Excel. Авто-определение кодировки и разделителя
              </p>
            </div>
          </div>

          {/* Drag & Drop зона */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
              ${isDragging
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }
            `}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.csv,.xlsx,.xls,.tsv,.txt'
              input.onchange = (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f) handleFile(f)
              }
              input.click()
            }}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
                <p className="text-white">Обработка файла...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-gray-500" />
                <p className="text-white font-medium">Перетащите файл сюда или нажмите</p>
                <p className="text-gray-500 text-sm">CSV, Excel, TSV, TXT</p>
              </div>
            )}
          </div>

          {/* Информация об отрасли */}
          {industry && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <h3 className="text-white text-sm font-semibold mb-2">
                  Обязательные поля для «{INDUSTRIES[industry].name}»:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES[industry].fields
                    .filter((f) => f.required)
                    .map((f) => (
                      <span key={f.key} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">
                        {f.label}
                      </span>
                    ))}
                  {INDUSTRIES[industry].fields
                    .filter((f) => !f.required)
                    .map((f) => (
                      <span key={f.key} className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded border border-white/10">
                        {f.label}
                      </span>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ШАГ 2: Маппинг колонок */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => { setStep(1); setCsvResult(null); setFile(null) }} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" /> Назад
              </Button>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Маппинг колонок
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                </h2>
                <p className="text-gray-400 text-sm">
                  Система определила колонки автоматически. Проверьте и исправьте если нужно
                </p>
              </div>
            </div>
          </div>

          {/* Статистика */}
          {csvResult && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {file?.name}
              </span>
              <span>{csvResult.totalRows} строк</span>
              <span>{csvResult.headers.length} колонок</span>
              <span>Разделитель: {csvResult.detectedDelimiter === ';' ? ';' : csvResult.detectedDelimiter === '\t' ? 'TAB' : ','}</span>
            </div>
          )}

          <MappingTable
            suggestions={suggestions}
            csvHeaders={csvResult?.headers || []}
            onChangeMapping={handleChangeMapping}
          />

          {/* Валидация */}
          {industry && (() => {
            const v = validateMapping(industry, mapping)
            return !v.valid ? (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-sm text-red-400">
                  {v.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">
                  Все обязательные поля привязаны ({v.mappedCount} из {suggestions.length})
                </span>
              </div>
            )
          })()}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (!industry || !csvResult) return
                const fresh = autoMapColumns(industry, csvResult.headers)
                setSuggestions(fresh)
                setMapping(suggestionsToMapping(fresh))
                toast.success('Авто-маппинг обновлён')
              }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Авто-маппинг
            </Button>
            <Button
              onClick={handleGoToPreview}
              disabled={!industry || !validateMapping(industry, mapping).valid}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Далее <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ШАГ 3: Превью данных */}
      {step === 3 && industry && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Назад
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">Превью данных</h2>
              <p className="text-gray-400 text-sm">
                Проверьте что данные отображаются корректно. Суммы, даты, названия
              </p>
            </div>
          </div>

          {templateApplied && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400">
                Применён сохранённый шаблон маппинга. Все данные обработаны автоматически
              </span>
            </div>
          )}

          <DataPreview industry={industry} country={country} rows={mappedRows} maxRows={5} />

          <div className="flex justify-end gap-3">
            <Button
              onClick={handleSaveTemplate}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" /> Сохранить шаблон и продолжить
            </Button>
          </div>
        </div>
      )}

      {/* ШАГ 4: Дашборд с данными */}
      {step === 4 && industry && (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <Check className="h-5 w-5 text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-green-300 font-medium">
                Шаблон для «{INDUSTRIES[industry].name}» сохранён — {mappedRows.length} строк обработано
              </span>
            </div>
          </div>

          {/* Full dashboard */}
          <MapperDashboard
            industry={industry}
            rows={mappedRows}
            currencySymbol={COUNTRIES[country].currency.symbol}
          />

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => { setStep(0); setFile(null); setCsvResult(null); setMappedRows([]) }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Другая отрасль
            </Button>
            <Button
              variant="outline"
              onClick={() => { setFile(null); setCsvResult(null); setMappedRows([]); setStep(1) }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Upload className="h-4 w-4 mr-2" /> Загрузить ещё файл
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
