// ============================================
// 🔗 МАППИНГ CSV КОЛОНОК → ПОЛЯ ОТРАСЛИ
// Авто-определение через aliases + ручная коррекция
// ============================================

import type { IndustryKey, FieldConfig } from './industries'
import { INDUSTRIES } from './industries'
import { parseLocalNumber, parseLocalDate } from './parseCSV'

// ─── Типы ─────────────────────────────────────

/** Маппинг: ключ поля отрасли → название колонки CSV */
export type ColumnMapping = Record<string, string | null>

/** Результат авто-маппинга одного поля */
export interface MappingSuggestion {
  fieldKey: string
  fieldLabel: string
  required: boolean
  csvColumn: string | null
  confidence: 'exact' | 'partial' | 'none'
}

/** Результат применения маппинга к строке */
export interface MappedRow {
  [fieldKey: string]: string | number | Date | null
}

/** Результат валидации */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  mappedCount: number
  unmappedRequired: string[]
}

// ─── Авто-маппинг через aliases ───────────────

/**
 * Для каждого поля отрасли ищет лучшее совпадение среди CSV-колонок.
 * Два прохода:
 *   1) Точное совпадение (lowercase) — confidence: 'exact'
 *   2) Частичное (alias содержится в названии колонки) — confidence: 'partial'
 */
export function autoMapColumns(
  industry: IndustryKey,
  csvHeaders: string[],
): MappingSuggestion[] {
  const config = INDUSTRIES[industry]
  if (!config) return []

  const headersLower = csvHeaders.map((h) => h.toLowerCase().trim())
  const usedColumns = new Set<string>()
  const suggestions: MappingSuggestion[] = []

  for (const field of config.fields) {
    let bestMatch: string | null = null
    let bestConfidence: 'exact' | 'partial' | 'none' = 'none'

    // Проход 1: точное совпадение (alias === headerLower)
    for (let i = 0; i < headersLower.length; i++) {
      if (usedColumns.has(csvHeaders[i])) continue
      const h = headersLower[i]

      // Проверяем сам key поля
      if (h === field.key) {
        bestMatch = csvHeaders[i]
        bestConfidence = 'exact'
        break
      }

      // Проверяем aliases
      for (const alias of field.aliases) {
        if (h === alias.toLowerCase()) {
          bestMatch = csvHeaders[i]
          bestConfidence = 'exact'
          break
        }
      }
      if (bestConfidence === 'exact') break
    }

    // Проход 2: частичное совпадение (alias содержится в заголовке)
    if (!bestMatch) {
      for (let i = 0; i < headersLower.length; i++) {
        if (usedColumns.has(csvHeaders[i])) continue
        const h = headersLower[i]

        for (const alias of field.aliases) {
          const aliasLower = alias.toLowerCase()
          if (h.includes(aliasLower) || aliasLower.includes(h)) {
            bestMatch = csvHeaders[i]
            bestConfidence = 'partial'
            break
          }
        }
        if (bestMatch) break
      }
    }

    if (bestMatch) {
      usedColumns.add(bestMatch)
    }

    suggestions.push({
      fieldKey: field.key,
      fieldLabel: field.label,
      required: field.required,
      csvColumn: bestMatch,
      confidence: bestConfidence,
    })
  }

  return suggestions
}

/**
 * Преобразует suggestions в плоский маппинг { fieldKey: csvColumn }
 */
