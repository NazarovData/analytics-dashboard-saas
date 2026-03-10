"""
File History API
API для работы с историей загрузок файлов
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.services.file_history import FileHistoryService

router = APIRouter()


@router.get("/history")
async def get_upload_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Получить историю загрузок файлов
    
    - **limit**: Количество записей (1-100)
    - **offset**: Смещение для пагинации
    - **user_id**: ID пользователя (опционально)
    """
    try:
        uploads = FileHistoryService.get_user_uploads(
            db=db,
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return {
            'success': True,
            'count': len(uploads),
            'uploads': [FileHistoryService.to_dict(u) for u in uploads]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории: {str(e)}")


@router.get("/history/{upload_id}")
async def get_upload_details(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Получить детали конкретной загрузки
    
    - **upload_id**: ID загрузки
    """
    try:
        upload = FileHistoryService.get_upload_by_id(db=db, upload_id=upload_id)
        
        if not upload:
            raise HTTPException(status_code=404, detail="Загрузка не найдена")
        
        result = FileHistoryService.to_dict(upload)
        
        # Добавляем полные данные аналитики если есть
        if upload.analytics_data:
            result['analytics_data'] = upload.analytics_data
        
        return {
            'success': True,
            'upload': result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения деталей: {str(e)}")


@router.get("/history/recent")
async def get_recent_uploads(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Получить последние успешные загрузки
    
    - **limit**: Количество записей (1-50)
    """
    try:
        uploads = FileHistoryService.get_recent_uploads(db=db, limit=limit)
        
        return {
            'success': True,
            'count': len(uploads),
            'uploads': [FileHistoryService.to_dict(u) for u in uploads]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения последних загрузок: {str(e)}")


@router.get("/stats")
async def get_upload_stats(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Получить статистику загрузок
    
    - **user_id**: ID пользователя (опционально)
    """
    try:
        stats = FileHistoryService.get_upload_stats(db=db, user_id=user_id)
        
        return {
            'success': True,
            'stats': stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")


@router.delete("/history/{upload_id}")
async def delete_upload(
    upload_id: int,
    db: Session = Depends(get_db)
):
    """
    Удалить загрузку из истории
    
    - **upload_id**: ID загрузки
    """
    try:
        success = FileHistoryService.delete_upload(db=db, upload_id=upload_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Загрузка не найдена")
        
        return {
            'success': True,
            'message': 'Загрузка удалена'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления: {str(e)}")
