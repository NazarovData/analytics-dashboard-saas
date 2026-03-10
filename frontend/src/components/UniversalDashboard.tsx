import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Spinner } from './ui/spinner';
import { MetricCard } from './MetricCard';
import { ChartComponent } from './ChartComponent';
import { ExportButton } from './ExportButton';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, Target, Activity, BarChart3, PieChart,
  Calendar, Clock, MapPin, Star, Award, AlertCircle
} from 'lucide-react';

interface UniversalDashboardProps {
  data: any;
  industry?: string;
  title?: string;
}

export const UniversalDashboard: React.FC<UniversalDashboardProps> = ({ 
  data, 
  industry = 'general',
  title = 'Аналитический дашборд'
}) => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      processData(data);
    }
  }, [data]);

  const processData = (rawData: any) => {
    setLoading(true);
    try {
      // Извлекаем метрики из данных
      const processedMetrics = extractMetrics(rawData);
      const processedCharts = generateCharts(rawData);
      const processedInsights = generateInsights(rawData, processedMetrics);

      setMetrics(processedMetrics);
      setCharts(processedCharts);
      setInsights(processedInsights);
    } catch (error) {
      console.error('Ошибка обработки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractMetrics = (rawData: any) => {
    const metrics: any = {};

    // Базовые метрики (работают для всех отраслей)
    if (rawData.total_revenue !== undefined) {
      metrics.revenue = {
        value: rawData.total_revenue,
        label: 'Выручка',
        icon: DollarSign,
        color: 'green',
        format: 'currency'
      };
    }

    if (rawData.total_orders !== undefined) {
      metrics.orders = {
        value: rawData.total_orders,
        label: industry === 'logistics' ? 'Доставок' : 
               industry === 'cafe' ? 'Заказов' : 
               industry === 'beauty' ? 'Записей' : 'Заказов',
        icon: ShoppingCart,
        color: 'blue',
        format: 'number'
      };
    }

    if (rawData.avg_check !== undefined) {
      metrics.avgCheck = {
        value: rawData.avg_check,
        label: 'Средний чек',
        icon: TrendingUp,
        color: 'purple',
        format: 'currency'
      };
    }

    if (rawData.unique_customers !== undefined) {
      metrics.customers = {
        value: rawData.unique_customers,
        label: industry === 'beauty' ? 'Клиентов' :
               industry === 'crm' ? 'Контактов' : 'Клиентов',
        icon: Users,
        color: 'indigo',
        format: 'number'
      };
    }

    // Прибыль (если есть)
    if (rawData.total_profit !== undefined) {
      metrics.profit = {
        value: rawData.total_profit,
        label: 'Прибыль',
        icon: Award,
        color: 'emerald',
        format: 'currency'
      };
    }

    // Маржа (если есть)
    if (rawData.margin_percent !== undefined) {
      metrics.margin = {
        value: rawData.margin_percent,
        label: 'Маржа',
        icon: Target,
        color: 'amber',
        format: 'percent'
      };
    }

    // Специфичные метрики для отраслей
    switch (industry) {
      case 'warehouse':
        if (rawData.total_stock_value) {
          metrics.stockValue = {
            value: rawData.total_stock_value,
            label: 'Стоимость остатков',
            icon: Package,
            color: 'cyan',
            format: 'currency'
          };
        }
        break;

      case 'logistics':
        if (rawData.avg_delivery_time) {
          metrics.deliveryTime = {
            value: rawData.avg_delivery_time,
            label: 'Среднее время доставки',
            icon: Clock,
            color: 'orange',
            format: 'time'
          };
        }
        break;

      case 'marketing':
        if (rawData.romi) {
          metrics.romi = {
            value: rawData.romi,
            label: 'ROMI',
            icon: Target,
            color: 'pink',
            format: 'percent'
          };
        }
        if (rawData.cac) {
          metrics.cac = {
            value: rawData.cac,
            label: 'CAC',
            icon: DollarSign,
            color: 'red',
            format: 'currency'
          };
        }
        break;

      case 'beauty':
        if (rawData.avg_rating) {
          metrics.rating = {
            value: rawData.avg_rating,
            label: 'Средний рейтинг',
            icon: Star,
            color: 'yellow',
            format: 'rating'
          };
        }
        break;
    }

    return metrics;
  };

  const generateCharts = (rawData: any) => {
    const charts: any = {};

    // График выручки по времени
    if (rawData.revenue_by_date) {
      charts.revenueTimeline = {
        type: 'line',
        title: 'Динамика выручки',
        data: rawData.revenue_by_date
      };
    }

    // Топ товары/услуги
    if (rawData.top_products) {
      charts.topProducts = {
        type: 'bar',
        title: industry === 'beauty' ? 'Топ услуг' :
               industry === 'cafe' ? 'Топ блюд' : 'Топ товаров',
        data: rawData.top_products
      };
    }

    // Распределение по категориям
    if (rawData.revenue_by_category) {
      charts.categoryDistribution = {
        type: 'pie',
        title: 'Распределение по категориям',
        data: rawData.revenue_by_category
      };
    }

    return charts;
  };

  const generateInsights = (rawData: any, metrics: any) => {
    const insights: any[] = [];

    // Инсайт по выручке
    if (metrics.revenue) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Общая выручка',
        message: `Выручка составила ${formatCurrency(metrics.revenue.value)}`
      });
    }

    // Инсайт по прибыли
    if (metrics.profit && metrics.margin) {
      insights.push({
        type: metrics.margin.value > 30 ? 'success' : 'warning',
        icon: metrics.margin.value > 30 ? Award : AlertCircle,
        title: `Маржинальность ${metrics.margin.value.toFixed(1)}%`,
        message: metrics.margin.value > 30 
          ? 'Отличная маржинальность! Бизнес работает эффективно.'
          : 'Маржинальность ниже 30%. Рассмотрите оптимизацию затрат.'
      });
    }

    // Инсайт по среднему чеку
    if (metrics.avgCheck) {
      insights.push({
        type: 'info',
        icon: DollarSign,
        title: 'Средний чек',
        message: `Средний чек: ${formatCurrency(metrics.avgCheck.value)}`
      });
    }

    return insights;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('ru-RU');
      case 'rating':
        return `${value.toFixed(1)} ⭐`;
      case 'time':
        return `${value.toFixed(0)} мин`;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-2">Обработка данных...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Нет данных для отображения</p>
          <p className="text-sm text-gray-500 mt-2">Загрузите файл с данными</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">
            {industry === 'general' ? 'Универсальная аналитика' : 
             `Аналитика для ${industry}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={data} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(metrics).map((metric: any, index) => (
          <MetricCard
            key={index}
            title={metric.label}
            value={formatValue(metric.value, metric.format)}
            icon={metric.icon}
            trend={metric.trend}
            color={metric.color}
          />
        ))}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            AI Инсайты
          </h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  insight.type === 'success' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <insight.icon className={`h-5 w-5 mt-0.5 ${
                  insight.type === 'success' ? 'text-green-600' :
                  insight.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div>
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      {charts && Object.keys(charts).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.values(charts).map((chart: any, index) => (
            <Card key={index} className="p-6">
              <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
              <ChartComponent
                type={chart.type}
                data={chart.data}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
