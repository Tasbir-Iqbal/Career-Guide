from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db
from app.gemini_service import generate_career_recommendations


router = APIRouter(
    prefix="/recommendations",
    tags=["Career Recommendations"],
)


def assessment_to_response(attempt: models.AssessmentAttempt) -> dict:
    return {
        "id": attempt.id,
        "student_id": attempt.student_id,
        "education_level": attempt.education_level,
        "interests": attempt.interests,
        "skills": attempt.skills,
        "favorite_subjects": attempt.favorite_subjects,
        "work_style": attempt.work_style,
        "created_at": attempt.created_at,
    }


def recommendation_to_response(
    recommendation: models.Recommendation,
) -> dict:
    return {
        "id": recommendation.id,
        "assessment_attempt_id": recommendation.assessment_attempt_id,
        "career_title": recommendation.career_title,
        "match_percentage": round(recommendation.score),
        "reason": recommendation.reason,
        "is_selected": recommendation.is_selected,
        "generated_at": recommendation.generated_at,
    }


@router.post(
    "/generate",
    response_model=schemas.AssessmentGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_recommendations(
    payload: schemas.AssessmentGenerateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can generate career recommendations.",
        )

    try:
        ai_recommendations = generate_career_recommendations(
            education_level=payload.education_level,
            interests=payload.interests,
            skills=payload.skills,
            favorite_subjects=payload.favorite_subjects,
            work_style=payload.work_style,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not generate AI recommendations: {str(error)}",
        ) from error

    db.query(models.Recommendation).filter(
        models.Recommendation.student_id == current_user.id,
        models.Recommendation.item_type == "career",
        models.Recommendation.is_selected.is_(True),
    ).update(
        {models.Recommendation.is_selected: False},
        synchronize_session=False,
    )

    assessment_attempt = models.AssessmentAttempt(
        student_id=current_user.id,
        education_level=payload.education_level,
        interests=payload.interests,
        skills=payload.skills,
        favorite_subjects=payload.favorite_subjects,
        work_style=payload.work_style,
    )
    db.add(assessment_attempt)
    db.flush()

    saved_recommendations = []

    for item in ai_recommendations:
        recommendation = models.Recommendation(
            student_id=current_user.id,
            assessment_attempt_id=assessment_attempt.id,
            item_type="career",
            item_id=None,
            score=item.match_percentage,
            career_title=item.career_title,
            reason=item.reason,
            is_selected=False,
        )
        db.add(recommendation)
        saved_recommendations.append(recommendation)

    db.commit()

    db.refresh(assessment_attempt)

    for recommendation in saved_recommendations:
        db.refresh(recommendation)

    return {
        "assessment": assessment_to_response(assessment_attempt),
        "recommendations": [
            recommendation_to_response(recommendation)
            for recommendation in saved_recommendations
        ],
    }


@router.get(
    "/me",
    response_model=schemas.LatestAssessmentResponse,
)
def get_latest_assessment(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view career recommendations.",
        )

    latest_attempt = (
        db.query(models.AssessmentAttempt)
        .filter(models.AssessmentAttempt.student_id == current_user.id)
        .order_by(models.AssessmentAttempt.created_at.desc())
        .first()
    )

    if not latest_attempt:
        return {
            "assessment": None,
            "recommendations": [],
        }

    recommendations = (
        db.query(models.Recommendation)
        .filter(
            models.Recommendation.student_id == current_user.id,
            models.Recommendation.assessment_attempt_id == latest_attempt.id,
            models.Recommendation.item_type == "career",
        )
        .order_by(
            models.Recommendation.is_selected.desc(),
            models.Recommendation.score.desc(),
        )
        .all()
    )

    return {
        "assessment": assessment_to_response(latest_attempt),
        "recommendations": [
            recommendation_to_response(recommendation)
            for recommendation in recommendations
        ],
    }


@router.patch(
    "/{recommendation_id}/select",
    response_model=schemas.CareerSelectionResponse,
)
def select_career_path(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can select a career path.",
        )

    recommendation = (
        db.query(models.Recommendation)
        .filter(
            models.Recommendation.id == recommendation_id,
            models.Recommendation.student_id == current_user.id,
            models.Recommendation.item_type == "career",
        )
        .first()
    )

    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career recommendation not found.",
        )

    latest_attempt = (
        db.query(models.AssessmentAttempt)
        .filter(models.AssessmentAttempt.student_id == current_user.id)
        .order_by(models.AssessmentAttempt.created_at.desc())
        .first()
    )

    if not latest_attempt or (
        recommendation.assessment_attempt_id != latest_attempt.id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "You can only select a career from your latest "
                "assessment results."
            ),
        )

    db.query(models.Recommendation).filter(
        models.Recommendation.student_id == current_user.id,
        models.Recommendation.item_type == "career",
        models.Recommendation.assessment_attempt_id == latest_attempt.id,
    ).update(
        {models.Recommendation.is_selected: False},
        synchronize_session=False,
    )

    recommendation.is_selected = True
    db.commit()
    db.refresh(recommendation)

    return recommendation_to_response(recommendation)