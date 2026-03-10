"""
Professional Charts API with Seaborn
Создание красивых графиков для клиентов
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Для работы без GUI
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/charts", tags=["charts"])

# Настройка стиля Seaborn
sns.set_theme(style="whitegrid", palette="husl")
sns.set_context("notebook", font_scale=1.2)

# Русские шрифты
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.unicode_minus'] = False


class ChartData(BaseModel):
    labels: List[str]
    values: List[float]
    title: str
    xlabel: Optional[str] = ""
    ylabel: Optional[str] = ""
    chart_type: str = "bar"  # bar, line, pie, heatmap, scatter


@router.post("/generate")
async def generate_chart(data: ChartData):
    """
    Генерация профессионального графика с Seaborn
    """
    try:
        # Создаём DataFrame
        df = pd.DataFrame({
            'label': data.labels,
            'value': data.values
        })
        
        # Создаём фигуру
        fig, ax = plt.subplots(figsize=(12, 6), dpi=100)
        
        # Выбираем тип графика
        if data.chart_type == "bar":
            # Столбчатая диаграмма
            sns.barplot(
                data=df,
                x='label',
                y='value',
                ax=ax,
                palette='viridis',
                edgecolor='black',
                linewidth=1.5
            )
            
            # Добавляем значения на столбцы
            for i, (label, value) in enumerate(zip(data.labels, data.values)):
                ax.text(i, value, f'{value:,.0f}', 
                       ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        elif data.chart_type == "line":
            # Линейный график
            sns.lineplot(
                data=df,
                x='label',
                y='value',
                ax=ax,
                marker='o',
                markersize=10,
                linewidth=3,
                color='#2E86AB'
            )
            
            # Добавляем значения на точки
            for i, (label, value) in enumerate(zip(data.labels, data.values)):
                ax.text(i, value, f'{value:,.0f}', 
                       ha='center', va='bottom', fontsize=9)
        
        elif data.chart_type == "pie":
            # Круговая диаграмма
            colors = sns.color_palette('husl', len(data.labels))
            wedges, texts, autotexts = ax.pie(
                data.values,
                labels=data.labels,
                autopct='%1.1f%%',
                startangle=90,
                colors=colors,
                explode=[0.05] * len(data.labels),
                shadow=True
            )
            
            # Улучшаем текст
            for text in texts:
                text.set_fontsize(11)
                text.set_fontweight('bold')
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontsize(10)
                autotext.set_fontweight('bold')
        
        elif data.chart_type == "horizontal_bar":
            # Горизонтальная столбчатая
            sns.barplot(
                data=df,
                y='label',
                x='value',
                ax=ax,
                palette='rocket',
                edgecolor='black',
                linewidth=1.5
            )
            
            # Добавляем значения
            for i, (label, value) in enumerate(zip(data.labels, data.values)):
                ax.text(value, i, f' {value:,.0f}', 
                       ha='left', va='center', fontsize=10, fontweight='bold')
        
        # Настройка графика
        ax.set_title(data.title, fontsize=16, fontweight='bold', pad=20)
        if data.xlabel:
            ax.set_xlabel(data.xlabel, fontsize=12, fontweight='bold')
        if data.ylabel:
            ax.set_ylabel(data.ylabel, fontsize=12, fontweight='bold')
        
        # Поворот меток на оси X для лучшей читаемости
        if data.chart_type in ["bar", "line"]:
            plt.xticks(rotation=45, ha='right')
        
        # Сетка для лучшей читаемости
        if data.chart_type != "pie":
            ax.grid(True, alpha=0.3, linestyle='--')
        
        # Убираем лишние границы
        sns.despine(left=True, bottom=True)
        
        # Плотная компоновка
        plt.tight_layout()
        
        # Сохраняем в буфер
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        buf.seek(0)
        plt.close(fig)
        
        # Конвертируем в base64
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{img_base64}",
            "message": "График успешно создан"
        }
        
    except Exception as e:
        logger.error(f"Error generating chart: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ошибка создания графика: {str(e)}")


@router.post("/revenue-trend")
async def revenue_trend_chart(daily_revenue: List[dict]):
    """
    График динамики выручки (красивый линейный)
    """
    try:
        df = pd.DataFrame(daily_revenue)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        fig, ax = plt.subplots(figsize=(14, 6), dpi=100)
        
        # Линейный график с заливкой
        ax.plot(df['date'], df['revenue'], 
               marker='o', markersize=8, linewidth=3, 
               color='#2E86AB', label='Выручка')
        ax.fill_between(df['date'], df['revenue'], alpha=0.3, color='#2E86AB')
        
        # Добавляем среднюю линию
        mean_revenue = df['revenue'].mean()
        ax.axhline(y=mean_revenue, color='red', linestyle='--', 
                  linewidth=2, label=f'Средняя: {mean_revenue:,.0f}₽')
        
        # Настройка
        ax.set_title('📈 Динамика выручки', fontsize=18, fontweight='bold', pad=20)
        ax.set_xlabel('Дата', fontsize=12, fontweight='bold')
        ax.set_ylabel('Выручка (₽)', fontsize=12, fontweight='bold')
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3, linestyle='--')
        
        # Форматирование оси Y
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}₽'))
        
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        
        # Сохранение
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        buf.seek(0)
        plt.close(fig)
        
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{img_base64}"
        }
        
    except Exception as e:
        logger.error(f"Error generating revenue trend: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/top-products")
async def top_products_chart(products: List[dict]):
    """
    График топ товаров (красивая горизонтальная диаграмма)
    """
    try:
        df = pd.DataFrame(products)
        df = df.sort_values('revenue', ascending=True).tail(10)
        
        fig, ax = plt.subplots(figsize=(12, 8), dpi=100)
        
        # Горизонтальная диаграмма с градиентом
        bars = ax.barh(df['product'], df['revenue'], 
                      color=sns.color_palette('rocket', len(df)),
                      edgecolor='black', linewidth=1.5)
        
        # Добавляем значения
        for i, (product, revenue) in enumerate(zip(df['product'], df['revenue'])):
            ax.text(revenue, i, f' {revenue:,.0f}₽', 
                   ha='left', va='center', fontsize=11, fontweight='bold')
        
        # Настройка
        ax.set_title('🏆 Топ-10 товаров по выручке', fontsize=18, fontweight='bold', pad=20)
        ax.set_xlabel('Выручка (₽)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Товар', fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3, linestyle='--', axis='x')
        
        plt.tight_layout()
        
        # Сохранение
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        buf.seek(0)
        plt.close(fig)
        
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{img_base64}"
        }
        
    except Exception as e:
        logger.error(f"Error generating top products chart: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Проверка доступности сервиса графиков"""
    return {
        "status": "ok",
        "seaborn_version": sns.__version__,
        "matplotlib_version": matplotlib.__version__
    }
