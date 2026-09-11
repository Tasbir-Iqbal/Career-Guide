from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login(email, password):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def create_student():
    email = f"test_student_{int(datetime.now().timestamp())}@example.com"

    response = client.post(
        "/auth/signup",
        json={
            "name": "Test Student",
            "email": email,
            "password": "StudentTest123",
            "role": "student"
        }
    )

    assert response.status_code == 201
    return response.json()["access_token"]


def test_webinar():
    counselor_token = login(
        "counselor@example.com",
        "CounselorTest123"
    )

    student_token = create_student()

    # Counselor creates webinar
    create_response = client.post(
        "/webinars",
        headers={
            "Authorization": f"Bearer {counselor_token}"
        },
        json={
            "title": "Career Guidance Test Webinar",
            "description": "This is a test webinar for career guidance.",
            "scheduled_at": (
                datetime.now() + timedelta(days=2)
            ).isoformat(),
            "meeting_link": "https://example.com/test-meeting",
            "max_attendees": 20
        }
    )

    assert create_response.status_code == 201

    webinar_id = create_response.json()["id"]

    # Student registers
    register_response = client.post(
        f"/webinars/{webinar_id}/register",
        headers={
            "Authorization": f"Bearer {student_token}"
        }
    )

    assert register_response.status_code == 201

    # Student can access registered webinar
    detail_response = client.get(
        f"/webinars/{webinar_id}",
        headers={
            "Authorization": f"Bearer {student_token}"
        }
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["meeting_link"] == \
        "https://example.com/test-meeting"

    # Counselor can see attendees
    attendees_response = client.get(
        f"/webinars/{webinar_id}/attendees",
        headers={
            "Authorization": f"Bearer {counselor_token}"
        }
    )

    assert attendees_response.status_code == 200
    assert len(attendees_response.json()) >= 1

    # Cancel webinar
    cancel_response = client.post(
        f"/webinars/{webinar_id}/cancel",
        headers={
            "Authorization": f"Bearer {counselor_token}"
        }
    )

    assert cancel_response.status_code == 200