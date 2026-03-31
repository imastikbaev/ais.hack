from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.models.grade import GradeType


class GradeOut(BaseModel):
    id: int
    student_id: int
    subject_id: int
    subject_name: Optional[str] = None
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    value: float
    grade_type: GradeType
    date: date
    quarter: Optional[int]

    model_config = {"from_attributes": True}


class SubjectSummary(BaseModel):
    subject_id: int
    subject_name: str
    average: float
    trend_score: float
    risk_score: float
    grades_count: int


class StudentAnalytics(BaseModel):
    student_id: int
    student_name: str
    subjects: List[SubjectSummary]
    overall_risk: float
    recommendations: List[dict]
