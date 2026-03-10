"""
Integrations API endpoints - Bitrix24, 1C, Google Sheets, PostgreSQL, ClickHouse, Excel
Full implementation with real connections
"""
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import httpx
import pandas as pd
from io import BytesIO
import asyncio

router = APIRouter()

# Storage for connections (in production use database)
connections_db: Dict[str, dict] = {}
synced_data: Dict[str, List[dict]] = {}

# ========== MODELS ==========

class BitrixConnection(BaseModel):
    name: str
    webhook_url: str
    entity_type: str = "deal"

class OneСConnection(BaseModel):
    name: str
    server_url: str
    database: str
    username: str
    password: str

class GoogleSheetsConnection(BaseModel):
    name: str
    spreadsheet_id: str
    sheet_name: str = "Sheet1"
    api_key: Optional[str] = None

class PostgreSQLConnection(BaseModel):
    name: str
    host: str
    port: int = 5432
    database: str
    username: str
    password: str
    query: Optional[str] = None

class ClickHouseConnection(BaseModel):
    name: str
    host: str
    port: int = 8123
    database: str
    username: str = "default"
    password: str = ""
    query: Optional[str] = None

class ConnectionResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    message: str
    records_count: Optional[int] = None

class SyncResponse(BaseModel):
    status: str
    records_imported: int
    message: str
    data: Optional[List[dict]] = None

# ========== BITRIX24 ==========

@router.post("/bitrix24/connect", response_model=ConnectionResponse)
async def connect_bitrix24(connection: BitrixConnection):
    """Connect to Bitrix24 CRM and fetch data"""
    
    if not connection.webhook_url.startswith("https://"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook URL должен начинаться с https://"
        )
    
    # Validate webhook by fetching data
    entity_map = {
        "deal": "crm.deal.list",
        "contact": "crm.contact.list",
        "company": "crm.company.list",
        "lead": "crm.lead.list"
    }
    
    method = entity_map.get(connection.entity_type, "crm.deal.list")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Bitrix24 REST API call
            url = f"{connection.webhook_url.rstrip('/')}/{method}.json"
            response = await client.get(url, params={"start": 0})
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка подключения к Bitrix24: {response.status_code}"
                )
            
            data = response.json()
            
            if "error" in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Bitrix24 API ошибка: {data.get('error_description', data['error'])}"
                )
            
            records = data.get("result", [])
            total = data.get("total", len(records))
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Превышено время ожидания ответа от Bitrix24"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка соединения с Bitrix24: {str(e)}"
        )
    
    connection_id = f"bitrix24_{len(connections_db) + 1}"
    connections_db[connection_id] = {
        "type": "bitrix24",
        "name": connection.name,
        "webhook_url": connection.webhook_url,
        "entity_type": connection.entity_type,
        "status": "connected",
        "total_records": total
    }
    synced_data[connection_id] = records
    
    return ConnectionResponse(
        id=connection_id,
        name=connection.name,
        type="Bitrix24",
        status="connected",
        message=f"Успешно подключено! Найдено {total} записей ({connection.entity_type})",
        records_count=total
    )

