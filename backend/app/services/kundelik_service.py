"""
Kundelik.kz Mock API Service.
В реальном проекте: OAuth2 flow → access_token → REST API kundelik.kz.
Здесь: детерминированная генерация данных по user_id (seed).
"""
from datetime import date, timedelta, time
from typing import List, Dict, Any
import random

PERIOD_TIMES = [
    ("08:00", "08:45"),
    ("08:55", "09:40"),
    ("09:50", "10:35"),
    ("10:55", "11:40"),
    ("11:50", "12:35"),
    ("12:45", "13:30"),
    ("14:00", "14:45"),
]

SUBJECTS = [
    "Математика", "Физика", "Химия", "Биология",
    "История Казахстана", "Английский язык", "Казахский язык",
    "Русский язык", "Информатика", "Физкультура", "Литература",
]

TEACHERS = [
    "Иванова М.П.", "Сейткали Н.А.", "Петрова С.В.",
    "Ахметова Г.К.", "Байжанов С.Т.", "Ли Д.И.",
]

HW_TEMPLATES = [
    "Параграф {n}, упражнения 1–5",
    "Решить задачи {n}–{m} на стр. {p}",
    "Подготовить реферат на тему: «{topic}»",
    "Выучить правило, написать 5 примеров",
    "Повторить теорему, доказать самостоятельно",
]

TOPICS = ["Экология", "Современная наука", "Казахстан в XXI веке", "ИИ и будущее"]


def get_today_schedule(user_id: int, target_date: date | None = None) -> List[Dict[str, Any]]:
    random.seed(user_id * 7 + (target_date or date.today()).toordinal())
    if target_date is None:
        target_date = date.today()

    day_of_week = target_date.weekday()
    if day_of_week >= 6:
        return []

    n_lessons = random.randint(5, 7)
    chosen_subjects = random.sample(SUBJECTS, n_lessons)
    lessons = []
    for i, subject in enumerate(chosen_subjects):
        start, end = PERIOD_TIMES[i]
        lessons.append({
            "period_num": i + 1,
            "subject_name": subject,
            "teacher_name": random.choice(TEACHERS),
            "room": f"каб.{random.randint(100, 320)}",
            "start_time": start,
            "end_time": end,
            "is_cancelled": random.random() < 0.05,
            "lesson_date": target_date.isoformat(),
        })
    return lessons


def get_current_lesson(user_id: int) -> Dict[str, Any] | None:
    """Возвращает текущий или ближайший урок на сегодня."""
    from datetime import datetime
    now = datetime.now().time()
    schedule = get_today_schedule(user_id)
    for lesson in schedule:
        start = time(*map(int, lesson["start_time"].split(":")))
        end = time(*map(int, lesson["end_time"].split(":")))
        if start <= now <= end:
            lesson["status"] = "in_progress"
            elapsed = (now.hour * 60 + now.minute) - (start.hour * 60 + start.minute)
            total = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute)
            lesson["progress_pct"] = min(100, round(elapsed / total * 100))
            return lesson
    for lesson in schedule:
        start = time(*map(int, lesson["start_time"].split(":")))
        if start > now:
            lesson["status"] = "upcoming"
            lesson["progress_pct"] = 0
            return lesson
    return None


def get_day_progress(user_id: int) -> Dict[str, Any]:
    """Прогресс-бар учебного дня."""
    schedule = get_today_schedule(user_id)
    if not schedule:
        return {"total": 0, "done": 0, "pct": 0, "lessons": []}
    from datetime import datetime
    now = datetime.now().time()
    done = sum(
        1 for l in schedule
        if time(*map(int, l["end_time"].split(":"))) < now
    )
    return {
        "total": len(schedule),
        "done": done,
        "pct": round(done / len(schedule) * 100),
        "lessons": schedule,
    }


def get_homework(user_id: int, days_ahead: int = 7) -> List[Dict[str, Any]]:
    random.seed(user_id * 13)
    today = date.today()
    hw = []
    for i in range(8):
        subject = random.choice(SUBJECTS)
        due = today + timedelta(days=random.randint(1, days_ahead))
        tmpl = random.choice(HW_TEMPLATES)
        desc = tmpl.format(n=random.randint(1, 20), m=random.randint(21, 40),
                           p=random.randint(50, 200), topic=random.choice(TOPICS))
        hw.append({
            "id": user_id * 100 + i,
            "subject_name": subject,
            "description": desc,
            "due_date": due.isoformat(),
            "is_done": random.random() < 0.3,
        })
    hw.sort(key=lambda x: x["due_date"])
    return hw
