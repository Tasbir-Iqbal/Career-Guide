from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.routers import recommendations

client = TestClient(app)


def create_student():
    email = f"assessment_student_{int(datetime.now().timestamp())}@example.com"

    response = client.post(
        "/auth/signup",
        json={
            "name": "Assessment Test Student",
            "email": email,
            "password": "StudentTest123",
            "role": "student"
        }
    )

    assert response.status_code == 201
    return response.json()["access_token"]


def fake_gemini_recommendations(**kwargs):
    return [
        type(
            "Recommendation",
            (),
            {
                "career_title": "Software Engineer",
                "match_percentage": 90,
                "reason": (
                    "This career matches the student's interest "
                    "in programming and problem solving. "
                    "Learning Python and software development "
                    "would be a useful next step."
                )
            }
        )(),
        type(
            "Recommendation",
            (),
            {
                "career_title": "Data Analyst",
                "match_percentage": 82,
                "reason": (
                    "This career fits the student's interest in "
                    "technology and analytical problem solving. "
                    "Learning SQL and data visualization would "
                    "be a useful next step."
                )
            }
        )(),
        type(
            "Recommendation",
            (),
            {
                "career_title": "AI Engineer",
                "match_percentage": 85,
                "reason": (
                    "This career is suitable for a student "
                    "interested in programming and artificial "
                    "intelligence. Learning Python and machine "
                    "learning would be a useful next step."
                )
            }
        )()
    ]


def test_career_assessment():
    student_token = create_student()

    # Replace real Gemini call with test data
    recommendations.generate_career_recommendations = (
        fake_gemini_recommendations
    )

    response = client.post(
        "/recommendations/generate",
        headers={
            "Authorization": f"Bearer {student_token}"
        },
        json={
            "education_level": "Undergraduate",
            "interests": "Programming and technology",
            "skills": "Python and problem solving",
            "favorite_subjects": "Computer Science and Mathematics",
            "work_style": "Creative and independent"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert "assessment" in data
    assert "recommendations" in data

    # System should return exactly 3 recommendations
    assert len(data["recommendations"]) == 3

    for recommendation in data["recommendations"]:
        assert "career_title" in recommendation
        assert "match_percentage" in recommendation
        assert "reason" in recommendation

        assert 0 <= recommendation["match_percentage"] <= 100

    # Test latest assessment
    latest_response = client.get(
        "/recommendations/me",
        headers={
            "Authorization": f"Bearer {student_token}"
        }
    )

    assert latest_response.status_code == 200
    assert len(latest_response.json()["recommendations"]) == 3