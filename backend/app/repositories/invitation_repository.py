from sqlalchemy.orm import Session

from backend.app.models.invitation import Invitation


def create(db: Session, invitation: Invitation):
    db.add(invitation)
    db.flush()
    return invitation


def list_for_publisher(
    db: Session,
    publisher_id
):
    return (
        db.query(Invitation)
        .filter(
            Invitation.publisher_id == publisher_id
        )
        .order_by(
            Invitation.created_at.desc()
        )
        .all()
    )


def get(
    db: Session,
    invitation_id,
):
    return (
        db.query(Invitation)
        .filter(
            Invitation.id == invitation_id
        )
        .first()
    )
