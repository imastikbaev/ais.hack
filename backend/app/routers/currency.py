import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.currency import CafeteriaItem, CafeteriaOrder, CurrencyTransaction
from app.models.gamification import GamificationPoint

router = APIRouter(prefix="/currency", tags=["currency"])

COIN_TO_TENGE_RATE = 1.0


async def get_balance(student_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.sum(CurrencyTransaction.amount))
        .where(CurrencyTransaction.student_id == student_id)
    )
    return result.scalar() or 0


@router.get("/balance")
async def my_balance(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    balance = await get_balance(current_user.id, db)
    txs_res = await db.execute(
        select(CurrencyTransaction)
        .where(CurrencyTransaction.student_id == current_user.id)
        .order_by(CurrencyTransaction.created_at.desc())
        .limit(20)
    )
    txs = txs_res.scalars().all()
    return {
        "balance": balance,
        "balance_tenge": balance * COIN_TO_TENGE_RATE,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "tx_type": t.tx_type,
                "description": t.description,
                "created_at": t.created_at,
            }
            for t in txs
        ],
    }


@router.post("/award")
async def award_coins(
    student_id: int,
    amount: int,
    reason: str,
    current_user: User = Depends(require_roles("admin", "teacher")),
    db: AsyncSession = Depends(get_db),
):
    tx = CurrencyTransaction(
        student_id=student_id,
        amount=amount,
        tx_type="award",
        description=reason,
    )
    db.add(tx)
    gp = GamificationPoint(student_id=student_id, points=amount, reason=reason)
    db.add(gp)
    await db.commit()
    return {"ok": True, "awarded": amount}


@router.get("/cafeteria")
async def cafeteria_menu(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CafeteriaItem).where(CafeteriaItem.is_available == True)
    )
    return [
        {
            "id": i.id,
            "name": i.name,
            "description": i.description,
            "price_coins": i.price_coins,
            "price_tenge": i.price_tenge,
            "category": i.category,
            "image_url": i.image_url,
            "stock": i.stock,
        }
        for i in result.scalars().all()
    ]


class OrderCreate(BaseModel):
    item_id: int


@router.post("/cafeteria/order")
async def place_order(
    data: OrderCreate,
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(CafeteriaItem, data.item_id)
    if not item or not item.is_available:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.stock == 0:
        raise HTTPException(status_code=400, detail="Out of stock")

    balance = await get_balance(current_user.id, db)
    if balance < item.price_coins:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно монет. Баланс: {balance}, нужно: {item.price_coins}"
        )

    qr_token = secrets.token_urlsafe(16)
    order = CafeteriaOrder(
        student_id=current_user.id,
        item_id=item.id,
        qr_token=qr_token,
        status="pending",
        coins_spent=item.price_coins,
    )
    db.add(order)
    tx = CurrencyTransaction(
        student_id=current_user.id,
        amount=-item.price_coins,
        tx_type="cafeteria",
        description=f"Заказ в буфете: {item.name}",
    )
    db.add(tx)
    if item.stock > 0:
        item.stock -= 1
    await db.commit()
    await db.refresh(order)
    return {
        "order_id": order.id,
        "qr_token": qr_token,
        "item_name": item.name,
        "coins_spent": item.price_coins,
        "qr_data": f"aqbobek:order:{qr_token}",
    }


@router.post("/cafeteria/redeem/{qr_token}")
async def redeem_qr(
    qr_token: str,
    current_user: User = Depends(require_roles("admin", "teacher")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CafeteriaOrder).where(CafeteriaOrder.qr_token == qr_token)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="QR not found")
    if order.status == "redeemed":
        raise HTTPException(status_code=400, detail="Already redeemed")
    order.status = "redeemed"
    order.redeemed_at = datetime.utcnow()
    await db.commit()
    item = await db.get(CafeteriaItem, order.item_id)
    student = await db.get(User, order.student_id)
    return {
        "ok": True,
        "student_name": student.name if student else "?",
        "item_name": item.name if item else "?",
    }


@router.get("/cafeteria/orders/my")
async def my_orders(
    current_user: User = Depends(require_roles("student")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CafeteriaOrder)
        .where(CafeteriaOrder.student_id == current_user.id)
        .order_by(CafeteriaOrder.created_at.desc())
        .limit(10)
    )
    orders = result.scalars().all()
    out = []
    for o in orders:
        item = await db.get(CafeteriaItem, o.item_id)
        out.append({
            "id": o.id,
            "item_name": item.name if item else "?",
            "qr_token": o.qr_token,
            "qr_data": f"aqbobek:order:{o.qr_token}",
            "status": o.status,
            "coins_spent": o.coins_spent,
            "created_at": o.created_at,
        })
    return out
