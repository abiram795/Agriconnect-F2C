path = r'c:\Users\abira\Downloads\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\Agri-connect-F2C-jules-agriconnect-init-9153873128297835644\backend\main.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure DELIVERIES_DB exists at top
if 'DELIVERIES_DB = {}' not in content:
    content = content.replace(
        'REVIEWS_DB = []',
        'REVIEWS_DB = []\nDELIVERIES_DB = {}\nEARNINGS_DB = {}'
    )

# 1. Update available deliveries endpoint
avail_code = '''@app.get("/api/orders/available-deliveries")
async def get_available_deliveries():
    deliveries_list = []
    # 1. Try DB
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                f"{supabase_url}/rest/v1/deliveries?status=in.(Pending%20Assignment,Delivery%20Requested)&select=*,orders(*,products(*,farmers(*,users(*))))",
                headers=get_supabase_headers()
            )
            if res.status_code == 200 and res.json():
                deliveries_list = res.json()
        except Exception:
            pass
            
    # 2. Add in-memory deliveries
    for oid, d in DELIVERIES_DB.items():
        if d.get("status") in ["Pending Assignment", "Delivery Requested"] and not d.get("delivery_partner_id"):
            if not any(x.get("order_id") == oid for x in deliveries_list):
                deliveries_list.append(d)
                
    return deliveries_list
'''

# 2. Update assign delivery endpoint
assign_code = '''@app.patch("/api/orders/{order_id}/assign-delivery")
async def assign_delivery(order_id: UUID, req: AssignDeliveryRequest):
    oid = str(order_id)
    # Check in-memory store first
    if oid in DELIVERIES_DB and DELIVERIES_DB[oid].get("delivery_partner_id") and DELIVERIES_DB[oid].get("delivery_partner_id") != req.delivery_partner_id:
        raise HTTPException(status_code=400, detail="Delivery already assigned to another partner.")

    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # Check DB
        check_res = await client.get(f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}", headers=headers)
        if check_res.status_code == 200 and check_res.json():
            delivery = check_res.json()[0]
            if delivery.get("delivery_partner_id") and str(delivery.get("delivery_partner_id")) != str(req.delivery_partner_id):
                raise HTTPException(status_code=400, detail="Delivery already assigned to another partner.")

        # Update DB
        res = await client.patch(
            f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}",
            json={
                "delivery_partner_id": str(req.delivery_partner_id),
                "status": "Accepted"
            },
            headers={**headers, "Prefer": "return=representation"}
        )
        
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
            json={"status": "Delivery Assigned"},
            headers=headers
        )

    DELIVERIES_DB[oid] = {
        "order_id": oid,
        "delivery_partner_id": str(req.delivery_partner_id),
        "status": "Accepted"
    }

    return {"status": "success", "message": "Delivery assigned successfully"}
'''

