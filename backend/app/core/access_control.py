"""
Middleware for audit logging + role permission helpers.
"""
from fastapi import Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.security import AuditLog, ParentLink, CuratorLink


async def audit(
    request: Request,
    action: str,
    resource_type: str = None,
    resource_id: int = None,
    user_id: int = None,
    db: AsyncSession = None,
    extra: dict = None,
):
    if db is None:
        return
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500],
        extra=extra or {},
    )
    db.add(log)
    await db.commit()


def require_not_role(*forbidden_roles: str):
    """Запрет доступа для указанных ролей."""
    async def checker(current_user: User = Depends(get_current_user)):
        if current_user.role in forbidden_roles:
            raise HTTPException(status_code=403, detail="Access denied for your role")
        return current_user
    return checker


async def can_view_student_data(
    student_id: int,
    current_user: User,
    db: AsyncSession,
    allow_roles: tuple = ("admin", "teacher"),
) -> bool:
    """Проверяет, имеет ли текущий пользователь доступ к данным ученика."""
    if current_user.id == student_id:
        return True
    if current_user.role in allow_roles:
        return True
    if current_user.role == "parent":
        result = await db.execute(
            select(ParentLink).where(
                ParentLink.parent_id == current_user.id,
                ParentLink.student_id == student_id,
            )
        )
        return result.scalar_one_or_none() is not None
    return False
