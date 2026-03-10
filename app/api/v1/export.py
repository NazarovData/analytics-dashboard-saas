"""
Export API
API для экспорта отчётов в различные форматы
"""
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime as dt_datetime

from app.services.pdf_export import PDFExportService

router = APIRouter()


class ExportRequest(BaseModel):
    """Запрос на экспорт"""
    data: Dict[str, Any]
    format: str = "pdf"  # pdf, excel, csv
    company_name: Optional[str] = None
    include_charts: bool = True


@router.post("/pdf")
async def export_to_pdf(request: ExportRequest):
    """
    Экспорт отчёта в PDF
    
    - **data**: Данные аналитики
    - **company_name**: Название компании (опционально)
    - **include_charts**: Включить графики (опционально)
    """
    try:
        pdf_service = PDFExportService()
        
        # Генерация PDF
        pdf_buffer = pdf_service.generate_report(
            data=request.data,
            company_name=request.company_name
        )
        
        # Имя файла
        timestamp = dt_datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"analitix_report_{timestamp}.pdf"
        
        # Возврат PDF
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail="reportlab не установлен. Установите: pip install reportlab"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации PDF: {str(e)}"
        )


@router.post("/excel")
async def export_to_excel(request: ExportRequest):
    """
    Экспорт отчёта в Excel
    
    - **data**: Данные аналитики
    """
    try:
        import pandas as pd
        from io import BytesIO
        
        # Создание Excel файла
        output = BytesIO()
        
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Метрики
            if 'metrics' in request.data:
                metrics_df = pd.DataFrame([request.data['metrics']])
                metrics_df.to_excel(writer, sheet_name='Метрики', index=False)
            
            # Топ товары
            if 'top_products' in request.data:
                products_df = pd.DataFrame(request.data['top_products'])
                products_df.to_excel(writer, sheet_name='Топ товары', index=False)
            
            # ABC анализ
            if 'abc_analysis' in request.data and 'abc_stats' in request.data['abc_analysis']:
                abc_df = pd.DataFrame(request.data['abc_analysis']['abc_stats'])
                abc_df.to_excel(writer, sheet_name='ABC анализ', index=False)
        
        output.seek(0)
        
        # Имя файла
        timestamp = dt_datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"analitix_report_{timestamp}.xlsx"
        
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации Excel: {str(e)}"
        )


@router.post("/csv")
async def export_to_csv(request: ExportRequest):
    """
    Экспорт данных в CSV
    
    - **data**: Данные для экспорта
    """
    try:
        import pandas as pd
        from io import StringIO
        
        # Определяем какие данные экспортировать
        if 'top_products' in request.data:
            df = pd.DataFrame(request.data['top_products'])
        elif 'raw_data' in request.data:
            df = pd.DataFrame(request.data['raw_data'])
        else:
            raise HTTPException(status_code=400, detail="Нет данных для экспорта")
        
        # Конвертация в CSV
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
        csv_buffer.seek(0)
        
        # Имя файла
        timestamp = dt_datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"analitix_data_{timestamp}.csv"
        
        return Response(
            content=csv_buffer.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка генерации CSV: {str(e)}"
        )


@router.get("/formats")
async def get_available_formats():
    """
    Получить список доступных форматов экспорта
    """
    return {
        "success": True,
        "formats": [
            {
                "id": "pdf",
                "name": "PDF",
                "description": "Красивый отчёт с графиками",
                "icon": "📄",
                "available": True
            },
            {
                "id": "excel",
                "name": "Excel",
                "description": "Таблицы для анализа",
                "icon": "📊",
                "available": True
            },
            {
                "id": "csv",
                "name": "CSV",
                "description": "Сырые данные",
                "icon": "📋",
                "available": True
            }
        ]
    }
