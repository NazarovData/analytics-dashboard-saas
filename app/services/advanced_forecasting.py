"""
Advanced Forecasting Service
ARIMA, Exponential Smoothing, Seasonality Detection, Confidence Intervals
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta

try:
    from scipy import stats as scipy_stats
    from scipy.signal import periodogram
    HAS_SCIPY = True
except ImportError:
    scipy_stats = None
    periodogram = None
    HAS_SCIPY = False


class AdvancedForecaster:
    """Улучшенное прогнозирование с ARIMA, сезонностью и доверительными интервалами"""

    MIN_DATA_POINTS = 14  # Минимум точек для прогноза
    MAX_HORIZON_RATIO = 0.5  # Горизонт не больше 50% от истории

    @staticmethod
    def forecast(data: List[Dict[str, Any]], horizon: int = 30,
                 method: str = "auto", confidence: float = 0.95) -> Dict[str, Any]:
        """
        Главная функция прогнозирования.
        
        Args:
            data: Список словарей с полями date, value (или amount/revenue/total)
            horizon: Количество дней для прогноза
            method: 'auto', 'arima', 'exponential', 'linear'
            confidence: Уровень доверительного интервала (0.90, 0.95, 0.99)
        """
        try:
            # Валидация и подготовка данных
            validation = AdvancedForecaster._validate_and_prepare(data)
            if not validation["success"]:
                return validation

            series = validation["series"]
            dates = validation["dates"]

            if len(series) < AdvancedForecaster.MIN_DATA_POINTS:
                return {
                    "success": False,
                    "error": f"Недостаточно данных. Минимум {AdvancedForecaster.MIN_DATA_POINTS} точек, получено {len(series)}"
                }

            # Ограничиваем горизонт
            max_horizon = max(int(len(series) * AdvancedForecaster.MAX_HORIZON_RATIO), 7)
            horizon = min(horizon, max_horizon)

            # Обнаружение сезонности
            seasonality = AdvancedForecaster._detect_seasonality(series)

            # Выбор метода
            if method == "auto":
                method = AdvancedForecaster._select_best_method(series, seasonality)

            # Прогнозирование
            if method == "arima":
                forecast_values, residuals = AdvancedForecaster._arima_forecast(series, horizon)
            elif method == "exponential":
                forecast_values, residuals = AdvancedForecaster._exponential_smoothing(series, horizon)
            else:
                forecast_values, residuals = AdvancedForecaster._linear_regression(series, horizon)

            # Доверительные интервалы
            ci = AdvancedForecaster._calculate_confidence_intervals(
                forecast_values, residuals, confidence, horizon
            )

            # Проверка реалистичности (не > 3x max)
            max_val = float(np.max(series))
            forecast_values = np.clip(forecast_values, 0, max_val * 3)

            # Метрики точности (на обучающих данных)
            accuracy = AdvancedForecaster._calculate_accuracy(series, method)

            # Тренд
            trend = AdvancedForecaster._determine_trend(series, forecast_values)

            # Генерация дат
            last_date = dates[-1]
            forecast_dates = [last_date + timedelta(days=i + 1) for i in range(horizon)]

            # Формирование ответа
            forecast_list = []
            for i in range(horizon):
                forecast_list.append({
                    "date": forecast_dates[i].strftime("%Y-%m-%d"),
                    "value": round(float(forecast_values[i]), 2),
                    "lower": round(float(ci["lower"][i]), 2),
                    "upper": round(float(ci["upper"][i]), 2),
                })

            # Рекомендации
            recommendations = AdvancedForecaster._generate_recommendations(
                series, forecast_values, trend, seasonality, accuracy
            )

            return {
                "success": True,
                "method": method,
                "horizon": horizon,
                "forecast": forecast_list,
                "seasonality": seasonality,
                "accuracy": accuracy,
                "trend": trend,
                "confidence": confidence,
                "historical_summary": {
                    "min": round(float(np.min(series)), 2),
                    "max": round(float(np.max(series)), 2),
                    "mean": round(float(np.mean(series)), 2),
                    "std": round(float(np.std(series)), 2),
                    "data_points": len(series),
                },
                "recommendations": recommendations,
            }

        except Exception as e:
            return {"success": False, "error": f"Ошибка прогнозирования: {str(e)}"}

    @staticmethod
    def _validate_and_prepare(data: List[Dict]) -> Dict:
        """Валидация и подготовка данных"""
        if not data or len(data) < 3:
            return {"success": False, "error": "Недостаточно данных (минимум 3 записи)"}

        # Извлекаем значения и даты
        values = []
        dates = []
        value_keys = ["value", "amount", "revenue", "total", "sum", "price", "sales"]
        date_keys = ["date", "Date", "datetime", "timestamp", "day"]

        # Определяем ключи
        sample = data[0]
        value_key = None
        date_key = None
        for k in value_keys:
            if k in sample:
                value_key = k
                break
        for k in date_keys:
            if k in sample:
                date_key = k
                break

        if not value_key:
            # Пробуем первый числовой столбец
            for k, v in sample.items():
                try:
                    float(v)
                    value_key = k
                    break
                except (ValueError, TypeError):
                    continue

        if not value_key:
            return {"success": False, "error": "Не найден столбец со значениями"}

        for row in data:
            try:
                val = float(row.get(value_key, 0))
                if val < 0:
                    val = 0
                values.append(val)

                if date_key and row.get(date_key):
                    try:
                        d = pd.to_datetime(row[date_key])
                        dates.append(d.to_pydatetime())
                    except Exception:
                        dates.append(None)
                else:
                    dates.append(None)
            except (ValueError, TypeError):
                continue

        if len(values) < 3:
            return {"success": False, "error": "Недостаточно числовых значений"}

        # Если даты не распарсились — генерируем
        if not any(dates) or len([d for d in dates if d]) < len(values) // 2:
            dates = [datetime.now() - timedelta(days=len(values) - i - 1) for i in range(len(values))]

        # Убираем None из дат
        valid_pairs = [(d, v) for d, v in zip(dates, values) if d is not None]
        if len(valid_pairs) < 3:
            dates = [datetime.now() - timedelta(days=len(values) - i - 1) for i in range(len(values))]
        else:
            valid_pairs.sort(key=lambda x: x[0])
            dates = [p[0] for p in valid_pairs]
            values = [p[1] for p in valid_pairs]

        series = np.array(values, dtype=float)

        # Заполнение пропусков (NaN -> интерполяция)
        if np.any(np.isnan(series)):
            nans = np.isnan(series)
            x = np.arange(len(series))
            series[nans] = np.interp(x[nans], x[~nans], series[~nans])

        return {"success": True, "series": series, "dates": dates}

    @staticmethod
    def _detect_seasonality(series: np.ndarray) -> Dict:
        """Обнаружение сезонности через автокорреляцию и периодограмму"""
        if len(series) < 14:
            return {"detected": False, "period": 0, "strength": 0.0}

        try:
            # Нормализация
            s = series - np.mean(series)
            if np.std(s) == 0:
                return {"detected": False, "period": 0, "strength": 0.0}
            s = s / np.std(s)

            # Автокорреляция
            n = len(s)
            acf = np.correlate(s, s, mode='full')[n - 1:]
            acf = acf / acf[0]

            # Ищем пик автокорреляции (период > 2 и < n/2)
            min_period = 3
            max_period = min(n // 2, 365)

            if max_period <= min_period:
                return {"detected": False, "period": 0, "strength": 0.0}

            acf_slice = acf[min_period:max_period]
            if len(acf_slice) == 0:
                return {"detected": False, "period": 0, "strength": 0.0}

            peak_idx = np.argmax(acf_slice) + min_period
            peak_val = acf[peak_idx]

            # Проверяем силу сезонности
            detected = peak_val > 0.3
            strength = round(float(max(0, min(1, peak_val))), 2)

            # Определяем тип
            period = int(peak_idx)
            if 6 <= period <= 8:
                period_type = "weekly"
            elif 28 <= period <= 32:
                period_type = "monthly"
            elif 85 <= period <= 95:
                period_type = "quarterly"
            elif 350 <= period <= 380:
                period_type = "yearly"
            else:
                period_type = "custom"

            return {
                "detected": detected,
                "period": period,
                "strength": strength,
                "type": period_type if detected else "none",
            }
        except Exception:
            return {"detected": False, "period": 0, "strength": 0.0}

    @staticmethod
    def _select_best_method(series: np.ndarray, seasonality: Dict) -> str:
        """Автоматический выбор лучшего метода"""
        n = len(series)

        if n < 20:
            return "linear"

        # Если сильная сезонность — exponential smoothing
        if seasonality.get("detected") and seasonality.get("strength", 0) > 0.5:
            return "exponential"

        # Проверяем стационарность (грубый тест)
        half = n // 2
        mean1, mean2 = np.mean(series[:half]), np.mean(series[half:])
        std1, std2 = np.std(series[:half]), np.std(series[half:])

        # Если средние и дисперсии сильно различаются — нестационарный ряд
        if abs(mean2 - mean1) / max(mean1, 1) > 0.3 or abs(std2 - std1) / max(std1, 1) > 0.5:
            return "arima"

        return "exponential"

    @staticmethod
    def _linear_regression(series: np.ndarray, horizon: int) -> Tuple[np.ndarray, np.ndarray]:
        """Линейная регрессия"""
        n = len(series)
        x = np.arange(n)
        if HAS_SCIPY:
            slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(x, series)
        else:
            x_mean, y_mean = np.mean(x), np.mean(series)
            slope = np.sum((x - x_mean) * (series - y_mean)) / max(np.sum((x - x_mean) ** 2), 1e-10)
            intercept = y_mean - slope * x_mean

        # Прогноз
        future_x = np.arange(n, n + horizon)
        forecast = slope * future_x + intercept

        # Остатки
        fitted = slope * x + intercept
        residuals = series - fitted

        return forecast, residuals

    @staticmethod
    def _exponential_smoothing(series: np.ndarray, horizon: int,
                                alpha: float = 0.3, beta: float = 0.1) -> Tuple[np.ndarray, np.ndarray]:
        """Двойное экспоненциальное сглаживание (Holt)"""
        n = len(series)

        # Инициализация
        level = series[0]
        trend = (series[1] - series[0]) if n > 1 else 0
        fitted = np.zeros(n)
        fitted[0] = level

        # Обучение
        for t in range(1, n):
            prev_level = level
            level = alpha * series[t] + (1 - alpha) * (level + trend)
            trend = beta * (level - prev_level) + (1 - beta) * trend
            fitted[t] = level + trend

        # Прогноз
        forecast = np.array([level + (i + 1) * trend for i in range(horizon)])
        residuals = series - fitted

        return forecast, residuals

    @staticmethod
    def _arima_forecast(series: np.ndarray, horizon: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Упрощенный ARIMA(1,1,1) — реализован вручную без statsmodels.
        Differencing + AR(1) + MA(1)
        """
        n = len(series)

        # Differencing (d=1)
        diff = np.diff(series)
        if len(diff) < 3:
            return AdvancedForecaster._linear_regression(series, horizon)

        # AR(1) — подбор коэффициента через автокорреляцию
        if len(diff) > 2:
            mean_diff = np.mean(diff)
            centered = diff - mean_diff

            # AR coefficient
            if np.sum(centered[:-1] ** 2) > 0:
                phi = np.sum(centered[1:] * centered[:-1]) / np.sum(centered[:-1] ** 2)
                phi = np.clip(phi, -0.99, 0.99)
            else:
                phi = 0.0

            # Fitted AR
            fitted_diff = np.zeros(len(diff))
            fitted_diff[0] = mean_diff
            for t in range(1, len(diff)):
                fitted_diff[t] = mean_diff + phi * (diff[t - 1] - mean_diff)

            ar_residuals = diff - fitted_diff

            # MA(1) — подбор коэффициента
            if len(ar_residuals) > 2 and np.sum(ar_residuals[:-1] ** 2) > 0:
                theta = np.sum(ar_residuals[1:] * ar_residuals[:-1]) / np.sum(ar_residuals[:-1] ** 2)
                theta = np.clip(theta, -0.99, 0.99)
            else:
                theta = 0.0
        else:
            phi = 0.0
            theta = 0.0
            mean_diff = np.mean(diff)
            ar_residuals = diff - mean_diff

        # Прогноз в разностях
        last_diff = diff[-1]
        last_residual = ar_residuals[-1] if len(ar_residuals) > 0 else 0
        forecast_diff = np.zeros(horizon)

        for i in range(horizon):
            if i == 0:
                forecast_diff[i] = mean_diff + phi * (last_diff - mean_diff) + theta * last_residual
            else:
                forecast_diff[i] = mean_diff + phi * (forecast_diff[i - 1] - mean_diff)

        # Обратная трансформация
        forecast = np.zeros(horizon)
        forecast[0] = series[-1] + forecast_diff[0]
        for i in range(1, horizon):
            forecast[i] = forecast[i - 1] + forecast_diff[i]

        # Остатки для доверительных интервалов
        # Восстанавливаем fitted на исходном ряде
        fitted_original = np.zeros(n)
        fitted_original[0] = series[0]
        for t in range(1, n):
            idx = t - 1
            if idx < len(fitted_diff):
                fitted_original[t] = series[t - 1] + fitted_diff[idx]
            else:
                fitted_original[t] = series[t - 1] + mean_diff

        residuals = series - fitted_original

        return forecast, residuals

    @staticmethod
    def _calculate_confidence_intervals(forecast: np.ndarray, residuals: np.ndarray,
                                         confidence: float, horizon: int) -> Dict[str, np.ndarray]:
        """Рассчитать доверительные интервалы"""
        # Стандартное отклонение остатков
        std_resid = np.std(residuals) if len(residuals) > 0 else np.std(forecast) * 0.1

        if HAS_SCIPY:
            z = scipy_stats.norm.ppf((1 + confidence) / 2)
        else:
            z_table = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
            z = z_table.get(confidence, 1.96)

        # Интервалы расширяются со временем (sqrt(h))
        lower = np.zeros(horizon)
        upper = np.zeros(horizon)
        for i in range(horizon):
            width = z * std_resid * np.sqrt(i + 1)
            lower[i] = max(0, forecast[i] - width)
            upper[i] = forecast[i] + width

        return {"lower": lower, "upper": upper}

    @staticmethod
    def _calculate_accuracy(series: np.ndarray, method: str) -> Dict:
        """Расчет метрик точности на обучающих данных (cross-validation подход)"""
        n = len(series)
        if n < 10:
            return {"mape": 0, "mae": 0, "rmse": 0, "r2": 0}

        # Берем 80% для обучения, 20% для теста
        split = int(n * 0.8)
        train = series[:split]
        test = series[split:]

        if len(test) < 2:
            return {"mape": 0, "mae": 0, "rmse": 0, "r2": 0}

        horizon = len(test)

        try:
            if method == "arima":
                pred, _ = AdvancedForecaster._arima_forecast(train, horizon)
            elif method == "exponential":
                pred, _ = AdvancedForecaster._exponential_smoothing(train, horizon)
            else:
                pred, _ = AdvancedForecaster._linear_regression(train, horizon)

            # MAPE
            mask = test != 0
            if np.any(mask):
                mape = np.mean(np.abs((test[mask] - pred[:len(test)][mask]) / test[mask])) * 100
            else:
                mape = 0

            # MAE
            mae = np.mean(np.abs(test - pred[:len(test)]))

            # RMSE
            rmse = np.sqrt(np.mean((test - pred[:len(test)]) ** 2))

            # R2
            ss_res = np.sum((test - pred[:len(test)]) ** 2)
            ss_tot = np.sum((test - np.mean(test)) ** 2)
            r2 = 1 - (ss_res / max(ss_tot, 1e-10))

            return {
                "mape": round(float(min(mape, 100)), 1),
                "mae": round(float(mae), 2),
                "rmse": round(float(rmse), 2),
                "r2": round(float(max(0, min(1, r2))), 3),
            }
        except Exception:
            return {"mape": 0, "mae": 0, "rmse": 0, "r2": 0}

    @staticmethod
    def _determine_trend(series: np.ndarray, forecast: np.ndarray) -> Dict:
        """Определить тренд"""
        # Текущий тренд
        if len(series) >= 7:
            recent = series[-7:]
            older = series[-14:-7] if len(series) >= 14 else series[:7]
            change = (np.mean(recent) - np.mean(older)) / max(np.mean(older), 1) * 100
        else:
            change = 0

        # Прогнозный тренд
        if len(forecast) >= 2:
            forecast_change = (forecast[-1] - forecast[0]) / max(forecast[0], 1) * 100
        else:
            forecast_change = 0

        if change > 5:
            direction = "growing"
            label = "Рост"
        elif change < -5:
            direction = "declining"
            label = "Снижение"
        else:
            direction = "stable"
            label = "Стабильно"

        return {
            "direction": direction,
            "label": label,
            "current_change_pct": round(float(change), 1),
            "forecast_change_pct": round(float(forecast_change), 1),
        }

    @staticmethod
    def _generate_recommendations(series: np.ndarray, forecast: np.ndarray,
                                   trend: Dict, seasonality: Dict,
                                   accuracy: Dict) -> List[str]:
        """Генерация рекомендаций"""
        recs = []

        # Тренд
        if trend["direction"] == "growing":
            recs.append(f"Прогнозируется рост на {abs(trend['forecast_change_pct'])}%. Подготовьте ресурсы для увеличения спроса")
        elif trend["direction"] == "declining":
            recs.append(f"Ожидается снижение на {abs(trend['forecast_change_pct'])}%. Рассмотрите стимулирующие акции")
        else:
            recs.append("Показатели стабильны. Фокусируйтесь на оптимизации")

        # Сезонность
        if seasonality.get("detected"):
            period = seasonality.get("period", 0)
            if period in range(6, 9):
                recs.append("Обнаружена недельная сезонность. Учитывайте пики в будние/выходные дни")
            elif period in range(28, 33):
                recs.append("Обнаружена месячная сезонность. Планируйте акции под циклы")
            else:
                recs.append(f"Обнаружен сезонный цикл с периодом {period} дней")

        # Точность
        mape = accuracy.get("mape", 0)
        if mape > 0:
            if mape < 10:
                recs.append(f"Точность прогноза высокая (MAPE {mape}%). Можно доверять")
            elif mape < 25:
                recs.append(f"Точность прогноза средняя (MAPE {mape}%). Используйте как ориентир")
            else:
                recs.append(f"Точность прогноза невысокая (MAPE {mape}%). Рекомендуем больше данных")

        # Волатильность
        cv = np.std(series) / max(np.mean(series), 1)
        if cv > 0.5:
            recs.append("Высокая волатильность данных. Доверительные интервалы широкие")

        return recs

    @staticmethod
    def compare_methods(data: List[Dict[str, Any]], horizon: int = 14) -> Dict[str, Any]:
        """Сравнение всех методов прогнозирования"""
        methods = ["linear", "exponential", "arima"]
        results = {}

        for method in methods:
            result = AdvancedForecaster.forecast(data, horizon=horizon, method=method)
            if result.get("success"):
                results[method] = {
                    "accuracy": result.get("accuracy", {}),
                    "trend": result.get("trend", {}),
                    "forecast_summary": {
                        "min": min(f["value"] for f in result["forecast"]),
                        "max": max(f["value"] for f in result["forecast"]),
                        "mean": sum(f["value"] for f in result["forecast"]) / len(result["forecast"]),
                    }
                }

        # Определяем лучший метод по MAPE
        best_method = "linear"
        best_mape = float("inf")
        for method, res in results.items():
            mape = res["accuracy"].get("mape", float("inf"))
            if 0 < mape < best_mape:
                best_mape = mape
                best_method = method

        return {
            "success": True,
            "methods": results,
            "best_method": best_method,
            "best_mape": best_mape if best_mape < float("inf") else 0,
            "recommendation": f"Рекомендуемый метод: {best_method} (MAPE: {best_mape:.1f}%)" if best_mape < float("inf") else "Недостаточно данных для сравнения"
        }

    @staticmethod
    def analyze_seasonality(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Детальный анализ сезонности"""
        validation = AdvancedForecaster._validate_and_prepare(data)
        if not validation["success"]:
            return validation

        series = validation["series"]
        seasonality = AdvancedForecaster._detect_seasonality(series)

        # Средние по дням недели (если есть даты)
        dates = validation["dates"]
        weekday_avg = {}
        if dates:
            weekday_names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
            weekday_sums: Dict[int, List[float]] = {i: [] for i in range(7)}
            for d, v in zip(dates, series):
                if d is not None:
                    weekday_sums[d.weekday()].append(v)
            for wd, values in weekday_sums.items():
                if values:
                    weekday_avg[weekday_names[wd]] = round(float(np.mean(values)), 2)

        return {
            "success": True,
            "seasonality": seasonality,
            "weekday_averages": weekday_avg,
            "data_points": len(series),
        }
