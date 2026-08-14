from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, aliased

from app import models, schemas
from app.auth import hash_password, require_role
from app.database import get_db


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get(
    "/users",
    response_model=list[schemas.AdminUserResponse]
)
def get_all_users(
    current_user: models.User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db)
):
    users = (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .all()
    )

    return users


@router.get(
    "/sessions",
    response_model=list[schemas.AdminSessionResponse]
)
def get_all_session_bookings(
    current_user: models.User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db)
):
    student_user = aliased(models.User)
    counselor_user = aliased(models.User)

    results = (
        db.query(
            models.SessionBooking,
            student_user,
            counselor_user
        )
        .join(
            student_user,
            student_user.id == models.SessionBooking.student_id
        )
        .join(
            counselor_user,
            counselor_user.id == models.SessionBooking.counselor_id
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
    response_model=schemas.AdminStatsResponse
)
def get_system_statistics(
    current_user: models.User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db)
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
    status_code=status.HTTP_201_CREATED
)
def create_counselor_account(
    payload: schemas.AdminCounselorCreate,
    current_user: models.User = Depends(
        require_role("admin")
    ),
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == payload.email)
        .first()
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    counselor_user = models.User(
        name=payload.name,
        email=payload.email,
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
    }