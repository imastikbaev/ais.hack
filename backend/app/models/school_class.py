from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SchoolClass(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    parallel = Column(String(10), nullable=False)

    students = relationship("User", back_populates="school_class", foreign_keys="User.class_id")
    groups = relationship("Group", back_populates="school_class")
    schedule_slots = relationship("ScheduleSlot", back_populates="school_class")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    name = Column(String(50), nullable=False)

    school_class = relationship("SchoolClass", back_populates="groups")
    schedule_slots = relationship("ScheduleSlot", back_populates="group")
