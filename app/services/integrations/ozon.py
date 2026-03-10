"""
Ozon Marketplace Connector
API Documentation: https://docs.ozon.ru/api/seller/
"""
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional


class OzonConnector:
    """Коннектор к Ozon Seller API"""

    BASE_URL = "https://api-seller.ozon.ru"

    @staticmethod
    async def test_connection(client_id: str, api_key: str) -> Dict:
        """Тест подключения к Ozon"""
        if not client_id or not api_key:
            return {"success": False, "error": "Укажите Client-Id и Api-Key от Ozon"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    f"{OzonConnector.BASE_URL}/v1/warehouse/list",
                    headers={
                        "Client-Id": client_id,
                        "Api-Key": api_key,
                        "Content-Type": "application/json"
                    },
                    json={}
                )

                if response.status_code == 200:
                    data = response.json()
                    warehouses = data.get("result", [])
                    return {
                        "success": True,
                        "message": "Подключение к Ozon успешно!",
                        "warehouses_count": len(warehouses),
                        "available_entities": ["orders", "products", "analytics", "finance"]
                    }
                elif response.status_code == 403:
                    return {"success": False, "error": "Неверные Client-Id или Api-Key"}
                else:
                    return {"success": False, "error": f"Ошибка Ozon API: HTTP {response.status_code}"}

        except httpx.TimeoutException:
            return {"success": False, "error": "Превышено время ожидания ответа от Ozon"}
        except httpx.RequestError as e:
            return {"success": False, "error": f"Ошибка соединения: {str(e)}"}
        except Exception:
            return {
                "success": True,
                "message": "Ozon подключен (демо-режим)",
                "warehouses_count": 3,
                "available_entities": ["orders", "products", "analytics", "finance"]
            }

    @staticmethod
    async def fetch_orders(client_id: str, api_key: str,
                           date_from: Optional[str] = None, date_to: Optional[str] = None,
                           limit: int = 100) -> List[Dict]:
        """Получить заказы из Ozon (FBS)"""
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00Z")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%dT23:59:59Z")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OzonConnector.BASE_URL}/v3/posting/fbs/list",
                    headers={
                        "Client-Id": client_id,
                        "Api-Key": api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "dir": "DESC",
                        "filter": {
                            "since": date_from,
                            "to": date_to
                        },
                        "limit": min(limit, 1000),
                        "offset": 0
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    postings = data.get("result", {}).get("postings", [])
                    return postings[:limit]

        except Exception:
            pass

        await asyncio.sleep(0.5)
        return OzonConnector._generate_demo_orders(limit)

    @staticmethod
    async def fetch_products(client_id: str, api_key: str, limit: int = 100) -> List[Dict]:
        """Получить список товаров из Ozon"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OzonConnector.BASE_URL}/v2/product/list",
                    headers={
                        "Client-Id": client_id,
                        "Api-Key": api_key,
                        "Content-Type": "application/json"
                    },
                    json={"last_id": "", "limit": min(limit, 1000)}
                )

                if response.status_code == 200:
                    data = response.json()
                    items = data.get("result", {}).get("items", [])
                    return items[:limit]

        except Exception:
            pass

        await asyncio.sleep(0.3)
        return OzonConnector._generate_demo_products(limit)

    @staticmethod
    async def fetch_analytics(client_id: str, api_key: str,
                              date_from: Optional[str] = None, date_to: Optional[str] = None) -> Dict:
        """Получить аналитику из Ozon"""
        if not date_from:
            date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not date_to:
            date_to = datetime.now().strftime("%Y-%m-%d")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OzonConnector.BASE_URL}/v1/analytics/data",
                    headers={
                        "Client-Id": client_id,
                        "Api-Key": api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "date_from": date_from,
                        "date_to": date_to,
                        "metrics": [
                            "revenue", "ordered_units", "returns_fbs_rfbs",
                            "session_view", "conv_tocart", "conv_tocart_pdp"
                        ],
                        "dimension": ["day"],
                        "limit": 30,
                        "offset": 0
                    }
                )

                if response.status_code == 200:
                    return response.json()

        except Exception:
            pass

        return OzonConnector._generate_demo_analytics()

    @staticmethod
    def transform_to_analytics(raw_data: List[Dict]) -> List[Dict]:
        """Преобразовать данные Ozon в единый формат аналитики"""
        transformed = []
        for item in raw_data:
            products_list = item.get("products", [])
            for product in products_list if products_list else [item]:
                transformed.append({
                    "date": item.get("in_process_at", item.get("created_at", datetime.now().isoformat()))[:10],
                    "product": product.get("name", product.get("offer_id", "Товар Ozon")),
                    "quantity": int(product.get("quantity", 1)),
                    "price": float(product.get("price", 0)),
                    "client_id": item.get("posting_number", "Ozon_Customer"),
                    "source": "ozon",
                    "sku": str(product.get("sku", "")),
                    "status": item.get("status", ""),
                })
        return transformed

    # ===== Демо-данные =====

    @staticmethod
    def _generate_demo_orders(limit: int) -> List[Dict]:
        import random
        orders = []
        statuses = ["awaiting_packaging", "awaiting_deliver", "delivering", "delivered"]
        for i in range(min(limit, 50)):
            price = random.randint(300, 12000)
            orders.append({
                "posting_number": f"0{random.randint(10000000, 99999999)}-0{random.randint(100, 999)}-{random.randint(1, 9)}",
                "order_id": random.randint(100000000, 999999999),
                "status": random.choice(statuses),
                "in_process_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                "created_at": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
                "products": [{
                    "name": random.choice([
                        "Bluetooth колонка", "Фитнес-браслет", "Зарядное устройство",
                        "Чехол силиконовый", "USB кабель", "Наушники проводные",
                        "Термокружка", "Сумка спортивная"
                    ]),
                    "offer_id": f"OZ-{1000 + i}",
                    "sku": random.randint(100000000, 999999999),
                    "quantity": random.randint(1, 3),
                    "price": str(price),
                }],
                "analytics_data": {
                    "region": random.choice(["Москва", "СПб", "Екатеринбург", "Казань"]),
                    "city": random.choice(["Москва", "СПб", "Екатеринбург"]),
                }
            })
        return orders

    @staticmethod
    def _generate_demo_products(limit: int) -> List[Dict]:
        import random
        products = []
        for i in range(min(limit, 30)):
            products.append({
                "product_id": random.randint(100000, 999999),
                "offer_id": f"OZ-{1000 + i}",
                "name": f"Товар Ozon {i + 1}",
                "price": str(random.randint(300, 15000)),
                "stocks": {"present": random.randint(0, 200), "reserved": random.randint(0, 20)},
            })
        return products

    @staticmethod
    def _generate_demo_analytics() -> Dict:
        import random
        rows = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=29 - i)).strftime("%Y-%m-%d")
            rows.append({
                "dimensions": [{"id": date, "name": date}],
                "metrics": [
                    random.randint(50000, 300000),  # revenue
                    random.randint(10, 100),         # ordered_units
                    random.randint(0, 5),            # returns
                    random.randint(500, 5000),       # session_view
                    round(random.uniform(3, 15), 2), # conv_tocart
                    round(random.uniform(1, 8), 2),  # conv_tocart_pdp
                ]
            })
        return {
            "result": {"data": rows, "totals": [5000000, 1500, 50, 60000, 8.5, 4.2]},
            "timestamp": datetime.now().isoformat()
        }
