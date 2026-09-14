from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to AgriConnect F2C API"}

def test_create_and_get_user():
    import uuid
    rand_phone = str(uuid.uuid4().int)[:10]
    user_data = {
        "name": "Test Farmer",
        "phone": rand_phone,
        "role": "farmer"
    }
    create_response = client.post("/api/users", json=user_data)
    assert create_response.status_code == 200
    created_user = create_response.json()
    assert created_user["name"] == "Test Farmer"
    assert "id" in created_user

    user_id = created_user["id"]
    get_response = client.get(f"/api/users/{user_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == user_id

def test_ai_search():
    search_req = {"query": "I need 3 kg tomatoes"}
    response = client.post("/api/ai/search", json=search_req)
    assert response.status_code == 200
    assert response.json()["product"] == "Tomatoes"

def test_demo_hub_login_success():
    login_data = {
        "phone": "hub@agriconnect.demo",
        "password": "AgriHub@2026",
        "role": "hub_worker"
    }
    response = client.post("/api/login", json=login_data)
    assert response.status_code == 200
    res_j = response.json()
    assert res_j["phone"] == "hub@agriconnect.demo"
    assert res_j["role"] == "hub_worker"
    assert res_j["hub_id"] == "COIMBATORE-HUB-001"

def test_demo_hub_login_invalid_password():
    login_data = {
        "phone": "hub@agriconnect.demo",
        "password": "WrongPassword123",
        "role": "hub_worker"
    }
    response = client.post("/api/login", json=login_data)
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]
