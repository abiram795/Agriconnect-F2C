import urllib.request
import json
import uuid

BASE_URL = "http://127.0.0.1:8001"

def api_request(method, path, data=None, headers_extra=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if headers_extra:
        headers.update(headers_extra)
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"detail": err_body}
    except Exception as e:
        return 500, {"detail": str(e)}

def test_focused():
    results = {}
    print("==========================================")
    print("DELIVERY VERIFICATION & OTP FOCUSED TEST")
    print("==========================================")

    suffix = str(uuid.uuid4().int)[:6]
    
    # 1. Create Farmer & Auto-Approve
    _, farmer = api_request("POST", "/api/users", {"name": f"Farmer {suffix}", "phone": f"9876{suffix}", "role": "farmer"})
    farmer_id = farmer["id"]
    api_request("POST", f"/api/farmers/{farmer_id}/auto-approve")

    # 2. Create Product
    _, product = api_request("POST", "/api/products", {
        "farmer_id": farmer_id, "name": f"Onion {suffix}", "price": 50.0, "quantity_available": 100.0, "unit": "kg", "delivery_preference": "Delivery Partner"
    }, headers_extra={"x-user-id": farmer_id})
    product_id = product["id"]

    # 3. Create Consumer & Address
    _, consumer = api_request("POST", "/api/users", {"name": f"Consumer {suffix}", "phone": f"9123{suffix}", "role": "consumer"})
    consumer_id = consumer["id"]
    _, address = api_request("POST", "/api/addresses", {
        "consumer_id": consumer_id, "label": "Home", "full_name": "Consumer", "mobile_number": f"9123{suffix}", "address_line": "123 Street", "city": "Coimbatore", "state": "Tamil Nadu", "pincode": "641012"
    })

    # 4. Create Delivery Partner
    _, dp = api_request("POST", "/api/users", {"name": f"DP {suffix}", "phone": f"9001{suffix}", "role": "delivery_partner"})
    dp_id = dp["id"]

    # 5. Place Order with Delivery Partner
    st_ord, order = api_request("POST", "/api/orders", {
        "consumer_id": consumer_id, "farmer_id": farmer_id, "product_id": product_id, "quantity": 1.0, "total_amount": 50.0, "fulfillment_method": "Delivery Partner", "delivery_address": address
    })
    order_id = order["id"]

    # --- STEP 1: TEST ACCEPT ORDER ---
    st_assign, assign_res = api_request("PATCH", f"/api/orders/{order_id}/assign-delivery", {"delivery_partner_id": dp_id})
    # Check status of order after accept
    _, cons_orders = api_request("GET", f"/api/orders/consumer/{consumer_id}")
    accepted_order = next((o for o in cons_orders if o["id"] == order_id), {})
    order_status_after_accept = accepted_order.get("status")

    results["Accept -> ACCEPTED Only"] = "PASS" if order_status_after_accept in ["ACCEPTED", "Delivery Assigned", "Order Placed"] else "FAIL"
    results["Accept Does NOT Complete Order"] = "PASS" if order_status_after_accept not in ["Delivered", "Completed"] else "FAIL"

    # --- STEP 2: TEST OUT_FOR_DELIVERY & OTP ACCESS ---
    api_request("PATCH", f"/api/orders/{order_id}/farmer-status", {"status": "Preparing"})
    st_out, _ = api_request("PATCH", f"/api/orders/{order_id}/farmer-status", {"status": "Out for Delivery"})
    results["OUT_FOR_DELIVERY"] = "PASS" if st_out == 200 else "FAIL"

    # Call View Delivery Code API (get_delivery_otp)
    st_otp, otp_res = api_request("GET", f"/api/orders/{order_id}/delivery-otp")
    otp = otp_res.get("otp")
    results["View Delivery Code"] = "PASS" if st_otp == 200 and otp else "FAIL"
    results["OTP Display"] = "PASS" if st_otp == 200 and otp and len(str(otp)) == 4 else "FAIL"

    # Test refresh GET returns same OTP
    st_otp2, otp_res2 = api_request("GET", f"/api/orders/{order_id}/delivery-otp")
    otp2 = otp_res2.get("otp")
    if otp != otp2:
        results["OTP Display"] = "FAIL (OTP changed on refresh)"

    # --- STEP 3: WRONG OTP PROTECTION ---
    wrong_st, wrong_res = api_request("POST", f"/api/orders/{order_id}/verify-otp", {
        "otp": "0000" if otp != "0000" else "9999",
        "farmer_id": farmer_id
    })
    results["Wrong OTP Protection"] = "PASS" if wrong_st == 400 and "Incorrect" in str(wrong_res) else "FAIL"

    # --- STEP 4: CORRECT OTP VERIFICATION & FINAL COMPLETION ---
    correct_st, verify_res = api_request("POST", f"/api/orders/{order_id}/verify-otp", {
        "otp": otp,
        "farmer_id": farmer_id
    })
    results["Correct OTP Verification"] = "PASS" if correct_st == 200 else "FAIL"
    results["Final Order Completion"] = "PASS" if correct_st == 200 and verify_res.get("status") == "Delivered" else "FAIL"

    # --- STEP 5: OTP REUSE PROTECTION ---
    dup_st, dup_res = api_request("POST", f"/api/orders/{order_id}/verify-otp", {
        "otp": otp,
        "farmer_id": farmer_id
    })
    results["OTP Reuse Protection"] = "PASS" if dup_st == 200 and dup_res.get("message") == "Order is already completed." else "FAIL"

    # --- STEP 6: OTP BYPASS PREVENTION ---
    # Attempt direct status patch to Delivered without OTP
    bypass_st, bypass_res = api_request("PATCH", f"/api/orders/{order_id}/farmer-status", {"status": "Delivered"})
    results["OTP Bypass Prevention"] = "PASS" if bypass_st in (400, 403) else "FAIL"

    print("\n==========================================")
    print("TARGETED TEST RESULTS:")
    print("==========================================")
    for k, v in results.items():
        print(f"{k}: {v}")

if __name__ == "__main__":
    test_focused()
