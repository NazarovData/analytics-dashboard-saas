import { useState, useMemo } from 'react'
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react'

interface RegionData {
  id: string
  name: string
  value: number
  growth?: number
  orders?: number
}

interface GeoMapProps {
  data: RegionData[]
  title?: string
  valueLabel?: string
}

// Simplified Russia map regions with approximate positions
const RUSSIA_REGIONS: Record<string, { x: number; y: number; size: 'sm' | 'md' | 'lg' }> = {
  'moscow': { x: 37, y: 45, size: 'lg' },
  'spb': { x: 30, y: 35, size: 'lg' },
  'krasnodar': { x: 39, y: 60, size: 'md' },
  'ekb': { x: 60, y: 42, size: 'md' },
  'novosibirsk': { x: 75, y: 45, size: 'md' },
  'kazan': { x: 49, y: 45, size: 'md' },
  'nizhny': { x: 44, y: 45, size: 'md' },
  'samara': { x: 50, y: 50, size: 'md' },
  'rostov': { x: 40, y: 58, size: 'md' },
  'ufa': { x: 56, y: 47, size: 'md' },
  'vladivostok': { x: 95, y: 55, size: 'sm' },
  'irkutsk': { x: 85, y: 48, size: 'sm' },
  'omsk': { x: 70, y: 45, size: 'sm' },
  'chelyabinsk': { x: 58, y: 45, size: 'sm' },
  'voronezh': { x: 40, y: 52, size: 'sm' },
}

