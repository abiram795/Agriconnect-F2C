import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the generation block
old_generation = """        # Generate OTP if transitioning to active delivery stages
        if status_update.status in ['Farmer Accepted', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery']:
            if not order_data.get("delivery_otp_hash"):
                raw_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{raw_otp}".encode()).hexdigest()
                update_data["delivery_otp_hash"] = otp_hash
                update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                update_data["delivery_otp_attempts"] = 0"""

new_generation = """        # Generate OTP if transitioning to Out for Delivery
        recovered_otp = None
        if status_update.status == 'Out for Delivery':
            if not order_data.get("delivery_otp_hash"):
                recovered_otp = str(random.randint(1000, 9999))
                otp_hash = hashlib.sha256(f"{order_id}:{recovered_otp}".encode()).hexdigest()
                update_data["delivery_otp_hash"] = otp_hash
                update_data["delivery_otp_expires_at"] = (datetime.utcnow() + timedelta(days=1)).isoformat()
                update_data["delivery_otp_attempts"] = 0
            else:
                # Recover it
                for i in range(10000):
                    test = f"{i:04d}"
                    if hashlib.sha256(f"{order_id}:{test}".encode()).hexdigest() == order_data.get("delivery_otp_hash"):
                        recovered_otp = test
                        break"""
code = code.replace(old_generation, new_generation)

# Replace the notification block
old_notify = """        # Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery. Your delivery verification code is ready. Share it with the farmer only after receiving your order."
            
            await client.post(
                f"{supabase_url}/rest/v1/notifications","""

new_notify = """        # Notify consumer
        if consumer_id:
            message = f"Your order status is now: {status_update.status}."
            if status_update.status == "Out for Delivery":
                message = f"Your farmer is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the farmer only when your order arrives."
            
            await client.post(
                f"{supabase_url}/rest/v1/notifications","""

code = code.replace(old_notify, new_notify)

# Also fix the notification title if requested. User said:
# Notification title: "Your order is out for delivery"
old_notify_full = """            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": "Order Status Updated",
                    "message": message
                },"""
new_notify_full = """            title_msg = "Your order is out for delivery" if status_update.status == "Out for Delivery" else "Order Status Updated"
            await client.post(
                f"{supabase_url}/rest/v1/notifications",
                json={
                    "user_id": consumer_id,
                    "role": "consumer",
                    "order_id": str(order_id),
                    "title": title_msg,
                    "message": message
                },"""
code = code.replace(old_notify_full, new_notify_full)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated OTP generation in main.py")
