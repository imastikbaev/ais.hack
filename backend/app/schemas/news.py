from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NewsCreate(BaseModel):
    title: str
    body: str
    image_url: Optional[str] = None
    is_announcement: bool = False


class NewsOut(BaseModel):
    id: int
    title: str
    body: str
    author_id: int
    published_at: datetime
    is_published: bool
    image_url: Optional[str]
    is_announcement: bool

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    text: str
    is_read: bool
    notification_type: str
    created_at: datetime

    model_config = {"from_attributes": True}
