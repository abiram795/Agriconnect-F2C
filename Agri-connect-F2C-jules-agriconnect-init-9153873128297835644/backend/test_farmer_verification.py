import pytest
from fastapi.testclient import TestClient
from main import app, users_db

client = TestClient(app)

def test_unverified_farmer_product_creation_forbidden():
    # Attempt product creation with missing / unverified farmer
    payload = {
        "name": "Organic Tomatoes",
        "description": "Fresh farm tomatoes",
        "price": 40.0,
        "unit": "kg",
        "quantity_available": 100.0,
        "farmer_id": "00000000-0000-0000-0000-000000000099",
        "delivery_preference": "Self Pickup"
    }
    response = client.post(
        "/api/products",
        json=payload,
        headers={"X-User-Id": "00000000-0000-0000-0000-000000000099"}
    )
    assert response.status_code in (401, 403)
    assert "unavailable" in response.json()["detail"].lower() or "not found" in response.json()["detail"].lower() or "verification" in response.json()["detail"].lower()

def test_self_approval_disabled():
    response = client.post("/api/farmers/00000000-0000-0000-0000-000000000099/auto-approve")
    assert response.status_code == 403
    assert "disabled" in response.json()["detail"].lower()

def test_admin_farmers_queue_unauthorized_without_header():
    response = client.get("/api/admin/farmers")
    # FastAPI Depends(get_current_user) expects Authorization header
    assert response.status_code in (401, 422)

def test_admin_farmers_queue_forbidden_for_non_admin_token():
    # Invalid token or non-admin user
    response = client.get("/api/admin/farmers", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 401

