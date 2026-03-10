import { useMemo } from 'react'

interface FunnelStage {
  name: string
  value: number
  color?: string
}

interface FunnelChartProps {
  data: FunnelStage[]
  title?: string
  showPercentage?: boolean
  showConversion?: boolean
}

export function FunnelChart({ 
  data, 
  title,
  showPercentage = true,
  showConversion = true 
}: FunnelChartProps) {
  const processedData = useMemo(() => {
    const maxValue = Math.max(...data.map(d => d.value))
    const firstValue = data[0]?.value || 1
    
    return data.map((stage, index) => ({
      ...stage,
      width: (stage.value / maxValue) * 100,
      percentage: (stage.value / firstValue) * 100,
      conversionFromPrev: index > 0 
        ? (stage.value / data[index - 1].value) * 100 
        : 100
    }))
  }, [data])

  const defaultColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-orange-500 to-orange-600',
    'from-green-500 to-green-600',
    'from-cyan-500 to-cyan-600',
  ]

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      )}
      
      <div className="space-y-3">
        {processedData.map((stage, index) => (
          <div key={index} className="relative">
            {/* Conversion arrow */}
            {showConversion && index > 0 && (
              <div className="absolute -top-2 right-4 text-xs text-gray-400 flex items-center gap-1">
                <span>↓</span>
                <span className={stage.conversionFromPrev >= 50 ? 'text-green-400' : 'text-orange-400'}>
                  {stage.conversionFromPrev.toFixed(1)}%
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              {/* Stage bar */}
              <div 
                className="relative h-14 rounded-lg overflow-hidden transition-all duration-500 group cursor-pointer hover:scale-[1.02]"
                style={{ width: `${stage.width}%`, minWidth: '200px' }}
              >
                {/* Background gradient */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-r ${stage.color || defaultColors[index % defaultColors.length]} opacity-90`}
                />
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                
                {/* Content */}
                <div className="relative h-full flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-white font-semibold">
                      {stage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-lg">
                      {stage.value.toLocaleString('ru-RU')}
                    </span>
                    {showPercentage && (
                      <span className="text-white/70 text-sm">
                        ({stage.percentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Hover tooltip */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-center">
                    <div className="text-white font-bold">{stage.name}</div>
                    <div className="text-gray-300 text-sm">
                      {stage.value.toLocaleString('ru-RU')} посетителей
                    </div>
                    {index > 0 && (
                      <div className="text-yellow-400 text-sm mt-1">
                        Потеряно: {(data[index-1].value - stage.value).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Lost users indicator */}
              {index > 0 && (
                <div className="text-xs text-red-400/70 whitespace-nowrap">
                  -{(data[index-1].value - stage.value).toLocaleString('ru-RU')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-gray-400 text-sm">
          Общая конверсия: 
          <span className="ml-2 text-white font-bold">
            {((data[data.length - 1]?.value / data[0]?.value) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          Потеряно всего: 
          <span className="ml-2 text-red-400 font-bold">
            {(data[0]?.value - data[data.length - 1]?.value).toLocaleString('ru-RU')}
          </span>
        </div>
      </div>
    </div>
  )
}

// Preset: E-commerce Sales Funnel
export function SalesFunnel() {
  const data: FunnelStage[] = [
    { name: 'Посетители сайта', value: 10000 },
    { name: 'Просмотр товаров', value: 6500 },
    { name: 'Добавили в корзину', value: 3200 },
    { name: 'Начали оформление', value: 1800 },
    { name: 'Завершили покупку', value: 950 },
  ]
  
  return (
    <FunnelChart 
      data={data}
      title="📊 Воронка продаж"
    />
  )
}

// Preset: Marketing Funnel
export function MarketingFunnel() {
  const data: FunnelStage[] = [
    { name: 'Охват рекламы', value: 50000, color: 'from-blue-400 to-blue-600' },
    { name: 'Клики по рекламе', value: 8500, color: 'from-cyan-400 to-cyan-600' },
    { name: 'Посещения лендинга', value: 6200, color: 'from-purple-400 to-purple-600' },
    { name: 'Заявки/Лиды', value: 420, color: 'from-pink-400 to-pink-600' },
    { name: 'Продажи', value: 85, color: 'from-green-400 to-green-600' },
  ]
  
  return (
    <FunnelChart 
      data={data}
      title="🎯 Маркетинговая воронка"
    />
  )
}















