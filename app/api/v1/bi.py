"""
BI Analytics API for PostgreSQL
Business Intelligence инструменты для анализа данных
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import pandas as pd
import psycopg2
from datetime import datetime, timedelta
import json

router = APIRouter()

class BIQueryRequest(BaseModel):
    connection_id: str
    query: str
    chart_type: Optional[str] = "line"  # line, bar, pie, area, table
    limit: Optional[int] = 1000

class BIAnalysisRequest(BaseModel):
    connection_id: str
    table_name: str
    date_column: Optional[str] = None
    value_column: Optional[str] = None
    group_by_column: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

@router.post("/postgresql/bi/query")
async def execute_bi_query(request: BIQueryRequest):
    """Выполнить SQL запрос и получить данные для визуализации"""
    
    # Получаем подключение из connections_db (временно, потом из БД)
    from app.api.v1.integrations import connections_db
    
    if request.connection_id not in connections_db:
        raise HTTPException(
            status_code=404, 
            detail=f"Подключение {request.connection_id} не найдено. Доступные: {list(connections_db.keys())}"
        )
    
    conn_data = connections_db[request.connection_id]
    if conn_data.get("type") != "postgresql":
        raise HTTPException(
            status_code=400, 
            detail=f"Только для PostgreSQL. Тип подключения: {conn_data.get('type')}"
        )
    
    try:
        import psycopg2
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Библиотека psycopg2 не установлена. Установите: pip install psycopg2-binary"
        )
    
    conn = None
    try:
        # Проверяем наличие всех необходимых полей
        required_fields = ["host", "port", "database", "username", "password"]
        missing_fields = [f for f in required_fields if f not in conn_data]
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Отсутствуют поля подключения: {', '.join(missing_fields)}"
            )
        
        conn = psycopg2.connect(
            host=conn_data["host"],
            port=conn_data["port"],
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"],
            connect_timeout=10
        )
        
        # Проверяем запрос на безопасность (базовая защита от SQL injection)
        query_lower = request.query.lower().strip()
        dangerous_keywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update']
        if any(keyword in query_lower for keyword in dangerous_keywords):
            # Разрешаем только SELECT запросы для безопасности
            if not query_lower.startswith('select'):
                raise HTTPException(
                    status_code=400,
                    detail="Разрешены только SELECT запросы для безопасности"
                )
        
        # Выполняем запрос через SQLAlchemy для совместимости с pandas
        from sqlalchemy import create_engine, text
        engine = create_engine(
            f"postgresql://{conn_data['username']}:{conn_data['password']}@{conn_data['host']}:{conn_data['port']}/{conn_data['database']}"
        )
        df = pd.read_sql_query(text(request.query), engine)
        engine.dispose()
        
        if df.empty:
            return {
                "status": "success",
                "data": [],
                "columns": [],
                "row_count": 0,
                "message": "Запрос выполнен, но данных не найдено"
            }
        
        # Конвертируем в JSON
        records = df.to_dict('records')
        
        # Очистка NaN и дат
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    record[key] = value.isoformat()
                elif isinstance(value, (int, float)) and pd.isna(value):
                    record[key] = None
        
        return {
            "status": "success",
            "data": records[:request.limit] if request.limit else records,
            "columns": list(df.columns),
            "column_types": {col: str(df[col].dtype) for col in df.columns},
            "row_count": len(records[:request.limit]) if request.limit else len(records),
            "total_rows": len(df),
            "chart_type": request.chart_type
        }
        
    except psycopg2.OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка подключения к базе данных: {str(e)}"
        )
    except psycopg2.ProgrammingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка в SQL запросе: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка выполнения запроса: {str(e)}\n\nДетали: {error_details[:500]}"
        )
    finally:
        if conn:
            conn.close()

@router.post("/postgresql/bi/analyze")
async def analyze_table_bi(request: BIAnalysisRequest):
    """Умный анализ таблицы - автоматически строит графики"""
    
    from app.api.v1.integrations import connections_db
    
    if request.connection_id not in connections_db:
        raise HTTPException(
            status_code=404, 
            detail=f"Подключение {request.connection_id} не найдено"
        )
    
    conn_data = connections_db[request.connection_id]
    
    if conn_data.get("type") != "postgresql":
        raise HTTPException(
            status_code=400,
            detail=f"Только для PostgreSQL. Тип: {conn_data.get('type')}"
        )
    
    try:
        import psycopg2
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Библиотека psycopg2 не установлена. Установите: pip install psycopg2-binary"
        )
    
    conn = None
    try:
        # Проверяем наличие всех необходимых полей
        required_fields = ["host", "port", "database", "username", "password"]
        missing_fields = [f for f in required_fields if f not in conn_data]
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Отсутствуют поля подключения: {', '.join(missing_fields)}"
            )
        
        conn = psycopg2.connect(
            host=conn_data["host"],
            port=conn_data["port"],
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"],
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Получаем структуру таблицы
        cursor.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position
        """, (request.table_name,))
        
        columns_info = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Строим запрос
        select_cols = ["*"]
        where_clause = ""
        
        if request.filters:
            conditions = []
            for col, value in request.filters.items():
                if col in columns_info:
                    if isinstance(value, str):
                        conditions.append(f"{col} = '{value}'")
                    else:
                        conditions.append(f"{col} = {value}")
            if conditions:
                where_clause = "WHERE " + " AND ".join(conditions)
        
        query = f"SELECT {', '.join(select_cols)} FROM {request.table_name} {where_clause} LIMIT 10000"
        
        # Используем SQLAlchemy для совместимости с pandas
        from sqlalchemy import create_engine, text
        engine = create_engine(
            f"postgresql://{conn_data['username']}:{conn_data['password']}@{conn_data['host']}:{conn_data['port']}/{conn_data['database']}"
        )
        df = pd.read_sql_query(text(query), engine)
        engine.dispose()
        conn.close()
        
        if df.empty:
            raise HTTPException(status_code=400, detail="Таблица пуста")
        
        # Автоматический анализ
        analysis = {
            "table_name": request.table_name,
            "total_rows": len(df),
            "columns": list(df.columns),
            "column_info": columns_info,
            "charts": []
        }
        
        # Определяем колонки для анализа
        date_col = request.date_column
        value_col = request.value_column
        group_col = request.group_by_column
        
        # Автопоиск колонок если не указаны
        if not date_col:
            for col in df.columns:
                if df[col].dtype in ['datetime64[ns]', 'object']:
                    try:
                        pd.to_datetime(df[col].iloc[0])
                        date_col = col
                        break
                    except:
                        pass
        
        if not value_col:
            numeric_cols = df.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                # Берём колонку с наибольшей суммой
                value_col = numeric_cols[0]
                for col in numeric_cols:
                    if df[col].sum() > df[value_col].sum():
                        value_col = col
        
        # 1. Временной ряд (если есть дата и значение)
        if date_col and value_col:
            try:
                df[date_col] = pd.to_datetime(df[date_col])
                time_series = df.groupby(df[date_col].dt.date)[value_col].sum().reset_index()
                time_series.columns = ['date', 'value']
                
                # Очистка NaN из данных графика
                time_series_data = time_series.to_dict('records')[-30:]
                for item in time_series_data:
                    if pd.isna(item.get('value')):
                        item['value'] = 0
                    elif isinstance(item.get('value'), float):
                        if pd.isna(item['value']) or item['value'] == float('inf') or item['value'] == float('-inf'):
                            item['value'] = 0
                    if isinstance(item.get('date'), (pd.Timestamp, datetime)):
                        item['date'] = item['date'].isoformat() if hasattr(item['date'], 'isoformat') else str(item['date'])
                
                analysis["charts"].append({
                    "type": "line",
                    "title": f"Динамика {value_col} по времени",
                    "data": time_series_data,
                    "x_axis": "date",
                    "y_axis": "value"
                })
            except Exception as e:
                print(f"Ошибка создания временного ряда: {e}")
                pass
        
        # 2. Группировка по категориям (если есть группа)
        if group_col and value_col:
            try:
                grouped = df.groupby(group_col)[value_col].sum().sort_values(ascending=False).head(10)
                
                # Очистка NaN из данных графика
                pie_data = []
                for k, v in grouped.items():
                    value = float(v) if not pd.isna(v) and v != float('inf') and v != float('-inf') else 0
                    pie_data.append({
                        "name": str(k) if k is not None else "Не указано",
                        "value": value
                    })
                
                analysis["charts"].append({
                    "type": "pie",
                    "title": f"Распределение {value_col} по {group_col}",
                    "data": pie_data,
                    "x_axis": "name",
                    "y_axis": "value"
                })
            except Exception as e:
                print(f"Ошибка создания pie графика: {e}")
                pass
        
        # 3. Топ значения
        if value_col:
            try:
                top_items = df.nlargest(10, value_col)[[group_col or df.columns[0], value_col]]
                top_records = top_items.to_dict('records')
                
                # Очистка NaN из данных графика
                for item in top_records:
                    for key, val in item.items():
                        if pd.isna(val):
                            item[key] = None
                        elif isinstance(val, (pd.Timestamp, datetime)):
                            item[key] = val.isoformat() if hasattr(val, 'isoformat') else str(val)
                        elif isinstance(val, (int, float)):
                            if pd.isna(val) or val == float('inf') or val == float('-inf'):
                                item[key] = 0
                
                analysis["charts"].append({
                    "type": "bar",
                    "title": f"Топ-10 по {value_col}",
                    "data": top_records,
                    "x_axis": group_col or df.columns[0],
                    "y_axis": value_col
                })
            except Exception as e:
                print(f"Ошибка создания bar графика: {e}")
                pass
        
        # 4. Статистика
        if value_col:
            def safe_float(value):
                """Конвертирует значение в float, заменяя NaN на None"""
                if pd.isna(value) or value == float('inf') or value == float('-inf'):
                    return None
                return float(value)
            
            analysis["statistics"] = {
                "total": safe_float(df[value_col].sum()),
                "average": safe_float(df[value_col].mean()),
                "median": safe_float(df[value_col].median()),
                "min": safe_float(df[value_col].min()),
                "max": safe_float(df[value_col].max()),
                "std": safe_float(df[value_col].std())
            }
        
        # 5. Сводная таблица
        summary_records = df.head(100).to_dict('records')
        # Очистка NaN из сводной таблицы
        for record in summary_records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    record[key] = value.isoformat()
                elif isinstance(value, (int, float)):
                    if pd.isna(value) or value == float('inf') or value == float('-inf'):
                        record[key] = None
        analysis["summary_table"] = summary_records
        
        return analysis
        
    except psycopg2.OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка подключения к базе данных: {str(e)}"
        )
    except psycopg2.ProgrammingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка в SQL запросе: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка анализа: {str(e)}\n\nДетали: {error_details[:500]}"
        )
    finally:
        if conn:
            conn.close()

