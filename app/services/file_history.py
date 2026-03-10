"""
File History Service
Сервис для работы с историей загрузок файлов
"""
from typing import List, Optional, Dict, Any
from datetime import datetime as dt_datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.database import FileUpload


class FileHistoryService:
    """Сервис для управления историей загрузок"""
    
    @staticmethod
    def create_upload(
        db: Session,
        filename: str,
        original_filename: str,
        file_size: int,
        file_type: str,
        user_id: Optional[int] = None
    ) -> FileUpload:
        """Создать запись о загрузке файла"""
        upload = FileUpload(
            user_id=user_id,
            filename=filename,
            original_filename=original_filename,
            file_size=file_size,
            file_type=file_type,
            status='processing',
            uploaded_at=dt_datetime.utcnow()
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)
        return upload
    
    @staticmethod
    def update_upload_success(
        db: Session,
        upload_id: int,
        metrics: Dict[str, Any],
        analytics_data: Dict[str, Any],
        records_count: int
    ) -> FileUpload:
        """Обновить запись после успешной обработки"""
        upload = db.query(FileUpload).filter(FileUpload.id == upload_id).first()
        if upload:
            upload.status = 'completed'
            upload.metrics = metrics
            upload.analytics_data = analytics_data
            upload.records_count = records_count
            upload.processed_at = dt_datetime.utcnow()
            db.commit()
            db.refresh(upload)
        return upload
    
    @staticmethod
    def update_upload_error(
        db: Session,
        upload_id: int,
        error_message: str
    ) -> FileUpload:
        """Обновить запись при ошибке"""
        upload = db.query(FileUpload).filter(FileUpload.id == upload_id).first()
        if upload:
            upload.status = 'failed'
            upload.error_message = error_message
            upload.processed_at = dt_datetime.utcnow()
            db.commit()
            db.refresh(upload)
        return upload
    
    @staticmethod
    def get_user_uploads(
        db: Session,
        user_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[FileUpload]:
        """Получить историю загрузок пользователя"""
        query = db.query(FileUpload)
        
        if user_id:
            query = query.filter(FileUpload.user_id == user_id)
        
        query = query.order_by(desc(FileUpload.uploaded_at))
        query = query.limit(limit).offset(offset)
        
        return query.all()
    
    @staticmethod
    def get_upload_by_id(
        db: Session,
        upload_id: int
    ) -> Optional[FileUpload]:
        """Получить загрузку по ID"""
        return db.query(FileUpload).filter(FileUpload.id == upload_id).first()
    
    @staticmethod
    def get_recent_uploads(
        db: Session,
        limit: int = 10
    ) -> List[FileUpload]:
        """Получить последние загрузки"""
        return db.query(FileUpload)\
            .filter(FileUpload.status == 'completed')\
            .order_by(desc(FileUpload.uploaded_at))\
            .limit(limit)\
            .all()
    
    @staticmethod
    def get_upload_stats(
        db: Session,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Получить статистику загрузок"""
        query = db.query(FileUpload)
        
        if user_id:
            query = query.filter(FileUpload.user_id == user_id)
        
        total = query.count()
        completed = query.filter(FileUpload.status == 'completed').count()
        failed = query.filter(FileUpload.status == 'failed').count()
        processing = query.filter(FileUpload.status == 'processing').count()
        
        # Общее количество обработанных записей
        total_records = db.query(FileUpload)\
            .filter(FileUpload.status == 'completed')
        
        if user_id:
            total_records = total_records.filter(FileUpload.user_id == user_id)
        
        total_records_count = sum([u.records_count or 0 for u in total_records.all()])
        
        return {
            'total_uploads': total,
            'completed': completed,
            'failed': failed,
            'processing': processing,
            'total_records_processed': total_records_count,
            'success_rate': round((completed / total * 100) if total > 0 else 0, 2)
        }
    
    @staticmethod
    def delete_upload(
        db: Session,
        upload_id: int
    ) -> bool:
        """Удалить загрузку"""
        upload = db.query(FileUpload).filter(FileUpload.id == upload_id).first()
        if upload:
            db.delete(upload)
            db.commit()
            return True
        return False
    
    @staticmethod
    def to_dict(upload: FileUpload) -> Dict[str, Any]:
        """Преобразовать FileUpload в словарь"""
        return {
            'id': upload.id,
            'filename': upload.filename,
            'original_filename': upload.original_filename,
            'file_size': upload.file_size,
            'file_type': upload.file_type,
            'status': upload.status,
            'error_message': upload.error_message,
            'records_count': upload.records_count,
            'uploaded_at': upload.uploaded_at.isoformat() if upload.uploaded_at else None,
            'processed_at': upload.processed_at.isoformat() if upload.processed_at else None,
            'metrics': upload.metrics,
            'has_analytics': upload.analytics_data is not None
        }