@router.get("/bitrix24/sync/{connection_id}", response_model=SyncResponse)
async def sync_bitrix24(connection_id: str, limit: int = 50):
    """Sync data from Bitrix24"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn = connections_db[connection_id]
    if conn["type"] != "bitrix24":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    entity_map = {
        "deal": "crm.deal.list",
        "contact": "crm.contact.list",
        "company": "crm.company.list",
        "lead": "crm.lead.list"
    }
    
    method = entity_map.get(conn["entity_type"], "crm.deal.list")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{conn['webhook_url'].rstrip('/')}/{method}.json"
            all_records = []
            start = 0
            
            while True:
                response = await client.get(url, params={"start": start})
                data = response.json()
                
                records = data.get("result", [])
                all_records.extend(records)
                
                if len(records) < 50 or len(all_records) >= limit:
                    break
                    
                start = data.get("next", start + 50)
                if start == 0:
                    break
            
            synced_data[connection_id] = all_records[:limit]
            
            return SyncResponse(
                status="success",
                records_imported=len(all_records[:limit]),
                message=f"Синхронизировано {len(all_records[:limit])} записей из Bitrix24",
                data=all_records[:10]  # Return first 10 for preview
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка синхронизации: {str(e)}"
        )

# ========== 1C ==========

@router.post("/1c/connect", response_model=ConnectionResponse)
async def connect_1c(connection: OneСConnection):
    """Connect to 1C via OData/REST"""
    
    # Build 1C OData URL
    base_url = connection.server_url.rstrip('/')
    odata_url = f"{base_url}/{connection.database}/odata/standard.odata/"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Try to get metadata to verify connection
            auth = (connection.username, connection.password)
            response = await client.get(
                f"{odata_url}$metadata",
                auth=auth,
                headers={"Accept": "application/xml"}
            )
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Неверные учетные данные 1С"
                )
            
            if response.status_code != 200:
                # Try alternative endpoint
                response = await client.get(
                    f"{base_url}/hs/api/v1/info",
                    auth=auth
                )
            
            if response.status_code not in [200, 404]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка подключения к 1С: HTTP {response.status_code}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Превышено время ожидания ответа от 1С"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка соединения с 1С: {str(e)}"
        )
    
    connection_id = f"1c_{len(connections_db) + 1}"
    connections_db[connection_id] = {
        "type": "1c",
        "name": connection.name,
        "server_url": connection.server_url,
        "database": connection.database,
        "username": connection.username,
        "password": connection.password,
        "odata_url": odata_url,
        "status": "connected"
    }
    
    return ConnectionResponse(
        id=connection_id,
        name=connection.name,
        type="1С",
        status="connected",
        message=f"Подключено к базе 1С: {connection.database}"
    )

@router.get("/1c/sync/{connection_id}", response_model=SyncResponse)
async def sync_1c(connection_id: str, entity: str = "Document_РеализацияТоваровУслуг"):
    """Sync data from 1C - Documents or Catalogs"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn = connections_db[connection_id]
    if conn["type"] != "1c":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            auth = (conn["username"], conn["password"])
            url = f"{conn['odata_url']}{entity}?$format=json&$top=100"
            
            response = await client.get(url, auth=auth)
            
            if response.status_code != 200:
                return SyncResponse(
                    status="partial",
                    records_imported=0,
                    message=f"1С подключена, но сущность {entity} недоступна. Попробуйте другую сущность.",
                    data=[]
                )
            
            data = response.json()
            records = data.get("value", [])
            
            synced_data[connection_id] = records
            
            return SyncResponse(
                status="success",
                records_imported=len(records),
                message=f"Синхронизировано {len(records)} записей из 1С ({entity})",
                data=records[:10]
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка синхронизации 1С: {str(e)}"
        )

