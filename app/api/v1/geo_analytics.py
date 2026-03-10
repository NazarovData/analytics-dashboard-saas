"""
📍 Геоаналитика Analitix AI
Анализ данных по регионам, карты продаж, геолокация клиентов
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/geo", tags=["geo-analytics"])

class RegionData(BaseModel):
    """Данные по региону"""
    region: str
    revenue: float
    orders: int
    clients: int
    average_check: float
    coordinates: Optional[Dict[str, float]] = None  # {"lat": 55.7558, "lng": 37.6173}

class GeoAnalyticsResponse(BaseModel):
    """Результат геоаналитики"""
    regions: List[RegionData]
    total_regions: int
    top_regions: List[RegionData]
    map_data: Dict[str, Any]
    summary: Dict[str, Any]

# Демо-данные (в production из БД)
_demo_geo_data = [
    {
        "region": "Москва",
        "revenue": 12500000,
        "orders": 450,
        "clients": 280,
        "average_check": 27777.78,
        "coordinates": {"lat": 55.7558, "lng": 37.6173}
    },
    {
        "region": "Санкт-Петербург",
        "revenue": 8500000,
        "orders": 320,
        "clients": 195,
        "average_check": 26562.50,
        "coordinates": {"lat": 59.9343, "lng": 30.3351}
    },
    {
        "region": "Новосибирск",
        "revenue": 3200000,
        "orders": 145,
        "clients": 98,
        "average_check": 22068.97,
        "coordinates": {"lat": 55.0084, "lng": 82.9357}
    },
    {
        "region": "Екатеринбург",
        "revenue": 2800000,
        "orders": 125,
        "clients": 85,
        "average_check": 22400.00,
        "coordinates": {"lat": 56.8431, "lng": 60.6454}
    },
    {
        "region": "Казань",
        "revenue": 2100000,
        "orders": 95,
        "clients": 68,
        "average_check": 22105.26,
        "coordinates": {"lat": 55.8304, "lng": 49.0661}
    },
    {
        "region": "Краснодар",
        "revenue": 1800000,
        "orders": 88,
        "clients": 62,
        "average_check": 20454.55,
        "coordinates": {"lat": 45.0355, "lng": 38.9753}
    },
    {
        "region": "Душанбе",
        "revenue": 1500000,
        "orders": 72,
        "clients": 55,
        "average_check": 20833.33,
        "coordinates": {"lat": 38.5608, "lng": 68.7870}
    },
]

@router.get("/analytics", response_model=GeoAnalyticsResponse)
async def get_geo_analytics(
    metric: str = Query("revenue", description="Метрика для анализа: revenue, orders, clients"),
    limit: int = Query(20, description="Количество регионов")
):
    """
    Получить геоаналитику по регионам
    
    Метрики:
    - revenue - выручка
    - orders - количество заказов
    - clients - количество клиентов
    """
    
    # Сортируем по выбранной метрике
    sorted_data = sorted(
        _demo_geo_data,
        key=lambda x: x.get(metric, 0),
        reverse=True
    )[:limit]
    
    regions = [RegionData(**item) for item in sorted_data]
    top_regions = regions[:5]
    
    # Данные для карты
    map_data = {
        "center": {"lat": 55.7558, "lng": 37.6173},  # Москва
        "zoom": 4,
        "markers": [
            {
                "position": {"lat": r.coordinates["lat"], "lng": r.coordinates["lng"]},
                "label": r.region,
                "value": getattr(r, metric),
                "revenue": r.revenue,
                "orders": r.orders,
                "clients": r.clients
            }
            for r in regions if r.coordinates
        ]
    }
    
    # Резюме
    total_revenue = sum(r.revenue for r in regions)
    total_orders = sum(r.orders for r in regions)
    total_clients = sum(r.clients for r in regions)
    
    summary = {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_clients": total_clients,
        "avg_revenue_per_region": total_revenue / len(regions) if regions else 0,
        "top_region": top_regions[0].region if top_regions else None,
        "concentration": {
            "top3_percent": (sum(r.revenue for r in top_regions[:3]) / total_revenue * 100) if total_revenue > 0 else 0,
            "top5_percent": (sum(r.revenue for r in top_regions) / total_revenue * 100) if total_revenue > 0 else 0
        }
    }
    
    return GeoAnalyticsResponse(
        regions=regions,
        total_regions=len(regions),
        top_regions=top_regions,
        map_data=map_data,
        summary=summary
    )

@router.get("/region/{region_name}")
async def get_region_details(region_name: str):
    """Получить детальную информацию по региону"""
    region = next((r for r in _demo_geo_data if r["region"].lower() == region_name.lower()), None)
    
    if not region:
        raise HTTPException(status_code=404, detail="Регион не найден")
    
    return {
        "success": True,
        "region": RegionData(**region),
        "trend": {
            "revenue_growth": 15.5,  # Рост выручки за период
            "orders_growth": 12.3,
            "clients_growth": 8.7
        },
        "insights": [
            f"{region['region']} показывает стабильный рост выручки",
            f"Средний чек выше среднего по стране на {(region['average_check'] - 22000) / 22000 * 100:.1f}%",
            f"ТОП-3 товара в регионе: iPhone 15 Pro, MacBook Air M3, AirPods Pro"
        ]
    }

@router.get("/heatmap")
async def get_heatmap_data(
    metric: str = Query("revenue", description="Метрика для тепловой карты")
):
    """Получить данные для тепловой карты"""
    heatmap_data = [
        {
            "lat": r["coordinates"]["lat"],
            "lng": r["coordinates"]["lng"],
            "weight": r.get(metric, 0) / 1000000,  # Нормализуем для карты
            "region": r["region"],
            "value": r.get(metric, 0)
        }
        for r in _demo_geo_data
        if r.get("coordinates")
    ]
    
    return {
        "success": True,
        "metric": metric,
        "heatmap": heatmap_data,
        "max_value": max(r.get(metric, 0) for r in _demo_geo_data) if _demo_geo_data else 0
    }


