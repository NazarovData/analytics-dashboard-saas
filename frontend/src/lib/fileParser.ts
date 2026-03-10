import { parseFileToCSV, parseLocalNumber } from './parseCSV'

/**
 * Universal file reader for all industry dashboards.
 * Handles: Excel (.xlsx, .xls), CSV, TSV, TXT
 * Auto-detects encoding, delimiter, and file type.
 *
 * Returns an array of objects with string keys and string values.
 */
export async function readFileUniversal(file: File): Promise<Record<string, string>[]> {
  const result = await parseFileToCSV(file, { maxRows: 50000 })
  return result.rows
}

/**
 * Finds a column in headers by pattern list (case-insensitive partial match).
 */
export function findColumn(headers: string[], patterns: string[]): string | null {
  const headersLower = headers.map(h => h.toLowerCase().trim())

  // Exact match first
  for (const p of patterns) {
    const pl = p.toLowerCase()
    const idx = headersLower.findIndex(h => h === pl)
    if (idx >= 0) return headers[idx]
  }

  // Partial match
  for (const p of patterns) {
    const pl = p.toLowerCase()
    const idx = headersLower.findIndex(h => h.includes(pl) || pl.includes(h))
    if (idx >= 0) return headers[idx]
  }

  return null
}

/**
 * Gets a string value from a row by column name.
 */
export function getStr(row: Record<string, string>, col: string | null, fallback = ''): string {
  if (!col) return fallback
  return (row[col] ?? '').trim() || fallback
}

/**
 * Gets a numeric value from a row by column name.
 * Uses parseLocalNumber for robust parsing of RU/TJ/UZ number formats.
 */
export function getNum(row: Record<string, string>, col: string | null, fallback = 0): number {
  if (!col) return fallback
  const val = row[col]
  if (val == null || val.trim() === '') return fallback
  const n = parseLocalNumber(val)
  return isNaN(n) ? fallback : n
}

/**
 * Extracts all unique header names from the first row of parsed data.
 */
export function getHeaders(rows: Record<string, string>[]): string[] {
  if (rows.length === 0) return []
  return Object.keys(rows[0])
}
