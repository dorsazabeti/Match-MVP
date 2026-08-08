from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.dependencies import (
    get_current_user,
    get_db
)

from backend.app.models.user import User

from backend.app.services import invitation_service

from backend.app.schemas.invitation import (
    InvitationResponse,
    InvitationListResponse
)


router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"]
)



@router.get(
    "/publisher",
    response_model=InvitationListResponse
)
def publisher_invitations(
    db:Session=Depends(get_db),
    user:User=Depends(get_current_user)
):

    items = invitation_service.list_publisher_invitations(
        db,
        user.id
    )

    return {
        "items":items,
        "total":len(items)
    }



@router.post(
    "/{id}/accept",
    response_model=InvitationResponse
)
def accept(
    id:UUID,
    db:Session=Depends(get_db),
    user:User=Depends(get_current_user)
):

    return invitation_service.update_status(
        db,
        id,
        "ACCEPTED"
    )



@router.post(
    "/{id}/reject",
    response_model=InvitationResponse
)
def reject(
    id:UUID,
    db:Session=Depends(get_db),
    user:User=Depends(get_current_user)
):

    return invitation_service.update_status(
        db,
        id,
        "REJECTED"
    )
