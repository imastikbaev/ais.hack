from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PsychTest(Base):
    """Психологический тест (шаблон)."""
    __tablename__ = "psych_tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    test_type = Column(String(50), default="soft_skills")
    questions = Column(JSON, default=list)
    external_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    results = relationship("PsychTestResult", back_populates="test")


class PsychTestResult(Base):
    """Результат прохождения теста учеником."""
    __tablename__ = "psych_test_results"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("psych_tests.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, default=dict)
    scores = Column(JSON, default=dict)
    interpretation = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    test = relationship("PsychTest", back_populates="results")


class JournalEntry(Base):
    """
    Зашифрованная запись личного дневника.
    encrypted_content — AES-GCM шифротекст, зашифрованный на стороне клиента.
    iv, auth_tag    — параметры шифрования (хранятся вместе, но без ключа бесполезны).
    Сервер НИКОГДА не видит plaintext. Ключ шифрования = pbkdf2(password, user_salt).
    """
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    encrypted_content = Column(Text, nullable=False)
    iv = Column(String(100), nullable=False)
    auth_tag = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ConsultationRequest(Base):
    """Запись на консультацию к психологу."""
    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    psychologist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_date = Column(DateTime(timezone=True), nullable=False)
    topic = Column(String(200), nullable=True)
    status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", foreign_keys=[student_id])
    psychologist = relationship("User", foreign_keys=[psychologist_id])
