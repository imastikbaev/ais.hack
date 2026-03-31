from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from collections import defaultdict
from datetime import date as date_cls

from app.core.database import get_db
from app.core.security import require_roles
from app.models.user import User
from app.models.grade import Grade
from app.models.subject import Subject
from app.models.school_class import SchoolClass

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/report/generate")
async def generate_report(
    quarter: Optional[int] = None,
    current_user: User = Depends(require_roles("admin", "teacher")),
    db: AsyncSession = Depends(get_db),
):
    # ── Load data ──────────────────────────────────────────────────────────
    students_result = await db.execute(select(User).where(User.role == "student"))
    students = students_result.scalars().all()

    subj_result = await db.execute(select(Subject))
    subjects = subj_result.scalars().all()

    classes_result = await db.execute(select(SchoolClass))
    classes = {c.id: c.name for c in classes_result.scalars().all()}

    grade_query = select(Grade)
    if quarter:
        grade_query = grade_query.where(Grade.quarter == quarter)
    grades_result = await db.execute(grade_query)
    all_grades = grades_result.scalars().all()

    # ── Aggregate ──────────────────────────────────────────────────────────
    # Subject averages
    subj_values: dict = defaultdict(list)
    for g in all_grades:
        subj_values[g.subject_id].append(g.value)

    subj_name = {s.id: s.name for s in subjects}

    subject_rows = []
    for sid, vals in subj_values.items():
        avg = sum(vals) / len(vals)
        dist = {
            "5": sum(1 for v in vals if v >= 4.5),
            "4": sum(1 for v in vals if 3.5 <= v < 4.5),
            "3": sum(1 for v in vals if 2.5 <= v < 3.5),
            "2": sum(1 for v in vals if v < 2.5),
        }
        subject_rows.append((subj_name.get(sid, f"Предмет {sid}"), avg, dist, len(vals)))

    subject_rows.sort(key=lambda x: x[1], reverse=True)

    # Per-student averages
    student_grades_map: dict = defaultdict(list)
    for g in all_grades:
        student_grades_map[g.student_id].append(g.value)

    student_avgs = []
    for st in students:
        vals = student_grades_map.get(st.id, [])
        if vals:
            student_avgs.append(sum(vals) / len(vals))

    # ── Build report text ──────────────────────────────────────────────────
    period = f"{quarter}-я четверть" if quarter else "учебный год (все четверти)"
    today = date_cls.today().strftime("%d.%m.%Y")

    lines = [
        f"ОТЧЁТ ОБ УСПЕВАЕМОСТИ — {period.upper()}",
        f"Лицей Aqbobek Lyceum  |  Дата: {today}",
        "─" * 52,
        "",
        f"Учеников: {len(students)}   Классов: {len(classes)}   Оценок: {len(all_grades)}",
        "",
    ]

    if subject_rows:
        overall_avg = sum(a for _, a, _, _ in subject_rows) / len(subject_rows)
        best = subject_rows[0]
        worst = subject_rows[-1]

        lines += [
            "СРЕДНИЕ БАЛЛЫ ПО ПРЕДМЕТАМ:",
            f"  {'Предмет':<24} {'Ср.балл':>7}  {'5':>4} {'4':>4} {'3':>4} {'2':>4}  {'Кол-во':>6}",
            "  " + "-" * 50,
        ]
        for name, avg, dist, count in subject_rows:
            lines.append(
                f"  {name:<24} {avg:>7.2f}  {dist['5']:>4} {dist['4']:>4} {dist['3']:>4} {dist['2']:>4}  {count:>6}"
            )

        lines += [
            "",
            f"Средний балл по лицею:    {overall_avg:.2f}",
            f"Лучший предмет:           {best[0]} ({best[1]:.2f})",
            f"Требует внимания:         {worst[0]} ({worst[1]:.2f})",
            "",
        ]

    if student_avgs:
        pct_good = sum(1 for a in student_avgs if a >= 3.5) / len(student_avgs) * 100
        pct_poor = sum(1 for a in student_avgs if a < 2.5) / len(student_avgs) * 100
        pct_exc  = sum(1 for a in student_avgs if a >= 4.5) / len(student_avgs) * 100
        lines += [
            "РАСПРЕДЕЛЕНИЕ УЧЕНИКОВ:",
            f"  Отличники (≥4.5):        {pct_exc:5.1f}%",
            f"  Успевают (≥3.5):         {pct_good:5.1f}%",
            f"  Требуют помощи (<2.5):   {pct_poor:5.1f}%",
            "",
        ]

    # Quarter comparison (if full-year report)
    if not quarter:
        quarter_avgs = {}
        for q in [1, 2, 3]:
            q_vals = [g.value for g in all_grades if g.quarter == q]
            if q_vals:
                quarter_avgs[q] = sum(q_vals) / len(q_vals)
        if quarter_avgs:
            lines.append("ДИНАМИКА ПО ЧЕТВЕРТЯМ:")
            for q, avg in sorted(quarter_avgs.items()):
                trend = ""
                prev = quarter_avgs.get(q - 1)
                if prev:
                    diff = avg - prev
                    trend = f"  ({'+' if diff >= 0 else ''}{diff:.2f} к пред. четверти)"
                lines.append(f"  {q}-я четверть: {avg:.2f}{trend}")
            lines.append("")

    lines.append("─" * 52)
    lines.append("Отчёт сформирован автоматически на основе журнала оценок.")

    return {"report": "\n".join(lines), "quarter": quarter}
