from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login_counselor():
    response = client.post(
        "/auth/login",
        json={
            "email": "counselor@example.com",
            "password": "CounselorTest123"
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_counselor_portal():
    token = login_counselor()

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # View counselors
    counselors_response = client.get(
        "/counselors"
    )

    assert counselors_response.status_code == 200
    assert isinstance(counselors_response.json(), list)

    # View counselor's sessions
    sessions_response = client.get(
        "/counselors/me/sessions",
        headers=headers
    )

    assert sessions_response.status_code == 200
    assert isinstance(sessions_response.json(), list)