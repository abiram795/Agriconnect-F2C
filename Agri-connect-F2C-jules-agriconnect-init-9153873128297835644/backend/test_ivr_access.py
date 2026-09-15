import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))
from main import app

client = TestClient(app)

def test_farmer_ivr_access_persistence_and_uniqueness():
    farmer_id = "test-farmer-ivr-001"
    headers = {"X-User-Id": farmer_id}

    # First call: Generates IVR access record
    res1 = client.get(f"/api/ivr/farmer/{farmer_id}/access", headers=headers)
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
    data1 = res1.json()
    assert data1["success"] is True
    assert data1["farmer_id"] == farmer_id
    assert "ivr_identifier" in data1
    assert data1["ivr_identifier"].startswith("IVR-FMR-")
    assert data1["status_label"] == "Demo / Ready for Provider Integration"

    # Second call: Must return the EXACT SAME ivr_identifier (persistent)
    res2 = client.get(f"/api/ivr/farmer/{farmer_id}/access", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["ivr_identifier"] == data1["ivr_identifier"]

def test_farmer_ivr_access_authorization_security():
    farmer_id = "test-farmer-ivr-002"
    attacker_id = "malicious-user-999"

    # Call with missing X-User-Id header -> 403
    res_no_header = client.get(f"/api/ivr/farmer/{farmer_id}/access")
    assert res_no_header.status_code == 403

    # Call with mismatched X-User-Id header -> 403
    res_mismatch = client.get(
        f"/api/ivr/farmer/{farmer_id}/access",
        headers={"X-User-Id": attacker_id}
    )
    assert res_mismatch.status_code == 403

def test_interactive_ivr_menu_responses():
    # Test keypress 1 (Vegetables in Tamil)
    res_ta = client.post("/api/ivr/interactive-menu", json={
        "farmer_id": "test-farmer-ivr-001",
        "digits": "1",
        "state": "MAIN_MENU",
        "language": "Tamil"
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert data_ta["state"] == "PRODUCT_SELECT"
    assert "VEGETABLES" in str(data_ta.get("data", {}))

    # Test keypress 4 (Orders in English)
    res_en = client.post("/api/ivr/interactive-menu", json={
        "farmer_id": "test-farmer-ivr-001",
        "digits": "4",
        "state": "MAIN_MENU",
        "language": "English"
    })
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "order" in data_en.get("text", "").lower()
