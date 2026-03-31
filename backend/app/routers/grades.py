from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from collections import defaultdict
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.grade import Grade
from app.models.subject import Subject, Topic
from app.models.gamification import GamificationPoint
from app.schemas.grades import GradeOut

router = APIRouter(prefix="/grades", tags=["grades"])

SUBJECT_RESOURCES: dict = {
    "Математика": [
        {"title": "Алгебра — Khan Academy (RU)", "url": "https://ru.khanacademy.org/math/algebra"},
        {"title": "ЕГЭ математика — видеоуроки", "url": "https://www.youtube.com/c/mathege"},
    ],
    "Физика": [
        {"title": "Физика — основы механики", "url": "https://www.youtube.com/watch?v=ZM8ECpBuQYE"},
        {"title": "Законы Ньютона — fizmat.by", "url": "https://fizmat.by/kursy/newton"},
    ],
    "Химия": [
        {"title": "Химия с нуля — videouroki.net", "url": "https://videouroki.net/video/himiya.html"},
        {"title": "Периодическая таблица интерактивно", "url": "https://ptable.com/?lang=ru"},
    ],
    "Английский язык": [
        {"title": "English Grammar in Use — British Council", "url": "https://learnenglish.britishcouncil.org/grammar"},
        {"title": "Academic Vocabulary — vocabulary.com", "url": "https://www.vocabulary.com"},
    ],
    "Казахский язык": [
        {"title": "Казахский язык онлайн — soyle.kz", "url": "https://soyle.kz"},
        {"title": "Грамматика казахского — учебные видео", "url": "https://www.youtube.com/results?search_query=казахский+грамматика"},
    ],
    "История Казахстана": [
        {"title": "История Казахстана — bilim.kz", "url": "https://bilim.kz/kz/history"},
        {"title": "Хронология событий — wikipedia", "url": "https://ru.wikipedia.org/wiki/История_Казахстана"},
    ],
    "Биология": [
        {"title": "Биология — Khan Academy", "url": "https://ru.khanacademy.org/science/biology"},
        {"title": "Анатомия человека — видеоуроки", "url": "https://www.youtube.com/results?search_query=анатомия+человека+урок"},
    ],
    "География": [
        {"title": "Интерактивные карты — geo.rocks", "url": "https://geo.rocks"},
        {"title": "Физическая география — videouroki.net", "url": "https://videouroki.net/video/geografiya.html"},
    ],
    "Информатика": [
        {"title": "Python для начинающих — stepik.org", "url": "https://stepik.org/course/67/promo"},
        {"title": "CS50 на русском — YouTube", "url": "https://www.youtube.com/results?search_query=cs50+русский"},
    ],
}

DEFAULT_RESOURCES = [
    {"title": "Видеоуроки по всем предметам — videouroki.net", "url": "https://videouroki.net"},
    {"title": "Учебные материалы — bilim.kz", "url": "https://bilim.kz"},
]


def _recommendations_for(subject_name: str, risk_score: float) -> list:
    if risk_score < 0.3:
        return []
    resources = SUBJECT_RESOURCES.get(subject_name, DEFAULT_RESOURCES)
    return resources[:2]



# ── Helpers ───────────────────────────────────────────────────────────────────

def _subject_stats(grades: list) -> dict:
    """Compute simple stats for a list of Grade ORM objects."""
    values = sorted([g.value for g in grades], key=lambda _: 0)  # preserve insertion order
    # re-sort by date for trend
    sorted_by_date = sorted(grades, key=lambda g: g.date)
    values_chron = [g.value for g in sorted_by_date]

    avg = round(sum(values_chron) / len(values_chron), 2)

    # Trend: compare first-half average vs second-half average
    mid = len(values_chron) // 2
    if mid >= 1:
        first_half_avg = sum(values_chron[:mid]) / mid
        second_half_avg = sum(values_chron[mid:]) / (len(values_chron) - mid)
        trend_slope = round((second_half_avg - first_half_avg) / 5.0, 3)
    else:
        trend_slope = 0.0

    # "needs_attention" score – purely grade-based: 0 = great (avg 5), 1 = bad (avg 1)
    needs_attention = round(max(0.0, min(1.0, (4.0 - avg) / 3.0)), 3)

    # Weak topics: any topic whose average is below 3.5
    topic_buckets: dict = defaultdict(list)
    for g in grades:
        if g.topic_id:
            topic_buckets[g.topic_id].append(g.value)
    weak_topic_ids = [
        tid for tid, vals in topic_buckets.items()
        if sum(vals) / len(vals) < 3.5
    ]

    return {
        "average": avg,
        "trend_slope": trend_slope,
        "needs_attention": needs_attention,
        "weak_topic_ids": weak_topic_ids,
        "grades_count": len(values_chron),
    }


# ── Student grades ─────────────────────────────────────────────────────────────

# points awarded per grade value (only for СОЧ/СОР)
GRADE_POINTS = {5: 100, 4: 50}

