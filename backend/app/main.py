from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.routers import auth, grades, schedule, gamification, news, kiosk, ai
from app.routers import kundelik, nisgram, wellness, currency, security as security_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables on startup, then seed demo data
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.seed import seed
    await seed()
    yield


app = FastAPI(
    title="Aqbobek Lyceum Portal API",
    version="2.0.0",
    description="Единый школьный портал Aqbobek Lyceum",
    lifespan=lifespan,
)

# allow frontend dev server during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(grades.router, prefix="/api")
app.include_router(schedule.router, prefix="/api")
app.include_router(gamification.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(kiosk.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(kundelik.router, prefix="/api")
app.include_router(nisgram.router, prefix="/api")
app.include_router(wellness.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(security_router.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Aqbobek Lyceum Portal API", "version": "2.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
