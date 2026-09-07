import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db


router = APIRouter(
    prefix="/recommendations",
    tags=["Career Recommendations"],
)


CAREER_PROFILES = [
    {
        "title": "Data Analyst",
        "keywords": [
            "data",
            "analytics",
            "analysis",
            "python",
            "sql",
            "excel",
            "statistics",
            "tableau",
            "power bi",
            "visualization",
            "research",
            "business",
            "mathematics",
            "math",
        ],
        "description": (
            "Your interest in data, analysis, and evidence-based "
            "problem solving fits this career path."
        ),
    },
    {
        "title": "Backend Developer",
        "keywords": [
            "computer science",
            "programming",
            "python",
            "java",
            "javascript",
            "sql",
            "api",
            "database",
            "backend",
            "fastapi",
            "node",
            "software",
            "coding",
            "logic",
        ],
        "description": (
            "Your technical skills and interest in building systems "
            "align with backend development."
        ),
    },
    {
        "title": "Machine Learning Engineer",
        "keywords": [
            "machine learning",
            "ai",
            "artificial intelligence",
            "python",
            "data",
            "statistics",
            "math",
            "mathematics",
            "deep learning",
            "model",
            "algorithm",
            "computer science",
        ],
        "description": (
            "Your AI, mathematics, programming, and data interests "
            "are a strong fit for machine learning engineering."
        ),
    },
    {
        "title": "Frontend Developer",
        "keywords": [
            "javascript",
            "typescript",
            "react",
            "html",
            "css",
            "ui",
            "ux",
            "design",
            "figma",
            "web",
            "frontend",
            "creative",
        ],
        "description": (
            "Your interest in web interfaces, design, and user "
            "experience fits frontend development."
        ),
    },
    {
        "title": "Cybersecurity Analyst",
        "keywords": [
            "security",
            "cybersecurity",
            "network",
            "linux",
            "ethical hacking",
            "risk",
            "privacy",
            "computer science",
            "systems",
            "forensics",
            "protection",
        ],
        "description": (
            "Your interest in protecting systems, networks, and "
            "information fits cybersecurity."
        ),
    },
    {
        "title": "UX/UI Designer",
        "keywords": [
            "design",
            "ui",
            "ux",
            "figma",
            "creative",
            "research",
            "user experience",
            "prototype",
            "visual",
            "web",
            "art",
        ],
        "description": (
            "Your creative and user-focused interests align with "
            "UX/UI design."
        ),
    },
    {
        "title": "Digital Marketing Specialist",
        "keywords": [
            "marketing",
            "social media",
            "content",
            "branding",
            "communication",
            "seo",
            "advertising",
            "business",
            "creative",
            "analytics",
            "writing",
        ],
        "description": (
            "Your communication, creativity, and business interests "
            "fit digital marketing."
        ),
    },
    {
        "title": "Project Manager",
        "keywords": [
            "management",
            "leadership",
            "planning",
            "organization",
            "business",
            "communication",
            "team",
            "agile",
            "project",
            "coordination",
            "lead",
        ],
        "description": (
            "Your planning, leadership, and communication strengths "
            "fit project management."
        ),
    },
    {
        "title": "Financial Analyst",
        "keywords": [
            "finance",
            "accounting",
            "economics",
            "business",
            "excel",
            "data",
            "statistics",
            "investment",
            "analysis",
            "math",
            "mathematics",
            "banking",
        ],
        "description": (
            "Your analytical and business interests align with "
            "financial analysis."
        ),
    },
    {
        "title": "Healthcare Administrator",
        "keywords": [
            "health",
            "healthcare",
            "hospital",
            "management",
            "administration",
            "communication",
            "organization",
            "public health",
            "business",
            "service",
        ],
        "description": (
            "Your interest in healthcare and organizing services "
            "fits healthcare administration."
        ),
    },
]


def normalize_text(text: str) -> str:
    return re.sub(r"[^a-z0-9+#. ]", " ", text.lower())


def calculate_match(profile: dict, student_text: str) -> tuple[int, list[str]]:
    normalized_text = normalize_text(student_text)
    matched_keywords = []

    for keyword in profile["keywords"]:
        if keyword in normalized_text:
            matched_keywords.append(keyword)

    unique_matches = list(dict.fromkeys(matched_keywords))

    if not unique_matches:
        return 35, []

    score = min(95, 45 + len(unique_matches) * 9)
    return score, unique_matches


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

    student_text = " ".join(
        [
            payload.education_level,
            payload.interests,
            payload.skills,
            payload.favorite_subjects,
            payload.work_style,
        ]
    )

    scored_careers = []

    for profile in CAREER_PROFILES:
        score, matched_keywords = calculate_match(profile, student_text)

        if matched_keywords:
            reason = (
                f"{profile['description']} Matched interests and skills: "
                f"{', '.join(matched_keywords[:5])}."
            )
        else:
            reason = (
                f"{profile['description']} Add more specific skills and "
                "interests to improve this match."
            )

        scored_careers.append(
            {
                "title": profile["title"],
                "score": score,
                "reason": reason,
            }
        )

    top_careers = sorted(
        scored_careers,
        key=lambda career: career["score"],
        reverse=True,
    )[:3]

    saved_recommendations = []

    for career in top_careers:
        recommendation = models.Recommendation(
            student_id=current_user.id,
            assessment_attempt_id=assessment_attempt.id,
            item_type="career",
            item_id=None,
            score=career["score"],
            career_title=career["title"],
            reason=career["reason"],
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