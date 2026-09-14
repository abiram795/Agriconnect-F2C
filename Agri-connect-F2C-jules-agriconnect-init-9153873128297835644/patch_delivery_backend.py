import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update create_order to notify eligible delivery partners
create_order_old = """        # 5. Create delivery request if needed
        if order.fulfillment_method == "Delivery Partner":
            await client.post(
                f"{supabase_url}/rest/v1/deliveries",
                json={
                    "order_id": created_order["id"],
                    "status": "Delivery Requested"
                },
                headers=headers
            )
            
        return created_order"""

create_order_new = """        # 5. Create delivery request if needed
        if order.fulfillment_method == "Delivery Partner":
            await client.post(
                f"{supabase_url}/rest/v1/deliveries",
                json={
                    "order_id": created_order["id"],
                    "status": "Delivery Requested"
                },
                headers=headers
            )
            
            # Find eligible delivery partners (simplified to all active partners for hackathon)
            dp_res = await client.get(f"{supabase_url}/rest/v1/users?role=eq.delivery_partner", headers=headers)
            if dp_res.status_code == 200:
                dps = dp_res.json()
                notifications = []
                for dp in dps:
                    notifications.append({
                        "user_id": dp["id"],
                        "role": "delivery_partner",
                        "order_id": created_order["id"],
                        "title": "New Delivery Request",
                        "message": f"A customer has placed a delivery order for {order.quantity} kg. Pickup from Farmer."
                    })
                if notifications:
                    await client.post(f"{supabase_url}/rest/v1/notifications", json=notifications, headers=headers)
            
        return created_order"""

code = code.replace(create_order_old, create_order_new)

# 2. Update assign_delivery to notify consumer & farmer, and change status correctly
assign_old = """@app.patch("/api/orders/{order_id}/assign-delivery")
async def assign_delivery(order_id: UUID, req: AssignDeliveryRequest):
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{supabase_url}/rest/v1/deliveries?order_id=eq.{order_id}",
            json={
                "delivery_partner_id": req.delivery_partner_id,
                "status": "Accepted"
            },
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 204, 201):
            raise HTTPException(status_code=400, detail="Failed to assign delivery")
            
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": "Out for Delivery"},
            headers=get_supabase_headers()
        )
        return {"status": "success"}"""

assign_new = """@app.patch("/api/orders/{order_id}/assign-delivery")
async def assign_delivery(order_id: UUID, req: AssignDeliveryRequest):
    async with httpx.AsyncClient() as client:
        # Check if already assigned
        check_res = await client.get(f"{supabase_url}/rest/v1/deliveries?order_id=eq.{order_id}", headers=get_supabase_headers())
        if check_res.status_code == 200 and check_res.json():
            delivery = check_res.json()[0]
            if delivery.get("delivery_partner_id") and delivery.get("delivery_partner_id") != req.delivery_partner_id:
                raise HTTPException(status_code=400, detail="Delivery already assigned to another partner.")
                
        res = await client.patch(
            f"{supabase_url}/rest/v1/deliveries?order_id=eq.{order_id}",
            json={
                "delivery_partner_id": req.delivery_partner_id,
                "status": "Accepted"
            },
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 204, 201):
            raise HTTPException(status_code=400, detail="Failed to assign delivery")
            
        # Get order to notify people
        order_res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=get_supabase_headers())
        order_data = order_res.json()[0] if order_res.status_code == 200 and order_res.json() else None
        
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": "Delivery Assigned"},
            headers=get_supabase_headers()
        )
        
        if order_data:
            # Notify consumer
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json=[{
                    "user_id": order_data["consumer_id"],
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Delivery Partner Assigned",
                    "message": "A delivery partner has been assigned to your order."
                },
                {
                    "user_id": order_data["farmer_id"],
                    "role": "farmer",
                    "order_id": str(order_id),
                    "title": "Delivery Partner Assigned",
                    "message": "A delivery partner will arrive soon to pick up the order."
                }],
                headers=get_supabase_headers()
            )
            
        return {"status": "success"}

@app.get("/api/deliveries/partner/{partner_id}")
async def get_partner_deliveries(partner_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/deliveries?delivery_partner_id=eq.{partner_id}&status=not.eq.Delivered&select=*,orders(*,consumers(*,users(*))),orders(*,order_items(*,products(*,farmers(*,users(*)))))",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

@app.patch("/api/deliveries/{delivery_id}/status")
async def update_delivery_status(delivery_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        raise HTTPException(status_code=400, detail="Supabase required")
    
    if status_update.status in ['Delivered', 'Completed']:
        raise HTTPException(status_code=403, detail="Order completion requires OTP verification.")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        get_res = await client.get(f"{supabase_url}/rest/v1/deliveries?id=eq.{delivery_id}&select=*,orders(*)", headers=headers)
        if get_res.status_code != 200 or not get_res.json():
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        delivery = get_res.json()[0]
        order = delivery.get("orders")
        order_id = order.get("id")
        
        update_data = {"status": status_update.status}
        order_update_data = {"status": status_update.status}
        
        recovered_otp = None
        if status_update.status == 'Out for Delivery':
            if not order.get("delivery_otp_hash"):
                import random, hashlib
                recovered_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{recovered_otp}".encode()).hexdigest()
                order_update_data["delivery_otp_hash"] = otp_hash
                from datetime import datetime, timedelta
                order_update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                order_update_data["delivery_otp_attempts"] = 0
            else:
                import hashlib
                for i in range(10000):
                    test = f"{i:04d}"
                    if hashlib.sha256(f"{order_id}:{test}".encode()).hexdigest() == order.get("delivery_otp_hash"):
                        recovered_otp = test
                        break
        
        # update delivery
        await client.patch(
            f"{supabase_url}/rest/v1/deliveries?id=eq.{delivery_id}",
            json=update_data,
            headers=headers
        )
        
        # update order
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json=order_update_data,
            headers=headers
        )
        
        consumer_id = order.get("consumer_id")
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            title_msg = "Order Status Updated"
            if status_update.status == "Out for Delivery":
                title_msg = "Your order is out for delivery"
                message = f"Your delivery partner is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the partner only when your order arrives."
            
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": title_msg,
                    "message": message
                },
                headers=headers
            )
            
        return {"status": "success"}"""

code = code.replace(assign_old, assign_new)

# 3. Update verify_delivery_otp to also update `deliveries` if it exists
verify_old = """        # Success! Mark as Delivered
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={
                "status": "Delivered",
                "delivery_otp_verified_at": datetime.utcnow().isoformat(),
                "delivery_otp_verified_by": str(req.farmer_id)
            },
            headers=headers
        )"""
verify_new = """        # Success! Mark as Delivered
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={
                "status": "Delivered",
                "delivery_otp_verified_at": datetime.utcnow().isoformat(),
                "delivery_otp_verified_by": str(req.farmer_id)
            },
            headers=headers
        )
        
        # Also mark delivery as completed if it exists
        await client.patch(
            f"{supabase_url}/rest/v1/deliveries?order_id=eq.{order_id}",
            json={"status": "Delivered"},
            headers=headers
        )"""
code = code.replace(verify_old, verify_new)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated backend for delivery partners!")
