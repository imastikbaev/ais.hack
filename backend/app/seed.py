"""
Seed script — заполняет БД реалистичными тестовыми данными.
"""
import asyncio
import random
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.models import *

random.seed(42)

# ─── Справочные данные ───────────────────────────────────────────────────────

CLASSES = [
    {"name": "10А", "parallel": "10"},
    {"name": "10Б", "parallel": "10"},
    {"name": "11А", "parallel": "11"},
]

SUBJECTS_DATA = [
    {"name": "Математика",       "requires_split": False},   # id 1
    {"name": "Физика",           "requires_split": False},   # id 2
    {"name": "Химия",            "requires_split": False},   # id 3
    {"name": "Биология",         "requires_split": False},   # id 4
    {"name": "История",          "requires_split": False},   # id 5
    {"name": "География",        "requires_split": False},   # id 6
    {"name": "Английский язык",  "requires_split": True},    # id 7
    {"name": "Русский язык",     "requires_split": False},   # id 8
    {"name": "Казахский язык",   "requires_split": False},   # id 9
    {"name": "Информатика",      "requires_split": True},    # id 10
    {"name": "Литература",       "requires_split": False},   # id 11
    {"name": "Физкультура",      "requires_split": True},    # id 12
]

# Темы: {субъект_индекс: [(название, order, prereq_orders)]}
TOPICS_DATA = {
    0: [   # Математика
        ("Функции и их свойства",         1, []),
        ("Производная функции",           2, [1]),
        ("Интегралы",                     3, [2]),
        ("Тригонометрия",                 4, [1]),
        ("Уравнения и неравенства",       5, [1]),
    ],
    1: [   # Физика
        ("Механика",                      1, []),
        ("Термодинамика",                 2, [1]),
        ("Электричество и магнетизм",     3, [1]),
        ("Оптика",                        4, [3]),
    ],
    2: [   # Химия
        ("Строение атома",                1, []),
        ("Химические реакции",            2, [1]),
        ("Органическая химия",            3, [2]),
        ("Неорганическая химия",          4, [2]),
    ],
    3: [   # Биология
        ("Клетка и её строение",          1, []),
        ("Генетика",                      2, [1]),
        ("Эволюция",                      3, [1]),
        ("Экология",                      4, [3]),
    ],
    4: [   # История
        ("Древний мир",                   1, []),
        ("Средние века",                  2, [1]),
        ("Новое время",                   3, [2]),
        ("Новейшая история",              4, [3]),
    ],
    6: [   # Английский язык
        ("Grammar",                       1, []),
        ("Vocabulary",                    2, [1]),
        ("Reading Comprehension",         3, [2]),
        ("Writing Skills",                4, [3]),
    ],
    7: [   # Русский язык
        ("Орфография",                    1, []),
        ("Синтаксис",                     2, [1]),
        ("Пунктуация",                    3, [2]),
        ("Написание сочинений",           4, [3]),
    ],
    8: [   # Казахский язык
        ("Грамматика",                    1, []),
        ("Лексика",                       2, [1]),
        ("Мәтін оқу",                     3, [2]),
        ("Шығарма жазу",                  4, [3]),
    ],
}

ROOMS_DATA = [
    {"name": "101",           "capacity": 30, "room_type": "classroom"},
    {"name": "102",           "capacity": 30, "room_type": "classroom"},
    {"name": "103",           "capacity": 30, "room_type": "classroom"},
    {"name": "104",           "capacity": 30, "room_type": "classroom"},
    {"name": "Спортзал",      "capacity": 60, "room_type": "gym"},
    {"name": "Физика-лаб",    "capacity": 25, "room_type": "lab"},
    {"name": "Химия-лаб",     "capacity": 25, "room_type": "lab"},
    {"name": "Комп-класс 1",  "capacity": 20, "room_type": "computer"},
    {"name": "Комп-класс 2",  "capacity": 20, "room_type": "computer"},
    {"name": "Английский 1",  "capacity": 15, "room_type": "classroom"},
    {"name": "Английский 2",  "capacity": 15, "room_type": "classroom"},
]

