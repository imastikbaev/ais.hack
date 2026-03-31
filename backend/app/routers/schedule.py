from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.schedule import ScheduleSlot
from app.models.teacher import Teacher, Room
from app.models.subject import Subject
from app.models.school_class import SchoolClass, Group
from app.models.news import Notification
from app.schemas.schedule import ScheduleSlotOut, SubstitutionCreate, ScheduleGenerateRequest, RoomOut
from app.services.schedule_solver import ScheduleSolver, ScheduleConstraints, check_conflicts
from app.services.notifier import manager, send_telegram_notification
from collections import defaultdict
import json

router = APIRouter(prefix="/schedule", tags=["schedule"])


async def _enrich_slot(slot: ScheduleSlot, db: AsyncSession) -> ScheduleSlotOut:
    subj = await db.get(Subject, slot.subject_id)
    room = await db.get(Room, slot.room_id)
    teacher = await db.get(Teacher, slot.teacher_id)
    teacher_user = await db.get(User, teacher.user_id) if teacher else None
    school_class = await db.get(SchoolClass, slot.class_id)
    return ScheduleSlotOut(
        id=slot.id,
        class_id=slot.class_id,
        group_id=slot.group_id,
        subject_id=slot.subject_id,
        subject_name=subj.name if subj else None,
        teacher_id=slot.teacher_id,
        teacher_name=teacher_user.name if teacher_user else None,
        room_id=slot.room_id,
        room_name=room.name if room else None,
        class_name=school_class.name if school_class else None,
        day_of_week=slot.day_of_week,
        period_num=slot.period_num,
        week_type=slot.week_type,
        slot_type=slot.slot_type,
        is_substitution=slot.is_substitution,
    )


@router.get("/class/{class_id}", response_model=List[ScheduleSlotOut])
async def get_class_schedule(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ScheduleSlot).where(ScheduleSlot.class_id == class_id)
        .order_by(ScheduleSlot.day_of_week, ScheduleSlot.period_num)
    )
    slots = result.scalars().all()
    return [await _enrich_slot(s, db) for s in slots]


@router.get("/my")
async def get_my_schedule(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "student" and current_user.class_id:
        result = await db.execute(
            select(ScheduleSlot).where(ScheduleSlot.class_id == current_user.class_id)
            .order_by(ScheduleSlot.day_of_week, ScheduleSlot.period_num)
        )
        slots = result.scalars().all()
        return [await _enrich_slot(s, db) for s in slots]

    if current_user.role == "teacher":
        teacher_res = await db.execute(
            select(Teacher).where(Teacher.user_id == current_user.id)
        )
        teacher = teacher_res.scalar_one_or_none()
        if not teacher:
            return []
        result = await db.execute(
            select(ScheduleSlot).where(ScheduleSlot.teacher_id == teacher.id)
            .order_by(ScheduleSlot.day_of_week, ScheduleSlot.period_num)
        )
        slots = result.scalars().all()
        return [await _enrich_slot(s, db) for s in slots]

    return []


@router.post("/generate")
async def generate_schedule(
    req: ScheduleGenerateRequest,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    classes_res = await db.execute(
        select(SchoolClass).where(SchoolClass.id.in_(req.class_ids))
    )
    classes = [{"id": c.id, "name": c.name} for c in classes_res.scalars().all()]

    teachers_res = await db.execute(select(Teacher))
    teachers_raw = teachers_res.scalars().all()
    teachers = [{"id": t.id, "subject_ids": t.subject_ids or []} for t in teachers_raw]

    rooms_res = await db.execute(select(Room))
    rooms = [{"id": r.id, "name": r.name, "capacity": r.capacity} for r in rooms_res.scalars().all()]

    subjects_res = await db.execute(select(Subject))
    subjects = [{"id": s.id, "name": s.name, "requires_split": s.requires_split} for s in subjects_res.scalars().all()]

    required_lessons = {
        cid: {1: 4, 2: 3, 3: 3, 4: 2, 7: 3, 8: 2, 9: 2, 10: 2}
        for cid in req.class_ids
    }

    constraints = ScheduleConstraints(
        classes=classes,
        teachers=teachers,
        rooms=rooms,
        subjects=subjects,
        teacher_availability={},
        required_lessons=required_lessons,
    )
    solver = ScheduleSolver(constraints)
    result = solver.solve()

    await db.execute(
        ScheduleSlot.__table__.delete().where(ScheduleSlot.class_id.in_(req.class_ids))
    )

    for slot_data in result["slots"]:
        slot = ScheduleSlot(**slot_data)
        db.add(slot)

    await db.commit()
    return {"message": "Schedule generated", "total_slots": result["total"], "windows": result["windows_count"]}


@router.post("/substitution")
async def create_substitution(
    data: SubstitutionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    slot = await db.get(ScheduleSlot, data.slot_id)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.original_teacher_id = slot.teacher_id
    slot.teacher_id = data.new_teacher_id
    if data.new_room_id:
        slot.room_id = data.new_room_id
    slot.is_substitution = True
    await db.commit()
    await db.refresh(slot)

    students_res = await db.execute(
        select(User).where(User.class_id == slot.class_id, User.role == "student")
    )
    student_ids = [u.id for u in students_res.scalars().all()]

    subj = await db.get(Subject, slot.subject_id)
    teacher = await db.get(Teacher, slot.teacher_id)
    teacher_user = await db.get(User, teacher.user_id) if teacher else None

    msg = {
        "type": "substitution",
        "message": f"Замена: {subj.name if subj else '?'} — новый учитель: {teacher_user.name if teacher_user else '?'}",
        "slot_id": slot.id,
        "day": slot.day_of_week,
        "period": slot.period_num,
    }

    for uid in student_ids:
        notif = Notification(user_id=uid, text=msg["message"], notification_type="substitution")
        db.add(notif)
    await db.commit()

    background_tasks.add_task(manager.broadcast_to_class, student_ids, msg)
    background_tasks.add_task(manager.broadcast_kiosk, msg)
    background_tasks.add_task(send_telegram_notification, msg["message"])

    return {"message": "Substitution created", "slot_id": slot.id}


@router.get("/rooms", response_model=List[RoomOut])
async def get_rooms(
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Room))
    return result.scalars().all()


@router.get("/substitutions/latest")
async def get_latest_substitutions(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ScheduleSlot).where(ScheduleSlot.is_substitution == True).limit(20)
    )
    slots = result.scalars().all()
    return [await _enrich_slot(s, db) for s in slots]