@router.get("/1c/entities/{connection_id}")
async def get_1c_entities(connection_id: str):
    """Get available entities from 1C"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    # Common 1C entities
    return {
        "documents": [
            {"id": "Document_РеализацияТоваровУслуг", "name": "Реализация товаров и услуг"},
            {"id": "Document_ПоступлениеТоваровУслуг", "name": "Поступление товаров и услуг"},
            {"id": "Document_СчетНаОплатуПокупателю", "name": "Счет на оплату"},
            {"id": "Document_ПриходныйКассовыйОрдер", "name": "Приходный кассовый ордер"},
        ],
        "catalogs": [
            {"id": "Catalog_Номенклатура", "name": "Номенклатура"},
            {"id": "Catalog_Контрагенты", "name": "Контрагенты"},
            {"id": "Catalog_Организации", "name": "Организации"},
            {"id": "Catalog_Склады", "name": "Склады"},
        ]
    }

# ========== GOOGLE SHEETS ==========

@router.post("/google-sheets/connect", response_model=ConnectionResponse)
async def connect_google_sheets(connection: GoogleSheetsConnection):
    """Connect to Google Sheets and fetch data"""
    
    # Use public access URL for Google Sheets
    spreadsheet_id = connection.spreadsheet_id
    sheet_name = connection.sheet_name
    
    # Google Sheets public CSV export URL
    csv_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"
    
    # Alternative: Google Sheets API URL (requires API key)
    api_url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            # Try CSV export first (works for public sheets)
            response = await client.get(csv_url)
            
            if response.status_code == 200 and "text/csv" in response.headers.get("content-type", ""):
                # Parse CSV data
                df = pd.read_csv(BytesIO(response.content))
                records = df.to_dict('records')
                total = len(records)
            elif connection.api_key:
                # Try API with key
                api_response = await client.get(
                    api_url,
                    params={"key": connection.api_key}
                )
                
                if api_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Не удалось получить данные. Убедитесь, что таблица доступна для просмотра"
                    )
                
                data = api_response.json()
                values = data.get("values", [])
                
                if len(values) > 1:
                    headers = values[0]
                    records = [dict(zip(headers, row)) for row in values[1:]]
                    total = len(records)
                else:
                    records = []
                    total = 0
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Таблица недоступна. Сделайте её публичной или укажите API ключ"
                )
                
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Таблица пуста или недоступна"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка соединения с Google Sheets: {str(e)}"
        )
    
    connection_id = f"gsheets_{len(connections_db) + 1}"
    connections_db[connection_id] = {
        "type": "google_sheets",
        "name": connection.name,
        "spreadsheet_id": connection.spreadsheet_id,
        "sheet_name": connection.sheet_name,
        "status": "connected",
        "total_records": total
    }
    synced_data[connection_id] = records
    
    return ConnectionResponse(
        id=connection_id,
        name=connection.name,
        type="Google Sheets",
        status="connected",
        message=f"Подключено к таблице! Найдено {total} строк",
        records_count=total
    )

@router.get("/google-sheets/sync/{connection_id}", response_model=SyncResponse)
async def sync_google_sheets(connection_id: str):
    """Re-sync data from Google Sheets"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn = connections_db[connection_id]
    if conn["type"] != "google_sheets":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    csv_url = f"https://docs.google.com/spreadsheets/d/{conn['spreadsheet_id']}/gviz/tq?tqx=out:csv&sheet={conn['sheet_name']}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(csv_url)
            
            if response.status_code == 200:
                df = pd.read_csv(BytesIO(response.content))
                records = df.to_dict('records')
                synced_data[connection_id] = records
                
                return SyncResponse(
                    status="success",
                    records_imported=len(records),
                    message=f"Синхронизировано {len(records)} строк из Google Sheets",
                    data=records[:10]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Не удалось получить данные из таблицы"
                )
                
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка синхронизации: {str(e)}"
        )

# ========== POSTGRESQL ==========

@router.post("/postgresql/connect", response_model=ConnectionResponse)
async def connect_postgresql(connection: PostgreSQLConnection):
    """Connect to PostgreSQL database"""
    
    try:
        import psycopg2
        from psycopg2 import OperationalError
        
        # Test connection
        conn = psycopg2.connect(
            host=connection.host,
            port=connection.port,
            database=connection.database,
            user=connection.username,
            password=connection.password,
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Get table count
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        
        # If query provided, test it
        records_count = 0
        if connection.query:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM ({connection.query} LIMIT 1) AS subq")
                cursor.execute(connection.query + " LIMIT 100")
                records = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                records_count = len(records)
            except Exception as e:
                cursor.close()
                conn.close()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка в SQL запросе: {str(e)}"
                )
        
        cursor.close()
        conn.close()
        
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="psycopg2 не установлен. Выполните: pip install psycopg2-binary"
        )
    except OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка подключения к PostgreSQL: {str(e)}"
        )
    
    connection_id = f"postgres_{len(connections_db) + 1}"
    connections_db[connection_id] = {
        "type": "postgresql",
        "name": connection.name,
        "host": connection.host,
        "port": connection.port,
        "database": connection.database,
        "username": connection.username,
        "password": connection.password,
        "query": connection.query,
        "status": "connected",
        "table_count": table_count
    }
    
    return ConnectionResponse(
        id=connection_id,
        name=connection.name,
        type="PostgreSQL",
        status="connected",
        message=f"Подключено к {connection.database}! Найдено {table_count} таблиц",
        records_count=records_count if connection.query else None
    )

