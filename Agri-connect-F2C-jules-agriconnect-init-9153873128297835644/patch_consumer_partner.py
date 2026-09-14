import re

with open("frontend/src/pages/ConsumerHome.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace condition for OTP block
old_cond = "{order.fulfillment_method === 'Farmer Delivery' && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && ("
new_cond = "{['Farmer Delivery', 'Delivery Partner'].includes(order.fulfillment_method) && !['Delivered', 'Completed', 'Cancelled'].includes(order.status) && ("
code = code.replace(old_cond, new_cond)

# Update the text "Give this OTP to the farmer only after your order arrives."
old_text = "Give this OTP to the farmer only after your order arrives."
new_text = "Give this OTP to the delivery person only after your order arrives."
code = code.replace(old_text, new_text)

with open("frontend/src/pages/ConsumerHome.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated ConsumerHome.tsx to include Delivery Partner OTP UI!")
