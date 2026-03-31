from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class SlotType(str, enum.Enum):
    lesson = "lesson"
    pair = "pair"
    stream = "stream"
    event = "event"


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    period_num = Column(Integer, nullable=False)
    week_type = Column(String(10), default="all")
    slot_type = Column(SAEnum(SlotType), default=SlotType.lesson)
    is_substitution = Column(Boolean, default=False)
    original_teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)

    school_class = relationship("SchoolClass", back_populates="schedule_slots")
    group = relationship("Group", back_populates="schedule_slots")
    subject = relationship("Subject", back_populates="schedule_slots")
    teacher = relationship("Teacher", back_populates="schedule_slots", foreign_keys=[teacher_id])
    room = relationship("Room", back_populates="schedule_slots")
