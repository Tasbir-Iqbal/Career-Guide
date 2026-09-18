from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def create_student():
    email = f"portal_student_{int(datetime.now().timestamp())}@example.com"

    response = client.post(
        "/auth/signup",
        json={
            "name": "Portal Test Student",
            "email": email,
            "password": "StudentTest123",
            "role": "student"
        }
    )

    assert response.status_code == 201
    return response.json()["access_token"]


def test_student_portal():
    token = create_student()

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Get student profile
    profile_response = client.get(
        "/students/me",
        headers=headers
    )

    assert profile_response.status_code == 200

    profile = profile_response.json()

    assert "id" in profile
    assert "user_id" in profile

    # Update student profile
    update_response = client.put(
        "/students/me",
        headers=headers,
        json={
            "education_level": "Undergraduate",
            "interests": "Programming and AI",
            "career_goals": "Become a software engineer"
        }
    )

    assert update_response.status_code == 200

    updated_profile = update_response.json()

    assert updated_profile["education_level"] == "Undergraduate"
    assert updated_profile["interests"] == "Programming and AI"
    assert updated_profile["career_goals"] == \
        "Become a software engineer"

    # Check student sessions
    sessions_response = client.get(
        "/students/sessions",
        headers=headers
    )

    assert sessions_response.status_code == 200
    assert isinstance(sessions_response.json(), list)