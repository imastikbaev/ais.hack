from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.news import News, Notification
from app.schemas.news import NewsCreate, NewsOut, NotificationOut

router = APIRouter(prefix="/news", tags=["news"])


@router.get("/", response_model=List[NewsOut])
async def get_news(limit: int = 20, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(News).where(News.is_published == True)
        .order_by(News.published_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/announcements", response_model=List[NewsOut])
async def get_announcements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(News).where(News.is_published == True, News.is_announcement == True)
        .order_by(News.published_at.desc())
        .limit(10)
    )
    return result.scalars().all()


@router.post("/", response_model=NewsOut)
async def create_news(
    data: NewsCreate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    news = News(
        title=data.title,
        body=data.body,
        author_id=current_user.id,
        image_url=data.image_url,
        is_announcement=data.is_announcement,
    )
    db.add(news)
    await db.commit()
    await db.refresh(news)
    return news


@router.put("/{news_id}", response_model=NewsOut)
async def update_news(
    news_id: int,
    data: NewsCreate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    news = await db.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Not found")
    news.title = data.title
    news.body = data.body
    news.image_url = data.image_url
    news.is_announcement = data.is_announcement
    await db.commit()
    await db.refresh(news)
    return news


@router.delete("/{news_id}")
async def delete_news(
    news_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    news = await db.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(news)
    await db.commit()
    return {"message": "Deleted"}


@router.get("/notifications", response_model=List[NotificationOut])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
    )
    return result.scalars().all()


@router.post("/notifications/{notif_id}/read")
async def mark_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif = await db.get(Notification, notif_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    notif.is_read = True
    await db.commit()
    return {"message": "Marked as read"}