# 3. Update verify OTP endpoint to credit ₹30 and handle idempotency
verify_code = '''@app.post("/api/orders/{order_id}/verify-otp")
async def verify_delivery_otp(order_id: UUID, req: OTPVerifyRequest):
    oid = str(order_id)
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{oid}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = res.json()[0]
        consumer_id = order.get("consumer_id")
        
        if order.get("status") in ['Delivered', 'Completed']:
            return {"message": "Order is already completed.", "status": "Delivered"}
            
        if order.get("delivery_otp_attempts", 0) >= 5:
            raise HTTPException(status_code=429, detail="Too many incorrect attempts. Please contact support.")
            
        if not order.get("delivery_otp_hash"):
            raise HTTPException(status_code=400, detail="OTP not generated for this order yet.")
            
        exp_time_str = order.get("delivery_otp_expires_at")
        if exp_time_str:
            exp_time = datetime.fromisoformat(exp_time_str.replace("Z", "+00:00"))
            if datetime.utcnow().timestamp() > exp_time.timestamp():
                raise HTTPException(status_code=400, detail="Delivery verification code expired.")
        
        # Verify OTP
        input_hash = hashlib.sha256(f"{order_id}:{req.otp}".encode()).hexdigest()
        if input_hash != order.get("delivery_otp_hash"):
            await client.patch(
                f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
                json={"delivery_otp_attempts": order.get("delivery_otp_attempts", 0) + 1},
                headers=headers
            )
            raise HTTPException(status_code=400, detail="Incorrect delivery OTP. Please ask the customer to provide the correct code.")
            
        # Success! Mark as Delivered
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{oid}",
            json={
                "status": "Delivered",
                "delivery_otp_verified_at": datetime.utcnow().isoformat(),
                "delivery_otp_verified_by": str(req.farmer_id)
            },
            headers=headers
        )
        
        # Also mark delivery as completed and set fee=30.0
        dp_id = None
        if oid in DELIVERIES_DB:
            DELIVERIES_DB[oid]["status"] = "Delivered"
            DELIVERIES_DB[oid]["fee"] = 30.0
            dp_id = DELIVERIES_DB[oid].get("delivery_partner_id")

        try:
            d_res = await client.patch(
                f"{supabase_url}/rest/v1/deliveries?order_id=eq.{oid}",
                json={"status": "Delivered", "fee": 30.0},
                headers={**headers, "Prefer": "return=representation"}
            )
            if d_res.status_code == 200 and d_res.json():
                dp_id = d_res.json()[0].get("delivery_partner_id") or dp_id
        except Exception:
            pass

        if dp_id:
            pid = str(dp_id)
            if pid not in EARNINGS_DB: EARNINGS_DB[pid] = []
            if not any(x.get("order_id") == oid for x in EARNINGS_DB[pid]):
                EARNINGS_DB[pid].append({"order_id": oid, "fee": 30.0, "date": datetime.utcnow().isoformat()})

        # Notify consumer
        if consumer_id:
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": oid,
                    "title": "Delivery Verified",
                    "message": "Your order has been delivered successfully."
                },
                headers=headers
            )
            
        return {"message": "Delivery verified successfully.", "status": "Delivered"}
'''

# 4. Update get earnings endpoint
earnings_code = '''@app.get("/api/delivery/earnings/{partner_id}")
async def get_delivery_earnings(partner_id: UUID):
    pid = str(partner_id)
    completed_orders = []
    
    # 1. Check DB
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{supabase_url}/rest/v1/deliveries?delivery_partner_id=eq.{pid}&status=eq.Delivered&select=*,orders(*)", headers=get_supabase_headers())
            if res.status_code == 200 and res.json():
                for d in res.json():
                    completed_orders.append({
                        "order_id": d.get("order_id"),
                        "date": d.get("updated_at") or d.get("created_at"),
                        "fee": 30.0,
                        "customer_address": d.get("orders", {}).get("delivery_address")
                    })
        except Exception:
            pass

    # 2. Check in-memory store
    if pid in EARNINGS_DB:
        for item in EARNINGS_DB[pid]:
            if not any(x.get("order_id") == item["order_id"] for x in completed_orders):
                completed_orders.append(item)

    total_earnings = len(completed_orders) * 30.0
    return {
        "total_earnings": total_earnings,
        "completed_deliveries_count": len(completed_orders),
        "todays_earnings": total_earnings,
        "completed_orders": completed_orders
    }
'''

# Apply replacements in content
import re

content = re.sub(r'@app\.get\("/api/orders/available-deliveries"\)[\s\S]*?(?=@app|\Z)', avail_code + '\n\n', content, count=1)
content = re.sub(r'@app\.patch\("/api/orders/\{order_id\}/assign-delivery"\)[\s\S]*?(?=@app|\Z)', assign_code + '\n\n', content, count=1)
content = re.sub(r'@app\.post\("/api/orders/\{order_id\}/verify-otp"\)[\s\S]*?(?=@app|\Z)', verify_code + '\n\n', content, count=1)
content = re.sub(r'@app\.get\("/api/delivery/earnings/\{partner_id\}"\)[\s\S]*?(?=@app|\Z)', earnings_code + '\n\n', content, count=1)

# In create_order endpoint, also store in DELIVERIES_DB
create_deliv_code = '''        if order.fulfillment_method == "Delivery Partner":
            DELIVERIES_DB[created_order["id"]] = {
                "order_id": created_order["id"],
                "delivery_partner_id": None,
                "status": "Delivery Requested",
                "orders": created_order
            }
            await client.post('''

content = content.replace('        if order.fulfillment_method == "Delivery Partner":\n            await client.post(', create_deliv_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched main.py delivery & earnings logic successfully!")
