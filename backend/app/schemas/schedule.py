from pydantic import BaseModel
from typing import Optional, List
from app.models.schedule import SlotType


class ScheduleSlotOut(BaseModel):
    id: int
    class_id: int
    group_id: Optional[int]
    subject_id: int
    subject_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    room_id: int
    room_name: Optional[str] = None
    class_name: Optional[str] = None
    day_of_week: int
    period_num: int
    week_type: str
    slot_type: SlotType
    is_substitution: bool

    model_config = {"from_attributes": True}


class SubstitutionCreate(BaseModel):
    slot_id: int
    new_teacher_id: int
    new_room_id: Optional[int] = None
    reason: Optional[str] = None


class ScheduleGenerateRequest(BaseModel):
    class_ids: List[int]
    week_type: str = "all"


class RoomOut(BaseModel):
    id: int
    name: str
    capacity: int
    room_type: str

    model_config = {"from_attributes": True}


class TeacherAvailabilityIn(BaseModel):
    day_of_week: int
    period_start: int
    period_end: int
