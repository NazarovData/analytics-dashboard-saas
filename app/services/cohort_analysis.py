"""
Cohort Analysis Service
Retention Rate, LTV по когортам, Heatmap данные
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta


class CohortAnalyzer:
    """Когортный анализ: retention, LTV, churn по когортам"""

    @staticmethod
    def analyze(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Главная функция когортного анализа.
        
        Args:
            data: Список словарей с полями date, client_id (или customer), amount/revenue/price
        """
        try:
            # Подготовка DataFrame
            df = CohortAnalyzer._prepare_data(data)
            if df is None or len(df) < 10:
                return {"success": False, "error": "Недостаточно данных для когортного анализа (минимум 10 транзакций)"}

            # Строим когорты
            cohort_df = CohortAnalyzer._build_cohorts(df)
            if cohort_df is None or len(cohort_df) == 0:
                return {"success": False, "error": "Не удалось построить когорты. Проверьте наличие дат и клиентов"}

            # Считаем retention matrix
            retention_matrix = CohortAnalyzer._calculate_retention(cohort_df)

            # LTV по когортам
            ltv_by_cohort = CohortAnalyzer._calculate_ltv_by_cohort(cohort_df, df)

            # Heatmap данные
            heatmap = CohortAnalyzer._generate_heatmap_data(retention_matrix)

            # Когорты с высоким оттоком
            high_churn = CohortAnalyzer._identify_high_churn_cohorts(retention_matrix)

            # Сводка
            summary = CohortAnalyzer._generate_summary(retention_matrix, ltv_by_cohort)

            # Рекомендации
            recommendations = CohortAnalyzer._generate_recommendations(
                retention_matrix, ltv_by_cohort, high_churn
            )

            return {
                "success": True,
                "cohorts": CohortAnalyzer._format_cohorts(retention_matrix, ltv_by_cohort),
                "heatmap": heatmap,
                "high_churn_cohorts": high_churn,
                "summary": summary,
                "recommendations": recommendations,
                "total_customers": int(cohort_df["client_id"].nunique()),
                "total_cohorts": len(retention_matrix),
            }

        except Exception as e:
            return {"success": False, "error": f"Ошибка когортного анализа: {str(e)}"}

    @staticmethod
    def _prepare_data(data: List[Dict]) -> Optional[pd.DataFrame]:
        """Подготовка данных для когортного анализа"""
        if not data:
            return None

        df = pd.DataFrame(data)

        # Определяем столбец даты
        date_cols = ["date", "Date", "datetime", "timestamp", "order_date", "created_at"]
        date_col = None
        for col in date_cols:
            if col in df.columns:
                date_col = col
                break
        if date_col is None:
            for col in df.columns:
                try:
                    test = pd.to_datetime(df[col].head(5), errors="coerce")
                    if test.notna().sum() >= 3:
                        date_col = col
                        break
                except Exception:
                    continue

        if date_col is None:
            return None

        # Определяем столбец клиента
        client_cols = ["client_id", "customer", "customer_id", "client", "user_id", "buyer",
                       "клиент", "покупатель", "customer_name"]
        client_col = None
        for col in client_cols:
            if col in df.columns:
                client_col = col
                break
        if client_col is None:
            # Берем столбец со строковыми значениями
            for col in df.columns:
                if col != date_col and df[col].dtype == object:
                    if df[col].nunique() > 1 and df[col].nunique() < len(df):
                        client_col = col
                        break

        if client_col is None:
            return None

        # Определяем столбец суммы
        amount_cols = ["amount", "revenue", "total", "sum", "price", "sales", "value",
                       "сумма", "выручка", "цена"]
        amount_col = None
        for col in amount_cols:
            if col in df.columns:
                amount_col = col
                break
        if amount_col is None:
            for col in df.columns:
                if col not in [date_col, client_col]:
                    try:
                        pd.to_numeric(df[col], errors="coerce")
                        if pd.to_numeric(df[col], errors="coerce").notna().sum() > len(df) * 0.5:
                            amount_col = col
                            break
                    except Exception:
                        continue

        # Парсим даты
        df["date"] = pd.to_datetime(df[date_col], errors="coerce")
        df = df.dropna(subset=["date"])

        # Нормализуем
        df["client_id"] = df[client_col].astype(str)
        if amount_col:
            df["amount"] = pd.to_numeric(df[amount_col], errors="coerce").fillna(0)
        else:
            df["amount"] = 1  # Если нет суммы — считаем просто транзакции

        # Месяц для когорт
        df["order_month"] = df["date"].dt.to_period("M")

        return df[["date", "client_id", "amount", "order_month"]]

    @staticmethod
    def _build_cohorts(df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Группировка клиентов по когортам (месяц первой покупки)"""
        if df is None or len(df) == 0:
            return None

        # Определяем когорту каждого клиента (месяц первой покупки)
        first_purchase = df.groupby("client_id")["order_month"].min().reset_index()
        first_purchase.columns = ["client_id", "cohort"]

        df = df.merge(first_purchase, on="client_id")

        # Период от когорты (в месяцах)
        df["cohort_index"] = (df["order_month"] - df["cohort"]).apply(lambda x: x.n if hasattr(x, 'n') else 0)

        return df

    @staticmethod
    def _calculate_retention(cohort_df: pd.DataFrame) -> Dict[str, Dict[int, float]]:
        """Расчет retention rate для каждой когорты по месяцам"""
        # Количество уникальных клиентов по когортам и периодам
        cohort_data = cohort_df.groupby(["cohort", "cohort_index"])["client_id"].nunique().reset_index()
        cohort_data.columns = ["cohort", "cohort_index", "customers"]

        # Pivot table
        pivot = cohort_data.pivot(index="cohort", columns="cohort_index", values="customers").fillna(0)

        # Retention rate (% от начального размера когорты)
        retention = {}
        for cohort in pivot.index:
            cohort_str = str(cohort)
            initial = pivot.loc[cohort, 0] if 0 in pivot.columns else 0
            if initial > 0:
                retention[cohort_str] = {
                    "size": int(initial)
                }
                for period in pivot.columns:
                    retention[cohort_str][int(period)] = round(
                        float(pivot.loc[cohort, period] / initial * 100), 1
                    )

        return retention

    @staticmethod
    def _calculate_ltv_by_cohort(cohort_df: pd.DataFrame, original_df: pd.DataFrame) -> Dict[str, float]:
        """Расчет LTV по когортам"""
        ltv = cohort_df.groupby("cohort")["amount"].sum()
        customers = cohort_df.groupby("cohort")["client_id"].nunique()

        result = {}
        for cohort in ltv.index:
            cohort_str = str(cohort)
            num_customers = customers.get(cohort, 1)
            if num_customers > 0:
                result[cohort_str] = round(float(ltv[cohort] / num_customers), 2)
            else:
                result[cohort_str] = 0.0

        return result

    @staticmethod
    def _generate_heatmap_data(retention_matrix: Dict) -> Dict[str, Any]:
        """Генерация данных для heatmap визуализации"""
        rows = sorted(retention_matrix.keys())
        if not rows:
            return {"data": [], "row_labels": [], "col_labels": []}

        # Определяем максимальный период
        max_period = 0
        for cohort_data in retention_matrix.values():
            for key in cohort_data:
                if isinstance(key, int) and key > max_period:
                    max_period = key

        col_labels = [f"Месяц {i}" for i in range(max_period + 1)]

        data = []
        for row in rows:
            row_data = []
            for period in range(max_period + 1):
                value = retention_matrix[row].get(period, 0)
                row_data.append(round(float(value), 1))
            data.append(row_data)

        return {
            "data": data,
            "row_labels": rows,
            "col_labels": col_labels,
            "max_period": max_period,
        }

    @staticmethod
    def _identify_high_churn_cohorts(retention_matrix: Dict) -> List[Dict]:
        """Выявление когорт с высоким оттоком"""
        high_churn = []

        for cohort, data in retention_matrix.items():
            size = data.get("size", 0)
            m1_retention = data.get(1, 0)

            if m1_retention > 0 and m1_retention < 40:
                churn_rate = 100 - m1_retention
                high_churn.append({
                    "cohort": cohort,
                    "size": size,
                    "m1_retention": m1_retention,
                    "churn_rate": round(churn_rate, 1),
                    "severity": "critical" if m1_retention < 20 else "warning"
                })

        high_churn.sort(key=lambda x: x["churn_rate"], reverse=True)
        return high_churn

    @staticmethod
    def _generate_summary(retention_matrix: Dict, ltv_by_cohort: Dict) -> Dict:
        """Генерация сводки"""
        if not retention_matrix:
            return {}

        # Средний retention по месяцам
        m1_retentions = []
        m3_retentions = []
        sizes = []

        for cohort, data in retention_matrix.items():
            sizes.append(data.get("size", 0))
            if 1 in data:
                m1_retentions.append(data[1])
            if 3 in data:
                m3_retentions.append(data[3])

        # Лучшая и худшая когорта (по M1 retention)
        best_cohort = ""
        worst_cohort = ""
        best_ret = 0
        worst_ret = 100

        for cohort, data in retention_matrix.items():
            m1 = data.get(1, -1)
            if m1 >= 0:
                if m1 > best_ret:
                    best_ret = m1
                    best_cohort = cohort
                if m1 < worst_ret:
                    worst_ret = m1
                    worst_cohort = cohort

        # Средний LTV
        avg_ltv = round(np.mean(list(ltv_by_cohort.values())), 2) if ltv_by_cohort else 0

        return {
            "avg_retention_m1": round(float(np.mean(m1_retentions)), 1) if m1_retentions else 0,
            "avg_retention_m3": round(float(np.mean(m3_retentions)), 1) if m3_retentions else 0,
            "best_cohort": best_cohort,
            "best_cohort_retention": best_ret,
            "worst_cohort": worst_cohort,
            "worst_cohort_retention": worst_ret,
            "avg_cohort_size": round(float(np.mean(sizes)), 0) if sizes else 0,
            "avg_ltv": avg_ltv,
            "total_cohorts": len(retention_matrix),
        }

    @staticmethod
    def _format_cohorts(retention_matrix: Dict, ltv_by_cohort: Dict) -> List[Dict]:
        """Форматирование когорт для ответа API"""
        cohorts = []
        for cohort_name in sorted(retention_matrix.keys()):
            data = retention_matrix[cohort_name]
            retention_series = []
            for key in sorted(k for k in data.keys() if isinstance(k, int)):
                retention_series.append(data[key])

            cohorts.append({
                "cohort": cohort_name,
                "size": data.get("size", 0),
                "retention": retention_series,
                "ltv": ltv_by_cohort.get(cohort_name, 0),
            })
        return cohorts

    @staticmethod
    def _generate_recommendations(retention_matrix: Dict, ltv_by_cohort: Dict,
                                   high_churn: List[Dict]) -> List[str]:
        """Генерация рекомендаций"""
        recs = []

        if not retention_matrix:
            return ["Загрузите данные с клиентами и датами покупок для когортного анализа"]

        # Средний retention M1
        m1_vals = [d.get(1, 0) for d in retention_matrix.values() if 1 in d]
        if m1_vals:
            avg_m1 = np.mean(m1_vals)
            if avg_m1 < 30:
                recs.append(f"Средний retention 1-го месяца {avg_m1:.0f}% — критически низкий. Внедрите программу онбординга")
            elif avg_m1 < 50:
                recs.append(f"Retention 1-го месяца {avg_m1:.0f}% — ниже среднего. Улучшите первый опыт клиента")
            else:
                recs.append(f"Retention 1-го месяца {avg_m1:.0f}% — хороший показатель. Поддерживайте качество сервиса")

        # Высокий отток
        if high_churn:
            worst = high_churn[0]
            recs.append(
                f"Когорта {worst['cohort']} потеряла {worst['churn_rate']:.0f}% клиентов в 1-й месяц. "
                f"Проанализируйте причины"
            )

        # LTV разброс
        if ltv_by_cohort:
            ltvs = list(ltv_by_cohort.values())
            if len(ltvs) >= 2:
                max_ltv = max(ltvs)
                min_ltv = min(ltvs)
                if max_ltv > min_ltv * 2:
                    best_c = max(ltv_by_cohort, key=ltv_by_cohort.get)  # type: ignore
                    recs.append(
                        f"Когорта {best_c} имеет LTV в {max_ltv / max(min_ltv, 1):.1f}x выше остальных. "
                        f"Изучите, что привлекло этих клиентов"
                    )

        # Тренд retention
        cohort_keys = sorted(retention_matrix.keys())
        if len(cohort_keys) >= 3:
            first_m1 = retention_matrix[cohort_keys[0]].get(1, 0)
            last_m1 = retention_matrix[cohort_keys[-1]].get(1, 0)
            if last_m1 > first_m1 * 1.1:
                recs.append("Retention новых когорт растет — ваши улучшения работают")
            elif last_m1 < first_m1 * 0.9:
                recs.append("Retention новых когорт снижается — обратите внимание на качество привлечения")

        return recs
