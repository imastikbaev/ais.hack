from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.nisgram import AchievementPost, PostLike, EventTag
from app.models.gamification import GamificationPoint

router = APIRouter(prefix="/nisgram", tags=["nisgram"])


class PostCreate(BaseModel):
    student_id: int
    mentor_id: Optional[int] = None
    title: str
    description: str
    image_url: Optional[str] = None
    tags: List[str] = []


class PostOut(BaseModel):
    id: int
    title: str
    description: str
    image_url: Optional[str]
    tags: list
    status: str
    likes_count: int
    student_name: Optional[str] = None
    mentor_name: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


@router.get("/feed")
async def get_feed(
    tag: Optional[str] = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    query = select(AchievementPost).where(AchievementPost.status == "approved")
    result = await db.execute(query.order_by(AchievementPost.created_at.desc()).limit(limit))
    posts = result.scalars().all()
    out = []
    for p in posts:
        if tag and tag not in (p.tags or []):
            continue
        student = await db.get(User, p.student_id)
        mentor = await db.get(User, p.mentor_id) if p.mentor_id else None
        out.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "image_url": p.image_url,
            "tags": p.tags or [],
            "likes_count": p.likes_count,
            "student_name": student.name if student else None,
            "mentor_name": mentor.name if mentor else None,
            "created_at": p.created_at,
        })
    return out


@router.post("/posts")
async def create_post(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = AchievementPost(
        author_id=current_user.id,
        student_id=data.student_id,
        mentor_id=data.mentor_id,
        title=data.title,
        description=data.description,
        image_url=data.image_url,
        tags=data.tags,
        status="pending",
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"id": post.id, "status": "pending", "message": "Пост отправлен на модерацию"}


@router.get("/moderation")
async def get_pending_posts(
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AchievementPost).where(AchievementPost.status == "pending")
        .order_by(AchievementPost.created_at.asc())
    )
    posts = result.scalars().all()
    out = []
    for p in posts:
        student = await db.get(User, p.student_id)
        out.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "tags": p.tags or [],
            "student_name": student.name if student else None,
            "created_at": p.created_at,
        })
    return out


class ModerationAction(BaseModel):
    action: str  # "approve" | "reject"
    reason: Optional[str] = None


@router.post("/moderation/{post_id}")
async def moderate_post(
    post_id: int,
    data: ModerationAction,
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(AchievementPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if data.action == "approve":
        post.status = "approved"
        point = GamificationPoint(
            student_id=post.student_id,
            points=150,
            reason=f"Достижение опубликовано: {post.title}",
        )
        db.add(point)
    elif data.action == "reject":
        post.status = "rejected"
        post.reject_reason = data.reason
    post.moderated_by = current_user.id
    post.moderated_at = datetime.utcnow()
    await db.commit()
    return {"status": post.status}


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        return {"liked": False}
    like = PostLike(post_id=post_id, user_id=current_user.id)
    db.add(like)
    post = await db.get(AchievementPost, post_id)
    if post:
        post.likes_count += 1
    await db.commit()
    return {"liked": True}


@router.get("/tags")
async def get_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EventTag))
    return result.scalars().all()
