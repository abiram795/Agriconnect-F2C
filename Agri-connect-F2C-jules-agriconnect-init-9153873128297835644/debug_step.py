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

def run_step_by_step():
    phone_suffix = str(uuid.uuid4().int)[:6]
    
    # 1. Create Farmer
    st, farmer = api_request("POST", "/api/users", {
        "name": f"Farmer {phone_suffix}",
        "phone": f"9876{phone_suffix}",
        "role": "farmer",
        "state": "Tamil Nadu",
        "district": "Coimbatore",
        "village": "Pollachi",
        "farm_size": "5 acres"
    })
    farmer_id = farmer.get("id")
    print("Farmer:", st, farmer_id)

    # 2. Auto approve farmer
    st, app = api_request("POST", f"/api/farmers/{farmer_id}/auto-approve")
    print("Auto approve:", st, app)

    # 3. Create Product with x-user-id header
    st, product = api_request("POST", "/api/products", {
        "farmer_id": farmer_id,
        "name": f"Organic Tomatoes {phone_suffix}",
        "category_id": "00000000-0000-0000-0000-000000000001",
        "price": 40.0,
        "quantity_available": 100.0,
        "unit": "kg",
        "delivery_preference": "Delivery Partner"
    }, headers_extra={"x-user-id": farmer_id})
    product_id = product.get("id")
    print("Product:", st, product_id)

    # 4. Create Consumer
    st, consumer = api_request("POST", "/api/users", {
        "name": f"Consumer {phone_suffix}",
        "phone": f"9123{phone_suffix}",
        "role": "consumer"
    })
    consumer_id = consumer.get("id")
    print("Consumer:", st, consumer_id)

    # 5. Create Consumer Address
    st, address = api_request("POST", "/api/addresses", {
        "consumer_id": consumer_id,
        "label": "Home",
        "full_name": "Consumer",
        "mobile_number": f"9123{phone_suffix}",
        "address_line": "123 Green Street",
        "locality": "Gandhipuram",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "pincode": "641012",
        "is_default": True
    })
    print("Address:", st, address.get("id"))

    # 6. Create Delivery Partner 1 & 2
    st, dp1 = api_request("POST", "/api/users", {
        "name": f"Delivery Partner One {phone_suffix}",
        "phone": f"9001{phone_suffix}",
        "role": "delivery_partner"
    })
    dp1_id = dp1.get("id")
    print("DP1:", st, dp1_id)

    st, dp2 = api_request("POST", "/api/users", {
        "name": f"Delivery Partner Two {phone_suffix}",
        "phone": f"9002{phone_suffix}",
        "role": "delivery_partner"
    })
    dp2_id = dp2.get("id")
    print("DP2:", st, dp2_id)

    # 7. Create Order
    st, order = api_request("POST", "/api/orders", {
        "consumer_id": consumer_id,
        "farmer_id": farmer_id,
        "product_id": product_id,
        "quantity": 5.0,
        "total_amount": 200.0,
        "fulfillment_method": "Delivery Partner",
        "delivery_address": address
    })
    print("Order:", st, order)

if __name__ == "__main__":
    run_step_by_step()
