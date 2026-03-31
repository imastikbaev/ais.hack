from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.gamification import GamificationPoint, ShopItem, Purchase
from app.schemas.gamification import (
    PortfolioItemCreate, PortfolioItemOut,
    GamificationPointOut, LeaderboardEntry,
    ShopItemOut, PurchaseCreate
)
from app.models.gamification import PortfolioItem
from app.models.school_class import SchoolClass

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/my-points")
async def get_my_points(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(func.sum(GamificationPoint.points))
        .where(GamificationPoint.student_id == current_user.id)
    )
    total = result.scalar() or 0
    history_res = await db.execute(
        select(GamificationPoint)
        .where(GamificationPoint.student_id == current_user.id)
        .order_by(GamificationPoint.created_at.desc())
        .limit(20)
    )
    history = history_res.scalars().all()
    return {"total_points": total, "history": [GamificationPointOut.model_validate(h) for h in history]}


@router.get("/leaderboard/class")
async def class_leaderboard(
    current_user: User = Depends(require_roles("student", "teacher", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GamificationPoint.student_id, func.sum(GamificationPoint.points).label("total"))
        .join(User, User.id == GamificationPoint.student_id)
        .where(User.class_id == current_user.class_id)
        .group_by(GamificationPoint.student_id)
        .order_by(func.sum(GamificationPoint.points).desc())
        .limit(20)
    )
    rows = result.all()
    entries = []
    for rank, row in enumerate(rows, 1):
        user = await db.get(User, row.student_id)
        school_class = await db.get(SchoolClass, user.class_id) if user and user.class_id else None
        entries.append(LeaderboardEntry(
            rank=rank,
            student_id=row.student_id,
            student_name=user.name if user else "?",
            total_points=row.total,
            class_name=school_class.name if school_class else None,
        ))
    return entries


@router.get("/leaderboard/school")
async def school_leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GamificationPoint.student_id, func.sum(GamificationPoint.points).label("total"))
        .group_by(GamificationPoint.student_id)
        .order_by(func.sum(GamificationPoint.points).desc())
        .limit(20)
    )
    rows = result.all()
    entries = []
    for rank, row in enumerate(rows, 1):
        user = await db.get(User, row.student_id)
        school_class = await db.get(SchoolClass, user.class_id) if user and user.class_id else None
        entries.append(LeaderboardEntry(
            rank=rank,
            student_id=row.student_id,
            student_name=user.name if user else "?",
            total_points=row.total,
            class_name=school_class.name if school_class else None,
        ))
    return entries


@router.get("/shop", response_model=List[ShopItemOut])
async def get_shop(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShopItem).where(ShopItem.is_available == True))
    return result.scalars().all()


@router.post("/shop/buy")
async def buy_item(
    data: PurchaseCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(ShopItem, data.item_id)
    if not item or not item.is_available:
        raise HTTPException(status_code=404, detail="Item not found")

    total_res = await db.execute(
        select(func.sum(GamificationPoint.points))
        .where(GamificationPoint.student_id == current_user.id)
    )
    total = total_res.scalar() or 0

    spent_res = await db.execute(
        select(func.sum(ShopItem.cost))
        .join(Purchase, Purchase.item_id == ShopItem.id)
        .where(Purchase.student_id == current_user.id)
    )
    spent = spent_res.scalar() or 0
    balance = total - spent

    if balance < item.cost:
        raise HTTPException(status_code=400, detail="Insufficient points")

    purchase = Purchase(student_id=current_user.id, item_id=item.id)
    db.add(purchase)
    deduct = GamificationPoint(
        student_id=current_user.id,
        points=-item.cost,
        reason=f"Покупка: {item.name}",
    )
    db.add(deduct)
    await db.commit()
    return {"message": "Purchase successful", "item": item.name}


@router.get("/portfolio", response_model=List[PortfolioItemOut])
async def get_portfolio(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PortfolioItem).where(PortfolioItem.student_id == current_user.id)
        .order_by(PortfolioItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("/portfolio", response_model=PortfolioItemOut)
async def add_portfolio_item(
    data: PortfolioItemCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    item = PortfolioItem(
        student_id=current_user.id,
        item_type=data.item_type,
        title=data.title,
        description=data.description,
        file_url=data.file_url,
    )
    db.add(item)
    point = GamificationPoint(
        student_id=current_user.id,
        points=50,
        reason=f"Добавлено достижение: {data.title}",
    )
    db.add(point)
    await db.commit()
    await db.refresh(item)
    return item
