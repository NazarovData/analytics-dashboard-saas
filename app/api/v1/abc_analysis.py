"""
ABC/XYZ Analysis API
API для ABC и XYZ анализа товаров
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.abc_analysis import ABCAnalyzer, XYZAnalyzer

router = APIRouter()


class ABCAnalysisRequest(BaseModel):
    """Запрос на ABC анализ"""
    data: List[Dict[str, Any]]


@router.post("/abc")
async def analyze_abc(request: ABCAnalysisRequest):
    """
    ABC анализ товаров по выручке
    
    Категории:
    - A: 80% выручки (ключевые товары)
    - B: 15% выручки (важные товары)
    - C: 5% выручки (дополнительные товары)
    """
    try:
        result = ABCAnalyzer.analyze_products(request.data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка ABC анализа: {str(e)}")


@router.post("/xyz")
async def analyze_xyz(request: ABCAnalysisRequest):
    """
    XYZ анализ стабильности спроса
    
    Категории:
    - X: Стабильный спрос (CV < 10%)
    - Y: Переменный спрос (CV 10-25%)
    - Z: Нестабильный спрос (CV > 25%)
    """
    try:
        result = XYZAnalyzer.analyze_stability(request.data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка XYZ анализа: {str(e)}")


@router.post("/combined")
async def analyze_combined(request: ABCAnalysisRequest):
    """
    Комбинированный ABC/XYZ анализ
    
    Создаёт матрицу 3x3 для оптимизации ассортимента:
    - AX: Ключевые товары со стабильным спросом (приоритет 1)
    - AY: Ключевые товары с переменным спросом (приоритет 2)
    - AZ: Ключевые товары с нестабильным спросом (приоритет 3)
    - BX, BY, BZ: Важные товары
    - CX, CY, CZ: Дополнительные товары
    """
    try:
        abc_result = ABCAnalyzer.analyze_products(request.data)
        xyz_result = XYZAnalyzer.analyze_stability(request.data)
        
        if not abc_result['success'] or not xyz_result['success']:
            return {
                'success': False,
                'message': 'Недостаточно данных для комбинированного анализа'
            }
        
        # Создаём матрицу ABC/XYZ
        matrix = _create_abc_xyz_matrix(
            abc_result['products_by_category'],
            xyz_result['products']
        )
        
        return {
            'success': True,
            'abc_analysis': abc_result,
            'xyz_analysis': xyz_result,
            'matrix': matrix,
            'recommendations': _generate_matrix_recommendations(matrix)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка комбинированного анализа: {str(e)}")


def _create_abc_xyz_matrix(abc_products: Dict, xyz_products: List[Dict]) -> Dict:
    """Создание матрицы ABC/XYZ"""
    # Создаём словарь XYZ категорий по товарам
    xyz_dict = {p['product']: p['xyz_category'] for p in xyz_products}
    
    # Создаём матрицу
    matrix = {}
    for abc_cat in ['A', 'B', 'C']:
        for xyz_cat in ['X', 'Y', 'Z']:
            key = f"{abc_cat}{xyz_cat}"
            matrix[key] = {
                'category': key,
                'products': [],
                'description': _get_matrix_description(abc_cat, xyz_cat),
                'priority': _get_matrix_priority(abc_cat, xyz_cat)
            }
    
    # Распределяем товары по матрице
    for abc_cat, products in abc_products.items():
        for product in products:
            product_name = product['product']
            xyz_cat = xyz_dict.get(product_name, 'Y')  # По умолчанию Y
            
            key = f"{abc_cat}{xyz_cat}"
            matrix[key]['products'].append(product)
    
    return matrix


def _get_matrix_description(abc: str, xyz: str) -> str:
    """Описание ячейки матрицы"""
    descriptions = {
        'AX': '🔥 Ключевые товары со стабильным спросом - максимальный приоритет',
        'AY': '⚡ Ключевые товары с переменным спросом - требуют мониторинга',
        'AZ': '⚠️ Ключевые товары с нестабильным спросом - сложно планировать',
        'BX': '✅ Важные товары со стабильным спросом - оптимизировать закупки',
        'BY': '📊 Важные товары с переменным спросом - средний приоритет',
        'BZ': '❓ Важные товары с нестабильным спросом - анализировать причины',
        'CX': '📦 Дополнительные товары со стабильным спросом - минимальный запас',
        'CY': '💤 Дополнительные товары с переменным спросом - под заказ',
        'CZ': '🗑️ Дополнительные товары с нестабильным спросом - рассмотреть исключение'
    }
    return descriptions.get(f"{abc}{xyz}", '')


def _get_matrix_priority(abc: str, xyz: str) -> int:
    """Приоритет ячейки матрицы (1 - высший)"""
    priorities = {
        'AX': 1, 'AY': 2, 'AZ': 3,
        'BX': 4, 'BY': 5, 'BZ': 6,
        'CX': 7, 'CY': 8, 'CZ': 9
    }
    return priorities.get(f"{abc}{xyz}", 9)


def _generate_matrix_recommendations(matrix: Dict) -> List[str]:
    """Генерация рекомендаций на основе матрицы"""
    recommendations = []
    
    # AX товары
    ax_count = len(matrix.get('AX', {}).get('products', []))
    if ax_count > 0:
        recommendations.append(
            f"🔥 {ax_count} товаров в категории AX - обеспечьте их постоянное наличие на складе"
        )
    
    # AZ товары
    az_count = len(matrix.get('AZ', {}).get('products', []))
    if az_count > 0:
        recommendations.append(
            f"⚠️ {az_count} ключевых товаров с нестабильным спросом - проанализируйте причины колебаний"
        )
    
    # CZ товары
    cz_count = len(matrix.get('CZ', {}).get('products', []))
    if cz_count > 5:
        recommendations.append(
            f"🗑️ {cz_count} товаров в категории CZ - рассмотрите исключение из ассортимента"
        )
    
    recommendations.append(
        "💡 Сфокусируйтесь на категориях AX и AY - они приносят основную прибыль"
    )
    
    return recommendations
