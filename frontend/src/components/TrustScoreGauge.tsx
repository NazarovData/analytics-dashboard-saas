import React from 'react';
import { motion } from 'framer-motion';

interface TrustScoreGaugeProps {
  score: number;
  level: 'high' | 'good' | 'medium' | 'low';
  components?: {
    data_quality: number;
    calculation: number;
    insights: number;
  };
}

const TrustScoreGauge: React.FC<TrustScoreGaugeProps> = ({ score, level, components }) => {
  // Цвета для разных уровней
  const levelConfig = {
    high: {
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      emoji: '✅',
      title: 'Высокая достоверность',
      description: 'Данные подходят для бизнес-решений'
    },
    good: {
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      emoji: '🟡',
      title: 'Хорошая достоверность',
      description: 'Обратите внимание на предупреждения'
    },
    medium: {
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      emoji: '🟠',
      title: 'Средняя достоверность',
      description: 'Рекомендуется проверка данных'
    },
    low: {
      color: 'from-red-500 to-red-700',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      emoji: '🔴',
      title: 'Низкая достоверность',
      description: 'Критические проблемы с данными'
    }
  };

  const config = levelConfig[level];
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`${config.bgColor} rounded-xl p-6 shadow-lg border-2 border-opacity-20`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Trust Score</h3>
        <span className="text-2xl">{config.emoji}</span>
      </div>

      {/* Gauge Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          {/* Background Circle */}
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${config.color.split(' ')[0].replace('from-', 'stop-')}`} />
                <stop offset="100%" className={`${config.color.split(' ')[2].replace('to-', 'stop-')}`} />
              </linearGradient>
            </defs>
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-center"
            >
              <div className={`text-4xl font-bold ${config.textColor}`}>
                {Math.round(score)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {config.title}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mb-4">
        {config.description}
      </p>

      {/* Components Breakdown */}
      {components && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700 mb-2">Компоненты:</div>
          
          {/* Data Quality */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Данные</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${components.data_quality}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-10 text-right">
                {Math.round(components.data_quality)}%
              </span>
            </div>
          </div>

          {/* Calculation */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Расчёты</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${components.calculation}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-10 text-right">
                {Math.round(components.calculation)}%
              </span>
            </div>
          </div>

          {/* Insights */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Инсайты</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-pink-500 to-pink-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${components.insights}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-10 text-right">
                {Math.round(components.insights)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreGauge;
