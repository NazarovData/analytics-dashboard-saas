import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface Anomaly {
  method: string;
  column: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  sample_values?: number[];
  threshold?: number;
  message?: string;
}

interface AnomalyTableProps {
  anomalies: Anomaly[];
  totalAnomalies: number;
  byMethod?: Record<string, number>;
  bySeverity?: Record<string, number>;
}

const AnomalyTable: React.FC<AnomalyTableProps> = ({
  anomalies,
  totalAnomalies,
  byMethod,
  bySeverity
}) => {
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Фильтрация аномалий
  const filteredAnomalies = anomalies.filter(anomaly => {
    const methodMatch = filterMethod === 'all' || anomaly.method === filterMethod;
    const severityMatch = filterSeverity === 'all' || anomaly.severity === filterSeverity;
    return methodMatch && severityMatch;
  });

  // Конфигурация severity
  const severityConfig = {
    high: {
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      emoji: '🔴'
    },
    medium: {
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      emoji: '🟠'
    },
    low: {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      emoji: '🟡'
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
          <h3 className="text-xl font-bold text-gray-800">
            Обнаруженные аномалии
          </h3>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
            {totalAnomalies}
          </span>
        </div>
      </div>

      {/* Статистика */}
      {(byMethod || bySeverity) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* По методам */}
          {byMethod && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">По методам:</div>
              <div className="space-y-1">
                {Object.entries(byMethod).map(([method, count]) => (
                  <div key={method} className="flex justify-between text-sm">
                    <span className="text-gray-600">{method}</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* По severity */}
          {bySeverity && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-2">По важности:</div>
              <div className="space-y-1">
                {Object.entries(bySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{severity}</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Фильтры:</span>
        </div>

        {/* Фильтр по методу */}
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Все методы</option>
          {byMethod && Object.keys(byMethod).map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>

        {/* Фильтр по severity */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Все уровни</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="ml-auto text-sm text-gray-600">
          Показано: {filteredAnomalies.length} из {anomalies.length}
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Метод</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Колонка</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Количество</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Важность</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Детали</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredAnomalies.map((anomaly, index) => (
                <React.Fragment key={index}>
                  <motion.tr
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-800">
                        {anomaly.method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {anomaly.column}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {anomaly.count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 ${severityConfig[anomaly.severity].bgColor} ${severityConfig[anomaly.severity].color} rounded-full text-xs font-semibold inline-flex items-center gap-1`}>
                        <span>{severityConfig[anomaly.severity].emoji}</span>
                        <span className="capitalize">{anomaly.severity}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {expandedRow === index ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 mx-auto" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />
                      )}
                    </td>
                  </motion.tr>

                  {/* Expanded Row */}
                  <AnimatePresence>
                    {expandedRow === index && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={5} className="bg-gray-50 px-4 py-4">
                          <div className="space-y-2">
                            {anomaly.message && (
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Сообщение:</span> {anomaly.message}
                              </div>
                            )}
                            {anomaly.threshold !== undefined && (
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Порог:</span> {anomaly.threshold}
                              </div>
                            )}
                            {anomaly.sample_values && anomaly.sample_values.length > 0 && (
                              <div className="text-sm text-gray-700">
                                <span className="font-semibold">Примеры значений:</span>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {anomaly.sample_values.map((value, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                                      {typeof value === 'number' ? value.toLocaleString() : value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredAnomalies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Аномалий не найдено с выбранными фильтрами
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyTable;
