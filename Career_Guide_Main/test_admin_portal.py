from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def login_admin():
    response = client.post(
        "/auth/login",
        json={
            "email": "admin@example.com",
            "password": "AdminTest123"
        }
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def test_admin_portal():
    token = login_admin()

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # View users
    users_response = client.get(
        "/admin/users",
        headers=headers
    )

    assert users_response.status_code == 200
    assert isinstance(users_response.json(), list)

    # View sessions
    sessions_response = client.get(
        "/admin/sessions",
        headers=headers
    )

    assert sessions_response.status_code == 200
    assert isinstance(sessions_response.json(), list)

    # View system statistics
    stats_response = client.get(
        "/admin/stats",
        headers=headers
    )

    assert stats_response.status_code == 200

    stats = stats_response.json()

    assert "total_users" in stats
    assert "total_students" in stats
    assert "total_counselors" in stats
    assert "total_sessions" in stats

    # Admin webinar access
    webinar_response = client.get(
        "/webinars/admin/all",
        headers=headers
    )

    assert webinar_response.status_code == 200
    assert isinstance(webinar_response.json(), list)