"""
AI Analytics Engine — собственные алгоритмы предиктивной аналитики.
Никаких внешних LLM / API не используется. Всё считается локально.

Алгоритмы:
  1. Trend Score     — EWMA (экспоненциальное скользящее среднее) по оценкам
  2. Knowledge Gap   — BFS по графу тем: если оценка < порога, все зависимые темы тоже «слабые»
  3. Risk Score      — формула: 0.4*(1-slope) + 0.4*gap_ratio + 0.2*(1-attendance)
  4. Heatmap         — агрегация по классу: темы, где > 60% учеников слабые → критические
  5. Recommendations — rule-based маппинг слабых тем → ресурсы (без LLM)
"""
from typing import List, Dict, Any, Optional, Tuple
import math
from collections import defaultdict, deque
from datetime import date


# ─── Trend Score ─────────────────────────────────────────────────────────────

def compute_trend_score(grades: List[float], decay: float = 0.85) -> Tuple[float, float]:
    """
    Exponential Weighted Moving Average по хронологическому ряду оценок.
    Возвращает (ewma_score, trend_slope).
    slope > 0  → улучшение, slope < 0 → ухудшение.
    """
    if not grades:
        return 0.0, 0.0

    ewma = grades[0]
    for g in grades[1:]:
        ewma = decay * ewma + (1 - decay) * g

    if len(grades) < 2:
        return ewma, 0.0

    mid = len(grades) // 2
    first_half_avg = sum(grades[:mid]) / max(len(grades[:mid]), 1)
    second_half_avg = sum(grades[mid:]) / max(len(grades[mid:]), 1)
    slope = (second_half_avg - first_half_avg) / 5.0

    return round(ewma, 3), round(slope, 3)


# ─── Knowledge Gap Detector ──────────────────────────────────────────────────

def detect_knowledge_gaps(
    topic_grades: Dict[int, List[float]],
    topic_graph: Dict[int, List[int]],
    threshold: float = 3.0,
) -> List[int]:
    """
    BFS по графу тем. Если оценка по теме < threshold,
    помечаем её и все зависимые темы как проблемные.
    topic_grades: {topic_id: [grade_values]}
    topic_graph:  {topic_id: [dependent_topic_ids]}
    """
    topic_avg = {
        tid: sum(vals) / len(vals)
        for tid, vals in topic_grades.items()
        if vals
    }

    weak_topics = {tid for tid, avg in topic_avg.items() if avg < threshold}
    gap_set = set(weak_topics)

    queue = deque(weak_topics)
    while queue:
        t = queue.popleft()
        for dependent in topic_graph.get(t, []):
            if dependent not in gap_set:
                gap_set.add(dependent)
                queue.append(dependent)

    return sorted(gap_set)


# ─── Risk Score ──────────────────────────────────────────────────────────────

def compute_risk_score(
    trend_slope: float,
    gap_ratio: float,
    attendance_rate: float = 1.0,
) -> float:
    """
    Risk Score = 0.4*(1 - normalised_slope) + 0.4*gap_ratio + 0.2*(1 - attendance_rate)
    Возвращает значение [0..1].  1.0 = максимальный риск провала.
    """
    slope_norm = max(0.0, min(1.0, (trend_slope + 1.0) / 2.0))
    risk = (
        0.4 * (1.0 - slope_norm)
        + 0.4 * gap_ratio
        + 0.2 * (1.0 - attendance_rate)
    )
    return round(max(0.0, min(1.0, risk)), 3)


# ─── Per-subject analytics ───────────────────────────────────────────────────

def analyze_subject(
    grades_by_topic: Dict[int, List[Dict]],
    all_grades_sorted: List[Dict],
    topic_graph: Dict[int, List[int]],
    attendance_rate: float = 1.0,
) -> Dict[str, Any]:
    values = [g["value"] for g in all_grades_sorted]
    if not values:
        return {"trend_score": 0, "trend_slope": 0, "risk_score": 0, "gap_topics": [], "avg": 0}

    ewma, slope = compute_trend_score(values)
    average = sum(values) / len(values)

    topic_grades: Dict[int, List[float]] = defaultdict(list)
    for g in all_grades_sorted:
        if g.get("topic_id"):
            topic_grades[g["topic_id"]].append(g["value"])

    gap_topics = detect_knowledge_gaps(dict(topic_grades), topic_graph)
    total_topics = len(topic_grades) or 1
    gap_ratio = len(gap_topics) / total_topics

    risk = compute_risk_score(slope, gap_ratio, attendance_rate)

    return {
        "average": round(average, 2),
        "trend_score": ewma,
        "trend_slope": slope,
        "risk_score": risk,
        "gap_topic_ids": gap_topics,
    }