export function GeoMap({ data, title, valueLabel = 'Продажи' }: GeoMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const { maxValue, minValue } = useMemo(() => {
    const values = data.map(d => d.value)
    return {
      maxValue: Math.max(...values),
      minValue: Math.min(...values)
    }
  }, [data])

  const getRegionSize = (value: number, baseSize: 'sm' | 'md' | 'lg') => {
    const normalized = (value - minValue) / (maxValue - minValue || 1)
    const sizes = {
      sm: 20 + normalized * 15,
      md: 30 + normalized * 20,
      lg: 40 + normalized * 30
    }
    return sizes[baseSize]
  }

  const getRegionColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue || 1)
    if (normalized > 0.7) return 'bg-green-500 shadow-green-500/50'
    if (normalized > 0.4) return 'bg-blue-500 shadow-blue-500/50'
    return 'bg-purple-500 shadow-purple-500/50'
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      
      <div className="relative">
        {/* Map container */}
        <div className="relative w-full h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-white/10">
          {/* Background grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* Russia outline (simplified) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <path
              d="M 10 40 Q 20 30 35 35 L 50 30 Q 70 25 90 35 L 95 50 Q 90 60 80 55 L 60 60 Q 40 65 25 55 L 15 50 Q 10 45 10 40 Z"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
          </svg>
          
          {/* Region markers */}
          {data.map((region) => {
            const pos = RUSSIA_REGIONS[region.id]
            if (!pos) return null
            
            const size = getRegionSize(region.value, pos.size)
            const isHovered = hoveredRegion === region.id
            const isSelected = selectedRegion?.id === region.id
            
            return (
              <div
                key={region.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
                style={{ 
                  left: `${pos.x}%`, 
                  top: `${pos.y}%`,
                  zIndex: isHovered || isSelected ? 20 : 10
                }}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => setSelectedRegion(region)}
              >
                {/* Pulse ring */}
                <div 
                  className={`absolute inset-0 rounded-full ${getRegionColor(region.value)} animate-ping opacity-20`}
                  style={{ 
                    width: size, 
                    height: size,
                    transform: 'translate(-50%, -50%)',
                    left: '50%',
                    top: '50%'
                  }}
                />
                
                {/* Main marker */}
                <div 
                  className={`
                    relative rounded-full flex items-center justify-center
                    ${getRegionColor(region.value)}
                    shadow-lg transition-transform
                    ${isHovered || isSelected ? 'scale-125' : ''}
                  `}
                  style={{ width: size, height: size }}
                >
                  <span className="text-white font-bold text-xs">
                    {region.value >= 1000 
                      ? `${(region.value / 1000).toFixed(0)}K` 
                      : region.value
                    }
                  </span>
                </div>
                
                {/* Label */}
                <div className={`
                  absolute top-full left-1/2 -translate-x-1/2 mt-1
                  text-xs text-white/70 whitespace-nowrap
                  transition-opacity
                  ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
                `}>
                  {region.name}
                </div>
                
                {/* Hover card */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 rounded-xl border border-white/10 shadow-xl min-w-[180px]">
                    <div className="text-white font-semibold mb-2">{region.name}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{valueLabel}:</span>
                        <span className="text-white font-medium">
                          {region.value.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                      {region.orders && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Заказов:</span>
                          <span className="text-white font-medium">{region.orders}</span>
                        </div>
                      )}
                      {region.growth !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Рост:</span>
                          <span className={`flex items-center gap-1 font-medium ${region.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {region.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {region.growth >= 0 ? '+' : ''}{region.growth}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400">Высокие продажи</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400">Средние</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-gray-400">Низкие</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin className="h-4 w-4" />
            {data.length} регионов
          </div>
        </div>
        
        {/* Selected region details */}
        {selectedRegion && (
          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">{selectedRegion.name}</h4>
              <button 
                onClick={() => setSelectedRegion(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-400 text-sm">{valueLabel}</div>
                <div className="text-white text-xl font-bold">
                  {selectedRegion.value.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              {selectedRegion.orders && (
                <div>
                  <div className="text-gray-400 text-sm">Заказов</div>
                  <div className="text-white text-xl font-bold">{selectedRegion.orders}</div>
                </div>
              )}
              {selectedRegion.growth !== undefined && (
                <div>
                  <div className="text-gray-400 text-sm">Рост</div>
                  <div className={`text-xl font-bold ${selectedRegion.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedRegion.growth >= 0 ? '+' : ''}{selectedRegion.growth}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Preset: Russia Sales Map
export function RussiaSalesMap() {
  const data: RegionData[] = [
    { id: 'moscow', name: 'Москва', value: 15500000, orders: 4520, growth: 12.5 },
    { id: 'spb', name: 'Санкт-Петербург', value: 8200000, orders: 2180, growth: 8.3 },
    { id: 'krasnodar', name: 'Краснодар', value: 3100000, orders: 890, growth: 22.1 },
    { id: 'ekb', name: 'Екатеринбург', value: 4500000, orders: 1250, growth: 15.7 },
    { id: 'novosibirsk', name: 'Новосибирск', value: 3800000, orders: 980, growth: 11.2 },
    { id: 'kazan', name: 'Казань', value: 2900000, orders: 750, growth: 18.9 },
    { id: 'nizhny', name: 'Нижний Новгород', value: 2100000, orders: 620, growth: 9.4 },
    { id: 'samara', name: 'Самара', value: 1800000, orders: 480, growth: -2.3 },
    { id: 'rostov', name: 'Ростов-на-Дону', value: 2400000, orders: 680, growth: 14.6 },
    { id: 'ufa', name: 'Уфа', value: 1500000, orders: 420, growth: 7.8 },
    { id: 'vladivostok', name: 'Владивосток', value: 980000, orders: 280, growth: 25.3 },
    { id: 'irkutsk', name: 'Иркутск', value: 750000, orders: 210, growth: 5.1 },
    { id: 'omsk', name: 'Омск', value: 1100000, orders: 310, growth: -1.5 },
    { id: 'chelyabinsk', name: 'Челябинск', value: 1900000, orders: 520, growth: 10.8 },
    { id: 'voronezh', name: 'Воронеж', value: 1300000, orders: 380, growth: 13.2 },
  ]
  
  return (
    <GeoMap 
      data={data}
      title="🗺️ География продаж по России"
      valueLabel="Выручка"
    />
  )
}