SHOP_ITEMS_DATA = [
    {"name": "Брелок Aqbobek Lyceum",  "description": "Брелок с логотипом лицея",    "cost": 200},
    {"name": "Блокнот A5",             "description": "Фирменный блокнот лицея",     "cost": 300},
    {"name": "Толстовка Aqbobek",      "description": "Толстовка с символикой лицея","cost": 1500},
    {"name": "Ручка металлическая",    "description": "Гравировка Aqbobek Lyceum",   "cost": 150},
    {"name": "Стикеры-набор",          "description": "Набор стикеров с маскотом",   "cost": 100},
]

# ─── Профили успеваемости учеников ──────────────────────────────────────────
# Индексы предметов: 0=Математика 1=Физика 2=Химия 3=Биология 4=История
#                    6=Английский 7=Русский 8=Казахский

STUDENT_PROFILES = [
    # Ученик 1  — силён в точных науках
    [4.2, 4.1, 3.7, 3.5, 3.5, 3.3, 3.5, 3.8],
    # Ученик 2  — языковед, почти отличник
    [3.7, 3.5, 3.7, 4.3, 4.5, 4.8, 4.7, 4.5],
    # Ученик 3  — стабильный средний
    [3.4, 3.4, 3.3, 3.5, 3.5, 3.3, 3.5, 3.5],
    # Ученик 4  — химик и биолог
    [3.5, 3.6, 4.8, 4.8, 4.0, 3.5, 4.0, 4.1],
    # Ученик 5  — математик-физик
    [4.7, 4.8, 3.7, 3.4, 3.2, 3.1, 3.3, 3.4],
    # Ученик 6  — хорошо по всем предметам
    [4.2, 4.0, 4.2, 4.0, 4.2, 4.0, 4.2, 4.0],
    # Ученик 7  — отличник
    [4.8, 4.8, 4.8, 4.8, 4.7, 4.8, 4.8, 4.7],
    # Ученик 8  — проблемы с языками
    [4.2, 4.3, 3.1, 2.9, 2.7, 2.4, 2.6, 2.7],
    # Ученик 9  — гуманитарий, слабый в физике/химии
    [2.9, 2.7, 2.8, 3.2, 4.5, 4.6, 4.7, 4.5],
    # Ученик 10 — средний
    [3.3, 3.3, 3.2, 3.3, 3.4, 3.2, 3.3, 3.4],
    # Ученик 11 — хороший ученик
    [4.0, 3.8, 4.1, 4.2, 4.3, 4.1, 4.2, 4.4],
    # Ученик 12 — слабый (демо высокого риска)
    [2.4, 2.2, 2.7, 2.5, 2.6, 2.3, 2.4, 2.6],
]

# ─── Меню буфета ─────────────────────────────────────────────────────────────

CAFETERIA_MENU = [
    # Основные блюда
    {"name": "Плов с мясом",          "description": "Узбекский плов с говядиной и морковью",      "price_coins": 90,  "price_tenge": 90,  "category": "main"},
    {"name": "Борщ со сметаной",      "description": "Наваристый красный борщ, сметана",           "price_coins": 65,  "price_tenge": 65,  "category": "main"},
    {"name": "Лагман",                "description": "Среднеазиатская лапша с мясом и овощами",    "price_coins": 80,  "price_tenge": 80,  "category": "main"},
    {"name": "Котлета с картофелем",  "description": "Домашняя котлета, пюре, салат",              "price_coins": 75,  "price_tenge": 75,  "category": "main"},
    {"name": "Куриный суп",           "description": "Лёгкий суп с лапшой и куриным мясом",       "price_coins": 60,  "price_tenge": 60,  "category": "main"},
    # Закуски
    {"name": "Самса с картошкой",     "description": "Слоёная самса с картофельной начинкой",      "price_coins": 35,  "price_tenge": 35,  "category": "snack"},
    {"name": "Самса с мясом",         "description": "Слоёная самса с говяжьей начинкой",          "price_coins": 45,  "price_tenge": 45,  "category": "snack"},
    {"name": "Бутерброд с сыром",     "description": "Хлеб, масло, твёрдый сыр",                   "price_coins": 25,  "price_tenge": 25,  "category": "snack"},
    {"name": "Сосиска в тесте",       "description": "Запечённая сосиска в дрожжевом тесте",       "price_coins": 40,  "price_tenge": 40,  "category": "snack"},
    {"name": "Пирожок с капустой",    "description": "Мягкий печёный пирожок",                     "price_coins": 20,  "price_tenge": 20,  "category": "snack"},
    # Напитки
    {"name": "Чай чёрный",            "description": "Стакан горячего чёрного чая",                "price_coins": 15,  "price_tenge": 15,  "category": "drink"},
    {"name": "Компот из сухофруктов", "description": "Домашний компот, 300 мл",                    "price_coins": 20,  "price_tenge": 20,  "category": "drink"},
    {"name": "Апельсиновый сок",      "description": "Свежевыжатый сок, 200 мл",                   "price_coins": 50,  "price_tenge": 50,  "category": "drink"},
    {"name": "Кефир",                 "description": "Кефир 2.5%, 200 мл",                         "price_coins": 25,  "price_tenge": 25,  "category": "drink"},
    {"name": "Вода минеральная",      "description": "Негазированная питьевая вода, 500 мл",       "price_coins": 18,  "price_tenge": 18,  "category": "drink"},
    # Десерты
    {"name": "Пирожное «Картошка»",   "description": "Шоколадное пирожное из бисквита",            "price_coins": 55,  "price_tenge": 55,  "category": "dessert"},
    {"name": "Кекс с изюмом",         "description": "Домашний кекс с изюмом и ванилью",           "price_coins": 40,  "price_tenge": 40,  "category": "dessert"},
    {"name": "Яблоко",                "description": "Свежее яблоко",                              "price_coins": 15,  "price_tenge": 15,  "category": "dessert"},
]

