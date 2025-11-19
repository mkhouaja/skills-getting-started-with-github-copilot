import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def setup_function():
    # Reset participant lists for predictable tests
    activities["Chess Club"]["participants"] = ["michael@mergington.edu", "daniel@mergington.edu"]
    activities["Programming Class"]["participants"] = ["emma@mergington.edu", "sophia@mergington.edu"]


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "newstudent@mergington.edu"

    # Ensure not already signed up
    assert email not in activities[activity]["participants"]

    # Sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # GET should reflect the new participant
    res = client.get("/activities")
    assert res.status_code == 200
    assert email in res.json()[activity]["participants"]

    # Unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]


def test_signup_duplicate_fails():
    activity = "Programming Class"
    email = "emma@mergington.edu"

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400


def test_unregister_nonexistent_fails():
    activity = "Programming Class"
    email = "notfound@mergington.edu"

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
