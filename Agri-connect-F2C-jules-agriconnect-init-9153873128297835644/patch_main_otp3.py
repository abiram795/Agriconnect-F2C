import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

old_code = """@app.patch("/api/orders/{order_id}/farmer-status")
async def update_farmer_order_status(order_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        if order_id in orders_db:
            orders_db[order_id].status = status_update.status
            return {"message": "Status updated successfully"}
        raise HTTPException(status_code=404, detail="Order not found")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        # 1. Update order status
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": status_update.status},
            headers={**headers, "Prefer": "return=representation"}
        )
        
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update order status")
            
        updated_order = res.json()[0]
        consumer_id = updated_order.get("consumer_id")
        
        # 2. Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery."
            elif status_update.status == "Delivered":
                message = "Your order has been delivered."
            elif status_update.status == "Preparing":
                message = "Farmer is preparing your order."
                
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Order Status Updated",
                    "message": message
                },
                headers=headers
            )
            
        return {"message": "Status updated successfully", "order": updated_order}"""

new_code = """import random
import hashlib
from datetime import datetime, timedelta

@app.patch("/api/orders/{order_id}/farmer-status")
async def update_farmer_order_status(order_id: UUID, status_update: FarmerOrderStatusUpdate):
    if not supabase_url:
        raise HTTPException(status_code=400, detail="Supabase required for OTP flow")
        
    if status_update.status in ['Delivered', 'Completed']:
        raise HTTPException(status_code=403, detail="Order completion requires OTP verification.")
        
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        
        # Retrieve order
        get_res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if get_res.status_code != 200 or not get_res.json():
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_data = get_res.json()[0]
        
        update_data = {"status": status_update.status}
        
        # Generate OTP if transitioning to active delivery stages
        if status_update.status in ['Farmer Accepted', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery']:
            if not order_data.get("delivery_otp_hash"):
                raw_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
                update_data["delivery_otp_hash"] = otp_hash
                update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                update_data["delivery_otp_attempts"] = 0
                
        # Update order status
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json=update_data,
            headers={**headers, "Prefer": "return=representation"}
        )
        
        if res.status_code not in (200, 201) or not res.json():
            raise HTTPException(status_code=400, detail="Failed to update order status")
            
        updated_order = res.json()[0]
        consumer_id = updated_order.get("consumer_id")
        
        # Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery. Your delivery verification code is ready. Share it with the farmer only after receiving your order."
            elif status_update.status == "Preparing":
                message = "Farmer is preparing your order."
                
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Order Status Updated",
                    "message": message
                },
                headers=headers
            )
            
        return {"message": "Status updated successfully", "order": updated_order}

class OTPVerifyRequest(BaseModel):
    otp: str
    farmer_id: UUID

@app.post("/api/orders/{order_id}/verify-otp")
async def verify_delivery_otp(order_id: UUID, req: OTPVerifyRequest):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # Verify order exists
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        order = res.json()[0]
        consumer_id = order.get("consumer_id")
        
        if order.get("status") in ['Delivered', 'Completed']:
            raise HTTPException(status_code=400, detail="Order is already completed.")
            
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
            # Increment attempts
            await client.patch(
                f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
                json={"delivery_otp_attempts": order.get("delivery_otp_attempts", 0) + 1},
                headers=headers
            )
            raise HTTPException(status_code=400, detail="Incorrect delivery OTP. Please ask the customer to provide the correct code.")
            
        # Success! Mark as Delivered
        await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={
                "status": "Delivered",
                "delivery_otp_verified_at": datetime.utcnow().isoformat(),
                "delivery_otp_verified_by": str(req.farmer_id)
            },
            headers=headers
        )
        
        # Notify consumer
        if consumer_id:
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Delivery Verified",
                    "message": "Your order has been delivered successfully."
                },
                headers=headers
            )
            
        return {"message": "Delivery verified successfully."}

@app.post("/api/orders/{order_id}/generate-otp")
async def generate_new_otp(order_id: UUID):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        res = await client.get(f"{supabase_url}/rest/v1/orders?id=eq.{order_id}", headers=headers)
        if res.status_code != 200 or not res.json():
            raise HTTPException(status_code=404, detail="Order not found")
            
        raw_otp = str(random.randint(1000, 9999))
        otp_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
        
        update_res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={
                "delivery_otp_hash": otp_hash,
                "delivery_otp_expires_at": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "delivery_otp_attempts": 0
            },
            headers=headers
        )
        if update_res.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail="Failed to generate OTP")
            
        return {"otp": raw_otp}"""

if old_code in code:
    code = code.replace(old_code, new_code)
    with open("backend/main.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("OTP Routes patched successfully!")
else:
    print("Could not find the block to replace.")
