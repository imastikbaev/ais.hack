from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.wellness import PsychTest, PsychTestResult, JournalEntry, ConsultationRequest

router = APIRouter(prefix="/wellness", tags=["wellness"])

BUILTIN_TESTS = [
    {
        "id": 1,
        "title": "Тест на импульсивность (BIS-11)",
        "description": "Оценка уровня импульсивности по шкале Баррата",
        "test_type": "impulse",
        "questions": [
            {"id": 1, "text": "Я планирую задачи заранее", "reverse": True},
            {"id": 2, "text": "Я делаю вещи не думая", "reverse": False},
            {"id": 3, "text": "Я быстро принимаю решения", "reverse": False},
            {"id": 4, "text": "Я сосредоточен на задаче", "reverse": True},
            {"id": 5, "text": "Мне трудно усидеть на месте", "reverse": False},
        ],
        "external_url": None,
    },
    {
        "id": 2,
        "title": "Soft Skills — Командная работа",
        "description": "Оценка навыков взаимодействия в команде",
        "test_type": "soft_skills",
        "questions": [
            {"id": 1, "text": "Я легко нахожу общий язык с новыми людьми", "reverse": False},
            {"id": 2, "text": "Я предпочитаю работать один", "reverse": True},
            {"id": 3, "text": "Я выслушиваю мнение других перед решением", "reverse": False},
            {"id": 4, "text": "Конфликты меня пугают", "reverse": True},
            {"id": 5, "text": "Я берусь за ответственные роли в группе", "reverse": False},
        ],
        "external_url": None,
    },
    {
        "id": 3,
        "title": "Внешний тест (psy.nis.edu.kz)",
        "description": "Официальный психологический тест НИШ",
        "test_type": "external",
        "questions": [],
        "external_url": "https://psy.nis.edu.kz",
    },
]


def _interpret(scores: dict) -> str:
    avg = sum(scores.values()) / max(len(scores), 1)
    if avg >= 4:
        return "Высокий уровень по данному параметру. Рекомендуем обсудить с психологом."
    if avg >= 2.5:
        return "Средний уровень. Продолжай развиваться в этом направлении!"
    return "Низкий уровень. Это нормально — работай над собой шаг за шагом."


@router.get("/tests")
async def list_tests():
    return BUILTIN_TESTS


@router.get("/tests/{test_id}")
async def get_test(test_id: int):
    test = next((t for t in BUILTIN_TESTS if t["id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test


class TestSubmit(BaseModel):
    answers: dict


@router.post("/tests/{test_id}/submit")
async def submit_test(
    test_id: int,
    data: TestSubmit,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    test = next((t for t in BUILTIN_TESTS if t["id"] == test_id), None)
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    scores = {str(k): int(v) for k, v in data.answers.items()}
    interpretation = _interpret(scores)
    result = PsychTestResult(
        test_id=test_id,
        student_id=current_user.id,
        answers=data.answers,
        scores=scores,
        interpretation=interpretation,
    )
    db.add(result)
    await db.commit()
    return {"scores": scores, "interpretation": interpretation}


@router.get("/tests/results/my")
async def my_results(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PsychTestResult)
        .where(PsychTestResult.student_id == current_user.id)
        .order_by(PsychTestResult.completed_at.desc())
    )
    rows = result.scalars().all()
    out = []
    for r in rows:
        test = next((t for t in BUILTIN_TESTS if t["id"] == r.test_id), {})
        out.append({
            "id": r.id,
            "test_title": test.get("title", "Тест"),
            "scores": r.scores,
            "interpretation": r.interpretation,
            "completed_at": r.completed_at,
        })
    return out


# ─── Private Journal ────────────────────────────────────────────────────────
# Сервер хранит только зашифрованные данные. Ключ шифрования никогда не передаётся.

class JournalCreate(BaseModel):
    encrypted_content: str
    iv: str
    auth_tag: Optional[str] = None


class JournalUpdate(BaseModel):
    encrypted_content: str
    iv: str
    auth_tag: Optional[str] = None


@router.get("/journal")
async def list_journal(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.student_id == current_user.id)
        .order_by(JournalEntry.created_at.desc())
    )
    entries = result.scalars().all()
    return [
        {
            "id": e.id,
            "encrypted_content": e.encrypted_content,
            "iv": e.iv,
            "auth_tag": e.auth_tag,
            "created_at": e.created_at,
        }
        for e in entries
    ]


@router.post("/journal")
async def create_journal_entry(
    data: JournalCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    entry = JournalEntry(
        student_id=current_user.id,
        encrypted_content=data.encrypted_content,
        iv=data.iv,
        auth_tag=data.auth_tag,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {"id": entry.id, "created_at": entry.created_at}


@router.put("/journal/{entry_id}")
async def update_journal_entry(
    entry_id: int,
    data: JournalUpdate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(JournalEntry, entry_id)
    if not entry or entry.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    entry.encrypted_content = data.encrypted_content
    entry.iv = data.iv
    entry.auth_tag = data.auth_tag
    await db.commit()
    return {"ok": True}


@router.delete("/journal/{entry_id}")
async def delete_journal_entry(
    entry_id: int,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.get(JournalEntry, entry_id)
    if not entry or entry.student_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(entry)
    await db.commit()
    return {"ok": True}


# ─── Consultation ────────────────────────────────────────────────────────────

class ConsultCreate(BaseModel):
    requested_date: datetime
    topic: Optional[str] = None


@router.post("/consultation")
async def book_consultation(
    data: ConsultCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    req = ConsultationRequest(
        student_id=current_user.id,
        requested_date=data.requested_date,
        topic=data.topic,
        status="pending",
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return {"id": req.id, "status": "pending", "message": "Запрос на консультацию отправлен"}


@router.get("/consultation/my")
async def my_consultations(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConsultationRequest)
        .where(ConsultationRequest.student_id == current_user.id)
        .order_by(ConsultationRequest.requested_date.asc())
    )
    return [
        {
            "id": r.id,
            "requested_date": r.requested_date,
            "topic": r.topic,
            "status": r.status,
        }
        for r in result.scalars().all()
    ]


@router.get("/consultation/pending")
async def pending_consultations(
    current_user: User = Depends(require_roles("admin", "teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ConsultationRequest).where(ConsultationRequest.status == "pending")
    )
    rows = result.scalars().all()
    out = []
    for r in rows:
        student = await db.get(User, r.student_id)
        out.append({
            "id": r.id,
            "student_name": student.name if student else "?",
            "requested_date": r.requested_date,
            "topic": r.topic,
        })
    return out


@router.post("/consultation/{req_id}/confirm")
async def confirm_consultation(
    req_id: int,
    current_user: User = Depends(require_roles("admin", "teacher")),
    db: AsyncSession = Depends(get_db),
):
    req = await db.get(ConsultationRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Not found")
    req.status = "confirmed"
    req.psychologist_id = current_user.id
    await db.commit()
    return {"ok": True}
