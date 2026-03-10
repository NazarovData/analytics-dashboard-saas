// ============================================
// 💰 ВАЛЮТЫ И ЛОКАЛИЗАЦИЯ
// Россия (RUB), Таджикистан (TJS), Узбекистан (UZS)
// ============================================

export type CountryCode = 'RU' | 'TJ' | 'UZ'
export type CurrencyCode = 'RUB' | 'TJS' | 'UZS'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  decimalSeparator: ',' | '.'
  thousandSeparator: ' ' | ','
  vatRate: number
  hasDecimals: boolean
}

export interface CountryConfig {
  code: CountryCode
  name: string
  currency: Currency
  dateFormats: string[]
  commonEncodings: string[]
  commonDelimiters: (';' | ',' | '\t')[]
  cashSystems: string[]
}

// ─── Валюты ───────────────────────────────────

export const CURRENCIES: Record<CountryCode, Currency> = {
  RU: {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    vatRate: 20,
    hasDecimals: true,
  },
  TJ: {
    code: 'TJS',
    symbol: 'сом.',
    name: 'Таджикский сомони',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    vatRate: 15,
    hasDecimals: true,
  },
  UZ: {
    code: 'UZS',
    symbol: 'сўм',
    name: 'Узбекский сўм',
    decimalSeparator: ',',
    thousandSeparator: ' ',
    vatRate: 12,
    hasDecimals: false, // суммы целые, копеек нет
  },
}

// ─── Конфигурация стран ───────────────────────

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  RU: {
    code: 'RU',
    name: 'Россия',
    currency: CURRENCIES.RU,
    dateFormats: ['DD.MM.YYYY', 'DD.MM.YYYY HH:mm:ss', 'YYYY-MM-DD'],
    commonEncodings: ['windows-1251', 'utf-8', 'utf-8-sig'],
    commonDelimiters: [';', ','],
    cashSystems: ['1С: Предприятие', 'МойСклад', 'ЭВОТОР', 'АТОЛ / Frontol'],
  },
  TJ: {
    code: 'TJ',
    name: 'Таджикистан',
    currency: CURRENCIES.TJ,
    dateFormats: ['DD.MM.YYYY', 'DD.MM.YYYY HH:mm:ss', 'YYYY-MM-DD'],
    commonEncodings: ['windows-1251', 'utf-8'],
    commonDelimiters: [';', ','],
    cashSystems: ['1С (адаптация)', 'Excel выгрузки'],
  },
  UZ: {
    code: 'UZ',
    name: 'Узбекистан',
    currency: CURRENCIES.UZ,
    dateFormats: ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'],
    commonEncodings: ['utf-8', 'windows-1251'],
    commonDelimiters: [';', ','],
    cashSystems: ['Soliq', '1С Узбекистан', 'JOWI', 'iiko'],
  },
}

// ─── Форматирование валюты ────────────────────

export function formatCurrency(amount: number, country: CountryCode): string {
  const c = CURRENCIES[country]

  if (country === 'UZ') {
    return (
      new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(
        Math.round(amount),
      ) +
      ' ' +
      c.symbol
    )
  }

  return (
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) +
    ' ' +
    c.symbol
  )
}

// ─── Расчёт НДС ──────────────────────────────

export interface VATResult {
  total: number
  vat: number
  clean: number
}

/**
 * @param amount  — сумма
 * @param country — страна
 * @param included — НДС уже включён в сумму (true по умолчанию)
 */
export function calcVAT(
  amount: number,
  country: CountryCode,
  included: boolean = true,
): VATResult {
  const rate = CURRENCIES[country].vatRate / 100

  if (included) {
    const clean = amount / (1 + rate)
    const vat = amount - clean
    return { total: amount, vat, clean }
  }

  const vat = amount * rate
  return { total: amount + vat, vat, clean: amount }
}
