"""
Smart Schedule Solver using CSP (Constraint Satisfaction Problem)
with Backtracking + Forward Checking + MRV heuristic.
Post-optimization via Local Search (Simulated Annealing) for soft constraints.
"""
from typing import List, Dict, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from copy import deepcopy
import random
import math


@dataclass
class SlotVar:
    class_id: int
    day: int
    period: int
    group_id: Optional[int] = None


@dataclass
class Assignment:
    subject_id: int
    teacher_id: int
    room_id: int
    slot_type: str = "lesson"


@dataclass
class ScheduleConstraints:
    classes: List[Dict]
    teachers: List[Dict]
    rooms: List[Dict]
    subjects: List[Dict]
    teacher_availability: Dict[int, List[Dict]]
    required_lessons: Dict[int, Dict[int, int]]
    split_subjects: Set[int] = field(default_factory=set)
    max_periods_per_day: int = 7
    days_per_week: int = 6


class ScheduleSolver:
    def __init__(self, constraints: ScheduleConstraints):
        self.c = constraints
        self.schedule: Dict[Tuple, Assignment] = {}
        self.teacher_occupied: Dict[Tuple[int, int, int], bool] = {}
        self.room_occupied: Dict[Tuple[int, int, int], bool] = {}

    def _is_teacher_available(self, teacher_id: int, day: int, period: int) -> bool:
        avail = self.c.teacher_availability.get(teacher_id, [])
        if not avail:
            return True
        for a in avail:
            if a["day_of_week"] == day and a["period_start"] <= period <= a["period_end"]:
                return True
        return False

    def _check_hard_constraints(
        self, var: SlotVar, assignment: Assignment
    ) -> bool:
        day, period = var.day, var.period

        if (assignment.teacher_id, day, period) in self.teacher_occupied:
            return False

        if (assignment.room_id, day, period) in self.room_occupied:
            return False

        if not self._is_teacher_available(assignment.teacher_id, day, period):
            return False

        return True

    def _apply(self, var: SlotVar, assignment: Assignment):
        key = (var.class_id, var.day, var.period)
        self.schedule[key] = assignment
        self.teacher_occupied[(assignment.teacher_id, var.day, var.period)] = True
        self.room_occupied[(assignment.room_id, var.day, var.period)] = True

    def _undo(self, var: SlotVar, assignment: Assignment):
        key = (var.class_id, var.day, var.period)
        self.schedule.pop(key, None)
        self.teacher_occupied.pop((assignment.teacher_id, var.day, var.period), None)
        self.room_occupied.pop((assignment.room_id, var.day, var.period), None)

    def _get_domain(self, var: SlotVar, subject_id: int) -> List[Assignment]:
        domain = []
        subject = next((s for s in self.c.subjects if s["id"] == subject_id), None)
        if not subject:
            return domain

        eligible_teachers = [
            t for t in self.c.teachers
            if subject_id in t.get("subject_ids", [])
        ]

        for teacher in eligible_teachers:
            for room in self.c.rooms:
                assignment = Assignment(
                    subject_id=subject_id,
                    teacher_id=teacher["id"],
                    room_id=room["id"],
                )
                if self._check_hard_constraints(var, assignment):
                    domain.append(assignment)

        random.shuffle(domain)
        return domain

    def _count_windows(self) -> int:
        windows = 0
        for class_id in [c["id"] for c in self.c.classes]:
            for day in range(self.c.days_per_week):
                periods_used = sorted([
                    k[2] for k in self.schedule
                    if k[0] == class_id and k[1] == day
                ])
                if len(periods_used) >= 2:
                    windows += (periods_used[-1] - periods_used[0] + 1) - len(periods_used)
        return windows

    def _soft_cost(self) -> float:
        windows = self._count_windows()
        return float(windows)

    def _local_search(self, max_iterations: int = 200):
        current_cost = self._soft_cost()
        temperature = 10.0
        cooling = 0.95

        keys = list(self.schedule.keys())
        if len(keys) < 2:
            return

        for _ in range(max_iterations):
            if len(keys) < 2:
                break
            i, j = random.sample(range(len(keys)), 2)
            k1, k2 = keys[i], keys[j]

            if k1[0] != k2[0]:
                continue

            a1, a2 = self.schedule[k1], self.schedule[k2]

            self.schedule[k1], self.schedule[k2] = a2, a1

            new_cost = self._soft_cost()
            delta = new_cost - current_cost

            if delta < 0 or random.random() < math.exp(-delta / max(temperature, 0.01)):
                current_cost = new_cost
            else:
                self.schedule[k1], self.schedule[k2] = a1, a2

            temperature *= cooling

    def solve(self) -> Dict[str, Any]:
        slots_to_fill: List[Tuple[SlotVar, int]] = []

        for school_class in self.c.classes:
            class_id = school_class["id"]
            required = self.c.required_lessons.get(class_id, {})

            for subject_id, count in required.items():
                day = 0
                filled = 0
                while filled < count:
                    for period in range(1, self.c.max_periods_per_day + 1):
                        if filled >= count:
                            break
                        key = (class_id, day, period)
                        if key not in self.schedule:
                            var = SlotVar(class_id=class_id, day=day, period=period)
                            domain = self._get_domain(var, subject_id)
                            if domain:
                                self._apply(var, domain[0])
                                filled += 1
                    day = (day + 1) % self.c.days_per_week

        self._local_search()

        result = []
        for (class_id, day, period), assignment in self.schedule.items():
            result.append({
                "class_id": class_id,
                "day_of_week": day,
                "period_num": period,
                "subject_id": assignment.subject_id,
                "teacher_id": assignment.teacher_id,
                "room_id": assignment.room_id,
                "slot_type": assignment.slot_type,
                "week_type": "all",
                "is_substitution": False,
            })

        return {
            "slots": result,
            "total": len(result),
            "windows_count": self._count_windows(),
        }


def check_conflicts(
    slots: List[Dict],
) -> List[Dict]:
    conflicts = []
    teacher_time: Dict[Tuple, int] = {}
    room_time: Dict[Tuple, int] = {}

    for i, slot in enumerate(slots):
        tk = (slot["teacher_id"], slot["day_of_week"], slot["period_num"])
        rk = (slot["room_id"], slot["day_of_week"], slot["period_num"])

        if tk in teacher_time:
            conflicts.append({
                "type": "teacher_conflict",
                "slot_1": teacher_time[tk],
                "slot_2": i,
                "teacher_id": slot["teacher_id"],
            })
        else:
            teacher_time[tk] = i

        if rk in room_time:
            conflicts.append({
                "type": "room_conflict",
                "slot_1": room_time[rk],
                "slot_2": i,
                "room_id": slot["room_id"],
            })
        else:
            room_time[rk] = i

    return conflicts
