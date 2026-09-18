from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, aliased

from app import models, schemas
from app.auth import hash_password, require_role
from app.database import get_db


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


def counselor_application_to_response(
    counselor: models.Counselor,
) -> dict:
    return {
        "id": counselor.id,
        "user_id": counselor.user.id,
        "name": counselor.user.name,
        "email": counselor.user.email,
        "specialization": counselor.specialization,
        "bio": counselor.bio,
        "availability": counselor.availability,
        "approval_status": counselor.approval_status,
        "applied_at": counselor.applied_at,
        "reviewed_at": counselor.reviewed_at,
    }


@router.get(
    "/users",
    response_model=list[schemas.AdminUserResponse],
)
def get_all_users(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .all()
    )


@router.get(
    "/sessions",
    response_model=list[schemas.AdminSessionResponse],
)
def get_all_session_bookings(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    student_user = aliased(models.User)
    counselor_user = aliased(models.User)

    results = (
        db.query(
            models.SessionBooking,
            student_user,
            counselor_user,
        )
        .join(
            student_user,
            student_user.id == models.SessionBooking.student_id,
        )
        .join(
            counselor_user,
            counselor_user.id == models.SessionBooking.counselor_id,
        )
        .order_by(models.SessionBooking.session_date.desc())
        .all()
    )

    return [
        {
            "id": booking.id,
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "counselor_id": counselor.id,
            "counselor_name": counselor.name,
            "counselor_email": counselor.email,
            "session_date": booking.session_date,
            "status": booking.status,
            "created_at": booking.created_at,
        }
        for booking, student, counselor in results
    ]


@router.get(
    "/stats",
    response_model=schemas.AdminStatsResponse,
)
def get_system_statistics(
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    total_users = db.query(models.User).count()

    total_students = (
        db.query(models.User)
        .filter(models.User.role == "student")
        .count()
    )

    total_counselors = (
        db.query(models.User)
        .filter(models.User.role == "counselor")
        .count()
    )

    total_admins = (
        db.query(models.User)
        .filter(models.User.role == "admin")
        .count()
    )

    total_sessions = db.query(models.SessionBooking).count()

    pending_sessions = (
        db.query(models.SessionBooking)
        .filter(models.SessionBooking.status == "pending")
        .count()
    )

    confirmed_sessions = (
        db.query(models.SessionBooking)
        .filter(models.SessionBooking.status == "confirmed")
        .count()
    )

    completed_sessions = (
        db.query(models.SessionBooking)
        .filter(models.SessionBooking.status == "completed")
        .count()
    )

    cancelled_sessions = (
        db.query(models.SessionBooking)
        .filter(models.SessionBooking.status == "cancelled")
        .count()
    )

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_counselors": total_counselors,
        "total_admins": total_admins,
        "total_sessions": total_sessions,
        "pending_sessions": pending_sessions,
        "confirmed_sessions": confirmed_sessions,
        "completed_sessions": completed_sessions,
        "cancelled_sessions": cancelled_sessions,
    }


@router.post(
    "/counselors",
    response_model=schemas.CounselorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_counselor_account(
    payload: schemas.AdminCounselorCreate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == payload.email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    counselor_user = models.User(
        name=payload.name.strip(),
        email=str(payload.email).lower(),
        password_hash=hash_password(payload.password),
        role="counselor",
    )
    db.add(counselor_user)
    db.flush()

    counselor_profile = models.Counselor(
        user_id=counselor_user.id,
        specialization=payload.specialization,
        bio=payload.bio,
        availability=payload.availability,
        approval_status="approved",
        reviewed_at=datetime.now(timezone.utc),
    )
    db.add(counselor_profile)
    db.commit()
    db.refresh(counselor_profile)

    return {
        "id": counselor_profile.id,
        "user_id": counselor_user.id,
        "name": counselor_user.name,
        "specialization": counselor_profile.specialization,
        "bio": counselor_profile.bio,
        "availability": counselor_profile.availability,
        "approval_status": counselor_profile.approval_status,
    }


@router.get(
    "/counselor-applications",
    response_model=list[schemas.AdminCounselorApplicationResponse],
)
def get_counselor_applications(
    approval_status: str | None = None,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Counselor)
        .join(models.User, models.User.id == models.Counselor.user_id)
        .order_by(models.Counselor.applied_at.desc())
    )

    if approval_status:
        if approval_status not in {"pending", "approved", "rejected"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "approval_status must be pending, approved, or rejected."
                ),
            )

        query = query.filter(
            models.Counselor.approval_status == approval_status
        )

    applications = query.all()

    return [
        counselor_application_to_response(counselor)
        for counselor in applications
    ]


@router.patch(
    "/counselor-applications/{counselor_id}",
    response_model=schemas.AdminCounselorApplicationResponse,
)
def review_counselor_application(
    counselor_id: int,
    payload: schemas.CounselorApprovalUpdate,
    current_user: models.User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    counselor = (
        db.query(models.Counselor)
        .filter(models.Counselor.id == counselor_id)
        .first()
    )

    if not counselor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Counselor application not found.",
        )

    if counselor.approval_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Only pending counselor applications can be approved or rejected."
            ),
        )

    counselor.approval_status = payload.approval_status
    counselor.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(counselor)

    return counselor_application_to_response(counselor)