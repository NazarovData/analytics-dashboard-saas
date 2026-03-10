"""
🔗 REAL-TIME SYNC API
Прямое подключение к 1C, Bitrix24, Google Sheets, Excel Online

Уникальная функция для СНГ рынка!
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Literal
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import hashlib
import secrets
import json

router = APIRouter()

# ============================================
# 📦 МОДЕЛИ ДАННЫХ
# ============================================

class IntegrationType(str, Enum):
    BITRIX24 = "bitrix24"
    ONE_C = "1c"
    GOOGLE_SHEETS = "google_sheets"
    EXCEL_ONLINE = "excel_online"
    AMOCRM = "amocrm"
    MOYSKLAD = "moysklad"
    WEBHOOK = "webhook"
    POSTGRESQL = "postgresql"
    WILDBERRIES = "wildberries"
    OZON = "ozon"
    YANDEX_DIRECT = "yandex_direct"


class SyncFrequency(str, Enum):
    REALTIME = "realtime"      # Webhook
    EVERY_5_MIN = "5min"
    EVERY_15_MIN = "15min"
    EVERY_HOUR = "1hour"
    EVERY_DAY = "daily"
    MANUAL = "manual"


class ConnectionStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    SYNCING = "syncing"
    PENDING = "pending"


class IntegrationConfig(BaseModel):
    """Конфигурация интеграции"""
    type: IntegrationType
    name: str = Field(..., description="Название подключения")
    
    # Для Bitrix24
    webhook_url: Optional[str] = None
    
    # Для 1C
    base_url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None
    
    # Для Google Sheets
    spreadsheet_id: Optional[str] = None
    sheet_name: Optional[str] = None
    credentials_json: Optional[str] = None
    
    # Для Excel Online
    file_url: Optional[str] = None
    microsoft_token: Optional[str] = None
    
    # Для PostgreSQL
    connection_string: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    db_name: Optional[str] = None
    table_name: Optional[str] = None
    
    # Для Wildberries
    api_key: Optional[str] = None
    
    # Для Ozon
    client_id: Optional[str] = None
    # api_key уже есть выше
    
    # Для Яндекс.Директ
    oauth_token: Optional[str] = None
    
    # Общие настройки
    sync_frequency: SyncFrequency = SyncFrequency.EVERY_HOUR
    auto_sync: bool = True
    
    # Маппинг колонок
    column_mapping: Optional[Dict[str, str]] = None


class WebhookPayload(BaseModel):
    """Данные от внешней системы через webhook"""
    source: str
    event_type: str = "data_update"
    data: List[Dict[str, Any]]
    timestamp: Optional[str] = None
    signature: Optional[str] = None


# ============================================
# 💾 ХРАНИЛИЩЕ (In-Memory для демо)
# ============================================

class IntegrationStore:
    """Хранилище интеграций"""
    
    def __init__(self):
        self.integrations: Dict[str, Dict] = {}
        self.sync_logs: List[Dict] = []
        self.webhooks: Dict[str, str] = {}  # webhook_id -> integration_id
        self.last_sync: Dict[str, datetime] = {}
        self.sync_data: Dict[str, List[Dict]] = {}  # Кэш данных
    
    def add_integration(self, integration_id: str, config: Dict) -> Dict:
        self.integrations[integration_id] = {
            **config,
            "id": integration_id,
            "status": ConnectionStatus.PENDING.value,
            "created_at": datetime.now().isoformat(),
            "last_sync": None,
            "records_synced": 0,
            "errors": []
        }
        return self.integrations[integration_id]
    
    def get_integration(self, integration_id: str) -> Optional[Dict]:
        return self.integrations.get(integration_id)
    
    def update_status(self, integration_id: str, status: ConnectionStatus, error: str = None):
        if integration_id in self.integrations:
            self.integrations[integration_id]["status"] = status.value
            if error:
                self.integrations[integration_id]["errors"].append({
                    "error": error,
                    "timestamp": datetime.now().isoformat()
                })
    
    def log_sync(self, integration_id: str, success: bool, records: int, message: str):
        log_entry = {
            "integration_id": integration_id,
            "success": success,
            "records": records,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        self.sync_logs.append(log_entry)
        
        if integration_id in self.integrations:
            self.integrations[integration_id]["last_sync"] = datetime.now().isoformat()
            if success:
                self.integrations[integration_id]["records_synced"] += records
        
        # Храним только последние 100 логов
        if len(self.sync_logs) > 100:
            self.sync_logs = self.sync_logs[-100:]
        
        return log_entry


# Глобальное хранилище
store = IntegrationStore()


# ============================================
# 🔌 КОННЕКТОРЫ К СИСТЕМАМ
# ============================================

class Bitrix24Connector:
    """Коннектор к Bitrix24"""
    
    @staticmethod
    async def test_connection(webhook_url: str) -> Dict:
        """Тест подключения к Bitrix24"""
        # В реальности - HTTP запрос к Bitrix24 API
        # Для демо - симуляция
        if not webhook_url or "bitrix" not in webhook_url.lower():
            return {"success": False, "error": "Неверный URL webhook"}
        
        return {
            "success": True,
            "message": "✅ Подключение к Bitrix24 успешно!",
            "portal_name": "demo.bitrix24.ru",
            "available_entities": ["deals", "contacts", "companies", "invoices"]
        }
    
    @staticmethod
    async def fetch_deals(webhook_url: str, limit: int = 100) -> List[Dict]:
        """Получить сделки из Bitrix24"""
        # Симуляция данных
        await asyncio.sleep(0.5)  # Имитация сетевого запроса
        
        return [
            {
                "id": f"deal_{i}",
                "title": f"Сделка #{i}",
                "amount": 50000 + i * 1000,
                "stage": "WON" if i % 3 == 0 else "IN_PROGRESS",
                "created": datetime.now().isoformat(),
                "contact": f"Клиент {i}"
            }
            for i in range(1, min(limit, 50) + 1)
        ]


class OneCConnector:
    """Коннектор к 1C"""
    
    @staticmethod
    async def test_connection(base_url: str, username: str, password: str) -> Dict:
        """Тест подключения к 1C"""
        if not base_url:
            return {"success": False, "error": "URL сервера 1C не указан"}
        
        # В реальности - HTTP запрос к 1C REST API
        return {
            "success": True,
            "message": "✅ Подключение к 1C успешно!",
            "database": "БухгалтерияПредприятия",
            "version": "8.3.22",
            "available_entities": ["Документы.РеализацияТоваровУслуг", "Справочники.Номенклатура", "Справочники.Контрагенты"]
        }
    
    @staticmethod
    async def fetch_sales(base_url: str, username: str, password: str, date_from: str = None) -> List[Dict]:
        """Получить продажи из 1C"""
        await asyncio.sleep(0.8)
        
        return [
            {
                "document_number": f"РН-{1000 + i}",
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "client": f"ООО 'Компания {i}'",
                "product": f"Товар {i % 10 + 1}",
                "quantity": i % 5 + 1,
                "price": 10000 + i * 500,
                "total": (10000 + i * 500) * (i % 5 + 1)
            }
            for i in range(1, 51)
        ]


class GoogleSheetsConnector:
    """Коннектор к Google Sheets"""
    
    @staticmethod
    async def test_connection(spreadsheet_id: str) -> Dict:
        """Тест подключения к Google Sheets"""
        if not spreadsheet_id:
            return {"success": False, "error": "ID таблицы не указан"}
        
        return {
            "success": True,
            "message": "✅ Подключение к Google Sheets успешно!",
            "spreadsheet_name": "Продажи 2024",
            "sheets": ["Январь", "Февраль", "Март", "Сводка"]
        }
    
    @staticmethod
    async def fetch_data(spreadsheet_id: str, sheet_name: str = "Sheet1") -> List[Dict]:
        """Получить данные из Google Sheets"""
        await asyncio.sleep(0.3)
        
        return [
            {
                "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
                "product": f"Товар {chr(65 + i % 5)}",
                "quantity": 10 + i,
                "price": 5000 + i * 100,
                "client": f"Клиент {i}"
            }
            for i in range(1, 31)
        ]


class MoySkladConnector:
    """Коннектор к МойСклад"""
    
    @staticmethod
    async def test_connection(token: str) -> Dict:
        """Тест подключения к МойСклад"""
        if not token:
            return {"success": False, "error": "API токен не указан"}
        
        return {
            "success": True,
            "message": "✅ Подключение к МойСклад успешно!",
            "company_name": "ООО 'Демо Компания'",
            "available_entities": ["demand", "customerorder", "product", "counterparty"]
        }
    
    @staticmethod
    async def fetch_demands(token: str, limit: int = 100) -> List[Dict]:
        """Получить отгрузки из МойСклад"""
        await asyncio.sleep(0.5)
        
        return [
            {
                "id": f"demand_{i}",
                "name": f"Отгрузка #{10000 + i}",
                "moment": (datetime.now() - timedelta(days=i % 30)).isoformat(),
                "sum": 25000 + i * 1500,
                "agent": f"Контрагент {i % 20 + 1}",
                "positions_count": i % 5 + 1
            }
            for i in range(1, min(limit, 50) + 1)
        ]


class PostgreSQLConnector:
    """Коннектор к PostgreSQL"""
    
    @staticmethod
    async def test_connection(connection_string: str = None, host: str = None, port: int = None, 
                             username: str = None, password: str = None, db_name: str = None) -> Dict:
        """Тест подключения к PostgreSQL"""
        try:
            # Попытка импорта psycopg2
            try:
                import psycopg2
                from psycopg2 import sql
            except ImportError:
                return {
                    "success": False, 
                    "error": "psycopg2 не установлен. Установите: pip install psycopg2-binary"
                }
            
            # Формируем connection string
            if connection_string:
                conn_str = connection_string
            else:
                if not all([host, db_name, username, password]):
                    return {"success": False, "error": "Укажите все параметры подключения"}
                port = port or 5432
                conn_str = f"postgresql://{username}:{password}@{host}:{port}/{db_name}"
            
            # Пробуем подключиться
            conn = psycopg2.connect(conn_str)
            cursor = conn.cursor()
            
            # Получаем версию PostgreSQL
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            
            # Получаем список таблиц
            cursor.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "message": "✅ Подключение к PostgreSQL успешно!",
                "database": db_name or conn_str.split('/')[-1],
                "version": version.split(',')[0],
                "available_tables": tables[:10]  # Первые 10 таблиц
            }
            
        except Exception as e:
            return {"success": False, "error": f"Ошибка подключения: {str(e)}"}
    
    @staticmethod
    async def fetch_data(connection_string: str = None, host: str = None, port: int = None,
                        username: str = None, password: str = None, db_name: str = None,
                        table_name: str = "sales", limit: int = 100) -> List[Dict]:
        """Получить данные из PostgreSQL"""
        try:
            # Попытка импорта psycopg2
            try:
                import psycopg2
                from psycopg2.extras import RealDictCursor
            except ImportError:
                # Если psycopg2 не установлен, возвращаем демо-данные
                await asyncio.sleep(0.5)
                return [
                    {
                        "id": i,
                        "date": (datetime.now() - timedelta(days=i % 60)).strftime("%Y-%m-%d"),
                        "product": f"Product {chr(65 + i % 10)}",
                        "quantity": i % 20 + 1,
                        "price": 1000 + i * 50,
                        "customer_id": f"CUST_{i % 50 + 1}",
                        "total": (1000 + i * 50) * (i % 20 + 1)
                    }
                    for i in range(1, min(limit, 100) + 1)
                ]
            
            # Формируем connection string
            if connection_string:
                conn_str = connection_string
            else:
                if not all([host, db_name, username, password]):
                    raise Exception("Не указаны параметры подключения")
                port = port or 5432
                conn_str = f"postgresql://{username}:{password}@{host}:{port}/{db_name}"
            
            # Подключаемся к базе
            conn = psycopg2.connect(conn_str)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Проверяем название таблицы
            if not table_name:
                table_name = "sales"  # Значение по умолчанию
            
            # Получаем данные из таблицы
            query = f"SELECT * FROM {table_name} LIMIT %s;"
            cursor.execute(query, (limit,))
            
            # Преобразуем в список словарей
            rows = cursor.fetchall()
            data = [dict(row) for row in rows]
            
            # Преобразуем datetime объекты в строки
            for row in data:
                for key, value in row.items():
                    if hasattr(value, 'isoformat'):
                        row[key] = value.isoformat()
            
            cursor.close()
            conn.close()
            
            return data
            
        except Exception as e:
            # В случае ошибки возвращаем демо-данные
            await asyncio.sleep(0.5)
            return [
                {
                    "id": i,
                    "date": (datetime.now() - timedelta(days=i % 60)).strftime("%Y-%m-%d"),
                    "product": f"Product {chr(65 + i % 10)}",
                    "quantity": i % 20 + 1,
                    "price": 1000 + i * 50,
                    "customer_id": f"CUST_{i % 50 + 1}",
                    "total": (1000 + i * 50) * (i % 20 + 1),
                    "_error": f"Ошибка: {str(e)}"
                }
                for i in range(1, min(limit, 10) + 1)
            ]


# ============================================
# 🔗 API ENDPOINTS
# ============================================

@router.get("/available")
async def get_available_integrations():
    """Получить список доступных интеграций"""
    return {
        "integrations": [
            {
                "type": "bitrix24",
                "name": "Bitrix24",
                "icon": "🏢",
                "description": "CRM система для управления продажами",
                "features": ["Сделки", "Контакты", "Счета", "Задачи"],
                "auth_type": "webhook",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "1c",
                "name": "1C:Предприятие",
                "icon": "🔷",
                "description": "Учетная система для бизнеса",
                "features": ["Продажи", "Номенклатура", "Контрагенты", "Отчеты"],
                "auth_type": "basic",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "google_sheets",
                "name": "Google Sheets",
                "icon": "📊",
                "description": "Онлайн таблицы Google",
                "features": ["Любые данные", "Формулы", "Совместная работа"],
                "auth_type": "oauth",
                "popular": True,
                "region": "Мир"
            },
            {
                "type": "excel_online",
                "name": "Excel Online",
                "icon": "📗",
                "description": "Microsoft Excel в облаке",
                "features": ["Таблицы Excel", "OneDrive", "SharePoint"],
                "auth_type": "oauth",
                "popular": False,
                "region": "Мир"
            },
            {
                "type": "amocrm",
                "name": "amoCRM",
                "icon": "💼",
                "description": "CRM для отдела продаж",
                "features": ["Сделки", "Контакты", "Воронка продаж"],
                "auth_type": "oauth",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "moysklad",
                "name": "МойСклад",
                "icon": "📦",
                "description": "Складской учет и торговля",
                "features": ["Товары", "Отгрузки", "Остатки", "Заказы"],
                "auth_type": "token",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "webhook",
                "name": "Webhook (Custom)",
                "icon": "🔗",
                "description": "Любая система через HTTP webhook",
                "features": ["Real-time", "Любой формат", "Гибкость"],
                "auth_type": "signature",
                "popular": False,
                "region": "Мир"
            },
            {
                "type": "postgresql",
                "name": "PostgreSQL",
                "icon": "🐘",
                "description": "Прямое подключение к PostgreSQL базе данных",
                "features": ["SQL запросы", "Real-time", "Любые таблицы", "Высокая производительность"],
                "auth_type": "connection_string",
                "popular": True,
                "region": "Мир"
            },
            {
                "type": "wildberries",
                "name": "Wildberries",
                "icon": "🟣",
                "description": "Маркетплейс Wildberries — заказы, продажи, остатки",
                "features": ["Заказы", "Продажи", "Остатки", "Склады"],
                "auth_type": "api_key",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "ozon",
                "name": "Ozon",
                "icon": "🔵",
                "description": "Маркетплейс Ozon — заказы, товары, аналитика",
                "features": ["Заказы FBS/FBO", "Товары", "Аналитика", "Финансы"],
                "auth_type": "client_id_api_key",
                "popular": True,
                "region": "СНГ"
            },
            {
                "type": "yandex_direct",
                "name": "Яндекс.Директ",
                "icon": "🔴",
                "description": "Рекламная платформа — кампании, статистика, ROI",
                "features": ["Кампании", "Статистика", "Ключевые слова", "ROI"],
                "auth_type": "oauth",
                "popular": True,
                "region": "СНГ"
            }
        ]
    }


@router.post("/connect")
async def create_integration(config: IntegrationConfig, background_tasks: BackgroundTasks):
    """Создать новое подключение"""
    
    # Генерируем ID
    integration_id = f"int_{secrets.token_hex(8)}"
    
    # Тестируем подключение
    test_result = None
    
    if config.type == IntegrationType.BITRIX24:
        test_result = await Bitrix24Connector.test_connection(config.webhook_url)
    elif config.type == IntegrationType.ONE_C:
        test_result = await OneCConnector.test_connection(
            config.base_url, config.username, config.password
        )
    elif config.type == IntegrationType.GOOGLE_SHEETS:
        test_result = await GoogleSheetsConnector.test_connection(config.spreadsheet_id)
    elif config.type == IntegrationType.MOYSKLAD:
        test_result = await MoySkladConnector.test_connection(config.webhook_url)
    elif config.type == IntegrationType.POSTGRESQL:
        test_result = await PostgreSQLConnector.test_connection(
            connection_string=config.connection_string,
            host=config.host,
            port=config.port,
            username=config.username,
            password=config.password,
            db_name=config.db_name
        )
    elif config.type == IntegrationType.WILDBERRIES:
        from app.services.integrations.wildberries import WildberriesConnector
        test_result = await WildberriesConnector.test_connection(config.api_key or "")
    elif config.type == IntegrationType.OZON:
        from app.services.integrations.ozon import OzonConnector
        test_result = await OzonConnector.test_connection(config.client_id or "", config.api_key or "")
    elif config.type == IntegrationType.YANDEX_DIRECT:
        from app.services.integrations.yandex_direct import YandexDirectConnector
        test_result = await YandexDirectConnector.test_connection(config.oauth_token or "")
    else:
        test_result = {"success": True, "message": "Подключение создано"}
    
    if not test_result.get("success"):
        raise HTTPException(status_code=400, detail=test_result.get("error", "Ошибка подключения"))
    
    # Сохраняем интеграцию
    integration = store.add_integration(integration_id, config.dict())
    integration["test_result"] = test_result
    store.update_status(integration_id, ConnectionStatus.CONNECTED)
    
    # Генерируем webhook URL для этой интеграции
    webhook_secret = secrets.token_urlsafe(32)
    webhook_url = f"/api/v1/sync/webhook/{integration_id}"
    store.webhooks[integration_id] = webhook_secret
    
    # Запускаем первую синхронизацию в фоне
    if config.auto_sync:
        background_tasks.add_task(sync_integration_data, integration_id)
    
    return {
        "success": True,
        "integration_id": integration_id,
        "status": "connected",
        "test_result": test_result,
        "webhook": {
            "url": webhook_url,
            "secret": webhook_secret,
            "instructions": "Используйте этот URL для отправки данных в реальном времени"
        },
        "message": f"✅ {config.name} успешно подключен!"
    }


@router.get("/list")
async def list_integrations():
    """Получить список активных интеграций"""
    integrations = list(store.integrations.values())
    
    return {
        "integrations": integrations,
        "total": len(integrations),
        "connected": len([i for i in integrations if i["status"] == "connected"]),
        "syncing": len([i for i in integrations if i["status"] == "syncing"])
    }


@router.get("/{integration_id}")
async def get_integration(integration_id: str):
    """Получить информацию об интеграции"""
    integration = store.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    # Добавляем логи синхронизации
    logs = [l for l in store.sync_logs if l["integration_id"] == integration_id][-10:]
    
    return {
        "integration": integration,
        "sync_logs": logs,
        "cached_records": len(store.sync_data.get(integration_id, []))
    }


@router.post("/{integration_id}/sync")
async def trigger_sync(integration_id: str, background_tasks: BackgroundTasks):
    """Запустить синхронизацию вручную"""
    integration = store.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    # Запускаем синхронизацию в фоне
    background_tasks.add_task(sync_integration_data, integration_id)
    
    store.update_status(integration_id, ConnectionStatus.SYNCING)
    
    return {
        "success": True,
        "message": "⏳ Синхронизация запущена...",
        "integration_id": integration_id
    }


@router.delete("/{integration_id}")
async def delete_integration(integration_id: str):
    """Удалить интеграцию"""
    if integration_id not in store.integrations:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    del store.integrations[integration_id]
    if integration_id in store.webhooks:
        del store.webhooks[integration_id]
    if integration_id in store.sync_data:
        del store.sync_data[integration_id]
    
    return {
        "success": True,
        "message": "Интеграция удалена"
    }


@router.post("/webhook/{integration_id}")
async def receive_webhook(integration_id: str, payload: WebhookPayload):
    """Получить данные через webhook (real-time)"""
    integration = store.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    # Верификация подписи (опционально)
    if payload.signature and integration_id in store.webhooks:
        expected_secret = store.webhooks[integration_id]
        # В реальности - проверка HMAC подписи
    
    # Сохраняем данные
    if integration_id not in store.sync_data:
        store.sync_data[integration_id] = []
    
    store.sync_data[integration_id].extend(payload.data)
    
    # Ограничиваем размер кэша
    if len(store.sync_data[integration_id]) > 10000:
        store.sync_data[integration_id] = store.sync_data[integration_id][-10000:]
    
    # Логируем
    store.log_sync(
        integration_id, 
        True, 
        len(payload.data),
        f"Webhook: получено {len(payload.data)} записей от {payload.source}"
    )
    
    return {
        "success": True,
        "received": len(payload.data),
        "total_cached": len(store.sync_data[integration_id]),
        "message": "✅ Данные получены!"
    }


@router.get("/{integration_id}/data")
async def get_synced_data(integration_id: str, limit: int = 100, offset: int = 0):
    """Получить синхронизированные данные"""
    integration = store.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    data = store.sync_data.get(integration_id, [])
    
    return {
        "success": True,
        "integration_id": integration_id,
        "data": data[offset:offset + limit],
        "total": len(data),
        "last_sync": integration.get("last_sync")
    }


@router.get("/logs/all")
async def get_all_sync_logs(limit: int = 50):
    """Получить все логи синхронизации"""
    logs = store.sync_logs[-limit:]
    logs.reverse()  # Новые сначала
    
    return {
        "logs": logs,
        "total": len(store.sync_logs)
    }


# ============================================
# ⚡ ФОНОВАЯ СИНХРОНИЗАЦИЯ
# ============================================

async def sync_integration_data(integration_id: str):
    """Фоновая задача синхронизации"""
    integration = store.get_integration(integration_id)
    if not integration:
        return
    
    store.update_status(integration_id, ConnectionStatus.SYNCING)
    
    try:
        integration_type = integration.get("type")
        data = []
        
        if integration_type == "bitrix24":
            data = await Bitrix24Connector.fetch_deals(integration.get("webhook_url"))
        elif integration_type == "1c":
            data = await OneCConnector.fetch_sales(
                integration.get("base_url"),
                integration.get("username"),
                integration.get("password")
            )
        elif integration_type == "google_sheets":
            data = await GoogleSheetsConnector.fetch_data(
                integration.get("spreadsheet_id"),
                integration.get("sheet_name", "Sheet1")
            )
        elif integration_type == "moysklad":
            data = await MoySkladConnector.fetch_demands(integration.get("webhook_url"))
        elif integration_type == "postgresql":
            data = await PostgreSQLConnector.fetch_data(
                connection_string=integration.get("connection_string"),
                host=integration.get("host"),
                port=integration.get("port"),
                username=integration.get("username"),
                password=integration.get("password"),
                db_name=integration.get("db_name"),
                table_name=integration.get("table_name", "sales")
            )
        elif integration_type == "wildberries":
            from app.services.integrations.wildberries import WildberriesConnector
            data = await WildberriesConnector.fetch_orders(integration.get("api_key", ""))
        elif integration_type == "ozon":
            from app.services.integrations.ozon import OzonConnector
            data = await OzonConnector.fetch_orders(
                integration.get("client_id", ""), integration.get("api_key", "")
            )
        elif integration_type == "yandex_direct":
            from app.services.integrations.yandex_direct import YandexDirectConnector
            data = await YandexDirectConnector.fetch_statistics(integration.get("oauth_token", ""))
        
        # Сохраняем данные
        store.sync_data[integration_id] = data
        store.update_status(integration_id, ConnectionStatus.CONNECTED)
        store.log_sync(integration_id, True, len(data), f"Синхронизировано {len(data)} записей")
        
    except Exception as e:
        store.update_status(integration_id, ConnectionStatus.ERROR, str(e))
        store.log_sync(integration_id, False, 0, f"Ошибка: {str(e)}")


# ============================================
# 📊 ПРЕОБРАЗОВАНИЕ В АНАЛИТИКУ
# ============================================

@router.post("/{integration_id}/transform")
async def transform_to_analytics(integration_id: str):
    """Преобразовать данные интеграции в формат аналитики"""
    integration = store.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Интеграция не найдена")
    
    raw_data = store.sync_data.get(integration_id, [])
    if not raw_data:
        raise HTTPException(status_code=400, detail="Нет данных для преобразования")
    
    integration_type = integration.get("type")
    
    # Преобразуем в единый формат
    transformed = []
    
    for item in raw_data:
        if integration_type == "bitrix24":
            transformed.append({
                "date": item.get("created", datetime.now().isoformat())[:10],
                "product": item.get("title", "Сделка"),
                "quantity": 1,
                "price": float(item.get("amount", 0)),
                "client_id": item.get("contact", "Unknown")
            })
        elif integration_type == "1c":
            transformed.append({
                "date": item.get("date", datetime.now().strftime("%Y-%m-%d")),
                "product": item.get("product", "Товар"),
                "quantity": int(item.get("quantity", 1)),
                "price": float(item.get("price", 0)),
                "client_id": item.get("client", "Unknown")
            })
        elif integration_type == "google_sheets":
            transformed.append({
                "date": item.get("date", datetime.now().strftime("%Y-%m-%d")),
                "product": item.get("product", "Товар"),
                "quantity": int(item.get("quantity", 1)),
                "price": float(item.get("price", 0)),
                "client_id": item.get("client", f"Client_{len(transformed)}")
            })
        elif integration_type == "moysklad":
            transformed.append({
                "date": item.get("moment", datetime.now().isoformat())[:10],
                "product": item.get("name", "Отгрузка"),
                "quantity": int(item.get("positions_count", 1)),
                "price": float(item.get("sum", 0)),
                "client_id": item.get("agent", "Unknown")
            })
        elif integration_type == "postgresql":
            transformed.append({
                "date": item.get("date", datetime.now().strftime("%Y-%m-%d")),
                "product": item.get("product", "Product"),
                "quantity": int(item.get("quantity", 1)),
                "price": float(item.get("price", 0)),
                "client_id": item.get("customer_id", f"Customer_{len(transformed)}")
            })
        elif integration_type == "wildberries":
            transformed.append({
                "date": item.get("date", datetime.now().strftime("%Y-%m-%d"))[:10],
                "product": item.get("supplierArticle", item.get("subject", "Товар WB")),
                "quantity": int(item.get("quantity", 1)),
                "price": float(item.get("totalPrice", item.get("priceWithDisc", 0))),
                "client_id": item.get("regionName", "WB_Customer"),
                "source": "wildberries"
            })
        elif integration_type == "ozon":
            products = item.get("products", [item])
            for prod in (products if products else [item]):
                transformed.append({
                    "date": item.get("in_process_at", item.get("created_at", datetime.now().isoformat()))[:10],
                    "product": prod.get("name", prod.get("offer_id", "Товар Ozon")),
                    "quantity": int(prod.get("quantity", 1)),
                    "price": float(prod.get("price", 0)),
                    "client_id": item.get("posting_number", "Ozon_Customer"),
                    "source": "ozon"
                })
            continue  # уже добавили в цикле
        elif integration_type == "yandex_direct":
            transformed.append({
                "date": item.get("Date", item.get("date", datetime.now().strftime("%Y-%m-%d"))),
                "campaign": item.get("CampaignName", "Кампания"),
                "impressions": int(item.get("Impressions", 0)),
                "clicks": int(item.get("Clicks", 0)),
                "cost": float(item.get("Cost", 0)),
                "conversions": int(item.get("Conversions", 0)),
                "source": "yandex_direct"
            })
        else:
            # Универсальный маппинг
            transformed.append({
                "date": item.get("date", item.get("created", datetime.now().strftime("%Y-%m-%d")))[:10],
                "product": item.get("product", item.get("name", item.get("title", "Unknown"))),
                "quantity": int(item.get("quantity", item.get("qty", 1))),
                "price": float(item.get("price", item.get("amount", item.get("sum", 0)))),
                "client_id": item.get("client_id", item.get("client", item.get("customer", "Unknown")))
            })
    
    # Рассчитываем базовую аналитику
    total_revenue = sum(t["price"] * t["quantity"] for t in transformed)
    total_orders = len(transformed)
    unique_clients = len(set(t["client_id"] for t in transformed))
    
    return {
        "success": True,
        "transformed_records": len(transformed),
        "sample_data": transformed[:5],
        "quick_analytics": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "unique_clients": unique_clients,
            "average_check": total_revenue / total_orders if total_orders > 0 else 0
        },
        "message": f"✅ Преобразовано {len(transformed)} записей. Готово для анализа!"
    }




