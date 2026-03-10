import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { DollarSign, ShoppingCart, Package, BarChart3, Clock } from 'lucide-react'
import type { IndustryKey } from '@/lib/industries'
import { INDUSTRIES } from '@/lib/industries'
import type { MappedRow } from '@/lib/applyMapping'
import { getPalette, TOOLTIP_STYLE, GRID_PROPS, axisProps } from '@/lib/palettes'
import { parseLocalNumber } from '@/lib/parseCSV'

interface MapperDashboardProps {
  industry: IndustryKey
  rows: MappedRow[]
  currencySymbol?: string
}

const DARK_BG = '#0d0d1a'
const CARD_BG = 'rgba(255,255,255,0.03)'
const CARD_BORDER = 'rgba(255,255,255,0.08)'

function num(v: any): number {
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  if (typeof v === 'string') return parseLocalNumber(v)
  return 0
}

function str(v: any): string {
  if (v == null) return ''
  return String(v).trim()
}

function fmtCurrency(v: number, symbol = '₽'): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${symbol}`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K ${symbol}`
  return `${v.toLocaleString('ru-RU')} ${symbol}`
}

function fmtNumber(v: number): string {
  return v.toLocaleString('ru-RU')
}

function fmtPercent(v: number): string {
  if (isNaN(v) || !isFinite(v)) return '—'
  return `${v.toFixed(1)}%`
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame = 0
    const total = 30
    const inc = value / total
    const id = setInterval(() => {
      frame++
      if (frame >= total) { setDisplay(value); clearInterval(id) }
      else setDisplay(Math.round(inc * frame))
    }, 20)
    return () => clearInterval(id)
  }, [value])
  return <>{fmtNumber(display)}{suffix}</>
}

