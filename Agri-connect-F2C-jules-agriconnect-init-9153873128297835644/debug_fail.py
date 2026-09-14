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

def debug_failures():
    phone_suffix = str(uuid.uuid4().int)[:6]
    
    # 1. Create Farmer
    _, farmer = api_request("POST", "/api/users", {
        "name": f"Audit Farmer {phone_suffix}",
        "phone": f"9876{phone_suffix}",
        "role": "farmer"
    })
    farmer_id = farmer.get("id")
    api_request("POST", f"/api/farmers/{farmer_id}/auto-approve")

    # 2. Create Product
    _, product = api_request("POST", "/api/products", {
        "farmer_id": farmer_id,
        "name": f"Organic Tomatoes {phone_suffix}",
        "price": 40.0,
        "quantity_available": 100.0,
        "unit": "kg",
        "delivery_preference": "Delivery Partner"
    }, headers_extra={"x-user-id": farmer_id})
    product_id = product.get("id")

    # 3. Create Consumer & Address
    _, consumer = api_request("POST", "/api/users", {"name": "Consumer", "phone": f"9123{phone_suffix}", "role": "consumer"})
    consumer_id = consumer.get("id")
    _, address = api_request("POST", "/api/addresses", {
        "consumer_id": consumer_id, "label": "Home", "full_name": "Consumer", "mobile_number": f"9123{phone_suffix}",
        "address_line": "123 Green Street", "city": "Coimbatore", "state": "Tamil Nadu", "pincode": "641012"
    })

    # 4. Create DP1 & DP2
    _, dp1 = api_request("POST", "/api/users", {"name": "DP1", "phone": f"9001{phone_suffix}", "role": "delivery_partner"})
    dp1_id = dp1.get("id")
    _, dp2 = api_request("POST", "/api/users", {"name": "DP2", "phone": f"9002{phone_suffix}", "role": "delivery_partner"})
    dp2_id = dp2.get("id")

    # Create Order
    _, order = api_request("POST", "/api/orders", {
        "consumer_id": consumer_id, "farmer_id": farmer_id, "product_id": product_id,
        "quantity": 5.0, "total_amount": 200.0, "fulfillment_method": "Delivery Partner", "delivery_address": address
    })
    order_id = order.get("id")
    print("Order ID:", order_id)

    # Check 3: Available deliveries
    st, avail = api_request("GET", "/api/orders/available-deliveries")
    print("Check 3 (Available Deliveries):", st, avail)

    # Check 4: Assign delivery partner 1
    st, assign1 = api_request("PATCH", f"/api/orders/{order_id}/assign-delivery", {"delivery_partner_id": dp1_id})
    print("Check 4 (Assign DP1):", st, assign1)

    # Check 5: Assign delivery partner 2 (dup)
    st, assign2 = api_request("PATCH", f"/api/orders/{order_id}/assign-delivery", {"delivery_partner_id": dp2_id})
    print("Check 5 (Assign DP2):", st, assign2)

    # Check 13: Earnings
    st, earn = api_request("GET", f"/api/delivery/earnings/{dp1_id}")
    print("Check 13 (Earnings):", st, earn)

    # Check 16, 19, 20: Profile patch
    st, prof = api_request("PATCH", f"/api/delivery/profile/{dp1_id}", {
        "name": "DP Updated", "vehicle_type": "EV", "vehicle_number": "TN 37 EV 9999"
    })
    print("Check 16/19/20 (Profile Patch):", st, prof)

    # Check 21: Review
    st, rev = api_request("POST", "/api/reviews", {
        "order_id": order_id, "consumer_id": consumer_id, "reviewee_type": "DELIVERY_PARTNER",
        "reviewee_id": dp1_id, "rating": 5, "review_text": "Great service!"
    })
    print("Check 21 (Review DP):", st, rev)

if __name__ == "__main__":
    debug_failures()
