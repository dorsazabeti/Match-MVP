from datetime import datetime, timedelta

from backend.app.models.invitation import Invitation
from backend.app.models.recommendation import Recommendation

from backend.app.repositories import invitation_repository


def create_invitation(
    db,
    business,
    recommendation: Recommendation,
    message,
):

    invitation = Invitation(
        recommendation_id=recommendation.id,
        publisher_id=recommendation.publisher_id,
        business_id=business.id,

        package_snapshot=recommendation.package_json,

        message=message,

        expires_at=datetime.utcnow()
        + timedelta(days=3),

        status="PENDING",
    )


    recommendation.status="INVITED"

    invitation_repository.create(
        db,
        invitation
    )

    db.commit()

    return invitation



def list_publisher_invitations(
    db,
    publisher_id
):

    return invitation_repository.list_for_publisher(
        db,
        publisher_id
    )



def update_status(
    db,
    invitation_id,
    status
):

    invitation = invitation_repository.get(
        db,
        invitation_id
    )

    if not invitation:
        raise LookupError(
            "Invitation not found"
        )

    invitation.status=status

    db.commit()
    db.refresh(invitation)

    return invitation