# ─── Class-level analytics ───────────────────────────────────────────────────

def analyze_class_heatmap(
    students_grades: Dict[int, List[Dict]],
    topics: List[Dict],
) -> Dict[str, Any]:
    """
    Строит тепловую карту student_id × topic_id.
    Также возвращает проблемные темы, в которых > 60% учеников слабы.
    """
    heatmap: Dict[int, Dict[int, float]] = {}
    topic_weak_count: Dict[int, int] = defaultdict(int)
    student_count = len(students_grades)

    for student_id, grades in students_grades.items():
        topic_scores: Dict[int, List[float]] = defaultdict(list)
        for g in grades:
            if g.get("topic_id"):
                topic_scores[g["topic_id"]].append(g["value"])

        heatmap[student_id] = {}
        for topic in topics:
            tid = topic["id"]
            vals = topic_scores.get(tid, [])
            avg = sum(vals) / len(vals) if vals else None
            heatmap[student_id][tid] = avg
            if avg is not None and avg < 3.0:
                topic_weak_count[tid] += 1

    critical_topics = [
        tid for tid, cnt in topic_weak_count.items()
        if cnt / max(student_count, 1) >= 0.6
    ]

    return {"heatmap": heatmap, "critical_topics": critical_topics}


# ─── Recommendations (rule-based) ────────────────────────────────────────────

TOPIC_RESOURCES = {
    101: [{"title": "Алгебраические выражения — Khan Academy", "url": "https://khanacademy.org"}],
    102: [{"title": "Уравнения — видеоурок", "url": "https://youtube.com"}],
    103: [{"title": "Функции и графики", "url": "https://mathprofi.ru"}],
    201: [{"title": "Кинематика — основы", "url": "https://fizmat.by"}],
    202: [{"title": "Законы Ньютона", "url": "https://youtube.com"}],
    701: [{"title": "English Tenses — British Council", "url": "https://learnenglish.britishcouncil.org"}],
    702: [{"title": "Academic Vocabulary", "url": "https://vocabulary.com"}],
}


def get_recommendations(gap_topic_ids: List[int], subject_name: str) -> List[Dict]:
    recs = []
    for tid in gap_topic_ids[:3]:
        resources = TOPIC_RESOURCES.get(tid, [{"title": f"Повторить тему по {subject_name}", "url": "#"}])
        recs.extend(resources)
    return recs


# ─── Full student analytics ──────────────────────────────────────────────────

def compute_full_student_analytics(
    student_id: int,
    student_name: str,
    grades: List[Dict],
    subjects: List[Dict],
    topics_by_subject: Dict[int, List[Dict]],
    attendance_rate: float = 0.95,
) -> Dict[str, Any]:
    grades_by_subject: Dict[int, List[Dict]] = defaultdict(list)
    for g in grades:
        grades_by_subject[g["subject_id"]].append(g)

    for sid in grades_by_subject:
        grades_by_subject[sid].sort(key=lambda x: x["date"])

    subject_results = []
    overall_risk_sum = 0.0

    for subject in subjects:
        sid = subject["id"]
        subject_grades = grades_by_subject.get(sid, [])
        if not subject_grades:
            continue

        topics = topics_by_subject.get(sid, [])
        topic_graph: Dict[int, List[int]] = defaultdict(list)
        for t in topics:
            for prereq_id in t.get("prerequisites", []):
                topic_graph[prereq_id].append(t["id"])

        analysis = analyze_subject(
            grades_by_topic={},
            all_grades_sorted=subject_grades,
            topic_graph=dict(topic_graph),
            attendance_rate=attendance_rate,
        )

        recs = get_recommendations(analysis["gap_topic_ids"], subject["name"])

        subject_results.append({
            "subject_id": sid,
            "subject_name": subject["name"],
            "average": analysis["average"],
            "trend_score": analysis["trend_score"],
            "trend_slope": analysis["trend_slope"],
            "risk_score": analysis["risk_score"],
            "gap_topic_ids": analysis["gap_topic_ids"],
            "recommendations": recs,
        })
        overall_risk_sum += analysis["risk_score"]

    overall_risk = overall_risk_sum / max(len(subject_results), 1)

    high_risk_subjects = [s for s in subject_results if s["risk_score"] > 0.6]
    all_recs = []
    for s in high_risk_subjects:
        all_recs.extend(s["recommendations"])

    return {
        "student_id": student_id,
        "student_name": student_name,
        "subjects": subject_results,
        "overall_risk": round(overall_risk, 3),
        "high_risk_subjects": [s["subject_name"] for s in high_risk_subjects],
        "recommendations": all_recs[:6],
    }