@router.get("/postgresql/sync/{connection_id}", response_model=SyncResponse)
async def sync_postgresql(connection_id: str, query: Optional[str] = None, limit: int = 1000):
    """Execute query and fetch data from PostgreSQL"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn_data = connections_db[connection_id]
    if conn_data["type"] != "postgresql":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    sql_query = query or conn_data.get("query")
    if not sql_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL запрос не указан"
        )
    
    try:
        import psycopg2
        
        conn = psycopg2.connect(
            host=conn_data["host"],
            port=conn_data["port"],
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"]
        )
        
        cursor = conn.cursor()
        cursor.execute(f"{sql_query} LIMIT {limit}")
        
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        records = [dict(zip(columns, row)) for row in rows]
        
        cursor.close()
        conn.close()
        
        synced_data[connection_id] = records
        
        return SyncResponse(
            status="success",
            records_imported=len(records),
            message=f"Получено {len(records)} записей из PostgreSQL",
            data=records[:10]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка выполнения запроса: {str(e)}"
        )

@router.get("/postgresql/tables/{connection_id}")
async def get_postgresql_tables(connection_id: str):
    """Get list of tables from PostgreSQL with column details"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn_data = connections_db[connection_id]
    
    try:
        import psycopg2
        
        conn = psycopg2.connect(
            host=conn_data["host"],
            port=conn_data["port"],
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"]
        )
        
        cursor = conn.cursor()
        
        # Get tables with column count
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        table_names = [row[0] for row in cursor.fetchall()]
        
        # Get columns for each table
        tables = []
        for table_name in table_names:
            cursor.execute("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            columns = [{"name": row[0], "type": row[1]} for row in cursor.fetchall()]
            
            # Get row count
            try:
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                row_count = cursor.fetchone()[0]
            except:
                row_count = 0
            
            tables.append({
                "name": table_name,
                "columns": len(columns),
                "column_details": columns,
                "row_count": row_count
            })
        
        cursor.close()
        conn.close()
        
        return {"tables": tables}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка получения списка таблиц: {str(e)}"
        )

# ========== CLICKHOUSE ==========

@router.post("/clickhouse/connect", response_model=ConnectionResponse)
async def connect_clickhouse(connection: ClickHouseConnection):
    """Connect to ClickHouse database"""
    
    try:
        from clickhouse_driver import Client
        
        client = Client(
            host=connection.host,
            port=9000,  # Native port
            database=connection.database,
            user=connection.username,
            password=connection.password,
            connect_timeout=10
        )
        
        # Test connection
        result = client.execute("SELECT 1")
        
        # Get table count
        tables = client.execute("SHOW TABLES")
        table_count = len(tables)
        
        # If query provided, test it
        records_count = 0
        if connection.query:
            try:
                test_result = client.execute(f"{connection.query} LIMIT 100")
                records_count = len(test_result)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка в SQL запросе: {str(e)}"
                )
        
    except ImportError:
        # Try HTTP interface as fallback
        try:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                url = f"http://{connection.host}:{connection.port}"
                response = await http_client.get(
                    url,
                    params={
                        "query": "SELECT 1",
                        "user": connection.username,
                        "password": connection.password
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Ошибка подключения к ClickHouse: {response.text}"
                    )
                
                table_count = 0
                
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ошибка соединения с ClickHouse: {str(e)}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка подключения к ClickHouse: {str(e)}"
        )
    
    connection_id = f"clickhouse_{len(connections_db) + 1}"
    connections_db[connection_id] = {
        "type": "clickhouse",
        "name": connection.name,
        "host": connection.host,
        "port": connection.port,
        "database": connection.database,
        "username": connection.username,
        "password": connection.password,
        "query": connection.query,
        "status": "connected",
        "table_count": table_count
    }
    
    return ConnectionResponse(
        id=connection_id,
        name=connection.name,
        type="ClickHouse",
        status="connected",
        message=f"Подключено к {connection.database}! Найдено {table_count} таблиц",
        records_count=records_count if connection.query else None
    )

