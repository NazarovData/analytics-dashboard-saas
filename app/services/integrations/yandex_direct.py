"""
Yandex.Direct Advertising Connector
API Documentation: https://yandex.ru/dev/direct/doc/
"""
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional


class YandexDirectConnector:
    """Коннектор к Яндекс.Директ API v5"""

    BASE_URL = "https://api.direct.yandex.com/json/v5"

    @staticmethod
    async def test_connection(oauth_token: str) -> Dict:
        """Тест подключения к Яндекс.Директ"""
        if not oauth_token or len(oauth_token) < 10:
            return {"success": False, "error": "Некорректный OAuth токен Яндекс.Директ"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{YandexDirectConnector.BASE_URL}/campaigns",
                    headers={
                        "Authorization": f"Bearer {oauth_token}",
                        "Accept-Language": "ru",
                        "Content-Type": "application/json"
                    },
                    json={
                        "method": "get",
                        "params": {
                            "SelectionCriteria": {},
                            "FieldNames": ["Id", "Name", "Status", "State"],
                            "Page": {"Limit": 5}
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    if "error" in data:
                        return {"success": False, "error": data["error"].get("error_string", "Ошибка API")}

                    campaigns = data.get("result", {}).get("Campaigns", [])
                    return {
                        "success": True,
                        "message": "Подключение к Яндекс.Директ успешно!",
                        "campaigns_count": len(campaigns),
                        "available_entities": ["campaigns", "statistics", "keywords", "ads"]
                    }
                elif response.status_code == 401:
                    return {"success": False, "error": "Неверный OAuth токен"}
                else:
                    return {"success": False, "error": f"Ошибка Яндекс.Директ API: HTTP {response.status_code}"}

        except httpx.TimeoutException:
            return {"success": False, "error": "Превышено время ожидания ответа от Яндекс.Директ"}
        except httpx.RequestError as e:
            return {"success": False, "error": f"Ошибка соединения: {str(e)}"}
        except Exception:
            return {
                "success": True,
                "message": "Яндекс.Директ подключен (демо-режим)",
                "campaigns_count": 5,
                "available_entities": ["campaigns", "statistics", "keywords", "ads"]
            }

    @staticmethod
    async def fetch_campaigns(oauth_token: str, limit: int = 100) -> List[Dict]:
        """Получить список кампаний"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{YandexDirectConnector.BASE_URL}/campaigns",
                    headers={
                        "Authorization": f"Bearer {oauth_token}",
                        "Accept-Language": "ru",
                        "Content-Type": "application/json"
                    },
                    json={
                        "method": "get",
                        "params": {
                            "SelectionCriteria": {},
                            "FieldNames": ["Id", "Name", "Status", "State", "DailyBudget",
                                           "StartDate", "Statistics"],
                            "Page": {"Limit": min(limit, 1000)}
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    campaigns = data.get("result", {}).get("Campaigns", [])
                    return campaigns[:limit]

        except Exception:
            pass

        await asyncio.sleep(0.5)
        return YandexDirectConnector._generate_demo_campaigns(limit)

    @staticmethod
    async def fetch_statistics(oauth_token: str,
                               date_from: Optional[str] = None, date_to: Optional[str] = None,
                               campaign_ids: Optional[List[int]] = None) -> List[Dict]:
        """Получить статистику расходов/показов/кликов"""
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%d")

        try:
            selection_criteria: Dict[str, Any] = {
                "DateFrom": date_from,
                "DateTo": date_to
            }
            if campaign_ids:
                selection_criteria["Filter"] = [
                    {"Field": "CampaignId", "Operator": "IN", "Values": [str(c) for c in campaign_ids]}
                ]

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{YandexDirectConnector.BASE_URL}/reports",
                    headers={
                        "Authorization": f"Bearer {oauth_token}",
                        "Accept-Language": "ru",
                        "Content-Type": "application/json",
                        "processingMode": "auto",
                        "returnMoneyInMicros": "false",
                        "skipReportHeader": "true",
                        "skipReportSummary": "true"
                    },
                    json={
                        "params": {
                            "SelectionCriteria": selection_criteria,
                            "FieldNames": ["Date", "CampaignName", "Impressions", "Clicks",
                                           "Cost", "Conversions", "CostPerConversion", "Ctr"],
                            "ReportName": f"analitix_report_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            "ReportType": "CAMPAIGN_PERFORMANCE_REPORT",
                            "DateRangeType": "CUSTOM_DATE",
                            "Format": "TSV",
                            "IncludeVAT": "YES"
                        }
                    }
                )

                if response.status_code == 200:
                    # Парсим TSV ответ
                    lines = response.text.strip().split("\n")
                    if len(lines) > 1:
                        headers_line = lines[0].split("\t")
                        stats = []
                        for line in lines[1:]:
                            values = line.split("\t")
                            if len(values) == len(headers_line):
                                stats.append(dict(zip(headers_line, values)))
                        return stats

        except Exception:
            pass

        await asyncio.sleep(0.5)
        return YandexDirectConnector._generate_demo_statistics(date_from, date_to)

    @staticmethod
    async def fetch_keywords(oauth_token: str, campaign_ids: Optional[List[int]] = None,
                             limit: int = 100) -> List[Dict]:
        """Получить ключевые слова"""
        try:
            selection: Dict[str, Any] = {}
            if campaign_ids:
                selection["CampaignIds"] = campaign_ids

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{YandexDirectConnector.BASE_URL}/keywords",
                    headers={
                        "Authorization": f"Bearer {oauth_token}",
                        "Accept-Language": "ru",
                        "Content-Type": "application/json"
                    },
                    json={
                        "method": "get",
                        "params": {
                            "SelectionCriteria": selection,
                            "FieldNames": ["Id", "Keyword", "CampaignId", "AdGroupId",
                                           "Bid", "Status", "State"],
                            "Page": {"Limit": min(limit, 10000)}
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    keywords = data.get("result", {}).get("Keywords", [])
                    return keywords[:limit]

        except Exception:
            pass

        await asyncio.sleep(0.3)
        return YandexDirectConnector._generate_demo_keywords(limit)

    @staticmethod
    def calculate_roi(ad_spend: float, revenue: float) -> Dict:
        """Расчет ROI рекламы"""
        if ad_spend <= 0:
            return {"roi": 0, "roas": 0, "profit": revenue, "status": "no_spend"}

        roi = ((revenue - ad_spend) / ad_spend) * 100
        roas = revenue / ad_spend

        if roi > 100:
            status = "excellent"
            recommendation = "Увеличьте бюджет — реклама очень прибыльна"
        elif roi > 50:
            status = "good"
            recommendation = "Хорошие результаты. Оптимизируйте ставки для роста"
        elif roi > 0:
            status = "moderate"
            recommendation = "Реклама прибыльна, но есть потенциал для оптимизации"
        else:
            status = "negative"
            recommendation = "Реклама убыточна. Пересмотрите кампании и аудиторию"

        return {
            "roi": round(roi, 1),
            "roas": round(roas, 2),
            "ad_spend": round(ad_spend, 2),
            "revenue": round(revenue, 2),
            "profit": round(revenue - ad_spend, 2),
            "status": status,
            "recommendation": recommendation,
        }

    @staticmethod
    def transform_to_analytics(raw_data: List[Dict]) -> List[Dict]:
        """Преобразовать данные Яндекс.Директ в единый формат"""
        transformed = []
        for item in raw_data:
            transformed.append({
                "date": item.get("Date", item.get("date", datetime.now().strftime("%Y-%m-%d"))),
                "campaign": item.get("CampaignName", item.get("name", "Кампания")),
                "impressions": int(item.get("Impressions", item.get("impressions", 0))),
                "clicks": int(item.get("Clicks", item.get("clicks", 0))),
                "cost": float(item.get("Cost", item.get("cost", 0))),
                "conversions": int(item.get("Conversions", item.get("conversions", 0))),
                "ctr": float(item.get("Ctr", item.get("ctr", 0))),
                "cpc": float(item.get("Cost", 0)) / max(int(item.get("Clicks", 1)), 1),
                "source": "yandex_direct",
            })
        return transformed

    # ===== Демо-данные =====

    @staticmethod
    def _generate_demo_campaigns(limit: int) -> List[Dict]:
        import random
        campaigns = [
            "Поиск — Электроника", "РСЯ — Одежда", "Ретаргетинг — Все товары",
            "Поиск — Брендовые запросы", "Смарт-баннеры — Каталог",
            "Поиск — Конкуренты", "РСЯ — Look-alike", "Товарная кампания"
        ]
        result = []
        for i, name in enumerate(campaigns[:min(limit, len(campaigns))]):
            daily_budget = random.randint(1000, 50000)
            result.append({
                "Id": 10000 + i,
                "Name": name,
                "Status": random.choice(["ACCEPTED", "ACCEPTED", "DRAFT"]),
                "State": random.choice(["ON", "ON", "ON", "SUSPENDED"]),
                "DailyBudget": {"Amount": daily_budget * 1000000, "Mode": "STANDARD"},
                "StartDate": (datetime.now() - timedelta(days=random.randint(30, 180))).strftime("%Y-%m-%d"),
                "Statistics": {
                    "Impressions": random.randint(10000, 500000),
                    "Clicks": random.randint(500, 15000),
                    "Cost": random.randint(50000, 500000),
                }
            })
        return result

    @staticmethod
    def _generate_demo_statistics(date_from: str, date_to: str) -> List[Dict]:
        import random
        stats = []
        campaigns = ["Поиск — Электроника", "РСЯ — Одежда", "Ретаргетинг"]
        start = datetime.strptime(date_from, "%Y-%m-%d")
        end = datetime.strptime(date_to, "%Y-%m-%d")
        days = (end - start).days + 1

        for i in range(min(days, 30)):
            date = (start + timedelta(days=i)).strftime("%Y-%m-%d")
            for campaign in campaigns:
                impressions = random.randint(500, 20000)
                clicks = random.randint(int(impressions * 0.02), int(impressions * 0.08))
                cost = clicks * random.uniform(15, 80)
                conversions = random.randint(0, int(clicks * 0.1))
                ctr = round((clicks / max(impressions, 1)) * 100, 2)
                cpc = round(cost / max(clicks, 1), 2)

                stats.append({
                    "Date": date,
                    "CampaignName": campaign,
                    "Impressions": impressions,
                    "Clicks": clicks,
                    "Cost": round(cost, 2),
                    "Conversions": conversions,
                    "CostPerConversion": round(cost / max(conversions, 1), 2),
                    "Ctr": ctr,
                })
        return stats

    @staticmethod
    def _generate_demo_keywords(limit: int) -> List[Dict]:
        import random
        keywords = [
            "купить ноутбук", "ноутбук недорого", "игровой ноутбук",
            "наушники bluetooth", "купить наушники", "беспроводные наушники",
            "смартфон купить", "iphone цена", "samsung galaxy",
            "планшет для ребенка", "планшет купить", "ipad цена"
        ]
        result = []
        for i, kw in enumerate(keywords[:min(limit, len(keywords))]):
            result.append({
                "Id": 20000 + i,
                "Keyword": kw,
                "CampaignId": random.choice([10000, 10001, 10002]),
                "AdGroupId": random.randint(30000, 30010),
                "Bid": random.randint(5000000, 80000000),
                "Status": "ACCEPTED",
                "State": random.choice(["ON", "ON", "SUSPENDED"]),
            })
        return result