export function suggestionsToMapping(suggestions: MappingSuggestion[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  for (const s of suggestions) {
    mapping[s.fieldKey] = s.csvColumn
  }
  return mapping
}

// ─── Валидация маппинга ───────────────────────

/**
 * Проверяет что все обязательные поля имеют маппинг.
 */
export function validateMapping(
  industry: IndustryKey,
  mapping: ColumnMapping,
): ValidationResult {
  const config = INDUSTRIES[industry]
  const errors: string[] = []
  const warnings: string[] = []
  const unmappedRequired: string[] = []
  let mappedCount = 0

  for (const field of config.fields) {
    const col = mapping[field.key]
    if (col) {
      mappedCount++
    } else if (field.required) {
      errors.push(`Обязательное поле «${field.label}» не привязано к колонке`)
      unmappedRequired.push(field.key)
    } else {
      warnings.push(`Необязательное поле «${field.label}» пропущено`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    mappedCount,
    unmappedRequired,
  }
}

// ─── Применение маппинга к данным ─────────────

/**
 * Применяет маппинг к массиву CSV-строк.
 * Конвертирует типы: number → parseLocalNumber, date → parseLocalDate.
 */
export function applyMapping(
  industry: IndustryKey,
  mapping: ColumnMapping,
  rows: Record<string, string>[],
): MappedRow[] {
  const config = INDUSTRIES[industry]
  const fieldsByKey = new Map<string, FieldConfig>()
  for (const f of config.fields) {
    fieldsByKey.set(f.key, f)
  }

  return rows.map((row) => {
    const mapped: MappedRow = {}

    for (const [fieldKey, csvCol] of Object.entries(mapping)) {
      if (!csvCol) continue

      const rawValue = row[csvCol]
      const fieldConfig = fieldsByKey.get(fieldKey)
      if (!fieldConfig) {
        mapped[fieldKey] = rawValue ?? null
        continue
      }

      switch (fieldConfig.type) {
        case 'number':
          mapped[fieldKey] = parseLocalNumber(rawValue)
          break
        case 'date':
          mapped[fieldKey] = parseLocalDate(rawValue)
          break
        case 'string':
        case 'enum':
        default:
          mapped[fieldKey] = rawValue?.trim() || null
          break
      }
    }

    return mapped
  })
}

// ─── Шаблоны (сохранение/загрузка) ────────────

export interface MappingTemplate {
  industry: IndustryKey
  country: string
  mapping: ColumnMapping
  createdAt: string
  updatedAt: string
}

const TEMPLATES_STORAGE_KEY = 'csv-mapping-templates'

/**
 * Сохраняет шаблон маппинга в localStorage + отправляет на бэкенд.
 * Ключ: industry (один шаблон на отрасль).
 */
export function saveTemplate(
  industry: IndustryKey,
  country: string,
  mapping: ColumnMapping,
): void {
  const templates = loadAllTemplates()
  templates[industry] = {
    industry,
    country,
    mapping,
    createdAt: templates[industry]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))

  syncTemplateToBackend(industry, country, mapping)
}

async function syncTemplateToBackend(
  industry: IndustryKey,
  country: string,
  mapping: ColumnMapping,
): Promise<void> {
  try {
    const { mapperApi } = await import('./api')
    await mapperApi.saveTemplate({ industry, country, mapping })
  } catch {
    // localStorage уже сохранён — бэкенд не критичен
  }
}

/**
 * Загружает сохранённый шаблон маппинга для отрасли.
 */
export function loadTemplate(industry: IndustryKey): MappingTemplate | null {
  const templates = loadAllTemplates()
  return templates[industry] || null
}

/**
 * Пытается применить сохранённый шаблон к новым заголовкам.
 * Возвращает маппинг только если все обязательные поля совпали.
 */
export function tryApplyTemplate(
  industry: IndustryKey,
  csvHeaders: string[],
): ColumnMapping | null {
  const template = loadTemplate(industry)
  if (!template) return null

  const headersSet = new Set(csvHeaders.map((h) => h.toLowerCase().trim()))
  const newMapping: ColumnMapping = {}
  let allRequiredFound = true

  const config = INDUSTRIES[industry]
  const requiredKeys = new Set(config.fields.filter((f) => f.required).map((f) => f.key))

  for (const [fieldKey, csvCol] of Object.entries(template.mapping)) {
    if (!csvCol) continue
    // Проверяем что колонка с таким именем есть в новом файле
    if (headersSet.has(csvCol.toLowerCase().trim())) {
      newMapping[fieldKey] = csvCol
    } else if (requiredKeys.has(fieldKey)) {
      allRequiredFound = false
    }
  }

  return allRequiredFound ? newMapping : null
}

function loadAllTemplates(): Record<string, MappingTemplate> {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
