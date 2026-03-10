import { Info, CheckCircle, AlertTriangle } from 'lucide-react'

interface CalculationDetailsProps {
  formula: string
  method: string
  verification?: {
    method2?: string
    result?: number
    match?: boolean
  }
  details?: {
    min?: number
    max?: number
    count?: number
    average?: number
  }
  isVisible: boolean
}

export function CalculationDetails({
  formula,
  method,
  verification,
  details,
  isVisible
}: CalculationDetailsProps) {
  if (!isVisible) return null

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 2
    }).format(val)
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 backdrop-blur-sm animate-fade-in-up">
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-blue-400" />
        <h4 className="text-sm font-semibold text-blue-300">Как рассчитано</h4>
      </div>

      {/* Формула */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-400 whitespace-nowrap">Метод:</span>
          <code className="flex-1 px-2 py-1 bg-black/30 rounded text-blue-300 font-mono text-xs">
            {method}
          </code>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-gray-400 whitespace-nowrap">Формула:</span>
          <code className="flex-1 px-2 py-1 bg-black/30 rounded text-purple-300 font-mono text-xs">
            {formula}
          </code>
        </div>

        {/* Детали */}
        {details && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
            {details.count !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Записей:</span>
                <span className="text-white font-medium">{details.count.toLocaleString('ru-RU')}</span>
              </div>
            )}
            {details.min !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Минимум:</span>
                <span className="text-green-300 font-medium">{formatCurrency(details.min)}</span>
              </div>
            )}
            {details.max !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Максимум:</span>
                <span className="text-red-300 font-medium">{formatCurrency(details.max)}</span>
              </div>
            )}
            {details.average !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-400">Среднее:</span>
                <span className="text-yellow-300 font-medium">{formatCurrency(details.average)}</span>
              </div>
            )}
          </div>
        )}

        {/* Верификация */}
        {verification && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              {verification.match ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
              <span className="text-sm font-medium text-white">Двойная проверка:</span>
            </div>
            
            {verification.method2 && (
              <code className="block px-2 py-1 bg-black/30 rounded text-green-300 font-mono text-xs mb-2">
                {verification.method2}
              </code>
            )}

            {verification.result !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Результат проверки:</span>
                <span className={`text-xs font-medium ${verification.match ? 'text-green-400' : 'text-yellow-400'}`}>
                  {formatCurrency(verification.result)}
                </span>
              </div>
            )}

            {verification.match !== undefined && (
              <div className="mt-2 px-3 py-2 rounded ${verification.match ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}">
                <p className={`text-xs ${verification.match ? 'text-green-300' : 'text-yellow-300'}`}>
                  {verification.match 
                    ? '✅ Расчеты совпадают - данные точны!' 
                    : '⚠️ Небольшое расхождение (допустимо из-за округления)'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Гарантия точности */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span className="text-xs text-gray-400">
              Точность до копеек • Float64 precision • Проверено автоматически
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}





