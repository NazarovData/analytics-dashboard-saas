// ============================================
// 📄 УНИВЕРСАЛЬНЫЙ CSV ПАРСЕР
// Поддержка: Россия, Таджикистан, Узбекистан
// Кодировки: UTF-8, UTF-8 BOM, Windows-1251
// Разделители: ; , \t
// ============================================

// ─── Определение кодировки и декодирование ────

export async function detectAndDecode(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)

  // UTF-8 BOM (0xEF 0xBB 0xBF)
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer)
  }

  // UTF-16 LE BOM
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer)
  }

  // Пробуем UTF-8 (строгий режим — бросит ошибку на невалидных байтах)
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    // Проверяем что нет мусора
    if (!text.includes('\ufffd')) return text
  } catch {
    // не UTF-8
  }

  // Fallback: Windows-1251 (1С, АТОЛ, Frontol и т.д.)
  return new TextDecoder('windows-1251').decode(buffer)
}

// ─── Определение разделителя ──────────────────

export function detectDelimiter(text: string): ',' | ';' | '\t' {
  // Берём первые 5 строк
  const lines = text.split('\n').slice(0, 5).filter((l) => l.trim())
  if (lines.length === 0) return ','

  let totalCommas = 0
  let totalSemicolons = 0
  let totalTabs = 0

  for (const line of lines) {
    totalCommas += (line.match(/,/g) || []).length
    totalSemicolons += (line.match(/;/g) || []).length
    totalTabs += (line.match(/\t/g) || []).length
  }

  if (totalTabs > totalCommas && totalTabs > totalSemicolons) return '\t'
  return totalSemicolons >= totalCommas ? ';' : ','
}

// ─── Парсинг чисел (три страны) ───────────────

/**
 * Универсальный парсер чисел для CSV из кассовых систем РФ, ТД, УЗ.
 * Обрабатывает:
 *   "1 234 567,56"  → 1234567.56
 *   "1234567.56"    → 1234567.56
 *   "1 234 567"     → 1234567
 *   "12345сўм"      → 12345
 *   "1 234,56 ₽"    → 1234.56
 *   "(1 234,56)"    → -1234.56   (бухгалтерский минус)
 *   "15%"           → 15
 *   "-1234,56"      → -1234.56
 */
export function parseLocalNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return isNaN(value) ? 0 : value

  let s = String(value).trim()
  if (!s || s === '-' || s === 'nan' || s === 'None') return 0

  // Отрицательное в скобках: (1 234,56) → -1234.56
  const negative = s.startsWith('(') && s.endsWith(')')
  if (negative) s = s.slice(1, -1)

  // Убираем символы валют и % (₽, сўм, сом., руб, $, €)
  s = s.replace(/[₽$€%]/g, '')
  s = s.replace(/сўм|сом\.|руб\.?|sum|som/gi, '')

  // Убираем все пробелы (разделитель тысяч)
  s = s.replace(/\s/g, '')

  // Определяем десятичный разделитель:
  // Если последняя запятая стоит после последней точки → запятая = десятичная
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')

  if (lastComma > lastDot) {
    // "1.234.567,56" или "1234,56" — запятая = десятичная
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    // "1,234,567.56" или "1234.56" — точка = десятичная
    s = s.replace(/,/g, '')
  } else {
    // Нет разделителя или один из них
    s = s.replace(/,/g, '')
  }

  // Убираем всё кроме цифр, точки и минуса
  s = s.replace(/[^\d.\-]/g, '')

  const result = parseFloat(s)
  if (isNaN(result)) return 0
  return negative ? -result : result
}

// ─── Парсинг дат (три страны) ─────────────────

/**
 * Парсер дат для CSV из РФ, ТД, УЗ.
 * НИКОГДА не передаёт строку "ДД.ММ.ГГГГ" напрямую в new Date().
 *
 * Поддерживает:
 *   "01.03.2024"           → Date
 *   "01.03.2024 14:30"     → Date
 *   "01.03.2024 14:30:00"  → Date
 *   "01/03/2024"           → Date
 *   "2024-03-01"           → Date (ISO)
 *   "2024-03-01T14:30:00"  → Date (ISO with time)
 */
