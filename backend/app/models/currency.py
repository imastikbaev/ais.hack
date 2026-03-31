from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CafeteriaItem(Base):
    """Позиция в буфете лицея."""
    __tablename__ = "cafeteria_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    price_coins = Column(Integer, nullable=False)
    price_tenge = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    category = Column(String(50), default="food")
    is_available = Column(Boolean, default=True)
    stock = Column(Integer, default=-1)

    orders = relationship("CafeteriaOrder", back_populates="item")


class CafeteriaOrder(Base):
    """Заказ через QR-код."""
    __tablename__ = "cafeteria_orders"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("cafeteria_items.id"), nullable=False)
    qr_token = Column(String(200), unique=True, nullable=False)
    status = Column(String(20), default="pending")
    coins_spent = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    redeemed_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("User")
    item = relationship("CafeteriaItem", back_populates="orders")


class CurrencyTransaction(Base):
    """Полный лог транзакций внутренней валюты."""
    __tablename__ = "currency_transactions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    tx_type = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    reference_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