@router.get("/clickhouse/sync/{connection_id}", response_model=SyncResponse)
async def sync_clickhouse(connection_id: str, query: Optional[str] = None, limit: int = 10000):
    """Execute query and fetch data from ClickHouse"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn_data = connections_db[connection_id]
    if conn_data["type"] != "clickhouse":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    sql_query = query or conn_data.get("query")
    if not sql_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL запрос не указан"
        )
    
    try:
        from clickhouse_driver import Client
        
        client = Client(
            host=conn_data["host"],
            port=9000,
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"]
        )
        
        result = client.execute(f"{sql_query} LIMIT {limit}", with_column_types=True)
        rows, columns_info = result
        
        columns = [col[0] for col in columns_info]
        records = [dict(zip(columns, row)) for row in rows]
        
        synced_data[connection_id] = records
        
        return SyncResponse(
            status="success",
            records_imported=len(records),
            message=f"Получено {len(records)} записей из ClickHouse",
            data=records[:10]
        )
        
    except ImportError:
        # Use HTTP interface
        async with httpx.AsyncClient(timeout=60.0) as http_client:
            url = f"http://{conn_data['host']}:{conn_data['port']}"
            response = await http_client.get(
                url,
                params={
                    "query": f"{sql_query} LIMIT {limit} FORMAT JSONEachRow",
                    "user": conn_data["username"],
                    "password": conn_data["password"],
                    "database": conn_data["database"]
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка запроса: {response.text}"
                )
            
            records = [json.loads(line) for line in response.text.strip().split('\n') if line]
            synced_data[connection_id] = records
            
            return SyncResponse(
                status="success",
                records_imported=len(records),
                message=f"Получено {len(records)} записей из ClickHouse",
                data=records[:10]
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка выполнения запроса: {str(e)}"
        )

# ========== EXCEL ==========

@router.post("/excel/upload", response_model=ConnectionResponse)
async def upload_excel(
    file: UploadFile = File(...),
    name: str = Form(...)
):
    """Upload and parse Excel/CSV file - supports unlimited columns and any format"""
    
    # Поддержка всех форматов
    allowed_extensions = ('.xlsx', '.xls', '.csv', '.tsv', '.txt')
    if not file.filename or not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поддерживаются файлы: {', '.join(allowed_extensions)}"
        )
    
    try:
        contents = await file.read()
        file_ext = file.filename.lower().split('.')[-1]
        df = None
        detected_sep = None  # Для CSV/TSV файлов
        
        # Определение формата и парсинг
        if file_ext in ('xlsx', 'xls'):
            # Excel файлы
            try:
                if file_ext == 'xlsx':
                    # Пробуем все листы, берём первый с данными
                    excel_file = pd.ExcelFile(BytesIO(contents), engine='openpyxl')
                    for sheet_name in excel_file.sheet_names:
                        df = pd.read_excel(BytesIO(contents), sheet_name=sheet_name, engine='openpyxl')
                        if not df.empty and len(df.columns) > 0:
                            break
                else:
                    # Старый формат .xls
                    df = pd.read_excel(BytesIO(contents), engine='xlrd')
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка чтения Excel: {str(e)}"
                )
        
        elif file_ext in ('csv', 'tsv', 'txt'):
            # CSV/TSV файлы - автоматическое определение разделителя
            try:
                # Пробуем разные кодировки
                encodings = ['utf-8', 'utf-8-sig', 'cp1251', 'windows-1251', 'latin-1', 'iso-8859-1']
                content_str = None
                
                for encoding in encodings:
                    try:
                        content_str = contents.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                
                if content_str is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Не удалось определить кодировку файла"
                    )
                
                # Автоматическое определение разделителя
                separators = [',', ';', '\t', '|', ' ']
                detected_sep = ','
                
                # Проверяем первые строки для определения разделителя
                first_lines = content_str.split('\n')[:5]
                max_cols = 0
                
                for sep in separators:
                    cols_count = len(first_lines[0].split(sep)) if first_lines else 0
                    if cols_count > max_cols:
                        max_cols = cols_count
                        detected_sep = sep
                
                # Парсим CSV с автоматическим определением параметров
                df = pd.read_csv(
                    BytesIO(content_str.encode('utf-8')),
                    sep=detected_sep,
                    encoding='utf-8',
                    on_bad_lines='skip',  # Пропускаем плохие строки
                    skipinitialspace=True,
                    quotechar='"',
                    dtype=str,  # Все как строки, потом конвертируем
                    na_values=['', 'NULL', 'null', 'None', 'N/A', 'n/a', '-'],
                    keep_default_na=False
                )
                
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ошибка чтения CSV: {str(e)}"
                )
        
        if df is None or df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл пуст или не содержит данных"
            )
        
        # Очистка названий колонок (убираем пробелы, спецсимволы)
        df.columns = [str(col).strip().replace('\n', ' ').replace('\r', ' ') for col in df.columns]
        
        # Удаляем полностью пустые строки и колонки
        df = df.dropna(how='all')  # Удаляем строки где все пусто
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]  # Удаляем Unnamed колонки
        
        # Если колонки без названий - даём им имена
        for i, col in enumerate(df.columns):
            if not col or col.startswith('Unnamed'):
                df.columns.values[i] = f'Column_{i+1}'
        
        # Конвертация типов - умная обработка
        for col in df.columns:
            # Пробуем конвертировать в числа
            try:
                # Убираем пробелы и запятые
                df[col] = df[col].astype(str).str.replace(r'[\s,]', '', regex=True)
                # Пробуем в float
                numeric_series = pd.to_numeric(df[col], errors='coerce')
                if numeric_series.notna().sum() > len(df) * 0.5:  # Если >50% чисел
                    df[col] = numeric_series
            except:
                pass
            
            # Пробуем конвертировать в даты
            try:
                date_series = pd.to_datetime(df[col], errors='coerce', dayfirst=True)
                if date_series.notna().sum() > len(df) * 0.3:  # Если >30% дат
                    df[col] = date_series
            except:
                pass
        
        # Конвертация в записи
        records = df.to_dict('records')
        
        # Очистка NaN/None значений
        for record in records:
            for key, value in record.items():
                if pd.isna(value) or value == 'nan' or value == 'None':
                    record[key] = None
                elif isinstance(value, (int, float)) and pd.isna(value):
                    record[key] = None
                elif isinstance(value, str) and value.strip() == '':
                    record[key] = None
        
        # Удаляем записи где все значения None
        records = [r for r in records if any(v is not None and v != '' for v in r.values())]
        
        if len(records) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Файл не содержит валидных данных"
            )
        
        connection_id = f"excel_{len(connections_db) + 1}"
        connections_db[connection_id] = {
            "type": "excel",
            "name": name,
            "filename": file.filename,
            "file_format": file_ext.upper(),
            "columns": list(df.columns),
            "columns_count": len(df.columns),
            "status": "connected",
            "total_records": len(records),
            "separator": detected_sep if file_ext in ('csv', 'tsv', 'txt') else None
        }
        synced_data[connection_id] = records
        
        return ConnectionResponse(
            id=connection_id,
            name=name,
            type="Excel/CSV",
            status="connected",
            message=f"Загружено {len(records)} строк, {len(df.columns)} колонок из {file.filename}",
            records_count=len(records)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка обработки файла: {str(e)}"
        )

@router.get("/excel/data/{connection_id}", response_model=SyncResponse)
async def get_excel_data(connection_id: str, limit: int = 100):
    """Get data from uploaded Excel file"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn = connections_db[connection_id]
    if conn["type"] != "excel":
        raise HTTPException(status_code=400, detail="Неверный тип подключения")
    
    records = synced_data.get(connection_id, [])
    
    return SyncResponse(
        status="success",
        records_imported=len(records),
        message=f"Данные из {conn['filename']}",
        data=records[:limit]
    )