# ─── Вспомогательные функции ─────────────────────────────────────────────────

def clamp(v: float) -> float:
    return round(max(1.0, min(5.0, v)), 1)


def rg(avg: float, var: float = 0.55) -> float:
    """Случайная оценка вокруг среднего с ограничением [1,5]."""
    return clamp(avg + random.gauss(0, var))


def make_grades(student_id: int, subject_id: int, topic_ids: list,
                avg: float) -> list:
    """
    Генерирует оценки за 3 четверти для одного ученика по одному предмету.
    Возвращает список словарей-параметров для Grade().
    """
    grades = []

    def add(value, grade_type, dt, quarter, topic_id=None):
        grades.append(dict(
            student_id=student_id,
            subject_id=subject_id,
            topic_id=topic_id,
            value=value,
            grade_type=grade_type,
            date=dt,
            quarter=quarter,
        ))

    # ── Четверть 1 (сентябрь–ноябрь 2025) ─────────────────────────────
    add(rg(avg),       GradeType.current, date(2025, 9, 12),  1, topic_ids[0] if topic_ids else None)
    add(rg(avg),       GradeType.current, date(2025, 9, 26),  1, topic_ids[0] if topic_ids else None)
    add(rg(avg),       GradeType.current, date(2025, 10, 10), 1, topic_ids[1] if len(topic_ids) > 1 else None)
    add(rg(avg, 0.3),  GradeType.sor,     date(2025, 10, 17), 1, topic_ids[1] if len(topic_ids) > 1 else None)
    add(rg(avg),       GradeType.current, date(2025, 11, 7),  1, topic_ids[2] if len(topic_ids) > 2 else None)
    add(rg(avg - 0.2, 0.4), GradeType.soch, date(2025, 11, 21), 1)

    # ── Четверть 2 (декабрь 2025–февраль 2026) ────────────────────────
    add(rg(avg),       GradeType.current, date(2025, 12, 5),  2, topic_ids[2] if len(topic_ids) > 2 else None)
    add(rg(avg),       GradeType.current, date(2025, 12, 19), 2, topic_ids[3] if len(topic_ids) > 3 else None)
    add(rg(avg, 0.3),  GradeType.sor,     date(2026, 1, 16),  2, topic_ids[3] if len(topic_ids) > 3 else None)
    add(rg(avg),       GradeType.current, date(2026, 1, 30),  2)
    add(rg(avg - 0.1, 0.4), GradeType.soch, date(2026, 2, 20), 2)

    # ── Четверть 3 (март 2026, текущие) ───────────────────────────────
    add(rg(avg + 0.1), GradeType.current, date(2026, 3, 7),  3, topic_ids[0] if topic_ids else None)
    add(rg(avg + 0.1), GradeType.current, date(2026, 3, 21), 3, topic_ids[1] if len(topic_ids) > 1 else None)

    return grades


