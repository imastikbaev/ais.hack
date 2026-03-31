from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.gamification import GamificationPoint
from app.models.news import News
from app.models.schedule import ScheduleSlot
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.services.notifier import manager
import json

router = APIRouter(prefix="/kiosk", tags=["kiosk"])


@router.websocket("/ws")
async def kiosk_ws(websocket: WebSocket):
    await manager.connect_kiosk(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/feed")
async def get_kiosk_feed(db: AsyncSession = Depends(get_db)):
    leaders_res = await db.execute(
        select(GamificationPoint.student_id, func.sum(GamificationPoint.points).label("total"))
        .group_by(GamificationPoint.student_id)
        .order_by(func.sum(GamificationPoint.points).desc())
        .limit(5)
    )
    leaders_raw = leaders_res.all()
    leaders = []
    for row in leaders_raw:
        user = await db.get(User, row.student_id)
        leaders.append({"name": user.name if user else "?", "points": row.total})

    news_res = await db.execute(
        select(News).where(News.is_published == True)
        .order_by(News.published_at.desc())
        .limit(5)
    )
    news = [{"title": n.title, "body": n.body[:200], "is_announcement": n.is_announcement}
            for n in news_res.scalars().all()]

    subs_res = await db.execute(
        select(ScheduleSlot).where(ScheduleSlot.is_substitution == True).limit(10)
    )
    substitutions = []
    for slot in subs_res.scalars().all():
        subj = await db.get(Subject, slot.subject_id)
        teacher = await db.get(Teacher, slot.teacher_id)
        teacher_user = await db.get(User, teacher.user_id) if teacher else None
        substitutions.append({
            "subject": subj.name if subj else "?",
            "teacher": teacher_user.name if teacher_user else "?",
            "day": slot.day_of_week,
            "period": slot.period_num,
        })

    return {
        "top_students": leaders,
        "news": news,
        "substitutions": substitutions,
    }


@router.websocket("/notifications/ws/{user_id}")
async def user_notifications_ws(websocket: WebSocket, user_id: int, token: str = Query(...)):
    try:
        payload = decode_token(token)
        if str(user_id) != str(payload.get("sub")):
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
