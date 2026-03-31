from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.kundelik import KundelikSync, KundelikLesson, KundelikHomework
from app.services import kundelik_service as ks

router = APIRouter(prefix="/kundelik", tags=["kundelik"])


@router.get("/today")
async def today_schedule(
    target_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
):
    return ks.get_today_schedule(current_user.id, target_date)


@router.get("/current-lesson")
async def current_lesson(current_user: User = Depends(get_current_user)):
    return ks.get_current_lesson(current_user.id)


@router.get("/day-progress")
async def day_progress(current_user: User = Depends(get_current_user)):
    return ks.get_day_progress(current_user.id)


@router.get("/homework")
async def homework(
    days_ahead: int = 7,
    current_user: User = Depends(get_current_user),
):
    hw = ks.get_homework(current_user.id, days_ahead)
    return hw


@router.post("/homework/{hw_id}/done")
async def mark_homework_done(
    hw_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KundelikHomework).where(
            KundelikHomework.id == hw_id,
        )
    )
    hw = result.scalar_one_or_none()
    if hw:
        hw.is_done = True
        await db.commit()
    return {"ok": True}


@router.post("/sync")
async def trigger_sync(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime
    result = await db.execute(
        select(KundelikSync).where(KundelikSync.user_id == current_user.id)
    )
    sync = result.scalar_one_or_none()
    if not sync:
        sync = KundelikSync(user_id=current_user.id, sync_status="ok")
        db.add(sync)
    sync.last_synced_at = datetime.utcnow()
    sync.sync_status = "ok"
    await db.commit()
    return {"status": "synced", "synced_at": sync.last_synced_at}
