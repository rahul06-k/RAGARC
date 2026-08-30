from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.auth import RoleUpdate, UserResponse
from app.schemas.admin import AdminAnalyticsResponse, AdminUserListResponse
from app.services.auth_service import require_admin
from app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin Portal"])


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve full system, retrieval, and conversation analytics."""
    return AdminService.get_analytics(db)


@router.get("/users", response_model=AdminUserListResponse)
def list_system_users(
    skip: int = 0,
    limit: int = 50,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve system users and their usage statistics."""
    users, total = AdminService.get_users_list(db, skip=skip, limit=limit)
    return AdminUserListResponse(total=total, users=users)


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a user's role (admin or student)."""
    user = AdminService.update_user_role(db, user_id, role_data.role)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    return UserResponse.model_validate(user)
