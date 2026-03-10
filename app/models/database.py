"""
Database Models for Analitix AI
SQLAlchemy models for PostgreSQL
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"

class IntegrationType(str, enum.Enum):
    BITRIX24 = "bitrix24"
    ONE_C = "1c"
    GOOGLE_SHEETS = "google_sheets"
    POSTGRESQL = "postgresql"
    CLICKHOUSE = "clickhouse"
    EXCEL = "excel"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    subscription_plan = Column(SQLEnum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    integrations = relationship("Integration", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
    leads = relationship("Lead", back_populates="user")

class Integration(Base):
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(IntegrationType), nullable=False)
    status = Column(String(50), default="connected")
    
    # Connection details (encrypted JSON)
    connection_config = Column(JSON, nullable=False)
    
    # Metadata
    total_records = Column(Integer, default=0)
    last_sync_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="integrations")
    syncs = relationship("IntegrationSync", back_populates="integration")

class IntegrationSync(Base):
    __tablename__ = "integration_syncs"
    
    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=False)
    records_count = Column(Integer, default=0)
    status = Column(String(50), default="success")
    error_message = Column(Text)
    synced_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    integration = relationship("Integration", back_populates="syncs")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=True)
    
    # Analytics data
    metrics = Column(JSON, nullable=False)  # total_revenue, total_orders, etc.
    charts_data = Column(JSON)  # pie_data, line_data, etc.
    ai_insights = Column(JSON)  # AI recommendations
    
    # Metadata
    data_source = Column(String(255))  # table name, file name, etc.
    records_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analytics")

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null if not registered
    
    # Contact info
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255))
    company = Column(String(255))
    message = Column(Text)
    
    # Status
    status = Column(String(50), default="new")  # new, contacted, converted, lost
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="leads")

class Export(Base):
    __tablename__ = "exports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analytics_id = Column(Integer, ForeignKey("analytics.id"), nullable=True)
    
    # Export details
    format = Column(String(50), nullable=False)  # pdf, excel, csv
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)  # bytes
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ClientTemplate(Base):
    __tablename__ = "client_templates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    industry = Column(String(50), nullable=False, index=True)
    country = Column(String(5), nullable=False, default='RU')
    mapping = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        # One template per user per industry
    )


class MappedTransaction(Base):
    __tablename__ = "mapped_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    industry = Column(String(50), nullable=False, index=True)
    country = Column(String(5), nullable=False, default='RU')
    date = Column(DateTime, nullable=True)
    data = Column(JSON, nullable=False)
    raw = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FileUpload(Base):
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # File details
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)  # bytes
    file_type = Column(String(50))  # csv, xlsx, xls, etc.
    
    # Processing status
    status = Column(String(50), default="processing")  # processing, completed, failed
    error_message = Column(Text)
    
    # Analytics results (cached)
    metrics = Column(JSON)  # Basic metrics
    analytics_data = Column(JSON)  # Full analytics result
    records_count = Column(Integer, default=0)
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    
    # Additional metadata
    file_metadata = Column(JSON)  # Additional file metadata








