from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class KundelikSync(Base):
    """Хранит токены и состояние синхронизации с Kundelik для каждого пользователя."""
    __tablename__ = "kundelik_sync"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    kundelik_user_id = Column(String(100), nullable=True)
    access_token = Column(String(500), nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    sync_status = Column(String(50), default="pending")

    user = relationship("User")
    cached_lessons = relationship("KundelikLesson", back_populates="sync", cascade="all, delete-orphan")
    cached_homework = relationship("KundelikHomework", back_populates="sync", cascade="all, delete-orphan")


class KundelikLesson(Base):
    """Кэш расписания из Kundelik."""
    __tablename__ = "kundelik_lessons"

    id = Column(Integer, primary_key=True, index=True)
    sync_id = Column(Integer, ForeignKey("kundelik_sync.id"), nullable=False)
    lesson_date = Column(Date, nullable=False)
    period_num = Column(Integer, nullable=False)
    subject_name = Column(String(200), nullable=False)
    teacher_name = Column(String(200), nullable=True)
    room = Column(String(50), nullable=True)
    start_time = Column(String(10), nullable=True)
    end_time = Column(String(10), nullable=True)
    is_cancelled = Column(Boolean, default=False)

    sync = relationship("KundelikSync", back_populates="cached_lessons")


class KundelikHomework(Base):
    """Кэш домашних заданий из Kundelik."""
    __tablename__ = "kundelik_homework"

    id = Column(Integer, primary_key=True, index=True)
    sync_id = Column(Integer, ForeignKey("kundelik_sync.id"), nullable=False)
    subject_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(Date, nullable=False)
    is_done = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sync = relationship("KundelikSync", back_populates="cached_homework")
