"""
ABC Analysis Service
ABC/XYZ анализ товаров для оптимизации ассортимента
"""
from typing import Dict, List, Any
import pandas as pd
import numpy as np


class ABCAnalyzer:
    """Сервис ABC/XYZ анализа товаров"""
    
    @staticmethod
    def analyze_products(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        ABC анализ товаров по выручке
        
        A - 80% выручки (самые важные)
        B - 15% выручки (средние)
        C - 5% выручки (наименее важные)
        """
        if not data:
            return {
                'success': False,
                'message': 'Нет данных для анализа'
            }
        
        # Создаём DataFrame
        df = pd.DataFrame(data)
        
        # Группируем по товарам
        products = df.groupby('product').agg({
            'revenue': 'sum',
            'quantity': 'sum'
        }).reset_index()
        
        # Сортируем по выручке
        products = products.sort_values('revenue', ascending=False)
        
        # Рассчитываем накопительную долю
        total_revenue = products['revenue'].sum()
        products['revenue_share'] = (products['revenue'] / total_revenue * 100).round(2)
        products['cumulative_share'] = products['revenue_share'].cumsum().round(2)
        
        # Присваиваем категории ABC
        products['abc_category'] = products['cumulative_share'].apply(
            lambda x: 'A' if x <= 80 else ('B' if x <= 95 else 'C')
        )
        
        # Статистика по категориям
        abc_stats = []
        for category in ['A', 'B', 'C']:
            cat_products = products[products['abc_category'] == category]
            abc_stats.append({
                'category': category,
                'products_count': int(len(cat_products)),
                'revenue': float(cat_products['revenue'].sum()),
                'revenue_share': float(cat_products['revenue_share'].sum()),
                'description': ABCAnalyzer._get_category_description(category)
            })
        
        # Топ товары по категориям
        products_by_category = {}
        for category in ['A', 'B', 'C']:
            cat_products = products[products['abc_category'] == category].head(10)
            products_by_category[category] = [
                {
                    'product': row['product'],
                    'revenue': float(row['revenue']),
                    'revenue_share': float(row['revenue_share']),
                    'cumulative_share': float(row['cumulative_share']),
                    'quantity': int(row['quantity'])
                }
                for _, row in cat_products.iterrows()
            ]
        
        return {
            'success': True,
            'total_products': int(len(products)),
            'total_revenue': float(total_revenue),
            'abc_stats': abc_stats,
            'products_by_category': products_by_category,
            'recommendations': ABCAnalyzer._generate_recommendations(abc_stats)
        }
    
    @staticmethod
    def _get_category_description(category: str) -> str:
        """Описание категории ABC"""
        descriptions = {
            'A': '🔥 Ключевые товары (80% выручки) - требуют максимального внимания',
            'B': '⚡ Важные товары (15% выручки) - стабильный ассортимент',
            'C': '📦 Дополнительные товары (5% выручки) - можно оптимизировать'
        }
        return descriptions.get(category, '')
    
    @staticmethod
    def _generate_recommendations(abc_stats: List[Dict]) -> List[str]:
        """Генерация рекомендаций на основе ABC анализа"""
        recommendations = []
        
        # Находим статистику по категориям
        a_stats = next((s for s in abc_stats if s['category'] == 'A'), None)
        c_stats = next((s for s in abc_stats if s['category'] == 'C'), None)
        
        if a_stats:
            recommendations.append(
                f"🔥 Категория A: {a_stats['products_count']} товаров приносят "
                f"{a_stats['revenue_share']:.1f}% выручки. Обеспечьте их наличие на складе!"
            )
        
        if c_stats and c_stats['products_count'] > 20:
            recommendations.append(
                f"📦 Категория C: {c_stats['products_count']} товаров приносят только "
                f"{c_stats['revenue_share']:.1f}% выручки. Рассмотрите сокращение ассортимента."
            )
        
        recommendations.append(
            "💡 Сфокусируйтесь на товарах категории A - они приносят основную прибыль"
        )
        
        return recommendations


class XYZAnalyzer:
    """Сервис XYZ анализа (стабильность спроса)"""
    
    @staticmethod
    def analyze_stability(data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        XYZ анализ стабильности спроса
        
        X - стабильный спрос (коэффициент вариации < 10%)
        Y - переменный спрос (10-25%)
        Z - нестабильный спрос (> 25%)
        """
        if not data:
            return {
                'success': False,
                'message': 'Нет данных для анализа'
            }
        
        df = pd.DataFrame(data)
        
        # Группируем по товарам и датам
        daily_sales = df.groupby(['product', 'date']).agg({
            'quantity': 'sum'
        }).reset_index()
        
        # Рассчитываем коэффициент вариации для каждого товара
        products_stability = []
        for product in daily_sales['product'].unique():
            product_data = daily_sales[daily_sales['product'] == product]
            
            if len(product_data) < 2:
                continue
            
            mean_qty = product_data['quantity'].mean()
            std_qty = product_data['quantity'].std()
            
            # Коэффициент вариации (CV)
            cv = (std_qty / mean_qty * 100) if mean_qty > 0 else 0
            
            # Определяем категорию XYZ
            if cv < 10:
                xyz_category = 'X'
            elif cv < 25:
                xyz_category = 'Y'
            else:
                xyz_category = 'Z'
            
            products_stability.append({
                'product': product,
                'mean_quantity': float(mean_qty),
                'std_quantity': float(std_qty),
                'coefficient_variation': float(cv),
                'xyz_category': xyz_category,
                'stability': XYZAnalyzer._get_stability_description(xyz_category)
            })
        
        # Сортируем по коэффициенту вариации
        products_stability.sort(key=lambda x: x['coefficient_variation'])
        
        # Статистика по категориям
        xyz_stats = []
        for category in ['X', 'Y', 'Z']:
            cat_products = [p for p in products_stability if p['xyz_category'] == category]
            xyz_stats.append({
                'category': category,
                'products_count': len(cat_products),
                'description': XYZAnalyzer._get_category_description(category)
            })
        
        return {
            'success': True,
            'total_products': len(products_stability),
            'xyz_stats': xyz_stats,
            'products': products_stability[:20],  # Топ-20
            'recommendations': XYZAnalyzer._generate_recommendations(xyz_stats)
        }
    
    @staticmethod
    def _get_stability_description(category: str) -> str:
        """Описание стабильности"""
        descriptions = {
            'X': 'Стабильный спрос',
            'Y': 'Переменный спрос',
            'Z': 'Нестабильный спрос'
        }
        return descriptions.get(category, '')
    
    @staticmethod
    def _get_category_description(category: str) -> str:
        """Описание категории XYZ"""
        descriptions = {
            'X': '✅ Стабильный спрос (CV < 10%) - легко планировать закупки',
            'Y': '⚠️ Переменный спрос (CV 10-25%) - требует мониторинга',
            'Z': '❌ Нестабильный спрос (CV > 25%) - сложно прогнозировать'
        }
        return descriptions.get(category, '')
    
    @staticmethod
    def _generate_recommendations(xyz_stats: List[Dict]) -> List[str]:
        """Генерация рекомендаций"""
        recommendations = []
        
        x_stats = next((s for s in xyz_stats if s['category'] == 'X'), None)
        z_stats = next((s for s in xyz_stats if s['category'] == 'Z'), None)
        
        if x_stats and x_stats['products_count'] > 0:
            recommendations.append(
                f"✅ {x_stats['products_count']} товаров со стабильным спросом - "
                f"оптимизируйте закупки под постоянный объём"
            )
        
        if z_stats and z_stats['products_count'] > 0:
            recommendations.append(
                f"❌ {z_stats['products_count']} товаров с нестабильным спросом - "
                f"держите минимальный запас или работайте под заказ"
            )
        
        return recommendations