export function parseLocalDate(value: unknown): Date | null {
  if (value == null) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value

  const v = String(value).trim()
  if (!v) return null

  // ДД.ММ.ГГГГ [ЧЧ:ММ[:СС]]
  const dmyDot = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (dmyDot) {
    const [, d, m, y, hh, mm, ss] = dmyDot
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${(hh || '00').padStart(2, '0')}:${(mm || '00').padStart(2, '0')}:${(ss || '00').padStart(2, '0')}`
    const date = new Date(iso)
    return isNaN(date.getTime()) ? null : date
  }

  // ДД/ММ/ГГГГ
  const dmySlash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmySlash) {
    const [, d, m, y] = dmySlash
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    return isNaN(date.getTime()) ? null : date
  }

  // ГГГГ-ММ-ДД или ISO 8601
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(v)) {
    const date = new Date(v)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

// ─── Парсинг CSV в массив объектов ────────────

export interface ParseCSVOptions {
  delimiter?: ',' | ';' | '\t'
  maxRows?: number
}

export interface ParseCSVResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  detectedDelimiter: ',' | ';' | '\t'
}

/**
 * Парсит CSV-строку в массив объектов.
 * Поддерживает кавычки, переносы внутри кавычек, экранирование "".
 */
export function parseCSVText(
  text: string,
  options: ParseCSVOptions = {},
): ParseCSVResult {
  const delimiter = options.delimiter || detectDelimiter(text)
  const maxRows = options.maxRows || Infinity

  const lines = splitCSVLines(text, delimiter)
  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedDelimiter: delimiter }
  }

  // Первая строка — заголовки
  const headers = lines[0].map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length && rows.length < maxRows; i++) {
    const line = lines[i]
    // Пропускаем пустые строки
    if (line.length === 1 && !line[0].trim()) continue

    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (line[j] || '').trim()
    }
    rows.push(row)
  }

  return {
    headers,
    rows,
    totalRows: lines.length - 1,
    detectedDelimiter: delimiter,
  }
}

/**
 * Разбивает CSV на строки с учётом кавычек.
 * Возвращает двумерный массив [строка][колонка].
 */
function splitCSVLines(text: string, delimiter: string): string[][] {
  const result: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++ // пропускаем экранированную кавычку
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delimiter) {
        current.push(field)
        field = ''
      } else if (ch === '\n') {
        current.push(field)
        field = ''
        if (current.some((c) => c.trim())) {
          result.push(current)
        }
        current = []
      } else if (ch === '\r') {
        // пропускаем \r
      } else {
        field += ch
      }
    }
  }

  // Последняя строка
  current.push(field)
  if (current.some((c) => c.trim())) {
    result.push(current)
  }

  return result
}

// ─── Определение типа файла ───────────────────

function isExcelFile(file: File, buffer: ArrayBuffer): boolean {
  const ext = file.name.toLowerCase()
  if (ext.endsWith('.xlsx') || ext.endsWith('.xls') || ext.endsWith('.xlsb')) {
    return true
  }
  // ZIP signature: PK\x03\x04 (xlsx is a ZIP archive)
  const bytes = new Uint8Array(buffer)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return true
  }
  // OLE2 signature (old .xls): 0xD0CF11E0
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return true
  }
  return false
}

/**
 * Парсит Excel файл через SheetJS (xlsx).
 * Берёт первый лист и конвертирует в массив объектов.
 */
async function parseExcelBuffer(
  buffer: ArrayBuffer,
  options: ParseCSVOptions = {},
): Promise<ParseCSVResult> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { headers: [], rows: [], totalRows: 0, detectedDelimiter: ',' }
  }

  const sheet = workbook.Sheets[sheetName]
  const jsonData: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  if (jsonData.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedDelimiter: ',' }
  }

  // First row = headers
  const headers = jsonData[0].map((h: any) => String(h ?? '').trim()).filter(Boolean)
  if (headers.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedDelimiter: ',' }
  }

  const maxRows = options.maxRows || Infinity
  const rows: Record<string, string>[] = []

  for (let i = 1; i < jsonData.length && rows.length < maxRows; i++) {
    const line = jsonData[i]
    if (!line || line.every((c: any) => !String(c ?? '').trim())) continue

    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = String(line[j] ?? '').trim()
    }
    rows.push(row)
  }

  return {
    headers,
    rows,
    totalRows: jsonData.length - 1,
    detectedDelimiter: ',',
  }
}

// ─── Полный пайплайн: File → ParseCSVResult ──

export async function parseFileToCSV(
  file: File,
  options: ParseCSVOptions = {},
): Promise<ParseCSVResult> {
  const buffer = await file.arrayBuffer()

  // Excel files (.xlsx, .xls) — parse with SheetJS
  if (isExcelFile(file, buffer)) {
    return parseExcelBuffer(buffer, options)
  }

  // CSV / TSV / TXT — decode and parse as text
  const text = await detectAndDecode(buffer)
  return parseCSVText(text, options)
}
