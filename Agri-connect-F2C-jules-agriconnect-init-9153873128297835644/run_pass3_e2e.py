import httpx
import uuid
import sys

BASE_URL = "http://127.0.0.1:8001"

def log_test(name, success, detail=""):
    status = "[PASS]" if success else "[FAIL]"
    print(f"{status} | {name} {detail}")

print("=== PASS 3: E2E AUTOMATED API TEST SUITE ===")

# Test 1: Farmer Registration
farmer_phone = f"99{uuid.uuid4().int % 100000000:08d}"
farmer_data = {
    'name': 'Audit Test Farmer',
    'phone': farmer_phone,
    'state': 'Tamil Nadu',
    'district': 'Coimbatore',
    'village': 'Saravanampatti',
    'farm_size': '2-5 acres',
    'languages': 'Tamil',
    'land_area': 'Plot 45',
    'acreage': '3.5',
    'ownership_status': 'Owned',
    'document_type': 'Patta'
}
r1 = httpx.post(f"{BASE_URL}/api/farmers/register", data=farmer_data)
if r1.status_code == 200:
    farmer_id = r1.json()["id"]
    log_test("1. Farmer Registration", True, f"ID: {farmer_id}")
else:
    log_test("1. Farmer Registration", False, f"Status: {r1.status_code} Text: {r1.text}")
    sys.exit(1)

# Test 2: Fetch Farmer Profile
r2 = httpx.get(f"{BASE_URL}/api/farmers/{farmer_id}")
if r2.status_code == 200 and r2.json().get("users", {}).get("name") == "Audit Test Farmer":
    log_test("2. Farmer Profile Retrieval", True, f"Name: {r2.json()['users']['name']}")
else:
    log_test("2. Farmer Profile Retrieval", False, f"Status: {r2.status_code}")
    sys.exit(1)

# Test 3: List Product by Farmer
prod_payload = {
    'name': 'Audit Organic Apples',
    'description': 'Fresh apples from farm',
    'price': 120.0,
    'unit': 'Kilograms (kg)',
    'quantity_available': 50.0,
    'farmer_id': farmer_id,
    'delivery_preference': 'Farmer Delivery, Delivery Partner',
    'image_url': 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD'
}
r3 = httpx.post(f"{BASE_URL}/api/products", json=prod_payload, headers={'X-User-Id': farmer_id})
if r3.status_code == 200:
    product_id = r3.json()["id"]
    log_test("3. Product Listing Creation", True, f"Product ID: {product_id}")
else:
    log_test("3. Product Listing Creation", False, f"Status: {r3.status_code} Text: {r3.text}")
    sys.exit(1)

# Test 4: Consumer Registration
consumer_phone = f"88{uuid.uuid4().int % 100000000:08d}"
consumer_payload = {
    'name': 'Audit Consumer',
    'phone': consumer_phone,
    'password': 'password123'
}
r4 = httpx.post(f"{BASE_URL}/api/consumers/register", json=consumer_payload)
if r4.status_code in (200, 201):
    consumer_id = r4.json()["id"]
    log_test("4. Consumer Registration", True, f"ID: {consumer_id}")
else:
    log_test("4. Consumer Registration", False, f"Status: {r4.status_code} Text: {r4.text}")
    sys.exit(1)

# Test 5: Consumer Save Address
addr_payload = {
    'consumer_id': consumer_id,
    'title': 'Home',
    'full_name': 'Audit Consumer',
    'mobile_number': consumer_phone,
    'address_line': '12, Audit Green Avenue',
    'locality': 'Saravanampatti',
    'city': 'Coimbatore',
    'state': 'Tamil Nadu',
    'pincode': '641035',
    'latitude': 11.0728,
    'longitude': 77.0116,
    'is_default': True
}
r5 = httpx.post(f"{BASE_URL}/api/addresses", json=addr_payload)
if r5.status_code in (200, 201):
    addr_id = r5.json()["id"]
    log_test("5. Consumer Address Save", True, f"Address ID: {addr_id}")
else:
    log_test("5. Consumer Address Save", False, f"Status: {r5.status_code} Text: {r5.text}")
    sys.exit(1)

# Test 6: Place Farmer Delivery Order
order_payload = {
    'consumer_id': consumer_id,
    'farmer_id': farmer_id,
    'product_id': product_id,
    'quantity': 3.0,
    'total_amount': 360.0,
    'fulfillment_method': 'Farmer Delivery',
    'delivery_address': addr_payload
}
r6 = httpx.post(f"{BASE_URL}/api/orders", json=order_payload)
if r6.status_code in (200, 201):
    order_id = r6.json()["id"]
    log_test("6. Farmer Delivery Order Creation", True, f"Order ID: {order_id}")
else:
    log_test("6. Farmer Delivery Order Creation", False, f"Status: {r6.status_code} Text: {r6.text}")
    sys.exit(1)

# Test 7: Farmer Changes Order Status to Out for Delivery (Generates OTP)
r7 = httpx.patch(f"{BASE_URL}/api/orders/{order_id}/farmer-status", json={'status': 'Out for Delivery'})
if r7.status_code == 200:
    log_test("7. Farmer Status -> Out for Delivery", True)
else:
    log_test("7. Farmer Status -> Out for Delivery", False, f"Status: {r7.status_code} Text: {r7.text}")
    sys.exit(1)

# Test 8: Consumer Fetches Generated Delivery OTP
r8 = httpx.get(f"{BASE_URL}/api/orders/{order_id}/delivery-otp")
if r8.status_code == 200 and r8.json().get("otp"):
    otp_code = r8.json()["otp"]
    log_test("8. Consumer Fetch OTP", True, f"OTP: {otp_code}")
else:
    log_test("8. Consumer Fetch OTP", False, f"Status: {r8.status_code} Text: {r8.text}")
    sys.exit(1)

# Test 9: Verify OTP & Mark Order Delivered
r9 = httpx.post(f"{BASE_URL}/api/orders/{order_id}/verify-otp", json={'otp': otp_code, 'farmer_id': farmer_id})
if r9.status_code == 200:
    log_test("9. OTP Verification & Order Delivered", True, "Order Completed!")
else:
    log_test("9. OTP Verification & Order Delivered", False, f"Status: {r9.status_code} Text: {r9.text}")
    sys.exit(1)

# Test 10: Delivery Partner Registration
dp_phone = f"77{uuid.uuid4().int % 100000000:08d}"
dp_data = {
    'name': 'Audit Partner',
    'phone': dp_phone,
    'email': 'audit@partner.com',
    'address': 'Coimbatore Street',
    'service_area': 'Coimbatore',
    'vehicle_type': 'Bike'
}
r10 = httpx.post(f"{BASE_URL}/api/delivery/register", data=dp_data)
if r10.status_code in (200, 201):
    partner_id = r10.json()["id"]
    log_test("10. Delivery Partner Registration", True, f"Partner ID: {partner_id}")
else:
    log_test("10. Delivery Partner Registration", False, f"Status: {r10.status_code} Text: {r10.text}")
    sys.exit(1)

print("\nALL 10 E2E AUTOMATED TESTS PASSED WITH 0 ERRORS!")
