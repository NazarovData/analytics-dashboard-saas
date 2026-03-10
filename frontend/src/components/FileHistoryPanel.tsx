import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { api } from '../lib/api';

interface FileUpload {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  status: string;
  records_count: number;
  uploaded_at: string;
  processed_at: string;
  has_analytics: boolean;
  metrics?: {
    total_revenue?: number;
    total_orders?: number;
    avg_check?: number;
  };
}

interface FileHistoryPanelProps {
  onSelectFile?: (uploadId: number) => void;
}

export const FileHistoryPanel: React.FC<FileHistoryPanelProps> = ({ onSelectFile }) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get('/files/history?limit=10');
      if (response.data.success) {
        setUploads(response.data.uploads);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/files/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Spinner />
          <span className="ml-2">Загрузка истории...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Статистика */}
      {stats && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-semibold mb-4">📊 Статистика загрузок</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.total_uploads}</div>
              <div className="text-sm text-gray-600">Всего загрузок</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Успешно</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.total_records_processed.toLocaleString('ru-RU')}
              </div>
              <div className="text-sm text-gray-600">Записей обработано</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.success_rate}%</div>
              <div className="text-sm text-gray-600">Успешность</div>
            </div>
          </div>
        </Card>
      )}

      {/* История загрузок */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📁 История загрузок</h3>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            🔄 Обновить
          </Button>
        </div>

        {uploads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>История загрузок пуста</p>
            <p className="text-sm mt-2">Загрузите первый файл для анализа</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectFile && onSelectFile(upload.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {upload.file_type === 'csv' ? '📄' : '📊'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {upload.original_filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatDate(upload.uploaded_at)} • {formatFileSize(upload.file_size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          upload.status === 'completed' ? 'bg-green-500' :
                          upload.status === 'failed' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        {upload.status === 'completed' ? 'Обработано' :
                         upload.status === 'failed' ? 'Ошибка' :
                         'Обработка...'}
                      </span>
                      <span className="text-gray-600">
                        📊 {upload.records_count?.toLocaleString('ru-RU')} записей
                      </span>
                    </div>

                    {upload.metrics && upload.status === 'completed' && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        {upload.metrics.total_revenue && (
                          <div>
                            <div className="text-gray-600">Выручка</div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(upload.metrics.total_revenue)}
                            </div>
                          </div>
                        )}
                        {upload.metrics.total_orders && (
                          <div>
                            <div className="text-gray-600">Заказов</div>
                            <div className="font-semibold">
                              {upload.metrics.total_orders}
                            </div>
                          </div>
                        )}
                        {upload.metrics.avg_check && (
                          <div>
                            <div className="text-gray-600">Средний чек</div>
                            <div className="font-semibold">
                              {formatCurrency(upload.metrics.avg_check)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {upload.has_analytics && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFile && onSelectFile(upload.id);
                      }}
                    >
                      Открыть анализ →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