@router.post("/add")
async def add_grade(
    student_id: int,
    subject_id: int,
    value: float,
    grade_type: str = "current",
    topic_id: Optional[int] = None,
    quarter: Optional[int] = None,
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    from datetime import date
    grade = Grade(
        student_id=student_id,
        subject_id=subject_id,
        value=value,
        grade_type=grade_type,
        topic_id=topic_id,
        quarter=quarter or 1,
        date=date.today(),
    )
    db.add(grade)

    # auto-award gamification points for high grades
    pts = GRADE_POINTS.get(int(value))
    if pts and grade_type in ("СОЧ", "СОР", "current"):
        subj = await db.get(Subject, subject_id)
        subj_name = subj.name if subj else f"предмет {subject_id}"
        point = GamificationPoint(
            student_id=student_id,
            points=pts,
            reason=f"Оценка {int(value)} по {subj_name} ({grade_type})",
        )
        db.add(point)

    await db.commit()
    return {"message": "Grade added", "points_awarded": pts or 0}


@router.get("/my", response_model=List[GradeOut])
async def get_my_grades(
    quarter: Optional[int] = None,
    subject_id: Optional[int] = None,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    query = select(Grade).where(Grade.student_id == current_user.id)
    if quarter:
        query = query.where(Grade.quarter == quarter)
    if subject_id:
        query = query.where(Grade.subject_id == subject_id)
    result = await db.execute(query.order_by(Grade.date.desc()))
    grades = result.scalars().all()

    grade_list = []
    for g in grades:
        subj_res = await db.execute(select(Subject).where(Subject.id == g.subject_id))
        subj = subj_res.scalar_one_or_none()
        topic_name = None
        if g.topic_id:
            topic_res = await db.execute(select(Topic).where(Topic.id == g.topic_id))
            topic = topic_res.scalar_one_or_none()
            topic_name = topic.name if topic else None
        grade_list.append(GradeOut(
            id=g.id,
            student_id=g.student_id,
            subject_id=g.subject_id,
            subject_name=subj.name if subj else None,
            topic_id=g.topic_id,
            topic_name=topic_name,
            value=g.value,
            grade_type=g.grade_type,
            date=g.date,
            quarter=g.quarter,
        ))
    return grade_list


# ── Student analytics (real DB data) ──────────────────────────────────────────

@router.get("/analytics/me")
async def get_my_analytics(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    grades_result = await db.execute(
        select(Grade).where(Grade.student_id == current_user.id).order_by(Grade.date)
    )
    grades = grades_result.scalars().all()

    subj_result = await db.execute(select(Subject))
    subjects = subj_result.scalars().all()

    grades_by_subject: dict = defaultdict(list)
    for g in grades:
        grades_by_subject[g.subject_id].append(g)

    subject_results = []
    for subj in subjects:
        subj_grades = grades_by_subject.get(subj.id, [])
        if not subj_grades:
            continue
        stats = _subject_stats(subj_grades)
        subject_results.append({
            "subject_id": subj.id,
            "subject_name": subj.name,
            "average": stats["average"],
            "trend_score": stats["average"],      # kept for compat
            "trend_slope": stats["trend_slope"],
            "risk_score": stats["needs_attention"],
            "gap_topic_ids": stats["weak_topic_ids"],
            "recommendations": _recommendations_for(subj.name, stats["needs_attention"]),
            "grades_count": stats["grades_count"],
        })

    if not subject_results:
        return {
            "student_id": current_user.id,
            "student_name": current_user.name,
            "subjects": [],
            "overall_risk": 0.0,
            "high_risk_subjects": [],
            "recommendations": [],
        }

    overall_avg = sum(s["average"] for s in subject_results) / len(subject_results)
    overall_needs_attention = round(max(0.0, min(1.0, (4.0 - overall_avg) / 3.0)), 3)

    # "Weak" = average below 3.5
    weak_subjects = [s["subject_name"] for s in subject_results if s["average"] < 3.5]

    return {
        "student_id": current_user.id,
        "student_name": current_user.name,
        "subjects": subject_results,
        "overall_risk": overall_needs_attention,
        "high_risk_subjects": weak_subjects,
        "recommendations": [],
    }


# ── Class analytics (real DB data) ────────────────────────────────────────────

@router.get("/analytics/class/{class_id}")
async def get_class_analytics(
    class_id: int,
    current_user: User = Depends(require_roles("teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    students_result = await db.execute(
        select(User).where(User.class_id == class_id, User.role == "student")
    )
    students = students_result.scalars().all()

    subj_result = await db.execute(select(Subject))
    subjects = subj_result.scalars().all()

    all_analytics = []
    for student in students:
        grades_result = await db.execute(
            select(Grade).where(Grade.student_id == student.id).order_by(Grade.date)
        )
        grades = grades_result.scalars().all()
        grades_by_subject: dict = defaultdict(list)
        for g in grades:
            grades_by_subject[g.subject_id].append(g)

        subject_results = []
        for subj in subjects:
            subj_grades = grades_by_subject.get(subj.id, [])
            if not subj_grades:
                continue
            stats = _subject_stats(subj_grades)
            subject_results.append({
                "subject_id": subj.id,
                "subject_name": subj.name,
                "average": stats["average"],
                "risk_score": stats["needs_attention"],
                "grades_count": stats["grades_count"],
            })

        if subject_results:
            overall_avg = sum(s["average"] for s in subject_results) / len(subject_results)
        else:
            overall_avg = 0.0

        all_analytics.append({
            "student_id": student.id,
            "student_name": student.name,
            "subjects": subject_results,
            "overall_risk": round(max(0.0, min(1.0, (4.0 - overall_avg) / 3.0)), 3),
            "overall_avg": round(overall_avg, 2),
        })

    return {"class_id": class_id, "students": all_analytics}


# ── Legacy mock routes (kept for backward compat) ─────────────────────────────

@router.get("/mock/subjects")
async def get_mock_subjects():
    return []


@router.get("/mock/student/{student_id}")
async def get_mock_student_grades(student_id: int):
    return []
