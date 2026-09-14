import re

with open("main.py", "r") as f:
    code = f.read()

# Replace the notification creation part
old_notifications = """        # 4. Create notifications
        await client.post(
            f"{supabase_url}/rest/v1/notifications",
            json=[
                {
                    "user_id": str(order.farmer_id),
                    "role": "farmer",
                    "order_id": created_order["id"],
                    "title": "New Order Received",
                    "message": f"You received a new order for {order.quantity} units via {order.fulfillment_method}."
                },
                {
                    "user_id": str(order.consumer_id),
                    "role": "consumer",
                    "order_id": created_order["id"],
                    "title": "Order Placed Successfully",
                    "message": f"Your order has been placed. Fulfillment: {order.fulfillment_method}."
                }
            ],
            headers=headers
        )"""

new_notifications = """        # 4. Create notifications
        farmer_title = "New Order Received"
        farmer_message = f"You received a new order for {order.quantity} kg via {order.fulfillment_method}."
        if order.fulfillment_method == "Farmer Delivery":
            farmer_title = "New Delivery Order"
            farmer_message = f"Customer has placed an order for {order.quantity} kg. Please deliver."

        await client.post(
            f"{supabase_url}/rest/v1/notifications",
            json=[
                {
                    "user_id": str(order.farmer_id),
                    "role": "farmer",
                    "order_id": created_order["id"],
                    "title": farmer_title,
                    "message": farmer_message
                },
                {
                    "user_id": str(order.consumer_id),
                    "role": "consumer",
                    "order_id": created_order["id"],
                    "title": "Order Placed Successfully",
                    "message": f"Your order has been placed. Fulfillment: {order.fulfillment_method}."
                }
            ],
            headers=headers
        )"""

code = code.replace(old_notifications, new_notifications)

with open("main.py", "w") as f:
    f.write(code)
