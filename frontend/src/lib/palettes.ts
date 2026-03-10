// ============================================
// 🎨 ЦВЕТОВЫЕ ПАЛИТРЫ 10 ОТРАСЛЕЙ
// Каждая отрасль — уникальный акцент и фон
// Плавная смена при переключении (transition 0.4s)
// ============================================

export interface Palette {
  bg: string
  card: string
  accent: string
  accent2: string
  text: string
  sub: string
}

export const PALETTES: Record<string, Palette> = {
  retail: {
    bg: '#0a0f1e',
    card: '#111827',
    accent: '#3B82F6',
    accent2: '#60A5FA',
    text: '#F1F5F9',
    sub: '#64748B',
  },
  cafe: {
    bg: '#0f0a08',
    card: '#1C1410',
    accent: '#F59E0B',
    accent2: '#FBBF24',
    text: '#F1F5F9',
    sub: '#78716C',
  },
  warehouse: {
    bg: '#080f0a',
    card: '#0F1A14',
    accent: '#10B981',
    accent2: '#34D399',
    text: '#F1F5F9',
    sub: '#6B7280',
  },
  logistics: {
    bg: '#0a0a0f',
    card: '#13111C',
    accent: '#8B5CF6',
    accent2: '#A78BFA',
    text: '#F1F5F9',
    sub: '#6B7280',
  },
  beauty: {
    bg: '#0f080d',
    card: '#1C1018',
    accent: '#EC4899',
    accent2: '#F472B6',
    text: '#F1F5F9',
    sub: '#78716C',
  },
  ecommerce: {
    bg: '#080f0f',
    card: '#0F1A1A',
    accent: '#06B6D4',
    accent2: '#22D3EE',
    text: '#F1F5F9',
    sub: '#6B7280',
  },
  avito: {
    bg: '#0f0f08',
    card: '#1A1A0F',
    accent: '#84CC16',
    accent2: '#A3E635',
    text: '#F1F5F9',
    sub: '#6B7280',
  },
  marketing: {
    bg: '#0f080a',
    card: '#1C1012',
    accent: '#EF4444',
    accent2: '#F87171',
    text: '#F1F5F9',
    sub: '#78716C',
  },
  crm: {
    bg: '#0f0a08',
    card: '#1C1410',
    accent: '#F97316',
    accent2: '#FB923C',
    text: '#F1F5F9',
    sub: '#78716C',
  },
  finance: {
    bg: '#0a0f08',
    card: '#101A0F',
    accent: '#22C55E',
    accent2: '#4ADE80',
    text: '#F1F5F9',
    sub: '#6B7280',
  },
}

export function getPalette(industry: string): Palette {
  return PALETTES[industry] || PALETTES.retail
}

// Общие цвета для графиков (10 штук)
export const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#22C55E',
]

// Стиль Tooltip для Recharts
export const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#1e293b',
    border: 'none',
    borderRadius: 8,
    color: '#F1F5F9',
    fontSize: 12,
  },
}

// Стиль CartesianGrid для Recharts
export const GRID_PROPS = {
  stroke: '#ffffff08',
  strokeDasharray: '3 3',
}

// Стиль осей для Recharts (генерируется по палитре)
export function axisProps(palette: Palette) {
  return {
    axisLine: false,
    tickLine: false,
    tick: { fill: palette.sub, fontSize: 11 },
  }
}
