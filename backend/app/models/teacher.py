from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    subject_ids = Column(JSON, default=list)

    user = relationship("User", back_populates="teacher_profile")
    availability = relationship("TeacherAvailability", back_populates="teacher")
    schedule_slots = relationship("ScheduleSlot", back_populates="teacher", foreign_keys="ScheduleSlot.teacher_id")


class TeacherAvailability(Base):
    __tablename__ = "teacher_availability"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    period_start = Column(Integer, nullable=False)
    period_end = Column(Integer, nullable=False)

    teacher = relationship("Teacher", back_populates="availability")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, default=30)
    room_type = Column(String(50), default="classroom")

    schedule_slots = relationship("ScheduleSlot", back_populates="room")
