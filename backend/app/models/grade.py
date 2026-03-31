from sqlalchemy import Column, Integer, String, ForeignKey, Date, Float, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class GradeType(str, enum.Enum):
    soch = "СОЧ"
    sor = "СОР"
    current = "текущая"
    exam = "экзамен"


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    value = Column(Float, nullable=False)
    grade_type = Column(SAEnum(GradeType), nullable=False, default=GradeType.current)
    date = Column(Date, nullable=False)
    quarter = Column(Integer, nullable=True)
    comment = Column(String(500), nullable=True)

    student = relationship("User", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
    topic = relationship("Topic", back_populates="grades")
