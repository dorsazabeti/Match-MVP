from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.dependencies import (
    get_db,
    get_current_user,
)

from backend.app.models.user import User

from backend.app.schemas.user import (
    RoleSelectionRequest,
    RoleSelectionResponse,
)

from backend.app.services.profile_service import (
    assign_user_role,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "/role",
    response_model=RoleSelectionResponse,
)
def select_role(
    request: RoleSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = assign_user_role(
        db,
        current_user,
        request.role,
    )

    return RoleSelectionResponse(
        id=str(user.id),
        email=user.email,
        role=user.role,
    )