# ========== COMMON ENDPOINTS ==========

@router.get("/connections")
async def list_connections():
    """Get list of all connections"""
    return {
        "connections": [
            {
                "id": conn_id,
                "name": conn_data["name"],
                "type": conn_data["type"],
                "status": conn_data["status"],
                "records_count": conn_data.get("total_records", 0)
            }
            for conn_id, conn_data in connections_db.items()
        ],
        "total": len(connections_db)
    }

@router.get("/connections/{connection_id}")
async def get_connection(connection_id: str):
    """Get connection details"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    conn = connections_db[connection_id]
    data = synced_data.get(connection_id, [])
    
    return {
        "connection": {
            "id": connection_id,
            "name": conn["name"],
            "type": conn["type"],
            "status": conn["status"]
        },
        "data_preview": data[:10],
        "total_records": len(data)
    }

@router.get("/connections/{connection_id}/data")
async def get_connection_data(connection_id: str, limit: int = 100, offset: int = 0):
    """Get synced data from connection"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    data = synced_data.get(connection_id, [])
    
    return {
        "data": data[offset:offset + limit],
        "total": len(data),
        "limit": limit,
        "offset": offset
    }

@router.delete("/connections/{connection_id}")
async def delete_connection(connection_id: str):
    """Delete a connection"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    connection = connections_db.pop(connection_id)
    synced_data.pop(connection_id, None)
    
    return {
        "status": "success",
        "message": f"Подключение '{connection['name']}' удалено"
    }

@router.get("/connections/{connection_id}/test")
async def test_connection(connection_id: str):
    """Test if connection is still working"""
    
    if connection_id not in connections_db:
        raise HTTPException(status_code=404, detail="Подключение не найдено")
    
    connection = connections_db[connection_id]
    conn_type = connection["type"]
    
    try:
        if conn_type == "bitrix24":
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{connection['webhook_url']}/profile.json")
                if response.status_code == 200:
                    return {"status": "success", "message": "Bitrix24 подключение активно"}
                    
        elif conn_type == "google_sheets":
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                url = f"https://docs.google.com/spreadsheets/d/{connection['spreadsheet_id']}/gviz/tq?tqx=out:csv&sheet={connection['sheet_name']}"
                response = await client.head(url)
                if response.status_code == 200:
                    return {"status": "success", "message": "Google Sheets доступна"}
                    
        elif conn_type == "postgresql":
            import psycopg2
            conn = psycopg2.connect(
                host=connection["host"],
                port=connection["port"],
                database=connection["database"],
                user=connection["username"],
                password=connection["password"],
                connect_timeout=5
            )
            conn.close()
            return {"status": "success", "message": "PostgreSQL подключение активно"}
            
        elif conn_type == "clickhouse":
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"http://{connection['host']}:{connection['port']}"
                response = await client.get(url, params={"query": "SELECT 1"})
                if response.status_code == 200:
                    return {"status": "success", "message": "ClickHouse подключение активно"}
                    
        elif conn_type == "excel":
            return {"status": "success", "message": "Excel файл загружен"}
            
        elif conn_type == "1c":
            async with httpx.AsyncClient(timeout=10.0) as client:
                auth = (connection["username"], connection["password"])
                response = await client.get(connection["server_url"], auth=auth)
                if response.status_code in [200, 401, 404]:
                    return {"status": "success", "message": "1С сервер доступен"}
        
        return {"status": "unknown", "message": "Не удалось проверить подключение"}
        
    except Exception as e:
        return {"status": "error", "message": f"Ошибка: {str(e)}"}