# ─── Расписание ──────────────────────────────────────────────────────────────
# (class_idx, day_of_week, period_num, teacher_idx, subj_idx, room_idx)
# Классы:   0=10А  1=10Б  2=11А
# Учителя:  0=Математика  1=Физика  2=Химия  3=Английский  4=Казахский  5=ИТ
# Предметы: 0=Матем 1=Физ 2=Хим 3=Биол 4=Ист 5=Геогр 6=Англ 7=Рус 8=Каз 9=ИТ
# Кабинеты: 0=101 1=102 2=103 3=104 4=Спортзал 5=ФизЛаб 6=ХимЛаб 7=КК1 8=КК2 9=Англ1 10=Англ2
#
# Распределение учителей по периодам (round-robin без конфликтов):
#   10А: p→teacher = 1→t0, 2→t1, 3→t2, 4→t3, 5→t4, 6→t5
#   10Б: p→teacher = 1→t2, 2→t3, 3→t4, 4→t5, 5→t0, 6→t1
#   11А: p→teacher = 1→t4, 2→t5, 3→t0, 4→t1, 5→t2, 6→t3

SCHEDULE_DATA = [
    # ──────── 10А ────────
    # Понедельник
    (0, 0, 1, 0, 0, 0), (0, 0, 2, 1, 1, 5), (0, 0, 3, 2, 2, 6),
    (0, 0, 4, 3, 6, 9), (0, 0, 5, 4, 8, 1), (0, 0, 6, 5, 9, 7),
    # Вторник
    (0, 1, 1, 0, 0, 0), (0, 1, 2, 1, 4, 1), (0, 1, 3, 2, 3, 2),
    (0, 1, 4, 3, 6, 9), (0, 1, 5, 4, 7, 1), (0, 1, 6, 5, 9, 7),
    # Среда
    (0, 2, 1, 0, 0, 0), (0, 2, 2, 1, 5, 2), (0, 2, 3, 2, 2, 6),
    (0, 2, 4, 3, 6, 9), (0, 2, 5, 4, 8, 1), (0, 2, 6, 5, 9, 7),
    # Четверг
    (0, 3, 1, 0, 1, 5), (0, 3, 2, 1, 4, 1), (0, 3, 3, 2, 3, 2),
    (0, 3, 4, 3, 6, 9), (0, 3, 5, 4, 7, 1), (0, 3, 6, 5, 9, 7),
    # Пятница
    (0, 4, 1, 0, 1, 5), (0, 4, 2, 1, 5, 2), (0, 4, 3, 2, 2, 6),
    (0, 4, 4, 3, 6, 9), (0, 4, 5, 4, 8, 1), (0, 4, 6, 5, 9, 7),

    # ──────── 10Б ────────
    # Понедельник
    (1, 0, 1, 2, 2, 6), (1, 0, 2, 3, 6,10), (1, 0, 3, 4, 8, 2),
    (1, 0, 4, 5, 9, 8), (1, 0, 5, 0, 0, 3), (1, 0, 6, 1, 1, 5),
    # Вторник
    (1, 1, 1, 2, 3, 2), (1, 1, 2, 3, 6,10), (1, 1, 3, 4, 7, 3),
    (1, 1, 4, 5, 9, 8), (1, 1, 5, 0, 0, 3), (1, 1, 6, 1, 4, 1),
    # Среда
    (1, 2, 1, 2, 2, 6), (1, 2, 2, 3, 6,10), (1, 2, 3, 4, 8, 2),
    (1, 2, 4, 5, 9, 8), (1, 2, 5, 0, 0, 3), (1, 2, 6, 1, 5, 1),
    # Четверг
    (1, 3, 1, 2, 3, 2), (1, 3, 2, 3, 6,10), (1, 3, 3, 4, 7, 3),
    (1, 3, 4, 5, 9, 8), (1, 3, 5, 0, 1, 5), (1, 3, 6, 1, 4, 1),
    # Пятница
    (1, 4, 1, 2, 2, 6), (1, 4, 2, 3, 6,10), (1, 4, 3, 4, 8, 2),
    (1, 4, 4, 5, 9, 8), (1, 4, 5, 0, 1, 5), (1, 4, 6, 1, 5, 1),

    # ──────── 11А ────────
    # Понедельник
    (2, 0, 1, 4, 8, 3), (2, 0, 2, 5, 9, 8), (2, 0, 3, 0, 0, 0),
    (2, 0, 4, 1, 1, 5), (2, 0, 5, 2, 2, 6), (2, 0, 6, 3, 6, 9),
    # Вторник
    (2, 1, 1, 4, 7, 3), (2, 1, 2, 5, 9, 8), (2, 1, 3, 0, 0, 0),
    (2, 1, 4, 1, 4, 1), (2, 1, 5, 2, 3, 2), (2, 1, 6, 3, 6, 9),
    # Среда
    (2, 2, 1, 4, 8, 3), (2, 2, 2, 5, 9, 8), (2, 2, 3, 0, 0, 0),
    (2, 2, 4, 1, 5, 1), (2, 2, 5, 2, 2, 6), (2, 2, 6, 3, 6, 9),
    # Четверг
    (2, 3, 1, 4, 7, 3), (2, 3, 2, 5, 9, 8), (2, 3, 3, 0, 1, 5),
    (2, 3, 4, 1, 4, 1), (2, 3, 5, 2, 3, 2), (2, 3, 6, 3, 6, 9),
    # Пятница
    (2, 4, 1, 4, 8, 3), (2, 4, 2, 5, 9, 8), (2, 4, 3, 0, 1, 5),
    (2, 4, 4, 1, 5, 1), (2, 4, 5, 2, 2, 6), (2, 4, 6, 3, 6, 9),
]

