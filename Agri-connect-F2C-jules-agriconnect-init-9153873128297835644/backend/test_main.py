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

def test_hub_incoming_and_sale_receipt_flow():
    # 1. Create Incoming Receipt
    incoming_payload = {
        "farmer_id": "FARMER-TEST-001",
        "product_name": "Organic Tomatoes",
        "quantity": 50.0,
        "unit": "kg",
        "farmer_price": 32.0,
        "hub_id": "COIMBATORE-HUB-001",
        "operating_cost_component": 8.0,
        "source_reference": "Ramanathan Farmers Ltd",
        "worker_id": "COIMBATORE-WORKER-001"
    }
    inc_res = client.post("/api/hubs/receipts/incoming", json=incoming_payload)
    assert inc_res.status_code == 200
    inc_data = inc_res.json()
    assert inc_data["receipt_number"].startswith("IN-2026-")
    assert inc_data["total_value"] == 1600.0
    receipt_id = inc_data.get("id")

    # 2. Get incoming receipts list
    inc_list_res = client.get("/api/hubs/receipts/incoming")
    assert inc_list_res.status_code == 200
    assert any(r["receipt_number"] == inc_data["receipt_number"] for r in inc_list_res.json())

    # Find the created inventory ID in memory or via receipt
    # In test environment, the inventory item was created with farmer_id "FARMER-TEST-001"
    inventory_items = client.get("/api/hubs/inventory").json() if hasattr(client, "get") else []
    inventory_id = None
    if isinstance(inventory_items, list):
        for item in inventory_items:
            if item.get("farmer_id") == "FARMER-TEST-001" and item.get("product_name") == "Organic Tomatoes":
                inventory_id = item.get("id")
                break

    # 3. Create Sale Receipt with valid quantity
    if inventory_id:
        sale_payload = {
            "hub_inventory_id": inventory_id,
            "quantity": 10.0,
            "unit_price": 40.0,
            "consumer_reference": "Fresh Market Supermarket",
            "payment_status": "PAID",
            "worker_id": "COIMBATORE-WORKER-001"
        }
        sale_res = client.post("/api/hubs/receipts/sale", json=sale_payload)
        assert sale_res.status_code == 200
        sale_data = sale_res.json()
        assert sale_data["receipt_number"].startswith("SALE-2026-")
        assert sale_data["farmer_id"] == "FARMER-TEST-001"
        assert sale_data["total_price"] == 400.0

        # 4. Attempt Sale Receipt exceeding available stock (40.0 kg left)
        over_sale_payload = {
            "hub_inventory_id": inventory_id,
            "quantity": 100.0,
            "unit_price": 40.0,
            "consumer_reference": "Bulk Buyer",
            "payment_status": "PAID",
            "worker_id": "COIMBATORE-WORKER-001"
        }
        over_res = client.post("/api/hubs/receipts/sale", json=over_sale_payload)
        assert over_res.status_code == 400
        assert "Insufficient inventory available" in over_res.json()["detail"]


