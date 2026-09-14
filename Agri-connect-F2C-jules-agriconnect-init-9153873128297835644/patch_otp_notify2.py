import re

with open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# Replace the notification block for Farmer Delivery
old_notify = """            if status_update.status == "Out for Delivery":
                message = "Your farmer has started the delivery. Your delivery verification code is ready. Share it with the farmer only after receiving your order." """
new_notify = """            if status_update.status == "Out for Delivery":
                message = f"Your farmer is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the farmer only when your order arrives." """
code = code.replace(old_notify, new_notify)

# Let's ensure the same for delivery partner
old_dp_notify = """            if status_update.status == "Out for Delivery":
                title_msg = "Your order is out for delivery"
                message = f"Your delivery partner is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the partner only when your order arrives." """
new_dp_notify = """            if status_update.status == "Out for Delivery":
                title_msg = "Your order is out for delivery"
                message = f"Your delivery partner is on the way. Your delivery verification OTP is {recovered_otp or 'ready'}. Share this OTP with the partner only when your order arrives." """
code = code.replace(old_dp_notify, new_dp_notify)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated OTP generation in main.py")
