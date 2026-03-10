import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import TrustScoreGauge from './TrustScoreGauge';
import AnomalyTable from './AnomalyTable';

interface DataQualityDashboardProps {
  trustScore: number;
  trustLevel: 'high' | 'good' | 'medium' | 'low';
  trustComponents?: {
    data_quality: number;
    calculation: number;
    insights: number;
  };
  anomalies: any[];
  totalAnomalies: number;
  anomaliesByMethod?: Record<string, number>;
  anomaliesBySeverity?: Record<string, number>;
  warnings?: any[];
  recommendations?: string[];
  metrics?: {
    total_revenue?: number;
    clean_revenue?: number;
    anomaly_revenue?: number;
  };
}

const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  trustScore,
  trustLevel,
  trustComponents,
  anomalies,
  totalAnomalies,
  anomaliesByMethod,
  anomaliesBySeverity,
  warnings = [],
  recommendations = [],
  metrics
}) => {
  // Группировка предупреждений по типу
  const criticalWarnings = warnings.filter(w => w.severity === 'high' || w.type === 'critical');
  const normalWarnings = warnings.filter(w => w.severity !== 'high' && w.type !== 'critical');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Качество данных</h2>
          <p className="text-gray-600 mt-1">
            Анализ достоверности и обнаружение аномалий
          </p>
        </div>
      </div>

      {/* Trust Score + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Score Gauge */}
        <div className="lg:col-span-1">
          <TrustScoreGauge
            score={trustScore}
            level={trustLevel}
            components={trustComponents}
          />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Аномалии */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-xl shadow-lg border-2 ${
              totalAnomalies > 0 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className={`w-6 h-6 ${
                totalAnomalies > 0 ? 'text-orange-600' : 'text-green-600'
              }`} />
              <span className={`text-3xl font-bold ${
                totalAnomalies > 0 ? 'text-orange-700' : 'text-green-700'
              }`}>
                {totalAnomalies}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Обнаружено аномалий
            </div>
            {totalAnomalies > 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Рекомендуется проверить строки с аномалиями
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Рекомендации</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Таблица аномалий */}
      {anomalies.length > 0 && (
        <AnomalyTable
          anomalies={anomalies}
          totalAnomalies={totalAnomalies}
          byMethod={anomaliesByMethod}
          bySeverity={anomaliesBySeverity}
        />
      )}
    </div>
  );
};

export default DataQualityDashboard;
