from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"
    kiosk = "kiosk"
    parent = "parent"
    curator = "curator"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(300), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    is_active = Column(Boolean, default=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    avatar_url = Column(String(500), nullable=True)

    school_class = relationship("SchoolClass", back_populates="students", foreign_keys=[class_id])
    teacher_profile = relationship("Teacher", back_populates="user", uselist=False)
    grades = relationship("Grade", back_populates="student")
    portfolio_items = relationship("PortfolioItem", back_populates="student", foreign_keys="PortfolioItem.student_id")
    gamification_points = relationship("GamificationPoint", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    purchases = relationship("Purchase", back_populates="student")