function KpiCard({ label, value, icon: Icon, color, suffix = '' }: {
  label: string; value: number; icon: any; color: string; suffix?: string
}) {
  return (
    <div
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
      className="rounded-2xl border p-4 md:p-5 transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function TopTable({ title, items, valueLabel, color }: {
  title: string; items: { name: string; value: number; count?: number }[]; valueLabel: string; color: string
}) {
  const maxVal = Math.max(...items.map(i => i.value), 1)
  return (
    <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 10).map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-5 text-right">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white truncate">{item.name}</span>
                <span className="text-sm font-medium text-white ml-2 shrink-0">{fmtNumber(item.value)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(item.value / maxVal) * 100}%`, background: color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label, symbol = '₽' }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)' }} className="rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {fmtNumber(p.value)} {symbol}
        </p>
      ))}
    </div>
  )
}

// ─── Analytics engine ──────────────────────────

function analyzeData(industry: IndustryKey, rows: MappedRow[], symbol: string) {
  const fields = INDUSTRIES[industry].fields
  const fieldKeys = fields.map(f => f.key)

  const findField = (patterns: string[]): string | null => {
    for (const p of patterns) {
      if (fieldKeys.includes(p)) return p
    }
    return null
  }

  const totalField = findField(['total', 'amount', 'revenue', 'price', 'delivery_cost', 'cost', 'spend'])
  const qtyField = findField(['quantity', 'items', 'packages', 'views', 'clicks', 'impressions', 'stock'])
  const nameField = findField([
    'product_name', 'dish_name', 'title', 'service_name', 'campaign', 'category',
    'item', 'client_name', 'master_name', 'cashier_name', 'channel', 'carrier',
    'waiter_name', 'description',
  ])
  const dateField = findField(['date', 'date_created', 'date_closed'])
  const categoryField = findField(['category', 'channel', 'type', 'status', 'payment_type', 'stage', 'account'])

  const totalSum = rows.reduce((s, r) => s + num(r[totalField || '']), 0)
  const totalQty = rows.reduce((s, r) => s + num(r[qtyField || '']), 0)
  const avgCheck = rows.length > 0 ? Math.round(totalSum / rows.length) : 0

  const byName: Record<string, { revenue: number; count: number; qty: number }> = {}
  if (nameField) {
    for (const r of rows) {
      const name = str(r[nameField]) || 'Другое'
      if (!byName[name]) byName[name] = { revenue: 0, count: 0, qty: 0 }
      byName[name].revenue += num(r[totalField || ''])
      byName[name].count++
      byName[name].qty += num(r[qtyField || ''])
    }
  }
  const topItems = Object.entries(byName)
    .map(([name, d]) => ({ name, value: d.revenue, count: d.count, qty: d.qty }))
    .sort((a, b) => b.value - a.value)

  const topByQty = Object.entries(byName)
    .map(([name, d]) => ({ name, value: d.qty || d.count }))
    .sort((a, b) => b.value - a.value)

  const byCategory: Record<string, number> = {}
  if (categoryField) {
    for (const r of rows) {
      const cat = str(r[categoryField]) || 'Другое'
      byCategory[cat] = (byCategory[cat] || 0) + num(r[totalField || ''])
    }
  }
  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const byDate: Record<string, { revenue: number; count: number }> = {}
  if (dateField) {
    for (const r of rows) {
      const raw = r[dateField]
      let dateKey = ''
      if (raw instanceof Date) {
        dateKey = `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`
      } else {
        const s = str(raw)
        const m = s.match(/(\d{4})-(\d{2})/) || s.match(/(\d{2})\.(\d{2})\.(\d{4})/)
        if (m) {
          dateKey = m.length === 4 ? `${m[3]}-${m[2]}` : `${m[1]}-${m[2]}`
        } else {
          dateKey = s.substring(0, 7)
        }
      }
      if (!dateKey) continue
      if (!byDate[dateKey]) byDate[dateKey] = { revenue: 0, count: 0 }
      byDate[dateKey].revenue += num(r[totalField || ''])
      byDate[dateKey].count++
    }
  }
  const trendData = Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, d]) => ({ period, revenue: d.revenue, count: d.count }))

  return {
    totalSum, totalQty, avgCheck, rows: rows.length,
    topItems, topByQty, categoryData, trendData,
    totalField, qtyField, nameField, dateField, categoryField,
  }
}

const PALETTE_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
]

export function MapperDashboard({ industry, rows, currencySymbol = '₽' }: MapperDashboardProps) {
  const palette = useMemo(() => getPalette(industry), [industry])
  const data = useMemo(() => analyzeData(industry, rows, currencySymbol), [industry, rows, currencySymbol])
  const accent = palette.primary

  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'trends'>('overview')

  const tabs = [
    { key: 'overview' as const, label: 'Обзор' },
    { key: 'items' as const, label: data.nameField ? 'Позиции' : 'Детали' },
    { key: 'trends' as const, label: 'Тренды' },
  ]

  return (
    <div style={{ background: DARK_BG }} className="rounded-2xl p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {INDUSTRIES[industry].name} — Аналитика
          </h2>
          <p className="text-sm text-gray-400">{fmtNumber(data.rows)} записей обработано</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Выручка" value={data.totalSum} icon={DollarSign} color={accent} suffix={` ${currencySymbol}`} />
        <KpiCard label="Записей" value={data.rows} icon={ShoppingCart} color="#f59e0b" />
        <KpiCard label="Количество" value={data.totalQty} icon={Package} color="#10b981" />
        <KpiCard label="Средний чек" value={data.avgCheck} icon={BarChart3} color="#8b5cf6" suffix={` ${currencySymbol}`} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Revenue by category — Pie */}
          {data.categoryData.length > 0 && (
            <ChartCard title="По категориям">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryData.map((_, i) => (
                        <Cell key={i} fill={PALETTE_COLORS[i % PALETTE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip symbol={currencySymbol} />} />
                    <Legend
                      formatter={(v: string) => <span className="text-xs text-gray-400">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Top items — horizontal bar */}
          {data.topItems.length > 0 && (
            <TopTable
              title={`ТОП-10 по выручке (${currencySymbol})`}
              items={data.topItems}
              valueLabel={currencySymbol}
              color={accent}
            />
          )}
        </div>
      )}

      {activeTab === 'items' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bar chart by quantity */}
          {data.topByQty.length > 0 && (
            <ChartCard title="По количеству (шт)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.topByQty.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid {...GRID_PROPS} horizontal={false} />
                    <XAxis type="number" {...axisProps(palette)} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      {...axisProps(palette)}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip symbol="шт" />} />
                    <Bar dataKey="value" name="Количество" fill={accent} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}

          {/* Table */}
          <ChartCard title={`ТОП-10 по выручке`}>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <div className="grid grid-cols-12 text-xs text-gray-500 pb-1 border-b border-white/5">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Название</span>
                <span className="col-span-3 text-right">Выручка</span>
                <span className="col-span-3 text-right">Кол-во</span>
              </div>
              {data.topItems.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 text-sm py-1.5 hover:bg-white/5 rounded-lg px-1 transition-colors"
                >
                  <span className="col-span-1 text-gray-500">{i + 1}</span>
                  <span className="col-span-5 text-white truncate">{item.name}</span>
                  <span className="col-span-3 text-right text-white font-medium">
                    {fmtCurrency(item.value, currencySymbol)}
                  </span>
                  <span className="col-span-3 text-right text-gray-400">{fmtNumber(item.qty || item.count)}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-4">
          {/* Revenue trend */}
          {data.trendData.length > 0 ? (
            <>
              <ChartCard title={`Выручка по периодам (${currencySymbol})`}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendData}>
                      <defs>
                        <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="period" {...axisProps(palette)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis {...axisProps(palette)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip symbol={currencySymbol} />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Выручка"
                        stroke={accent}
                        fill="url(#gradRevenue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Количество записей по периодам">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trendData}>
                      <CartesianGrid {...GRID_PROPS} />
                      <XAxis dataKey="period" {...axisProps(palette)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis {...axisProps(palette)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip symbol="шт" />} />
                      <Bar dataKey="count" name="Записей" fill={accent} radius={[6, 6, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Insight cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.trendData.length >= 2 && (() => {
                  const last = data.trendData[data.trendData.length - 1]
                  const prev = data.trendData[data.trendData.length - 2]
                  const growth = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0
                  const best = data.trendData.reduce((a, b) => a.revenue > b.revenue ? a : b)
                  const worst = data.trendData.reduce((a, b) => a.revenue < b.revenue ? a : b)

                  return (
                    <>
                      <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4">
                        <div className="text-xs text-gray-400 mb-1">Рост</div>
                        <div className={`text-lg font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {growth >= 0 ? '+' : ''}{fmtPercent(growth)}
                        </div>
                      </div>
                      <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4">
                        <div className="text-xs text-gray-400 mb-1">Лучший период</div>
                        <div className="text-lg font-bold text-white">{best.period}</div>
                        <div className="text-xs text-gray-500">{fmtCurrency(best.revenue, currencySymbol)}</div>
                      </div>
                      <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4">
                        <div className="text-xs text-gray-400 mb-1">Худший период</div>
                        <div className="text-lg font-bold text-white">{worst.period}</div>
                        <div className="text-xs text-gray-500">{fmtCurrency(worst.revenue, currencySymbol)}</div>
                      </div>
                      <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-4">
                        <div className="text-xs text-gray-400 mb-1">Среднее / период</div>
                        <div className="text-lg font-bold text-white">
                          {fmtCurrency(Math.round(data.totalSum / data.trendData.length), currencySymbol)}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </>
          ) : (
            <div style={{ background: CARD_BG, borderColor: CARD_BORDER }} className="rounded-2xl border p-8 text-center">
              <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Нет данных по датам для построения трендов</p>
              <p className="text-xs text-gray-500 mt-1">Убедитесь, что поле «Дата» привязано при маппинге</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
