# Aqbobek Lyceum Portal

Школьный портал, разработанный командой для хакатона AIS 3.0 (кейс 1 — Aqbobek Lyceum).

Основная идея — собрать всё что нужно ученику, учителю и администрации в одном месте: оценки, расписание, достижения, буфет и психологическая поддержка.

## Что умеет

- **AI-аналитика** — предсказывает риск провала СОЧ по графу знаний и тренду оценок (собственные алгоритмы, без LLM)
- **Умное расписание** — CSP-алгоритм с автоматической расстановкой и проверкой конфликтов
- **Kundelik sync** — синхронизация оценок и домашних заданий
- **Лента** — школьная лента достижений с модерацией
- **Wellness** — психологические тесты и зашифрованный личный дневник (E2E, даже админ не читает)
- **School Currency** — внутренняя валюта за оценки, буфет с QR-оплатой
- **Kiosk Mode** — экран в коридоре с топом дня, заменами и расписанием
- **i18n** — интерфейс на русском, казахском и английском

## Стек

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** FastAPI + SQLAlchemy (async)
- **БД:** SQLite (файл создаётся автоматически)
- **Real-time:** WebSockets

## Быстрый старт

Требования: **Python 3.11–3.13** (не 3.14+), **Node.js 18+**

```bash
# Backend (терминал 1)
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (терминал 2)
cd frontend
npm install
npm run dev
```

- Frontend → http://localhost:5173
- API docs → http://localhost:8000/docs
- Kiosk → http://localhost:5173/kiosk

## Тестовые аккаунты

БД заполняется демо-данными автоматически при первом запуске.

| Логин | Пароль | Роль |
|-------|--------|------|
| student1@aqbobek.kz | password123 | Ученик |
| math@aqbobek.kz | password123 | Учитель |
| admin@aqbobek.kz | password123 | Администратор |
| parent1@aqbobek.kz | password123 | Родитель |
| kiosk@aqbobek.kz | password123 | Kiosk (экран в коридоре) |

> Kiosk Mode открывается по адресу `/kiosk` — полноэкранный режим без навигации, автоматически листает виджеты каждые 8 секунд.

## AI-алгоритмы (без внешних API)

Вся аналитика считается локально, никаких LLM или внешних сервисов:

| Алгоритм | Описание |
|---|---|
| **Trend Score** | EWMA (экспоненциальное скользящее среднее) по хронологическому ряду оценок |
| **Knowledge Gap** | BFS по графу тем — слабая тема «заражает» все зависимые |
| **Risk Score** | `0.4*(1-slope) + 0.4*gap_ratio + 0.2*(1-attendance)` |
| **Рекомендации** | Rule-based маппинг слабых тем → ресурсы (Khan Academy, Stepik и др.) |

## Структура проекта

```
backend/
  app/
    routers/        # API эндпоинты по модулям
    models/         # SQLAlchemy модели
    schemas/        # Pydantic схемы валидации
    services/       # AI engine, CSP solver, Kundelik
    core/           # Конфиг, БД, безопасность, контроль доступа
  seed.py           # Генерация демо-данных

frontend/
  src/
    pages/          # Страницы по ролям (Student, Teacher, Admin, Kiosk...)
    components/     # Переиспользуемые UI компоненты
    stores/         # Zustand — глобальный стейт (auth, lang)
    api/            # axios клиенты для каждого модуля
```

## Переменные окружения

Скопируй `.env.example` в `.env`:

```
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-secret-key-here
TELEGRAM_BOT_TOKEN=...   # опционально, для уведомлений о заменах
```
