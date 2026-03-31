"""
Mock BilimClass API service.
Provides realistic test data emulating the BilimClass grade management system.
"""
from typing import List, Dict, Any
from datetime import date, timedelta
import random

MOCK_SUBJECTS = [
    {"id": 1, "name": "Математика", "requires_split": False},
    {"id": 2, "name": "Физика", "requires_split": False},
    {"id": 3, "name": "Химия", "requires_split": False},
    {"id": 4, "name": "Биология", "requires_split": False},
    {"id": 5, "name": "История", "requires_split": False},
    {"id": 6, "name": "География", "requires_split": False},
    {"id": 7, "name": "Английский язык", "requires_split": True},
    {"id": 8, "name": "Русский язык", "requires_split": False},
    {"id": 9, "name": "Казахский язык", "requires_split": False},
    {"id": 10, "name": "Информатика", "requires_split": True},
    {"id": 11, "name": "Литература", "requires_split": False},
    {"id": 12, "name": "Физкультура", "requires_split": True},
]

MOCK_TOPICS = {
    1: [
        {"id": 101, "name": "Алгебраические выражения", "prerequisites": []},
        {"id": 102, "name": "Уравнения и неравенства", "prerequisites": [101]},
        {"id": 103, "name": "Функции и графики", "prerequisites": [102]},
        {"id": 104, "name": "Тригонометрия", "prerequisites": [103]},
        {"id": 105, "name": "Производная", "prerequisites": [103, 104]},
        {"id": 106, "name": "Интеграл", "prerequisites": [105]},
    ],
    2: [
        {"id": 201, "name": "Механика: кинематика", "prerequisites": []},
        {"id": 202, "name": "Механика: динамика", "prerequisites": [201]},
        {"id": 203, "name": "Законы сохранения", "prerequisites": [202]},
        {"id": 204, "name": "Термодинамика", "prerequisites": [203]},
        {"id": 205, "name": "Электростатика", "prerequisites": []},
        {"id": 206, "name": "Электрический ток", "prerequisites": [205]},
    ],
    7: [
        {"id": 701, "name": "Grammar: Tenses", "prerequisites": []},
        {"id": 702, "name": "Vocabulary: Academic", "prerequisites": [701]},
        {"id": 703, "name": "Reading Comprehension", "prerequisites": [701, 702]},
        {"id": 704, "name": "Essay Writing", "prerequisites": [702, 703]},
    ],
}

GRADE_TYPES = ["текущая", "СОР", "СОЧ"]


def _generate_student_grades(student_id: int, base_performance: float = 0.75) -> List[Dict[str, Any]]:
    grades = []
    start_date = date.today() - timedelta(days=180)
    grade_id = student_id * 1000

    for subject in MOCK_SUBJECTS:
        subj_perf = base_performance + random.uniform(-0.15, 0.15)
        subj_perf = max(0.4, min(1.0, subj_perf))
        current_date = start_date

        for week in range(24):
            current_date += timedelta(days=7)
            if random.random() > 0.3:
                value = round(subj_perf * 5 + random.uniform(-0.5, 0.5), 1)
                value = max(1.0, min(5.0, value))

                if week in [5, 11, 17, 23]:
                    grade_type = "СОЧ"
                    value = round(subj_perf * 5 + random.uniform(-0.3, 0.3), 1)
                elif week in [2, 8, 14, 20]:
                    grade_type = "СОР"
                else:
                    grade_type = "текущая"

                topic_id = None
                if subject["id"] in MOCK_TOPICS:
                    topics = MOCK_TOPICS[subject["id"]]
                    topic_id = random.choice(topics)["id"]

                grades.append({
                    "id": grade_id,
                    "student_id": student_id,
                    "subject_id": subject["id"],
                    "subject_name": subject["name"],
                    "topic_id": topic_id,
                    "value": value,
                    "grade_type": grade_type,
                    "date": current_date.isoformat(),
                    "quarter": min(4, (week // 6) + 1),
                })
                grade_id += 1

    return grades


def get_student_grades(student_id: int) -> List[Dict[str, Any]]:
    random.seed(student_id * 42)
    performance_map = {
        1: 0.90, 2: 0.75, 3: 0.85, 4: 0.60, 5: 0.70,
        6: 0.80, 7: 0.65, 8: 0.88, 9: 0.72, 10: 0.55,
        11: 0.78, 12: 0.82, 13: 0.69, 14: 0.91, 15: 0.73,
    }
    perf = performance_map.get(student_id % 15 + 1, 0.75)
    return _generate_student_grades(student_id, perf)


def get_class_grades(class_id: int, student_ids: List[int]) -> Dict[str, Any]:
    all_grades = []
    for sid in student_ids:
        all_grades.extend(get_student_grades(sid))
    return {"class_id": class_id, "grades": all_grades, "total": len(all_grades)}


def get_subjects() -> List[Dict[str, Any]]:
    return MOCK_SUBJECTS


def get_topics(subject_id: int) -> List[Dict[str, Any]]:
    return MOCK_TOPICS.get(subject_id, [])
