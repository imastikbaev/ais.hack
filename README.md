# Aqbobek Lyceum Portal

Школьный портал для Aqbobek International School. Разработан в рамках хакатона AIS 3.0.

Включает:
- AI-аналитику успеваемости (собственные алгоритмы + LLM)
- Умное расписание на основе CSP-алгоритма
- Геймификацию и School Currency (буфет с QR)
- Kiosk Mode для экранов в коридорах
- Школьную ленту достижений
- Wellness модуль с E2E-зашифрованным дневником
- Синхронизацию с Kundelik

## Стек

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Zustand
- **Backend:** FastAPI (Python 3.11) + SQLAlchemy async
- **БД:** PostgreSQL 15
- **Кэш / real-time:** Redis + WebSockets
- **Контейнеризация:** Docker + docker-compose

## Запуск

### Через Docker (рекомендуется)

```bash
cp env.txt .env
docker-compose up --build
```

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Kiosk: http://localhost:5173/kiosk

### Локально (без Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../env.txt ../.env
uvicorn app.main:app --reload

# Frontend (отдельный терминал)
cd frontend
npm install
npm run dev
```

## Тестовые аккаунты

После первого запуска БД заполняется демо-данными:

| Логин | Пароль | Роль |
|-------|--------|------|
| student1@aqbobek.kz | password123 | Ученик |
| teacher1@aqbobek.kz | password123 | Учитель |
| admin@aqbobek.kz | password123 | Администратор |
| parent1@aqbobek.kz | password123 | Родитель |

## Структура проекта

```
backend/
  app/
    routers/      # API эндпоинты
    models/       # SQLAlchemy модели
    schemas/      # Pydantic схемы
    services/     # Бизнес-логика (AI engine, CSP solver)
    core/         # Конфиг, база данных, безопасность
  seed.py         # Демо-данные
frontend/
  src/
    pages/        # Страницы (Student, Teacher, Admin, Kiosk...)
    components/   # UI компоненты
    stores/       # Zustand стейт
    api/          # axios клиенты
```

## Переменные окружения

Скопируй `env.txt` в `.env` и заполни нужные ключи:

```
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...        # опционально, для LLM отчётов
GEMINI_API_KEY=...            # опционально
TELEGRAM_BOT_TOKEN=...        # опционально, для уведомлений
```