# ─── Основная функция ────────────────────────────────────────────────────────

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = await db.execute(
            select(User).where(User.email == "admin@aqbobek.kz")
        )
        if existing.scalar_one_or_none():
            print("Database already seeded, skipping.")
            return

        # ── Классы ──────────────────────────────────────────────────────
        classes = []
        for c in CLASSES:
            obj = SchoolClass(name=c["name"], parallel=c["parallel"])
            db.add(obj)
            classes.append(obj)
        await db.flush()

        # ── Предметы ────────────────────────────────────────────────────
        subjects = []
        for s in SUBJECTS_DATA:
            obj = Subject(name=s["name"], requires_split=s["requires_split"])
            db.add(obj)
            subjects.append(obj)
        await db.flush()

        # ── Темы ────────────────────────────────────────────────────────
        # topic_map[subj_index] = [topic_obj, ...]
        topic_map: dict[int, list] = {}
        for subj_idx, topic_list in TOPICS_DATA.items():
            topic_map[subj_idx] = []
            for tname, order, prereq_orders in topic_list:
                t = Topic(
                    subject_id=subjects[subj_idx].id,
                    name=tname,
                    order_index=order,
                    prerequisites=[],  # заполним ниже через id
                )
                db.add(t)
                topic_map[subj_idx].append(t)
        await db.flush()

        # Устанавливаем prerequisites по ids
        for subj_idx, topic_list in TOPICS_DATA.items():
            for i, (_, order, prereq_orders) in enumerate(topic_list):
                prereq_ids = []
                for pre_order in prereq_orders:
                    prereq_topic = next(
                        (t for j, t in enumerate(topic_map[subj_idx])
                         if topic_list[j][1] == pre_order),
                        None
                    )
                    if prereq_topic:
                        prereq_ids.append(prereq_topic.id)
                topic_map[subj_idx][i].prerequisites = prereq_ids
        await db.flush()

        # ── Кабинеты ────────────────────────────────────────────────────
        for r in ROOMS_DATA:
            db.add(Room(name=r["name"], capacity=r["capacity"],
                        room_type=r["room_type"]))

        # ── Магазин ─────────────────────────────────────────────────────
        for item in SHOP_ITEMS_DATA:
            db.add(ShopItem(name=item["name"],
                            description=item["description"],
                            cost=item["cost"]))

        # ── Администратор ────────────────────────────────────────────────
        admin = User(
            name="Директор лицея",
            email="admin@aqbobek.kz",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
        )
        db.add(admin)
        await db.flush()

        # ── Учителя ─────────────────────────────────────────────────────
        teacher_users = [
            ("Учитель по математике",    "math@aqbobek.kz",    [1, 2]),
            ("Учитель по физике",        "physics@aqbobek.kz", [2, 6]),
            ("Учитель по химии",         "chem@aqbobek.kz",    [3, 4]),
            ("Учитель по английскому",   "eng@aqbobek.kz",     [7]),
            ("Учитель по казахскому",    "kaz@aqbobek.kz",     [9, 8]),
            ("Учитель по информатике",   "it@aqbobek.kz",      [10]),
        ]
        teachers = []
        for name, email, subj_ids in teacher_users:
            u = User(name=name, email=email,
                     hashed_password=hash_password("teacher123"),
                     role=UserRole.teacher)
            db.add(u)
            await db.flush()
            t = Teacher(user_id=u.id, subject_ids=subj_ids)
            db.add(t)
            teachers.append(t)
        await db.flush()

        # ── Ученики ─────────────────────────────────────────────────────
        student_names = [
            "Ученик 1",
            "Ученик 2",
            "Ученик 3",
            "Ученик 4",
            "Ученик 5",
            "Ученик 6",
            "Ученик 7",
            "Ученик 8",
            "Ученик 9",
            "Ученик 10",
            "Ученик 11",
            "Ученик 12",
        ]
        students = []
        for i, name in enumerate(student_names):
            email = f"student{i+1}@aqbobek.kz"
            cls = classes[i % len(classes)]
            u = User(name=name, email=email,
                     hashed_password=hash_password("student123"),
                     role=UserRole.student,
                     class_id=cls.id)
            db.add(u)
            await db.flush()
            db.add(GamificationPoint(
                student_id=u.id,
                points=100 + i * 55,
                reason="Начальный баланс",
            ))
            students.append(u)

        # ── Киоск ───────────────────────────────────────────────────────
        db.add(User(
            name="Киоск",
            email="kiosk@aqbobek.kz",
            hashed_password=hash_password("kiosk123"),
            role=UserRole.kiosk,
        ))

        # ── Родитель ─────────────────────────────────────────────────────
        parent_user = User(
            name="Родитель 1",
            email="parent1@aqbobek.kz",
            hashed_password=hash_password("parent123"),
            role=UserRole.parent,
        )
        db.add(parent_user)
        await db.flush()
        # Привязываем к Ученику 1 (students[0])
        db.add(ParentLink(parent_id=parent_user.id, student_id=students[0].id, is_verified=1))

        # ── Оценки ──────────────────────────────────────────────────────
        # Индексы предметов для генерации оценок:
        # (profile_col, subject_index_in_DB, topic_subj_index_in_TOPICS_DATA)
        GRADE_SUBJECTS = [
            (0, 0, 0),  # Math        profile[0] → subjects[0] → topic_map[0]
            (1, 1, 1),  # Physics     profile[1] → subjects[1] → topic_map[1]
            (2, 2, 2),  # Chemistry   profile[2] → subjects[2] → topic_map[2]
            (3, 3, 3),  # Biology     profile[3] → subjects[3] → topic_map[3]
            (4, 4, 4),  # History     profile[4] → subjects[4] → topic_map[4]
            (5, 6, 6),  # English     profile[5] → subjects[6] → topic_map[6]
            (6, 7, 7),  # Russian     profile[6] → subjects[7] → topic_map[7]
            (7, 8, 8),  # Kazakh      profile[7] → subjects[8] → topic_map[8]
        ]

        for st_idx, student in enumerate(students):
            profile = STUDENT_PROFILES[st_idx]
            for prof_col, subj_idx, topic_subj_idx in GRADE_SUBJECTS:
                avg = profile[prof_col]
                topic_ids = [t.id for t in topic_map.get(topic_subj_idx, [])]
                grade_records = make_grades(
                    student_id=student.id,
                    subject_id=subjects[subj_idx].id,
                    topic_ids=topic_ids,
                    avg=avg,
                )
                for gr in grade_records:
                    db.add(Grade(**gr))

        # ── Новости ─────────────────────────────────────────────────────
        news_items = [
            ("День открытых дверей",
             "Приглашаем всех родителей и учеников на день открытых дверей лицея 12 апреля. Начало в 10:00.", True),
            ("Победа на республиканской олимпиаде",
             "Ученики нашего лицея заняли 1 и 3 место на республиканской олимпиаде по математике. Поздравляем!", False),
            ("Изменение расписания звонков",
             "С 1 апреля 2026 года расписание звонков изменяется. Первый урок начинается в 08:00.", True),
            ("Субботник на территории лицея",
             "В эту субботу, 5 апреля, проводится общешкольный субботник. Просим всех принять участие.", True),
            ("Итоги II четверти",
             "Опубликованы итоговые оценки за II четверть. Средний балл по лицею составил 4.1.", False),
        ]
        for title, body, is_ann in news_items:
            db.add(News(title=title, body=body,
                        author_id=admin.id, is_announcement=is_ann))

        # ── Теги и публикации в Ленте достижений ──────────────────────
        tags = [
            EventTag(name="Олимпиада",               color="#f59e0b", icon=""),
            EventTag(name="Спорт",                   color="#22c55e", icon=""),
            EventTag(name="Наука",                   color="#3b82f6", icon=""),
            EventTag(name="Искусство",               color="#a855f7", icon=""),
            EventTag(name="Выборы президента школы", color="#ef4444", icon=""),
        ]
        for tag in tags:
            db.add(tag)
        await db.flush()

        achievement_posts = [
            dict(
                author_id=admin.id,
                student_id=students[0].id,
                title="Победитель республиканской олимпиады по математике",
                description="Ученик 1 занял 1 место на республиканской олимпиаде по математике среди учеников 10 классов. Поздравляем!",
                tags=["Олимпиада", "Наука"],
                status="approved",
                likes_count=24,
            ),
            dict(
                author_id=admin.id,
                student_id=students[1].id,
                title="Серебро на городских соревнованиях по плаванию",
                description="Ученик 2 завоевал серебряную медаль на городских соревнованиях по плаванию. Отличный результат!",
                tags=["Спорт"],
                status="approved",
                likes_count=18,
            ),
            dict(
                author_id=admin.id,
                student_id=students[6].id,
                title="Победитель конкурса научных проектов",
                description="Ученик 7 представил исследовательский проект по экологии и занял 1 место на районном этапе конкурса.",
                tags=["Наука", "Олимпиада"],
                status="approved",
                likes_count=31,
            ),
            dict(
                author_id=admin.id,
                student_id=students[4].id,
                title="Призёр городской олимпиады по физике",
                description="Ученик 5 занял 3 место на городской олимпиаде по физике. Продолжаем в том же духе!",
                tags=["Олимпиада"],
                status="approved",
                likes_count=15,
            ),
            dict(
                author_id=admin.id,
                student_id=students[8].id,
                title="Лучшее эссе на конкурсе по казахскому языку",
                description="Ученик 9 написал лучшее сочинение на конкурсе «Мой Казахстан» среди школ района.",
                tags=["Искусство"],
                status="approved",
                likes_count=12,
            ),
            dict(
                author_id=admin.id,
                student_id=students[3].id,
                title="Призёр областной олимпиады по биологии",
                description="Ученик 4 занял 2 место на областной олимпиаде по биологии — отличный результат!",
                tags=["Наука", "Олимпиада"],
                status="pending",
                likes_count=0,
            ),
            dict(
                author_id=admin.id,
                student_id=students[10].id,
                title="Капитан школьной команды КВН",
                description="Ученик 11 возглавил команду лицея на городском фестивале КВН. Команда прошла в финал!",
                tags=["Искусство"],
                status="pending",
                likes_count=0,
            ),
        ]
        for post_data in achievement_posts:
            db.add(AchievementPost(**post_data))

        # ── Меню буфета ─────────────────────────────────────────────────
        for item in CAFETERIA_MENU:
            db.add(CafeteriaItem(
                name=item["name"],
                description=item["description"],
                price_coins=item["price_coins"],
                price_tenge=item["price_tenge"],
                category=item["category"],
                is_available=True,
            ))

        # ── Расписание ──────────────────────────────────────────────────
        rooms_res = await db.execute(select(Room))
        rooms_list = rooms_res.scalars().all()
        for (cls_i, day, period, tch_i, subj_i, room_i) in SCHEDULE_DATA:
            db.add(ScheduleSlot(
                class_id=classes[cls_i].id,
                subject_id=subjects[subj_i].id,
                teacher_id=teachers[tch_i].id,
                room_id=rooms_list[room_i].id,
                day_of_week=day,
                period_num=period,
            ))

        # ── Начальный баланс первого ученика ────────────────────────────
        if students:
            db.add(CurrencyTransaction(
                student_id=students[0].id,
                amount=500,
                tx_type="initial",
                description="Начальный баланс",
            ))

        await db.commit()
        print("Seed completed successfully!")
        print(f"  Учеников: {len(students)}")
        print(f"  Оценок:   {len(students) * len(GRADE_SUBJECTS) * 13}")
        print(f"  Позиций в меню: {len(CAFETERIA_MENU)}")


if __name__ == "__main__":
    asyncio.run(seed())
