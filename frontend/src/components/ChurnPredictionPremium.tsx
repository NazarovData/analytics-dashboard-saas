import React from 'react';
import {
  TrendingDown,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Zap
} from 'lucide-react';

interface ChurnPredictionPremiumProps {
  churnData: {
    success: boolean;
    churn_risk: 'low' | 'medium' | 'high';
    churn_percentage: number;
    orders_per_client: number;
    recommendation: string;
    estimated_churned_clients: number;
  };
  totalClients: number;
  avgCheck: number;
}

const ChurnPredictionPremium: React.FC<ChurnPredictionPremiumProps> = ({
  churnData,
  totalClients,
  avgCheck
}) => {
  if (!churnData.success) {
    return null;
  }

  const riskConfig = {
    low: {
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      icon: Shield,
      label: 'Низкий риск',
      emoji: '✅'
    },
    medium: {
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      icon: AlertTriangle,
      label: 'Средний риск',
      emoji: '⚠️'
    },
    high: {
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      icon: TrendingDown,
      label: 'Высокий риск',
      emoji: '🚨'
    }
  };

  const config = riskConfig[churnData.churn_risk];
  const RiskIcon = config.icon;

  // Расчет потенциальных потерь
  const potentialLoss = churnData.estimated_churned_clients * avgCheck;
  const retainedClients = totalClients - churnData.estimated_churned_clients;
  const retentionRate = ((retainedClients / totalClients) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header с градиентом */}
      <div className={`bg-gradient-to-r ${config.color} p-8 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <RiskIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Прогноз оттока клиентов</h3>
                <p className="text-white text-opacity-90 text-sm">
                  Customer Churn Prediction • AI-анализ
                </p>
              </div>
            </div>
            <div className="text-5xl animate-pulse-slow">{config.emoji}</div>
          </div>

          {/* Главная метрика */}
          <div className="mt-6 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white text-opacity-80 text-sm font-medium mb-2">
                  Уровень риска оттока
                </p>
                <div className="flex items-baseline space-x-3">
                  <span className="text-6xl font-bold tracking-tight">
                    {churnData.churn_percentage}%
                  </span>
                  <span className="text-2xl font-semibold opacity-90">
                    {config.label}
                  </span>
                </div>
              </div>
              
              {/* Круговой индикатор */}
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - churnData.churn_percentage / 100)}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{churnData.churn_percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="p-8">
        {/* Ключевые метрики в карточках */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Клиенты в зоне риска */}
          <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-red-600 font-medium mb-1">В зоне риска</p>
            <p className="text-3xl font-bold text-red-700 mb-1">
              {churnData.estimated_churned_clients}
            </p>
            <p className="text-xs text-red-500">
              из {totalClients} клиентов
            </p>
          </div>

          {/* Удержанные клиенты */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-green-600 font-medium mb-1">Удержано</p>
            <p className="text-3xl font-bold text-green-700 mb-1">
              {retainedClients}
            </p>
            <p className="text-xs text-green-500">
              Retention: {retentionRate}%
            </p>
          </div>

          {/* Заказов на клиента */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-blue-600 font-medium mb-1">Заказов/клиент</p>
            <p className="text-3xl font-bold text-blue-700 mb-1">
              {churnData.orders_per_client.toFixed(1)}
            </p>
            <p className="text-xs text-blue-500">
              Средняя частота
            </p>
          </div>

          {/* Потенциальные потери */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <TrendingDown className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm text-orange-600 font-medium mb-1">Риск потерь</p>
            <p className="text-3xl font-bold text-orange-700 mb-1">
              {(potentialLoss / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-orange-500">
              ₽ выручки под угрозой
            </p>
          </div>
        </div>

        {/* Визуализация распределения клиентов */}
        <div className="mb-8 bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" />
            Распределение клиентской базы
          </h4>
          
          <div className="space-y-4">
            {/* Прогресс бар для риска */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-700">
                  🚨 В зоне риска ({churnData.churn_percentage}%)
                </span>
                <span className="text-sm font-bold text-red-700">
                  {churnData.estimated_churned_clients} клиентов
                </span>
              </div>
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${churnData.churn_percentage}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {churnData.churn_percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Прогресс бар для удержанных */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-700">
                  ✅ Удержанные клиенты ({retentionRate}%)
                </span>
                <span className="text-sm font-bold text-green-700">
                  {retainedClients} клиентов
                </span>
              </div>
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${retentionRate}%` }}
                >
                  <span className="text-white text-xs font-bold">
                    {retentionRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Рекомендации и план действий */}
        <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-6 mb-6`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 ${config.bgColor} rounded-xl`}>
              <Zap className={`w-6 h-6 ${config.textColor}`} />
            </div>
            <div className="flex-1">
              <h4 className={`text-lg font-bold ${config.textColor} mb-2`}>
                💡 Рекомендации по снижению оттока
              </h4>
              <p className={`text-sm ${config.textColor} mb-4 leading-relaxed`}>
                {churnData.recommendation}
              </p>
              
              {/* План действий */}
              <div className="space-y-3 mt-4">
                <h5 className={`text-sm font-bold ${config.textColor} mb-2`}>
                  🎯 План действий:
                </h5>
                
                {churnData.churn_risk === 'high' && (
                  <>
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Срочно запустите программу лояльности с бонусами
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Приоритет: Критический | Срок: 3-7 дней
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Персональные предложения для клиентов в зоне риска
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Скидка 15-20% или эксклюзивное предложение
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Опрос удовлетворенности и выявление проблем
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Узнайте причины недовольства напрямую от клиентов
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {churnData.churn_risk === 'medium' && (
                  <>
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Увеличьте частоту коммуникации с клиентами
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Email-рассылки, SMS, персональные предложения
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Запустите реактивационную кампанию
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          "Мы скучаем по вам" со специальным предложением
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {churnData.churn_risk === 'low' && (
                  <>
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Продолжайте текущую стратегию
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Ваши клиенты довольны - поддерживайте качество
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        +
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Запросите отзывы и рекомендации
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Используйте довольных клиентов для привлечения новых
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Потенциальный ROI от удержания */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-6 border-2 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-indigo-900 mb-2 flex items-center">
                💰 Потенциальная выгода от удержания
              </h4>
              <p className="text-sm text-indigo-700 mb-4">
                Если удержите хотя бы 50% клиентов в зоне риска:
              </p>
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-bold text-indigo-900">
                  {((potentialLoss * 0.5) / 1000).toFixed(0)}K ₽
                </span>
                <span className="text-lg text-indigo-700">сохраненной выручки</span>
              </div>
            </div>
            <div className="text-6xl animate-bounce-slow">💎</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurnPredictionPremium;





