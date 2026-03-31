from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    requires_split = Column(Boolean, default=False)
    is_core = Column(Boolean, default=True)

    topics = relationship("Topic", back_populates="subject")
    grades = relationship("Grade", back_populates="subject")
    schedule_slots = relationship("ScheduleSlot", back_populates="subject")


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    name = Column(String(300), nullable=False)
    prerequisites = Column(JSON, default=list)
    order_index = Column(Integer, default=0)

    subject = relationship("Subject", back_populates="topics")
    grades = relationship("Grade", back_populates="topic")
