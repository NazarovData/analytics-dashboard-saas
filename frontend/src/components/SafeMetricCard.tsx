/**
 * 📊 SafeMetricCard - Карточка метрики с уровнем уверенности
 * 
 * Показывает:
 * - Значение метрики
 * - Confidence Level (High/Medium/Low/Unavailable)
 * - Допущения если есть
 * - Подсказку при наведении
 */
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Info
} from 'lucide-react'

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unavailable'

interface SafeMetricCardProps {
  title: string
  value: string | number | null | undefined
  subtitle?: string
  icon: React.ReactNode
  confidence?: ConfidenceLevel
  assumption?: string
  formula?: string
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  formatValue?: (value: number) => string
}

const confidenceConfig = {
  high: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Высокая уверенность',
    badge: '🟢'
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Есть допущения',
    badge: '🟡'
  },
  low: {
    icon: Info,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'Низкая уверенность',
    badge: '🔴'
  },
  unavailable: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Нет данных',
    badge: '❌'
  }
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: 'bg-blue-500/20 text-blue-400',
    text: 'text-blue-400'
  },
  purple: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: 'bg-purple-500/20 text-purple-400',
    text: 'text-purple-400'
  },
  green: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    icon: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-400'
  },
  orange: {
    gradient: 'from-orange-500/20 to-amber-500/20',
    icon: 'bg-orange-500/20 text-orange-400',
    text: 'text-orange-400'
  },
  red: {
    gradient: 'from-red-500/20 to-rose-500/20',
    icon: 'bg-red-500/20 text-red-400',
    text: 'text-red-400'
  }
}

export function SafeMetricCard({
  title,
  value,
  subtitle,
  icon,
  confidence = 'high',
  assumption,
  formula,
  color = 'blue',
  formatValue
}: SafeMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const confConfig = confidenceConfig[confidence]
  const colConfig = colorConfig[color]
  
  // Определяем отображаемое значение
  const displayValue = () => {
    if (value === null || value === undefined || confidence === 'unavailable') {
      return <span className="text-gray-500">—</span>
    }
    
    if (typeof value === 'number' && formatValue) {
      return formatValue(value)
    }
    
    return value
  }
  
  return (
    <Card className={`
      relative overflow-hidden
      bg-gradient-to-br ${colConfig.gradient}
      backdrop-blur-xl border-white/10
      hover:border-white/20 transition-all duration-300
      group
    `}>
      <CardContent className="p-4">
        {/* Header with icon and confidence */}
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-xl ${colConfig.icon}`}>
            {icon}
          </div>
          
          {/* Confidence Badge */}
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
              ${confConfig.bgColor} ${confConfig.borderColor} border
              cursor-help
            `}>
              {confConfig.badge}
            </span>
            
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 p-3 rounded-lg bg-gray-900 border border-gray-700 shadow-xl animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-2">
                  <confConfig.icon className={`h-4 w-4 ${confConfig.color}`} />
                  <span className={`text-sm font-medium ${confConfig.color}`}>
                    {confConfig.label}
                  </span>
                </div>
                {assumption && (
                  <p className="text-xs text-gray-400 mb-2">
                    ⚠️ {assumption}
                  </p>
                )}
                {formula && (
                  <p className="text-xs text-gray-500">
                    📐 Формула: <code className="bg-gray-800 px-1 rounded">{formula}</code>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Title */}
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        
        {/* Value */}
        <p className={`text-2xl font-bold ${confidence === 'unavailable' ? 'text-gray-500' : 'text-white'}`}>
          {displayValue()}
        </p>
        
        {/* Subtitle or warning */}
        {confidence === 'unavailable' ? (
          <p className="text-xs text-orange-400 mt-1">
            Требуется поле в данных
          </p>
        ) : subtitle ? (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        ) : null}
        
        {/* Warning for medium/low confidence */}
        {(confidence === 'medium' || confidence === 'low') && assumption && (
          <div className={`mt-2 p-2 rounded-lg ${confConfig.bgColor} ${confConfig.borderColor} border`}>
            <p className={`text-xs ${confConfig.color}`}>
              {assumption}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Компонент для группы метрик с общим AI Trust Score
 */
interface MetricsGroupProps {
  children: React.ReactNode
  trustScore?: number
  className?: string
}

export function MetricsGroup({ children, trustScore, className = '' }: MetricsGroupProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {trustScore !== undefined && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-gray-500">AI Trust Score:</span>
          <span className={`
            font-bold
            ${trustScore >= 90 ? 'text-green-400' : ''}
            ${trustScore >= 70 && trustScore < 90 ? 'text-yellow-400' : ''}
            ${trustScore >= 50 && trustScore < 70 ? 'text-orange-400' : ''}
            ${trustScore < 50 ? 'text-red-400' : ''}
          `}>
            {trustScore}%
          </span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  )
}

export default SafeMetricCard














