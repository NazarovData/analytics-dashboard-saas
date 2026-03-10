/**
 * 🎯 AI TRUST SCORE Component
 * Отображает уровень доверия к аналитике
 * 
 * Показывает:
 * - Общий скор качества анализа
 * - Разбивка по категориям (данные, математика, инсайты)
 * - Допущения и ограничения
 * - Рекомендации по улучшению
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Database,
  Calculator,
  Lightbulb,
  XCircle,
  HelpCircle
} from 'lucide-react'

interface AITrustScoreProps {
  trustScore: {
    overall_score: number
    data_score: number
    math_score: number
    insights_score: number
    recommendation: string
    breakdown?: {
      high_confidence_metrics: number
      medium_confidence_metrics: number
      total_metrics: number
    }
  }
  metricsConfidence?: Record<string, {
    level: string
    reason: string
    can_calculate: boolean
  }>
  assumptions?: Array<{
    metric: string
    assumption: string
    impact: string
  }>
  className?: string
}

// Цвета для разных уровней
const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

const getScoreBg = (score: number) => {
  if (score >= 90) return 'from-green-500/20 to-emerald-500/20'
  if (score >= 70) return 'from-yellow-500/20 to-amber-500/20'
  if (score >= 50) return 'from-orange-500/20 to-amber-500/20'
  return 'from-red-500/20 to-rose-500/20'
}

const getScoreBorder = (score: number) => {
  if (score >= 90) return 'border-green-500/30'
  if (score >= 70) return 'border-yellow-500/30'
  if (score >= 50) return 'border-orange-500/30'
  return 'border-red-500/30'
}

const getConfidenceIcon = (level: string) => {
  switch (level) {
    case 'high':
      return <CheckCircle className="h-4 w-4 text-green-400" />
    case 'medium':
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />
    case 'low':
      return <Info className="h-4 w-4 text-orange-400" />
    case 'unavailable':
      return <XCircle className="h-4 w-4 text-red-400" />
    default:
      return <HelpCircle className="h-4 w-4 text-gray-400" />
  }
}

const getConfidenceLabel = (level: string) => {
  switch (level) {
    case 'high':
      return '🟢 Высокая'
    case 'medium':
      return '🟡 Средняя'
    case 'low':
      return '🔴 Низкая'
    case 'unavailable':
      return '❌ Недоступно'
    default:
      return '❓ Неизвестно'
  }
}

export function AITrustScore({ 
  trustScore, 
  metricsConfidence, 
  assumptions = [],
  className = '' 
}: AITrustScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { overall_score, data_score, math_score, insights_score, recommendation } = trustScore
  
  return (
    <Card className={`bg-gradient-to-br ${getScoreBg(overall_score)} backdrop-blur-xl border ${getScoreBorder(overall_score)} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${overall_score >= 70 ? 'from-green-500/30 to-emerald-500/30' : 'from-orange-500/30 to-amber-500/30'}`}>
              <Shield className={`h-6 w-6 ${getScoreColor(overall_score)}`} />
            </div>
            <div>
              <CardTitle className="text-white text-lg">AI Trust Score</CardTitle>
              <CardDescription className="text-gray-400">Уровень доверия к анализу</CardDescription>
            </div>
          </div>
          
          {/* Main Score */}
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(overall_score)}`}>
              {overall_score}%
            </div>
            <div className="text-xs text-gray-500">достоверность</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Score Bars */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Data Score */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Database className="h-4 w-4" />
              <span>Данные</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${data_score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">{data_score}%</div>
          </div>
          
          {/* Math Score */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Calculator className="h-4 w-4" />
              <span>Расчёты</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${math_score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">{math_score}%</div>
          </div>
          
          {/* Insights Score */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Lightbulb className="h-4 w-4" />
              <span>Инсайты</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${insights_score}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">{insights_score}%</div>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className={`p-3 rounded-lg ${overall_score >= 70 ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'} mb-3`}>
          <p className="text-sm text-gray-300">{recommendation}</p>
        </div>
        
        {/* Expand/Collapse for details */}
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-gray-400 hover:text-white hover:bg-white/5"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" /> Скрыть детали
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" /> Показать детали
            </>
          )}
        </Button>
        
        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Metrics Confidence */}
            {metricsConfidence && Object.keys(metricsConfidence).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">📊 Уверенность по метрикам</h4>
                <div className="space-y-2">
                  {Object.entries(metricsConfidence).map(([metric, conf]) => (
                    <div 
                      key={metric}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getConfidenceIcon(conf.level)}
                        <span className="text-sm text-gray-300 capitalize">
                          {metric.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">
                          {getConfidenceLabel(conf.level)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Assumptions */}
            {assumptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">⚠️ Допущения</h4>
                <div className="space-y-2">
                  {assumptions.map((assumption, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-orange-300 font-medium">{assumption.assumption}</p>
                          <p className="text-xs text-gray-400 mt-1">{assumption.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* How to improve */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Как улучшить точность?</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Добавьте колонку <code className="bg-gray-800 px-1 rounded">client_id</code> или <code className="bg-gray-800 px-1 rounded">customer</code> для анализа клиентов</li>
                <li>• Добавьте колонку <code className="bg-gray-800 px-1 rounded">order_id</code> для точного подсчёта заказов</li>
                <li>• Добавьте колонку <code className="bg-gray-800 px-1 rounded">cost</code> для расчёта прибыли и маржи</li>
                <li>• Загрузите данные минимум за 30 дней для анализа трендов</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Компактная версия для встраивания в карточки метрик
 */
interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low' | 'unavailable'
  showLabel?: boolean
}

export function ConfidenceBadge({ level, showLabel = false }: ConfidenceBadgeProps) {
  const colors = {
    high: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    unavailable: 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  
  const labels = {
    high: '🟢',
    medium: '🟡',
    low: '🔴',
    unavailable: '❌'
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[level]}`}>
      {labels[level]}
      {showLabel && <span className="ml-1">{getConfidenceLabel(level).split(' ')[1]}</span>}
    </span>
  )
}

export default AITrustScore














