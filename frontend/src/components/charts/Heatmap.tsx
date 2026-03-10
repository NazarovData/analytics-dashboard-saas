import { useMemo } from 'react'

interface HeatmapData {
  x: string
  y: string
  value: number
}

interface HeatmapProps {
  data: HeatmapData[]
  title?: string
  xLabels?: string[]
  yLabels?: string[]
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange'
}

export function Heatmap({ 
  data, 
  title,
  xLabels,
  yLabels,
  colorScheme = 'blue' 
}: HeatmapProps) {
  const { matrix, xAxis, yAxis, maxValue, minValue } = useMemo(() => {
    const xSet = new Set(xLabels || data.map(d => d.x))
    const ySet = new Set(yLabels || data.map(d => d.y))
    const xAxis = Array.from(xSet)
    const yAxis = Array.from(ySet)
    
    const matrix: (number | null)[][] = []
    let maxValue = -Infinity
    let minValue = Infinity
    
    yAxis.forEach((y, yi) => {
      matrix[yi] = []
      xAxis.forEach((x, xi) => {
        const item = data.find(d => d.x === x && d.y === y)
        const value = item?.value ?? null
        matrix[yi][xi] = value
        if (value !== null) {
          maxValue = Math.max(maxValue, value)
          minValue = Math.min(minValue, value)
        }
      })
    })
    
    return { matrix, xAxis, yAxis, maxValue, minValue }
  }, [data, xLabels, yLabels])

  const getColor = (value: number | null) => {
    if (value === null) return 'bg-gray-800'
    
    const normalized = (value - minValue) / (maxValue - minValue || 1)
    
    const colors = {
      blue: [
        'bg-blue-900/30',
        'bg-blue-800/50',
        'bg-blue-700/60',
        'bg-blue-600/70',
        'bg-blue-500/80',
        'bg-blue-400/90',
        'bg-blue-300'
      ],
      green: [
        'bg-emerald-900/30',
        'bg-emerald-800/50',
        'bg-emerald-700/60',
        'bg-emerald-600/70',
        'bg-emerald-500/80',
        'bg-emerald-400/90',
        'bg-emerald-300'
      ],
      purple: [
        'bg-purple-900/30',
        'bg-purple-800/50',
        'bg-purple-700/60',
        'bg-purple-600/70',
        'bg-purple-500/80',
        'bg-purple-400/90',
        'bg-purple-300'
      ],
      orange: [
        'bg-orange-900/30',
        'bg-orange-800/50',
        'bg-orange-700/60',
        'bg-orange-600/70',
        'bg-orange-500/80',
        'bg-orange-400/90',
        'bg-orange-300'
      ]
    }
    
    const colorArray = colors[colorScheme]
    const index = Math.min(Math.floor(normalized * colorArray.length), colorArray.length - 1)
    return colorArray[index]
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* X-axis labels */}
          <div className="flex ml-20">
            {xAxis.map((label, i) => (
              <div 
                key={i} 
                className="flex-1 min-w-[60px] text-center text-xs text-gray-400 pb-2 truncate px-1"
                title={label}
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Matrix */}
          <div className="flex flex-col gap-1">
            {yAxis.map((yLabel, yi) => (
              <div key={yi} className="flex items-center gap-1">
                {/* Y-axis label */}
                <div className="w-20 text-right text-xs text-gray-400 pr-2 truncate" title={yLabel}>
                  {yLabel}
                </div>
                
                {/* Row cells */}
                <div className="flex gap-1 flex-1">
                  {matrix[yi].map((value, xi) => (
                    <div
                      key={xi}
                      className={`
                        flex-1 min-w-[60px] h-10 rounded-md flex items-center justify-center
                        ${getColor(value)}
                        transition-all hover:scale-105 hover:z-10 cursor-pointer
                        group relative
                      `}
                    >
                      <span className="text-xs font-medium text-white/80">
                        {value !== null ? value.toLocaleString('ru-RU') : '-'}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 border border-white/10">
                        <div className="text-white font-medium">{xAxis[xi]}</div>
                        <div className="text-gray-400">{yLabel}</div>
                        <div className="text-blue-400 font-bold">{value?.toLocaleString('ru-RU') ?? 'Нет данных'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center mt-4 gap-2">
            <span className="text-xs text-gray-500">Мин</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className={`w-6 h-3 rounded-sm ${getColor(minValue + (maxValue - minValue) * (i / 6))}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Макс</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Preset: Sales by Hour and Day
export function SalesHeatmap() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const hours = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
  
  // Generate sample data
  const data: HeatmapData[] = []
  days.forEach(day => {
    hours.forEach(hour => {
      // Peak hours simulation
      const isPeak = (hour === '12:00' || hour === '13:00' || hour === '18:00' || hour === '19:00')
      const isWeekend = (day === 'Сб' || day === 'Вс')
      const baseValue = isWeekend ? 30 : 50
      const peakBonus = isPeak ? 40 : 0
      const randomFactor = Math.random() * 20
      
      data.push({
        x: hour,
        y: day,
        value: Math.round(baseValue + peakBonus + randomFactor)
      })
    })
  })
  
  return (
    <Heatmap 
      data={data}
      title="🔥 Активность продаж по дням и часам"
      xLabels={hours}
      yLabels={days}
      colorScheme="orange"
    />
  )
}