@router.get("/postgresql/bi/suggestions/{connection_id}")
async def get_bi_suggestions(
    connection_id: str, 
    table_name: str = Query(..., description="Имя таблицы для анализа")
):
    """Получить предложения по анализу таблицы"""
    
    from app.api.v1.integrations import connections_db
    
    if connection_id not in connections_db:
        raise HTTPException(
            status_code=404, 
            detail=f"Подключение {connection_id} не найдено"
        )
    
    conn_data = connections_db[connection_id]
    
    if conn_data.get("type") != "postgresql":
        raise HTTPException(
            status_code=400,
            detail=f"Только для PostgreSQL. Тип: {conn_data.get('type')}"
        )
    
    try:
        import psycopg2
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Библиотека psycopg2 не установлена. Установите: pip install psycopg2-binary"
        )
    
    conn = None
    try:
        required_fields = ["host", "port", "database", "username", "password"]
        missing_fields = [f for f in required_fields if f not in conn_data]
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Отсутствуют поля подключения: {', '.join(missing_fields)}"
            )
        
        conn = psycopg2.connect(
            host=conn_data["host"],
            port=conn_data["port"],
            database=conn_data["database"],
            user=conn_data["username"],
            password=conn_data["password"],
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Получаем колонки
        cursor.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
        """, (table_name,))
        
        columns = cursor.fetchall()
        conn.close()
        
        # Генерируем предложения
        suggestions = []
        
        date_cols = [c[0] for c in columns if 'date' in c[1] or 'time' in c[1]]
        numeric_cols = [c[0] for c in columns if c[1] in ['integer', 'bigint', 'numeric', 'real', 'double precision']]
        text_cols = [c[0] for c in columns if c[1] in ['varchar', 'text', 'character varying']]
        
        # Предложение 1: Временной ряд
        if date_cols and numeric_cols:
            suggestions.append({
                "title": "📈 Динамика по времени",
                "description": f"График изменения {numeric_cols[0]} по {date_cols[0]}",
                "query": f"SELECT {date_cols[0]}, SUM({numeric_cols[0]}) as total FROM {table_name} GROUP BY {date_cols[0]} ORDER BY {date_cols[0]}",
                "chart_type": "line"
            })
        
        # Предложение 2: Группировка
        if text_cols and numeric_cols:
            suggestions.append({
                "title": "🥧 Распределение по категориям",
                "description": f"Распределение {numeric_cols[0]} по {text_cols[0]}",
                "query": f"SELECT {text_cols[0]}, SUM({numeric_cols[0]}) as total FROM {table_name} GROUP BY {text_cols[0]} ORDER BY total DESC LIMIT 10",
                "chart_type": "pie"
            })
        
        # Предложение 3: Топ значения
        if numeric_cols:
            suggestions.append({
                "title": "🏆 Топ значения",
                "description": f"Топ-10 записей по {numeric_cols[0]}",
                "query": f"SELECT * FROM {table_name} ORDER BY {numeric_cols[0]} DESC LIMIT 10",
                "chart_type": "bar"
            })
        
        return {
            "suggestions": suggestions,
            "columns": {
                "dates": date_cols,
                "numeric": numeric_cols,
                "text": text_cols
            }
        }
        
    except psycopg2.OperationalError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка подключения к базе данных: {str(e)}"
        )
    except psycopg2.ProgrammingError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ошибка в SQL запросе: {str(e)}"
        )
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка: {str(e)}\n\nДетали: {error_details[:500]}"
        )
    finally:
        if conn:
            conn.close()

