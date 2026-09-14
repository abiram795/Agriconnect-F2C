import re
import os

with open("backend/main.py", "r") as f:
    content = f.read()

# Add endpoints for orders, deliveries, notifications
new_routes = """
@app.get("/api/products/search")
async def search_products(q: str):
    async with httpx.AsyncClient() as client:
        # Use ilike for case-insensitive search
        res = await client.get(
            f"{supabase_url}/rest/v1/products?name=ilike.*{q}*&status=eq.Available&select=*,farmers!inner(*,users!farmers_user_id_fkey(name,phone))&order=created_at.desc",
            headers=get_supabase_headers()
        )
        if res.status_code != 200:
            return []
        return res.json()

class OrderCreateData(BaseModel):
    consumer_id: UUID
    farmer_id: UUID
    product_id: UUID
    quantity: float
    total_amount: float
    fulfillment_method: str
    delivery_address: Optional[dict] = None

@app.post("/api/orders")
async def create_order(order: OrderCreateData):
    async with httpx.AsyncClient() as client:
        headers = get_supabase_headers()
        # 1. Verify product and quantity
        prod_res = await client.get(f"{supabase_url}/rest/v1/products?id=eq.{order.product_id}&select=quantity_available,status", headers=headers)
        if not prod_res.json():
            raise HTTPException(status_code=404, detail="Product not found")
        prod = prod_res.json()[0]
        if prod["status"] != "Available" or float(prod["quantity_available"]) < order.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock or product unavailable")
        
        # 2. Reduce quantity
        new_qty = float(prod["quantity_available"]) - order.quantity
        new_status = "Available" if new_qty > 0 else "Out of Stock"
        patch_res = await client.patch(
            f"{supabase_url}/rest/v1/products?id=eq.{order.product_id}",
            json={"quantity_available": new_qty, "status": new_status},
            headers=headers
        )
        
        # 3. Create order
        order_payload = order.dict()
        order_payload["consumer_id"] = str(order_payload["consumer_id"])
        order_payload["farmer_id"] = str(order_payload["farmer_id"])
        order_payload["product_id"] = str(order_payload["product_id"])
        order_res = await client.post(
            f"{supabase_url}/rest/v1/orders",
            json=order_payload,
            headers={**headers, "Prefer": "return=representation"}
        )
        if order_res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Failed to create order: {order_res.text}")
        created_order = order_res.json()[0]
        
        # 4. Create notifications
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
        )
        
        # 5. Create delivery request if needed
        if order.fulfillment_method == "Delivery Partner":
            await client.post(
                f"{supabase_url}/rest/v1/deliveries",
                json={
                    "order_id": created_order["id"],
                    "status": "Delivery Requested"
                },
                headers=headers
            )
            
        return created_order

@app.get("/api/orders/{role}/{user_id}")
async def get_orders(role: str, user_id: UUID):
    async with httpx.AsyncClient() as client:
        if role == "farmer":
            query = f"farmer_id=eq.{user_id}"
        elif role == "consumer":
            query = f"consumer_id=eq.{user_id}"
        else:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        res = await client.get(
            f"{supabase_url}/rest/v1/orders?{query}&select=*,products(*),users!orders_consumer_id_fkey(name,phone)&order=created_at.desc",
            headers=get_supabase_headers()
        )
        return res.json() if res.status_code == 200 else []

class OrderStatusUpdate(BaseModel):
    status: str

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(order_id: UUID, status_update: OrderStatusUpdate):
    async with httpx.AsyncClient() as client:
        res = await client.patch(
            f"{supabase_url}/rest/v1/orders?id=eq.{order_id}",
            json={"status": status_update.status},
            headers={**get_supabase_headers(), "Prefer": "return=representation"}
        )
        if res.status_code not in (200, 201, 204):
            raise HTTPException(status_code=400, detail="Failed to update order status")
        return res.json()[0]

@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: UUID):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{supabase_url}/rest/v1/notifications?user_id=eq.{user_id}&order=created_at.desc",
            headers=get_supabase_headers()
        )
        return res.json() if res.status_code == 200 else []

"""

if "async def search_products" not in content:
    content += "\n" + new_routes
    with open("backend/main.py", "w") as f:
        f.write(content)
    print("Backend patched successfully")
else:
    print("Backend already patched")
