from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PortfolioItemCreate(BaseModel):
    item_type: str
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None


class PortfolioItemOut(BaseModel):
    id: int
    student_id: int
    item_type: str
    title: str
    description: Optional[str]
    file_url: Optional[str]
    verified_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class GamificationPointOut(BaseModel):
    id: int
    student_id: int
    points: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    rank: int
    student_id: int
    student_name: str
    total_points: int
    class_name: Optional[str]


class ShopItemOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    cost: int
    image_url: Optional[str]
    is_available: bool
    stock: int

    model_config = {"from_attributes": True}


class PurchaseCreate(BaseModel):
    item_id: int
