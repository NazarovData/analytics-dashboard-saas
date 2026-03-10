"""
PDF Export Service
Сервис для экспорта аналитических отчётов в PDF
"""
from typing import Dict, Any, List, Optional
from datetime import datetime as dt_datetime
from io import BytesIO
import os

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, 
        Spacer, PageBreak, Image, Frame, PageTemplate
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


class PDFExportService:
    """Сервис для экспорта отчётов в PDF"""
    
    def __init__(self):
        self.page_width, self.page_height = A4
        self.styles = self._setup_styles()
        
    def _setup_styles(self):
        """Настройка стилей для PDF"""
        styles = getSampleStyleSheet()
        
        # Заголовок отчёта
        styles.add(ParagraphStyle(
            name='ReportTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Подзаголовок
        styles.add(ParagraphStyle(
            name='ReportSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=20,
            alignment=TA_CENTER
        ))
        
        # Заголовок секции
        styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=15,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        ))
        
        # Метрика
        styles.add(ParagraphStyle(
            name='MetricValue',
            parent=styles['Normal'],
            fontSize=32,
            textColor=colors.HexColor('#10b981'),
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Метка метрики
        styles.add(ParagraphStyle(
            name='MetricLabel',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#64748b'),
            alignment=TA_CENTER
        ))
        
        # AI инсайт
        styles.add(ParagraphStyle(
            name='AIInsight',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#334155'),
            spaceAfter=10,
            leftIndent=20
        ))
        
        return styles
    
    def generate_report(
        self,
        data: Dict[str, Any],
        filename: str = "report.pdf",
        company_name: Optional[str] = None,
        logo_path: Optional[str] = None
    ) -> BytesIO:
        """
        Генерация PDF отчёта
        
        Args:
            data: Данные аналитики
            filename: Имя файла
            company_name: Название компании
            logo_path: Путь к логотипу
            
        Returns:
            BytesIO: PDF файл в памяти
        """
        if not REPORTLAB_AVAILABLE:
            raise ImportError("reportlab не установлен. Установите: pip install reportlab")
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Элементы документа
        story = []
        
        # Заголовок
        story.extend(self._create_header(company_name, logo_path))
        
        # Основные метрики
        if 'metrics' in data:
            story.extend(self._create_metrics_section(data['metrics']))
        
        # AI инсайты
        if 'ai_insights' in data:
            story.extend(self._create_insights_section(data['ai_insights']))
        
        # Топ товары
        if 'top_products' in data:
            story.extend(self._create_top_products_section(data['top_products']))
        
        # ABC анализ
        if 'abc_analysis' in data:
            story.extend(self._create_abc_section(data['abc_analysis']))
        
        # Футер
        story.extend(self._create_footer())
        
        # Генерация PDF
        doc.build(story, onFirstPage=self._add_page_number, onLaterPages=self._add_page_number)
        
        buffer.seek(0)
        return buffer
    
    def _create_header(self, company_name: Optional[str], logo_path: Optional[str]) -> List:
        """Создание заголовка отчёта"""
        elements = []
        
        # Логотип (если есть)
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image(logo_path, width=2*inch, height=1*inch)
                elements.append(logo)
                elements.append(Spacer(1, 0.3*inch))
            except:
                pass
        
        # Название компании
        if company_name:
            elements.append(Paragraph(company_name, self.styles['ReportTitle']))
        else:
            elements.append(Paragraph("📊 Analitix AI", self.styles['ReportTitle']))
        
        # Подзаголовок
        elements.append(Paragraph("Аналитический отчёт", self.styles['ReportSubtitle']))
        
        # Дата
        date_str = dt_datetime.now().strftime("%d.%m.%Y %H:%M")
        elements.append(Paragraph(f"Дата: {date_str}", self.styles['MetricLabel']))
        elements.append(Spacer(1, 0.5*inch))
        
        return elements
    
    def _create_metrics_section(self, metrics: Dict[str, Any]) -> List:
        """Создание секции с метриками"""
        elements = []
        
        elements.append(Paragraph("📈 Основные показатели", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Таблица метрик (2 колонки)
        metrics_data = []
        metrics_list = list(metrics.items())
        
        for i in range(0, len(metrics_list), 2):
            row = []
            
            # Первая метрика
            key1, value1 = metrics_list[i]
            cell1 = self._create_metric_cell(key1, value1)
            row.append(cell1)
            
            # Вторая метрика (если есть)
            if i + 1 < len(metrics_list):
                key2, value2 = metrics_list[i + 1]
                cell2 = self._create_metric_cell(key2, value2)
                row.append(cell2)
            else:
                row.append('')
            
            metrics_data.append(row)
        
        # Создание таблицы
        table = Table(metrics_data, colWidths=[8*cm, 8*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 15),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5*inch))
        
        return elements
    
    def _create_metric_cell(self, key: str, value: Any) -> str:
        """Создание ячейки метрики"""
        # Форматирование значения
        if isinstance(value, (int, float)):
            if key in ['total_revenue', 'total_profit', 'avg_check']:
                formatted_value = f"{value:,.0f} ₽"
            elif key in ['margin_percent']:
                formatted_value = f"{value:.1f}%"
            else:
                formatted_value = f"{value:,.0f}"
        else:
            formatted_value = str(value)
        
        # Название метрики
        metric_names = {
            'total_revenue': 'Выручка',
            'total_orders': 'Заказов',
            'avg_check': 'Средний чек',
            'unique_customers': 'Клиентов',
            'total_profit': 'Прибыль',
            'margin_percent': 'Маржа'
        }
        
        label = metric_names.get(key, key.replace('_', ' ').title())
        
        return f"<b><font size='24' color='#10b981'>{formatted_value}</font></b><br/><font size='10' color='#64748b'>{label}</font>"
    
    def _create_insights_section(self, insights: List[Dict[str, Any]]) -> List:
        """Создание секции с AI инсайтами"""
        elements = []
        
        elements.append(Paragraph("🤖 AI Рекомендации", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        for i, insight in enumerate(insights[:5], 1):  # Топ-5 инсайтов
            icon = "✅" if insight.get('type') == 'success' else "💡"
            text = f"{icon} <b>{i}.</b> {insight.get('message', '')}"
            elements.append(Paragraph(text, self.styles['AIInsight']))
        
        elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    def _create_top_products_section(self, products: List[Dict[str, Any]]) -> List:
        """Создание секции с топ товарами"""
        elements = []
        
        elements.append(Paragraph("🏆 Топ-5 товаров", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Данные таблицы
        table_data = [['№', 'Товар', 'Выручка', 'Количество']]
        
        for i, product in enumerate(products[:5], 1):
            table_data.append([
                str(i),
                product.get('product', ''),
                f"{product.get('revenue', 0):,.0f} ₽",
                str(product.get('quantity', 0))
            ])
        
        # Создание таблицы
        table = Table(table_data, colWidths=[1*cm, 8*cm, 4*cm, 3*cm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5*inch))
        
        return elements
    
    def _create_abc_section(self, abc_data: Dict[str, Any]) -> List:
        """Создание секции с ABC анализом"""
        elements = []
        
        elements.append(Paragraph("📊 ABC Анализ", self.styles['SectionTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        if 'abc_stats' in abc_data:
            table_data = [['Категория', 'Товаров', 'Выручка', 'Доля']]
            
            for stat in abc_data['abc_stats']:
                table_data.append([
                    stat.get('category', ''),
                    str(stat.get('products_count', 0)),
                    f"{stat.get('revenue', 0):,.0f} ₽",
                    f"{stat.get('revenue_share', 0):.1f}%"
                ])
            
            table = Table(table_data, colWidths=[3*cm, 3*cm, 5*cm, 5*cm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
                ('PADDING', (0, 0), (-1, -1), 8),
            ]))
            
            elements.append(table)
        
        elements.append(Spacer(1, 0.5*inch))
        
        return elements
    
    def _create_footer(self) -> List:
        """Создание футера"""
        elements = []
        
        elements.append(Spacer(1, 1*inch))
        elements.append(Paragraph(
            "Отчёт сгенерирован системой Analitix AI",
            self.styles['MetricLabel']
        ))
        elements.append(Paragraph(
            "https://analitix.ai",
            self.styles['MetricLabel']
        ))
        
        return elements
    
    def _add_page_number(self, canvas, doc):
        """Добавление номера страницы"""
        page_num = canvas.getPageNumber()
        text = f"Страница {page_num}"
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#64748b'))
        canvas.drawRightString(
            doc.pagesize[0] - 2*cm,
            1*cm,
            text
        )
        canvas.restoreState()
