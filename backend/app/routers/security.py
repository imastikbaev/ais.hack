from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_roles, hash_password
from app.core.access_control import audit, can_view_student_data
from app.models.user import User, UserRole
from app.models.security import AuditLog, ParentLink, CuratorLink
from app.models.school_class import SchoolClass
from app.models.grade import Grade
from app.models.subject import Subject
from app.models.schedule import ScheduleSlot
from app.models.teacher import Teacher, Room
from app.services import bilimclass_mock as mock

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/audit-log")
async def get_audit_log(
    limit: int = 50,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    )
    logs = result.scalars().all()
    out = []
    for log in logs:
        user = await db.get(User, log.user_id) if log.user_id else None
        out.append({
            "id": log.id,
            "user_name": user.name if user else "anonymous",
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        })
    return out


class ParentLinkCreate(BaseModel):
    student_email: str


@router.post("/parent/link")
async def link_parent_to_student(
    data: ParentLinkCreate,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    student_res = await db.execute(select(User).where(User.email == data.student_email))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": f"Parent linked to {student.name}"}


@router.get("/parent/my-children")
async def my_children(
    current_user: User = Depends(require_roles("parent")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ParentLink).where(ParentLink.parent_id == current_user.id)
    )
    links = result.scalars().all()
    children = []
    for link in links:
        student = await db.get(User, link.student_id)
        if student:
            grades = mock.get_student_grades(student.id)
            subjects = mock.get_subjects()
            avgs = {}
            for g in grades:
                s = g["subject_name"]
                if s not in avgs:
                    avgs[s] = []
                avgs[s].append(g["value"])
            subject_avgs = {s: round(sum(vs) / len(vs), 2) for s, vs in avgs.items()}
            school_class = await db.get(SchoolClass, student.class_id) if student.class_id else None
            children.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "class_name": school_class.name if school_class else None,
                "subject_averages": subject_avgs,
            })
    return children


@router.get("/curator/class-alerts")
async def curator_alerts(
    class_id: int,
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Куратор видит ТОЛЬКО: алерты успеваемости и посещаемость.
    Личные переписки, дневники и wellness-данные НЕ передаются.
    """
    students_res = await db.execute(
        select(User).where(User.class_id == class_id, User.role == "student")
    )
    students = students_res.scalars().all()
    alerts = []
    for student in students:
        grades = mock.get_student_grades(student.id)
        if not grades:
            continue
        avgs_by_subj = {}
        for g in grades[-30:]:
            s = g["subject_id"]
            if s not in avgs_by_subj:
                avgs_by_subj[s] = []
            avgs_by_subj[s].append(g["value"])
        for subj_id, vals in avgs_by_subj.items():
            avg = sum(vals) / len(vals)
            if avg < 2.5:
                alerts.append({
                    "student_name": student.name,
                    "student_id": student.id,
                    "alert_type": "low_grade",
                    "subject_id": subj_id,
                    "average": round(avg, 2),
                    "severity": "critical" if avg < 2.0 else "warning",
                })
    return {"class_id": class_id, "alerts": alerts, "total": len(alerts)}


@router.post("/register-parent")
async def register_parent(
    name: str,
    email: str,
    password: str,
    student_id: int,
    current_user: User = Depends(require_roles("admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    parent = User(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role=UserRole.student,
    )
    parent.role = "parent"
    db.add(parent)
    await db.flush()
    link = ParentLink(parent_id=parent.id, student_id=student_id, is_verified=1)
    db.add(link)
    await db.commit()
    return {"message": f"Parent {name} registered and linked to student {student_id}"}


# ── Parent: child grades ───────────────────────────────────────────────────────

async def _verify_parent_child(parent_id: int, student_id: int, db: AsyncSession):
    res = await db.execute(
        select(ParentLink).where(
            ParentLink.parent_id == parent_id,
            ParentLink.student_id == student_id,
        )
    )
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Нет доступа к данным этого ученика")


@router.get("/parent/child/{student_id}/grades")
async def child_grades(
    student_id: int,
    current_user: User = Depends(require_roles("parent")),
    db: AsyncSession = Depends(get_db),
):
    await _verify_parent_child(current_user.id, student_id, db)
    grades_res = await db.execute(
        select(Grade).where(Grade.student_id == student_id).order_by(Grade.date.desc())
    )
    grades = grades_res.scalars().all()
    result = []
    for g in grades:
        subj = await db.get(Subject, g.subject_id)
        result.append({
            "id": g.id,
            "subject_id": g.subject_id,
            "subject_name": subj.name if subj else "—",
            "value": g.value,
            "grade_type": g.grade_type,
            "date": str(g.date),
            "quarter": g.quarter,
        })
    return result


@router.get("/parent/child/{student_id}/schedule")
async def child_schedule(
    student_id: int,
    current_user: User = Depends(require_roles("parent")),
    db: AsyncSession = Depends(get_db),
):
    await _verify_parent_child(current_user.id, student_id, db)
    student = await db.get(User, student_id)
    if not student or not student.class_id:
        return []
    slots_res = await db.execute(
        select(ScheduleSlot)
        .where(ScheduleSlot.class_id == student.class_id)
        .order_by(ScheduleSlot.day_of_week, ScheduleSlot.period_num)
    )
    slots = slots_res.scalars().all()
    result = []
    for s in slots:
        subj = await db.get(Subject, s.subject_id)
        room = await db.get(Room, s.room_id)
        teacher = await db.get(Teacher, s.teacher_id)
        teacher_user = await db.get(User, teacher.user_id) if teacher else None
        result.append({
            "id": s.id,
            "subject_name": subj.name if subj else "—",
            "teacher_name": teacher_user.name if teacher_user else "—",
            "room_name": room.name if room else "—",
            "day_of_week": s.day_of_week,
            "period_num": s.period_num,
            "is_substitution": s.is_substitution,
        })
    return result
